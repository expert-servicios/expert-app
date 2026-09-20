type SupabaseErrorLike = {
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
} | null | undefined;

export function isRulesetSchemaUnavailable(error: SupabaseErrorLike): boolean {
  if (!error) return false;
  if (error.code === '42P01' || error.code === '42703' || error.code === 'PGRST205') return true;

  const text = [error.message, error.details, error.hint]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return text.includes('regulatory_rulesets')
    || text.includes('ruleset_key')
    || text.includes('schema cache');
}
