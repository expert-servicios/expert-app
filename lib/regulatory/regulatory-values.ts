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
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ?? null;
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
      .select('id,status,severity,change_type,summary,effective_date,created_at,source:regulatory_sources(source_key,authority,title)')
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
