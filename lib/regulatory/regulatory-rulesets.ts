import { getSupabaseAdmin } from '@/lib/integrations/supabase';

export async function getCurrentRegulatoryRuleset(rulesetKey: string, onDate = new Date()) {
  const admin = getSupabaseAdmin();
  const date = onDate.toISOString().slice(0, 10);

  const { data, error } = await admin
    .from('regulatory_rulesets')
    .select('ruleset_key,label,schema_version,valid_from,valid_to,payload,verified_at,metadata,source:regulatory_sources(source_key,authority,title,url)')
    .eq('ruleset_key', rulesetKey)
    .lte('valid_from', date)
    .or(`valid_to.is.null,valid_to.gte.${date}`)
    .order('valid_from', { ascending: false })
    .order('schema_version', { ascending: false })
    .limit(2);

  if (error) throw new Error(error.message);
  if ((data ?? []).length > 1) {
    throw new Error(`Ambiguous regulatory ruleset ${rulesetKey} for ${date}; human review required`);
  }
  return data?.[0] ?? null;
}
