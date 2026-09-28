import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { resolveEffectiveCaseStatus } from '@/lib/cases/case-status';
import type { KiaContext } from './kia-context-builder';

export async function resolveKiaQuickActionCase(input: {
  admin: ReturnType<typeof getSupabaseAdmin>;
  context: KiaContext;
  caseId?: string | null;
  companyId?: string | null;
}): Promise<KiaContext['cases'][number] | null> {
  const { admin, context, caseId, companyId } = input;
  if (!caseId) return context.cases.length === 1 ? context.cases[0] : null;
  const cached = context.cases.find((item) => item.id === caseId);
  if (cached) return cached;
  if (!context.contact.clientId) return null;

  // The context builder intentionally limits open cases. A context token can refer
  // to an older or completed case, but must never silently select another case.
  let query = admin.from('cases')
    .select('id,service,service_id,state,status,next_action')
    .eq('id', caseId)
    .eq('client_id', context.contact.clientId);
  if (companyId) query = query.eq('company_id', companyId);
  const { data, error } = await query.maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    serviceName: data.service,
    serviceSlug: data.service_id,
    status: resolveEffectiveCaseStatus(data.status, data.state),
    nextAction: data.next_action,
  };
}
