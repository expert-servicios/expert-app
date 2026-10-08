import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { createHoldedV2Client } from '@/lib/integrations/holded/holded-v2-client';
import { resolveKiaCompanyHoldedAccess } from './kia-holded-access';
import type { KiaContext } from './kia-context-builder';
import type { KiaToolResult } from './kia-tool-definitions';

export type KiaAccountingReadName = 'get_holded_chart_of_accounts' | 'get_holded_ledger_entries';
export const KIA_ACCOUNTING_READ_NAMES = new Set<KiaAccountingReadName>([
  'get_holded_chart_of_accounts', 'get_holded_ledger_entries',
]);

export async function executeKiaAccountingRead(
  name: KiaAccountingReadName,
  args: Record<string, unknown>,
  context: KiaContext,
): Promise<KiaToolResult> {
  if (context.actor?.isStaff !== true || !['admin', 'owner'].includes(context.actor.role ?? '') || !context.company?.id) {
    return { toolName: name, ok: false, error: 'Requiere acceso Admin de EXPERT y empresa autorizada.' };
  }
  if (name === 'get_holded_ledger_entries' && String(args.startDate) > String(args.endDate)) {
    return { toolName: name, ok: false, error: 'El periodo contable tiene las fechas invertidas.' };
  }
  const admin = getSupabaseAdmin();
  const permission = name === 'get_holded_ledger_entries' ? 'accountingEntries' : 'accountingAccounts';
  const access = await resolveKiaCompanyHoldedAccess(admin, context, permission);
  if (!access.ok) return { toolName: name, ok: false, error: access.error };
  const { data: integration, error } = await admin.from('client_integrations')
    .select('api_version').eq('id', access.access.integrationId)
    .eq('company_id', access.access.companyId).eq('provider', 'holded').eq('status', 'active').maybeSingle();
  if (error || integration?.api_version !== 'v2') {
    return { toolName: name, ok: false, error: 'La consulta exige una integración Holded v2 activa.' };
  }
  try {
    const client = await createHoldedV2Client(access.access.integrationId);
    const limit = Number(args.limit ?? 30);
    const cursor = typeof args.cursor === 'string' ? args.cursor : undefined;
    const page = name === 'get_holded_ledger_entries'
      ? await client.listLedgerEntries({
          startDate: String(args.startDate), endDate: String(args.endDate), limit, cursor,
        })
      : await client.listAccountingAccounts({ limit, cursor });
    return { toolName: name, ok: true, result: {
      companyId: access.access.companyId, source: 'holded_v2_company_scoped',
      items: page.items, count: page.items.length, nextCursor: page.cursor,
      hasMore: page.has_more, exhaustive: !page.has_more, holdedMutated: false,
    } };
  } catch {
    return { toolName: name, ok: false, error: 'No se pudo leer la contabilidad en Holded.' };
  }
}
