import { isStaffRole } from '@/lib/auth/roles';
import type { getSupabaseAdmin } from '@/lib/integrations/supabase';

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

export async function canAccessFinancialReport(
  admin: AdminClient,
  userId: string,
  reportClientId: string,
): Promise<boolean> {
  if (userId === reportClientId) return true;

  const { data: profile } = await admin
    .from('profiles')
    .select('role,status')
    .eq('id', userId)
    .maybeSingle();

  return Boolean(
    profile
    && profile.status !== 'inactive'
    && isStaffRole(profile.role),
  );
}
