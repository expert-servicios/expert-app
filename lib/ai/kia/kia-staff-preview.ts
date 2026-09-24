import type { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { isStaffRole } from '@/lib/auth/roles';

type Admin = ReturnType<typeof getSupabaseAdmin>;

type PreviewMetadata = {
  staff_preview?: unknown;
  preview_case_id?: unknown;
  preview_client_id?: unknown;
};

export async function resolveKiaStaffPreview(input: {
  admin: Admin;
  actorId: string;
  metadata: unknown;
}) {
  const metadata = input.metadata && typeof input.metadata === 'object'
    ? input.metadata as PreviewMetadata
    : {};
  if (metadata.staff_preview !== true) return null;
  if (typeof metadata.preview_case_id !== 'string' || typeof metadata.preview_client_id !== 'string') return null;

  const [{ data: actor, error: actorError }, { data: caseRow, error: caseError }] = await Promise.all([
    input.admin.from('profiles').select('id,role,status,tenant_id').eq('id', input.actorId).maybeSingle(),
    input.admin.from('cases')
      .select('id,client_id,company_id,tenant_id,service,service_id,state,status,next_action,due_date,updated_at,closed_at')
      .eq('id', metadata.preview_case_id)
      .eq('client_id', metadata.preview_client_id)
      .maybeSingle(),
  ]);
  if (actorError || caseError || !actor || !caseRow || caseRow.closed_at) return null;
  if (actor.status === 'inactive' || !isStaffRole(actor.role)) return null;

  const { data: client, error: clientError } = await input.admin
    .from('profiles')
    .select('id,full_name,preferred_language,status,tenant_id')
    .eq('id', caseRow.client_id)
    .maybeSingle();
  if (clientError || !client || client.status === 'inactive') return null;

  return {
    actor,
    client,
    caseRow,
    clientId: client.id,
    companyId: caseRow.company_id ?? null,
    serviceSlug: caseRow.service_id ?? null,
  };
}
