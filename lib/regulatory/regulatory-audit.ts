import { getSupabaseAdmin } from '@/lib/integrations/supabase';

type AuditIssue = {
  code: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  entity?: string;
};

function daysBetween(a: string, b = new Date()) {
  return Math.floor((b.getTime() - new Date(a).getTime()) / 86_400_000);
}

function minutesBetween(a: string, b = new Date()) {
  return Math.floor((b.getTime() - new Date(a).getTime()) / 60_000);
}

export async function runRegulatoryHealthAudit() {
  const admin = getSupabaseAdmin();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  const [
    { data: sources, error: sourcesError },
    { data: values, error: valuesError },
    { data: dependencies, error: depsError },
    { data: runs, error: runsError },
  ] = await Promise.all([
    admin.from('regulatory_sources')
      .select('id,source_key,authority,check_frequency,last_success_at,last_fingerprint,last_error,metadata')
      .eq('active', true),
    admin.from('regulatory_values')
      .select('id,value_key,period_key,valid_from,valid_to,metadata')
      .order('value_key', { ascending: true })
      .order('valid_from', { ascending: true }),
    admin.from('regulatory_dependencies')
      .select('id,source_id,value_key,dependency_type,dependency_key')
      .eq('active', true),
    admin.from('regulatory_review_runs')
      .select('id,run_type,status,started_at,finished_at')
      .order('started_at', { ascending: false })
      .limit(100),
  ]);

  if (sourcesError) throw new Error(sourcesError.message);
  if (valuesError) throw new Error(valuesError.message);
  if (depsError) throw new Error(depsError.message);
  if (runsError) throw new Error(runsError.message);

  const issues: AuditIssue[] = [];
  const sourceIds = new Set((sources ?? []).map((source) => source.id));
  const valueKeys = new Set((values ?? []).map((value) => value.value_key));

  for (const source of sources ?? []) {
    if (!source.last_fingerprint) {
      issues.push({
        code: 'source_missing_baseline',
        severity: 'warning',
        entity: source.source_key,
        message: `${source.authority} · ${source.source_key} no tiene baseline.`,
      });
    }
    if (source.last_error) {
      issues.push({
        code: 'source_error',
        severity: 'critical',
        entity: source.source_key,
        message: `${source.authority} · ${source.source_key}: ${source.last_error}`,
      });
    }
    const sourceMetadata = (source.metadata ?? {}) as Record<string, unknown>;
    if (!source.last_success_at && sourceMetadata.monitoring_mode !== 'manual_reference') {
      issues.push({
        code: 'source_never_succeeded',
        severity: 'critical',
        entity: source.source_key,
        message: `${source.authority} · ${source.source_key} nunca ha tenido una lectura correcta.`,
      });
    }
    if (source.last_success_at) {
      const maxDays = source.check_frequency === 'daily' ? 2 : source.check_frequency === 'monthly' ? 40 : 90;
      if (daysBetween(source.last_success_at, now) > maxDays) {
        issues.push({
          code: 'source_stale',
          severity: 'critical',
          entity: source.source_key,
          message: `${source.source_key} lleva más de ${maxDays} días sin lectura correcta.`,
        });
      }
    }
  }

  const byKey = new Map<string, NonNullable<typeof values>>();
  for (const value of values ?? []) {
    const list = byKey.get(value.value_key) ?? [];
    list.push(value);
    byKey.set(value.value_key, list);
  }

  for (const [valueKey, rows] of byKey) {
    const current = rows.filter((row) =>
      row.valid_from <= today && (row.valid_to == null || row.valid_to >= today),
    );
    const latest = rows[rows.length - 1];
    const latestMetadata = (latest?.metadata ?? {}) as Record<string, unknown>;
    if (current.length === 0 && latestMetadata.availability_mode !== 'latest_published') {
      issues.push({
        code: 'value_no_current_record',
        severity: 'warning',
        entity: valueKey,
        message: `${valueKey} no tiene un valor vigente para ${today}.`,
      });
    }
    if (current.length === 0 && latest && latestMetadata.availability_mode === 'latest_published') {
      const maxAgeDays = typeof latestMetadata.max_age_days === 'number' ? latestMetadata.max_age_days : 62;
      if (daysBetween(`${latest.valid_from}T00:00:00Z`, now) > maxAgeDays) {
        issues.push({
          code: 'value_latest_published_stale',
          severity: 'critical',
          entity: valueKey,
          message: `${valueKey} supera la antigüedad máxima de ${maxAgeDays} días sin un nuevo dato oficial.`,
        });
      }
    }

    for (let i = 1; i < rows.length; i += 1) {
      const previous = rows[i - 1];
      const next = rows[i];
      if (previous.valid_to == null || previous.valid_to >= next.valid_from) {
        issues.push({
          code: 'value_overlap',
          severity: 'critical',
          entity: valueKey,
          message: `${valueKey} tiene vigencias solapadas entre ${previous.period_key} y ${next.period_key}.`,
        });
      }
    }
  }

  const sourceDependencyCounts = new Map<string, number>();
  for (const dependency of dependencies ?? []) {
    if (dependency.source_id) {
      sourceDependencyCounts.set(
        dependency.source_id,
        (sourceDependencyCounts.get(dependency.source_id) ?? 0) + 1,
      );
    }
  }

  for (const source of sources ?? []) {
    const metadata = (source.metadata ?? {}) as Record<string, unknown>;
    if ((sourceDependencyCounts.get(source.id) ?? 0) === 0 && metadata.discovery_only !== true) {
      issues.push({
        code: 'source_without_dependency',
        severity: 'warning',
        entity: source.source_key,
        message: `${source.source_key} está activa pero no tiene ninguna dependencia explícita.`,
      });
    }
  }
  for (const dependency of dependencies ?? []) {
    if (dependency.source_id && !sourceIds.has(dependency.source_id)) {
      issues.push({
        code: 'dependency_orphan_source',
        severity: 'critical',
        entity: dependency.id,
        message: `Dependencia ${dependency.dependency_type}:${dependency.dependency_key} apunta a una fuente inexistente.`,
      });
    }
    if (dependency.value_key && !valueKeys.has(dependency.value_key)) {
      issues.push({
        code: 'dependency_orphan_value',
        severity: 'critical',
        entity: dependency.id,
        message: `Dependencia ${dependency.dependency_type}:${dependency.dependency_key} apunta al valor inexistente ${dependency.value_key}.`,
      });
    }
  }

  for (const run of runs ?? []) {
    if (run.status === 'running' && minutesBetween(run.started_at, now) >= 15) {
      issues.push({
        code: 'run_stuck',
        severity: 'critical',
        entity: run.id,
        message: `Ejecución ${run.run_type} permanece running desde ${run.started_at}.`,
      });
    }
  }

  return {
    checkedAt: now.toISOString(),
    issues,
    critical: issues.filter((issue) => issue.severity === 'critical').length,
    warnings: issues.filter((issue) => issue.severity === 'warning').length,
    healthy: issues.length === 0,
  };
}
