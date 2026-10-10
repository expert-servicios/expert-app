import { NextRequest } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import type { AppRole } from '@/lib/auth/roles';

export type ActiveActor = {
  userId: string;
  role: AppRole;
  tenantId: string | null;
};

/**
 * Server-only gate. Never infer authority from client-supplied role, a valid
 * JWT alone, or a protected layout. The current profile is re-read before
 * privileged operations that use service-role database access.
 */
export async function requireActiveActor(
  request: NextRequest,
  allowedRoles?: readonly AppRole[],
): Promise<ActiveActor | null> {
  const session = createServerSupabaseClient(request);
  const { data: { user }, error } = await session.auth.getUser();
  if (error || !user) return null;

  const admin = getSupabaseAdmin();
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('role,status,tenant_id')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile || profile.status !== 'active') return null;
  const role = profile.role as AppRole;
  if (!['owner', 'admin', 'tenant_admin', 'client'].includes(role)) return null;
  if (allowedRoles && !allowedRoles.includes(role)) return null;

  return { userId: user.id, role, tenantId: profile.tenant_id ?? null };
}
