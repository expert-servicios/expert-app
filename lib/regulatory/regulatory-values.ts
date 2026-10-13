import { getSupabaseAdmin } from '@/lib/integrations/supabase';

export async function getCurrentRegulatoryValue(valueKey: string, onDate = new Date()) {
  const admin = getSupabaseAdmin();
  const date = onDate.toISOString().slice(0, 10);

  const { data, error } = await admin
    .from('regulatory_values')
    .select('value_key,label,numeric_value,text_value,unit,period_key,valid_from,valid_to,verified_at,metadata')
    .eq('value_key', valueKey)
    .lte('valid_from', date)
    .or(`valid_to.is.null,valid_to.gte.${date}`)
    .order('valid_from', { ascending: false })
    .limit(2);

  if (error) throw new Error(error.message);
  if ((data ?? []).length > 1) {
    throw new Error(`Ambiguous regulatory value ${valueKey} for ${date}; human review required`);
  }
  if (data?.[0]) return { ...data[0], availability_mode: 'effective_date' as const };

  const { data: latest, error: latestError } = await admin
    .from('regulatory_values')
    .select('value_key,label,numeric_value,text_value,unit,period_key,valid_from,valid_to,verified_at,metadata')
    .eq('value_key', valueKey)
    .lte('valid_from', date)
    .order('valid_from', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError) throw new Error(latestError.message);
  const metadata = (latest?.metadata ?? {}) as Record<string, unknown>;
  if (latest && metadata.availability_mode === 'latest_published') {
    const maxAgeDays = typeof metadata.max_age_days === 'number' ? metadata.max_age_days : 62;
    const ageDays = Math.floor((onDate.getTime() - new Date(`${latest.valid_from}T00:00:00Z`).getTime()) / 86_400_000);
    if (ageDays <= maxAgeDays) {
      return { ...latest, availability_mode: 'latest_published' as const, age_days: ageDays };
    }
  }
  return null;
}

export async function getRegulatoryPulseSummary() {
  const admin = getSupabaseAdmin();

  const [{ data: run }, { data: changes }, { data: values }, { data: sources }] = await Promise.all([
    admin.from('regulatory_review_runs')
      .select('id,run_type,status,sources_checked,sources_changed,changes_classified,critical_changes,started_at,finished_at')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin.from('regulatory_changes')
      .select('id,status,severity,change_type,summary,effective_date,value_updates,proposal_pr_number,proposal_pr_url,values_applied_at,created_at,source:regulatory_sources(source_key,authority,title)')
      .in('status', ['detected','classified','needs_review','proposal_ready'])
      .order('created_at', { ascending: false })
      .limit(20),
    admin.from('regulatory_values')
      .select('value_key,label,numeric_value,text_value,unit,period_key,valid_from,valid_to,verified_at')
      .order('valid_from', { ascending: false })
      .limit(50),
    admin.from('regulatory_sources')
      .select('source_key,authority,title,priority,last_checked_at,last_success_at,last_error,last_changed_at')
      .eq('active', true)
      .order('priority', { ascending: false }),
  ]);

  return {
    lastRun: run ?? null,
    pendingChanges: changes ?? [],
    values: values ?? [],
    sources: sources ?? [],
  };
}


/**
 * A legal sign-off is distinct from automatic KIA classification and from
 * closing an issue. Approval must be tied to the exact source snapshot.
 */
export async function approveRegulatoryLegalReview(input: {
  changeId: string;
  reviewerId: string;
  note: string;
  officialSourceUrl: string;
  checkedAt: string;
}) {
  const admin = getSupabaseAdmin();
  if (input.note.trim().length < 30) throw new Error('El dictamen jurídico debe incluir al menos 30 caracteres');
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(input.checkedAt)) throw new Error('Fecha de verificación inválida');
  const date = new Date(input.checkedAt + 'T00:00:00Z');
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== input.checkedAt ||
      input.checkedAt > new Date().toISOString().slice(0,10)) throw new Error('Fecha de verificación inválida');
  let sourceUrl: URL;
  try { sourceUrl = new URL(input.officialSourceUrl); } catch { throw new Error('URL oficial inválida'); }
  if (sourceUrl.protocol !== 'https:' || sourceUrl.username || sourceUrl.password)
    throw new Error('La evidencia exige una URL HTTPS válida');

  const { data: change, error: changeError } = await admin.from('regulatory_changes')
    .select('id,status,relevant,source_id,current_snapshot_id,resolution_evidence')
    .eq('id', input.changeId).maybeSingle();
  if (changeError) throw new Error(changeError.message);
  if (!change || !['classified','needs_review','proposal_ready'].includes(change.status))
    throw new Error('Cambio no disponible para revisión');
  if (change.relevant !== true) throw new Error('El cambio no es relevante');
  const [{data: snapshot,error: snapshotError},{data: source,error: sourceError}] = await Promise.all([
    admin.from('regulatory_snapshots').select('fingerprint').eq('id',change.current_snapshot_id).single(),
    admin.from('regulatory_sources').select('url,fetch_url').eq('id',change.source_id).single(),
  ]);
  if (snapshotError || !snapshot?.fingerprint || sourceError || !source) throw new Error('Falta evidencia de fuente/version');
  const allowed = [source.url,source.fetch_url].filter(Boolean).some((value) => {
    try {return new URL(value).hostname === sourceUrl.hostname;} catch {return false;}
  });
  if (!allowed) throw new Error('La URL aportada no corresponde al organismo de la fuente');
  const evidence = (change.resolution_evidence ?? {}) as Record<string, unknown>;
  const existing = evidence.legal_approval as Record<string,unknown> | undefined;
  if (existing?.status === 'approved') throw new Error('Ya existe una aprobación: debe auditarse antes de sustituirla');
  const approval = {
    status:'approved', reviewer_id:input.reviewerId,
    approved_at:new Date().toISOString(), checked_at:input.checkedAt,
    official_source_url:sourceUrl.toString(), reviewed_snapshot_id:change.current_snapshot_id,
    reviewed_fingerprint:snapshot.fingerprint, note:input.note.trim(),
  };
  const {data:updated,error:updateError} = await admin.from('regulatory_changes').update({
    resolution_evidence:{...evidence,legal_approval:approval},
  }).eq('id',input.changeId).eq('current_snapshot_id',change.current_snapshot_id)
    .eq('status',change.status).select('id').maybeSingle();
  if(updateError || !updated) throw new Error(updateError?.message ?? 'Cambio de versión concurrente; repetir revisión');
  return {changeId:input.changeId,approved:true};
}

type ProposedValueUpdate = {
  valueKey?: unknown;
  numericValue?: unknown;
  textValue?: unknown;
  unit?: unknown;
  periodKey?: unknown;
  validFrom?: unknown;
  validTo?: unknown;
  evidence?: unknown;
};

function asDateString(value: unknown): string | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return value;
}

export async function applyReviewedRegulatoryValueUpdates(changeId: string, approvedBy?: string) {
  const admin = getSupabaseAdmin();

  const { data: change, error: changeError } = await admin
    .from('regulatory_changes')
    .select('id,source_id,status,relevant,value_updates,current_snapshot_id,resolution_evidence')
    .eq('id', changeId)
    .maybeSingle();

  if (changeError) throw new Error(changeError.message);
  if (!change) throw new Error('Cambio regulatorio no encontrado');
  if (change.relevant !== true) throw new Error('No se pueden aplicar valores desde un cambio marcado como no relevante');
  const approval = ((change.resolution_evidence ?? {}) as Record<string,unknown>).legal_approval as
    Record<string,unknown> | undefined;
  if (approval?.status !== 'approved' || !approval.reviewer_id ||
      approval.reviewed_snapshot_id !== change.current_snapshot_id ||
      typeof approval.reviewed_fingerprint !== 'string' ||
      typeof approval.official_source_url !== 'string' ||
      typeof approval.note !== 'string') {
    throw new Error('Antes de aplicar valores se requiere aprobación jurídica documentada y vigente');
  }
  const {data: approvedSnapshot,error:approvedSnapshotError} = await admin.from('regulatory_snapshots')
    .select('fingerprint').eq('id',change.current_snapshot_id).single();
  if (approvedSnapshotError || approvedSnapshot?.fingerprint !== approval.reviewed_fingerprint)
    throw new Error('La fuente ha cambiado desde la aprobación jurídica');

  if (!['classified','needs_review','proposal_ready'].includes(change.status)) {
    throw new Error('El cambio no está en un estado revisable');
  }

  const proposals = Array.isArray(change.value_updates)
    ? change.value_updates as ProposedValueUpdate[]
    : [];

  if (proposals.length === 0) throw new Error('El cambio no contiene propuestas de valores');

  const applied: string[] = [];

  for (const proposal of proposals) {
    const valueKey = typeof proposal.valueKey === 'string' ? proposal.valueKey.trim() : '';
    const validFrom = asDateString(proposal.validFrom);
    const validTo = proposal.validTo == null ? null : asDateString(proposal.validTo);
    const numericValue = typeof proposal.numericValue === 'number' && Number.isFinite(proposal.numericValue)
      ? proposal.numericValue
      : null;
    const textValue = typeof proposal.textValue === 'string' && proposal.textValue.trim()
      ? proposal.textValue.trim()
      : null;

    if (!valueKey || !validFrom || (numericValue === null && textValue === null)) {
      throw new Error(`Propuesta incompleta para ${valueKey || 'valueKey desconocido'}`);
    }
    if (proposal.validTo != null && !validTo) {
      throw new Error(`validTo inválido para ${valueKey}`);
    }

    const { data: previous, error: previousError } = await admin
      .from('regulatory_values')
      .select('label,unit,period_key,metadata')
      .eq('value_key', valueKey)
      .order('valid_from', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (previousError) throw new Error(previousError.message);
    if (!previous) {
      throw new Error(`El valor ${valueKey} no existe todavía en el registro canónico; requiere alta manual revisada`);
    }

    const periodKey = typeof proposal.periodKey === 'string' && proposal.periodKey.trim()
      ? proposal.periodKey.trim()
      : validFrom.slice(0, 4);
    const unit = typeof proposal.unit === 'string' && proposal.unit.trim()
      ? proposal.unit.trim()
      : previous.unit;

    const { error: valueError } = await admin.rpc('apply_regulatory_value_reviewed', {
      p_value_key: valueKey,
      p_label: previous.label,
      p_numeric_value: numericValue,
      p_text_value: textValue,
      p_unit: unit,
      p_period_key: periodKey,
      p_valid_from: validFrom,
      p_valid_to: validTo,
      p_source_id: change.source_id,
      p_change_id: change.id,
      p_metadata: {
        ...((previous.metadata ?? {}) as Record<string, unknown>),
        evidence: typeof proposal.evidence === 'string' ? proposal.evidence.slice(0, 500) : null,
        approved_via: 'admin_regulatory_review',
      },
    });

    if (valueError) throw new Error(valueError.message);
    applied.push(valueKey);
  }

  await admin.from('regulatory_changes').update({
    values_applied_at: new Date().toISOString(),
    values_applied_by: approvedBy ?? null,
  }).eq('id', changeId);

  return { changeId, applied, resolved: false };
}

export async function resolveReviewedRegulatoryChange(
  changeId: string,
  resolvedBy: string | undefined,
  resolutionNote: string,
  resolutionEvidence?: Record<string, unknown>,
) {
  const admin = getSupabaseAdmin();
  const note = resolutionNote.trim();
  if (note.length < 10) throw new Error('La resolución requiere una nota de al menos 10 caracteres');

  const { data: change, error } = await admin
    .from('regulatory_changes')
    .select('id,status,relevant,summary,resolution_evidence')
    .eq('id', changeId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!change) throw new Error('Cambio regulatorio no encontrado');
  if (!['classified','needs_review','proposal_ready'].includes(change.status)) {
    throw new Error('El cambio no está en un estado que pueda resolverse manualmente');
  }

  const { error: updateError } = await admin.from('regulatory_changes').update({
    status: 'resolved',
    resolved_at: new Date().toISOString(),
    resolved_by: resolvedBy ?? null,
    resolution_note: note,
    // Resolving a case must not erase the already recorded legal approval.
    resolution_evidence: {
      ...((change as { resolution_evidence?: Record<string, unknown> }).resolution_evidence ?? {}),
      ...(resolutionEvidence ?? {}),
    },
  }).eq('id', changeId);

  if (updateError) throw new Error(updateError.message);
  return { changeId, resolved: true };
}
