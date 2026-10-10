import { WorkspaceFrame } from '@/components/workspace/WorkspaceFrame';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import type { ReactNode } from 'react';
import { createServerClient } from '@supabase/ssr';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminMobileNav } from '@/components/admin/AdminMobileNav';
import { AdminRightPanel } from '@/components/admin/AdminRightPanel';
import { AdminBackBar } from '@/components/admin/AdminBackBar';
import { GlobalSearch } from '@/components/admin/GlobalSearch';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { absoluteAppUrl } from '@/lib/utils/app-url';

async function fetchJson(path: string, cookieHeader: string) {
  try {
    const res = await fetch(absoluteAppUrl(path), {
      headers: { cookie: cookieHeader },
      cache: 'no-store'
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('profiles')
    .select('id,role,status,full_name')
    .eq('id', user.id)
    .single();

  if (profile?.status === 'inactive') redirect('/auth/login?error=inactive');
  if (profile?.role === 'tenant_admin') redirect('/tenant/dashboard');
  if (profile?.role !== 'admin' && profile?.role !== 'owner') redirect('/dashboard');

  const enrichedProfile = { ...profile, email: user.email ?? '' };
  const [obligationsData, emailUnreadRaw] = await Promise.all([
    fetchJson(`/api/admin/fiscal-calendar?year=${new Date().getFullYear()}`, cookieHeader),
    admin.from('system_kv').select('value').eq('key', 'email_unread_count').maybeSingle(),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const urgentCount = (obligationsData?.obligations ?? []).filter((o: { status: string; deadline: string }) => {
    if (o.status !== 'pending') return false;
    const diff = Math.ceil((new Date(o.deadline).getTime() - today.getTime()) / 86400000);
    return diff <= 7;
  }).length;
  const emailUnreadCount = Number(emailUnreadRaw?.data?.value ?? 0);

  return (
    <WorkspaceFrame
      area="admin"
      navigation={<AdminSidebar userName={enrichedProfile.full_name ?? null} userEmail={enrichedProfile.email} urgentCount={urgentCount} />}
      topContent={<AdminBackBar />}
      rightPanel={<AdminRightPanel emailUnreadCount={emailUnreadCount} />}
      mobileNavigation={<AdminMobileNav urgentCount={urgentCount} />}
      overlays={<GlobalSearch />}
    >
      {children}
    </WorkspaceFrame>
  );
}
