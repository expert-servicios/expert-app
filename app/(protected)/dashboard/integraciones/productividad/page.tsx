import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { ArrowLeft, CalendarDays, Cloud, Mail, ShieldCheck } from 'lucide-react';

type Provider = 'google' | 'microsoft' | null;

export default async function ProductivityIntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ provider?: string; connected?: string; error?: string }>;
}) {
  const params = await searchParams;
  const provider: Provider = params.provider === 'google'
    ? 'google'
    : params.provider === 'microsoft'
      ? 'microsoft'
      : null;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?next=/dashboard/integraciones/productividad');

  const admin = getSupabaseAdmin();
  const [{ data: profile }, { data: memberships }] = await Promise.all([
    admin.from('profiles').select('active_company_id').eq('id', user.id).single(),
    admin
      .from('profile_companies')
      .select('company_id,role,company:companies(id,razon_social,nombre_comercial,cif_nif,status)')
      .eq('profile_id', user.id)
      .eq('role', 'owner'),
  ]);

  const companies = (memberships ?? [])
    .map((row) => {
      const company = Array.isArray(row.company) ? row.company[0] : row.company;
      return company ? { ...company, membershipRole: row.role } : null;
    })
    .filter(Boolean)
    .sort((a, b) => Number(b!.id === profile?.active_company_id) - Number(a!.id === profile?.active_company_id));

  const companyIds = companies.map((company) => company!.id);
  const { data: integrations } = companyIds.length
    ? await admin
        .from('client_integrations')
        .select('id,company_id,provider,status,consent_at,last_success_at')
        .in('company_id', companyIds)
        .in('provider', ['google_workspace', 'microsoft_365'])
        .neq('status', 'revoked')
    : { data: [] };

  const connected = new Map(
    (integrations ?? []).map((item) => [`${item.company_id}:${item.provider}`, item]),
  );

  const providers = [
    {
      key: 'google' as const,
      db: 'google_workspace',
      title: 'Google Workspace',
      subtitle: 'Gmail · Google Calendar · Drive · Meet',
      docs: '/docs/conectar-google-workspace-expert',
      auth: '/api/auth/productivity/google',
    },
    {
      key: 'microsoft' as const,
      db: 'microsoft_365',
      title: 'Microsoft 365',
      subtitle: 'Outlook · Calendar · OneDrive · Teams',
      docs: '/docs/conectar-microsoft-365-expert',
      auth: '/api/auth/productivity/microsoft',
    },
  ].filter((item) => !provider || item.key === provider);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 lg:px-8">
      <Link href="/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm text-[#7a6e5f] hover:text-[#3d3528]">
        <ArrowLeft size={14} /> Volver al panel
      </Link>

      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c88b25]">Integraciones de productividad</p>
        <h1 className="mt-2 text-2xl font-bold text-[#07111d]">Conecta tu ecosistema de trabajo</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#52606d]">
          Elige Google Workspace o Microsoft 365 y la entidad fiscal a la que quieres asociar la conexión.
          Los permisos se autorizan mediante OAuth y puedes revocarlos posteriormente desde tu proveedor.
        </p>
      </div>

      {params.connected && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          Conexión completada correctamente.
        </div>
      )}
      {params.error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          No se pudo completar la conexión. Revisa la entidad seleccionada o vuelve a intentarlo.
        </div>
      )}

      <div className="space-y-8">
        {providers.map((item) => (
          <section key={item.key} className="rounded-2xl border border-[#e8dfc8] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#07111d]">{item.title}</h2>
                <p className="mt-1 text-sm text-[#52606d]">{item.subtitle}</p>
              </div>
              <Link href={item.docs} className="text-sm font-semibold text-[#b27b1e] underline underline-offset-4">
                Ver instrucciones
              </Link>
            </div>

            <div className="mt-5 grid gap-3">
              {companies.map((company) => {
                const state = connected.get(`${company!.id}:${item.db}`);
                const next = `/dashboard/integraciones/productividad?provider=${item.key}&connected=${item.key}`;
                const href = `${item.auth}?companyId=${encodeURIComponent(company!.id)}&next=${encodeURIComponent(next)}`;
                return (
                  <div key={company!.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#eee5d4] bg-[#fbf8f2] p-4">
                    <div>
                      <p className="font-semibold text-[#07111d]">{company!.razon_social || company!.nombre_comercial || 'Entidad sin nombre'}</p>
                      <p className="mt-1 text-xs text-[#7a6e5f]">
                        {company!.cif_nif || 'NIF/CIF pendiente'}
                        {company!.id === profile?.active_company_id ? ' · entidad activa' : ''}
                      </p>
                    </div>
                    {state?.status === 'active' ? (
                      <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800">Conectado</span>
                    ) : (
                      <a href={href} className="rounded-xl bg-[#07111d] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#15263a]">
                        Conectar {item.title}
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[#e8dfc8] bg-[#faf9f6] p-4 text-sm text-[#52606d]"><Mail className="mb-2 h-4 w-4 text-[#c88b25]" />Correo autorizado por OAuth.</div>
        <div className="rounded-xl border border-[#e8dfc8] bg-[#faf9f6] p-4 text-sm text-[#52606d]"><CalendarDays className="mb-2 h-4 w-4 text-[#c88b25]" />Calendario para coordinación y reuniones.</div>
        <div className="rounded-xl border border-[#e8dfc8] bg-[#faf9f6] p-4 text-sm text-[#52606d]"><ShieldCheck className="mb-2 h-4 w-4 text-[#c88b25]" />Credenciales cifradas y separadas por entidad.</div>
      </div>
      <p className="mt-5 flex items-center gap-2 text-xs text-[#8a7d69]"><Cloud className="h-4 w-4" />EXPERT no solicita ni almacena tu contraseña de Google o Microsoft.</p>
    </main>
  );
}
