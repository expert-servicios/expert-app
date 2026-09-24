import { createHash } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { isStaffRole, isTenantAdmin } from '@/lib/auth/roles';

export class WorkError extends Error {
  constructor(public code: string, public status = 409) { super(code); }
}
export const hashWorkToken = (token: string) => createHash('sha256').update(token).digest('hex');
export const workEnabled = () => process.env.KIA_WORK_CONNECTOR_ENABLED === 'true';
export type WorkAdmin = ReturnType<typeof getSupabaseAdmin>;

export async function authorizeWorkCase(admin: WorkAdmin, actorId: string, caseId: string) {
  const [{ data: profile, error: pError }, { data: caseRow, error: cError }] = await Promise.all([
    admin.from('profiles').select('id,role,status,tenant_id').eq('id', actorId).maybeSingle(),
    admin.from('cases').select('id,client_id,company_id,tenant_id,state,status,next_action,service,closed_at').eq('id', caseId).maybeSingle(),
  ]);
  if (pError || cError) throw new WorkError('authorization_unavailable', 503);
  if (!profile || profile.status === 'inactive' || !caseRow || caseRow.closed_at) throw new WorkError('forbidden', 403);
  const tenantAccess = isTenantAdmin(profile.role) && Boolean(profile.tenant_id) && profile.tenant_id === caseRow.tenant_id;
  if (!isStaffRole(profile.role) && !tenantAccess) throw new WorkError('forbidden', 403);
  return { profile, caseRow };
}

export async function requireWorkProfessional(request: NextRequest, caseId: string) {
  const { data: { user }, error } = await createServerSupabaseClient(request).auth.getUser();
  if (error || !user) throw new WorkError('unauthorized', 401);
  const admin = getSupabaseAdmin();
  const scope = await authorizeWorkCase(admin, user.id, caseId);
  return { admin, actorId: user.id, ...scope };
}

export async function requireWorkConnection(request: NextRequest) {
  if (!workEnabled()) throw new WorkError('connector_disabled', 503);
  const token = request.headers.get('authorization')?.match(/^Bearer (kw_[A-Za-z0-9_-]{43})$/)?.[1];
  if (!token) throw new WorkError('unauthorized', 401);
  const admin = getSupabaseAdmin();
  const { data: connection, error } = await admin.from('kia_work_connections').select('*')
    .eq('token_hash', hashWorkToken(token)).maybeSingle();
  if (error) throw new WorkError('authorization_unavailable', 503);
  if (!connection || connection.revoked_at || Date.parse(connection.expires_at) <= Date.now()) throw new WorkError('unauthorized', 401);
  const scope = await authorizeWorkCase(admin, connection.created_by, connection.case_id);
  if (scope.caseRow.client_id !== connection.client_id || scope.caseRow.tenant_id !== connection.tenant_id
    || scope.caseRow.company_id !== connection.company_id) throw new WorkError('scope_changed', 403);
  return { admin, connection, ...scope };
}
