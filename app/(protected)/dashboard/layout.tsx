import { WorkspaceFrame } from '@/components/workspace/WorkspaceFrame';
import { type ReactNode } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { DashboardNav } from '@/components/dashboard/DashboardNav';
import { MobileNav } from '@/components/dashboard/MobileNav';
import { SubscriptionOnboardingStatus } from '@/components/dashboard/SubscriptionOnboardingStatus';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { fetchWithCookies } from '@/lib/utils/server-fetch';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {}
      }
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const [profileRow, companiesData] = await Promise.all([
    getSupabaseAdmin()
      .from('profiles')
      .select('id,role,status,full_name,active_company_id')
      .eq('id', user.id)
      .single()
      .then((r) => r.data),
    fetchWithCookies('/api/companies')
  ]);

  const companies = companiesData?.companies ?? [];
  if (profileRow?.status === 'inactive') redirect('/auth/login?error=inactive');
  if (profileRow?.role === 'tenant_admin') redirect('/tenant/dashboard');

  return (
    <WorkspaceFrame
      area="client"
      navigation={<DashboardNav
        companies={companies}
        activeCompanyId={profileRow?.active_company_id ?? null}
        userName={profileRow?.full_name ?? null}
        userEmail={user.email ?? ''}
        isAdmin={profileRow?.role === 'admin' || profileRow?.role === 'owner'}
      />}
      topContent={<SubscriptionOnboardingStatus />}
      mobileNavigation={<MobileNav />}
    >
      {children}
    </WorkspaceFrame>
  );
}
