import { createHash } from 'node:crypto';
import type { getSupabaseAdmin } from '@/lib/integrations/supabase';
import type { KiaOperationalCategory } from '@/lib/ai/kia/kia-operational-routing';

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

export type MaterializeKiaOperationalTaskInput = {
  admin: AdminClient;
  origin: 'email' | 'telegram' | 'dashboard';
  originId: string;
  summary: string;
  description?: string | null;
  nextAction: string;
  confidence: number;
  requiresManualReview: boolean;
  operationalCategory: KiaOperationalCategory;
  clientId?: string | null;
  leadId?: string | null;
  caseId?: string | null;
  companyId?: string | null;
  decisionLogId?: string | null;
  priority?: 'baja' | 'media' | 'alta' | 'critica';
  metadata?: Record<string, unknown>;
};

function normalizedAction(value: string) {
  return value
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .slice(0, 240);
}

function madridDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export async function materializeKiaOperationalTask(input: MaterializeKiaOperationalTaskInput) {
  if (input.nextAction !== 'create_task') return null;
  if (input.requiresManualReview || input.confidence < 0.75) return null;

  const scope = input.caseId ?? input.leadId ?? input.clientId ?? input.companyId ?? null;
  if (!scope) return null;

  const actionText = input.summary.trim().slice(0, 500);
  const normalized = normalizedAction(actionText);
  if (!normalized) return null;

  const actionFingerprint = createHash('sha256')
    .update(`${scope}|${input.operationalCategory}|${normalized}`)
    .digest('hex')
    .slice(0, 40);
  const sourceKey = `kia-action:${input.origin}:${createHash('sha256').update(input.originId).digest('hex').slice(0, 32)}`;
  const now = new Date().toISOString();
  const dueDate = madridDate();

  const { data: existing, error: existingError } = await input.admin
    .from('internal_tasks')
    .select('id,title,metadata')
    .in('status', ['pendiente', 'en_progreso'])
    .eq('metadata->>action_fingerprint', actionFingerprint)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existingError) throw existingError;

  if (existing?.id) {
    const previousMetadata = (existing.metadata ?? {}) as Record<string, unknown>;
    const { data: reused, error } = await input.admin
      .from('internal_tasks')
      .update({
        description: (input.description ?? actionText).slice(0, 1800),
        due_date: dueDate,
        updated_at: now,
        metadata: {
          ...previousMetadata,
          ...input.metadata,
          operational_category: input.operationalCategory,
          last_origin: input.origin,
          last_origin_id: input.originId,
          last_seen_at: now,
          decision_log_id: input.decisionLogId ?? previousMetadata.decision_log_id ?? null,
        },
      })
      .eq('id', existing.id)
      .in('status', ['pendiente', 'en_progreso'])
      .select('id,title,due_date')
      .maybeSingle();
    if (error) throw error;
    return reused ? { ...reused, created: false, actionFingerprint } : null;
  }

  const { data, error } = await input.admin
    .from('internal_tasks')
    .insert({
      source_key: sourceKey,
      title: actionText.slice(0, 220),
      description: (input.description ?? actionText).slice(0, 1800),
      status: 'pendiente',
      priority: input.priority ?? 'media',
      due_date: dueDate,
      case_id: input.caseId ?? null,
      client_id: input.clientId ?? null,
      lead_id: input.leadId ?? null,
      company_id: input.companyId ?? null,
      source: 'kia',
      metadata: {
        ...input.metadata,
        task_kind: 'kia_operational_action',
        source_key: sourceKey,
        action_fingerprint: actionFingerprint,
        action_summary: actionText,
        operational_category: input.operationalCategory,
        origin: input.origin,
        origin_id: input.originId,
        decision_log_id: input.decisionLogId ?? null,
        confidence: input.confidence,
        created_by_policy: 'operations360_phase2',
      },
    })
    .select('id,title,due_date')
    .single();

  if (!error) return data ? { ...data, created: true, actionFingerprint } : null;
  if (error.code !== '23505') throw error;

  const { data: sameOrigin, error: sameOriginError } = await input.admin
    .from('internal_tasks')
    .select('id,title,due_date')
    .eq('source_key', sourceKey)
    .maybeSingle();
  if (sameOriginError) throw sameOriginError;
  return sameOrigin ? { ...sameOrigin, created: false, actionFingerprint } : null;
}
