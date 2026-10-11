import { isStaffRole } from '@/lib/auth/roles';
import type { getSupabaseAdmin } from '@/lib/integrations/supabase';

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

export async function canAccessFinancialReport(
  admin: AdminClient,
  userId: string,
  reportClientId: string,
): Promise<boolean> {
  const { data: profile, error } = await admin
    .from('profiles')
    .select('role,status')
    .eq('id', userId)
    .maybeSingle();

  if (error || !profile || profile.status !== 'active') return false;
  return userId === reportClientId || isStaffRole(profile.role);
}
