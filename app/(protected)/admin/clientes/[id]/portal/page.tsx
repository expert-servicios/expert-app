'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import {
  Building2,
  CalendarClock,
  CreditCard,
  Eye,
  FileText,
  FolderOpen,
  Loader2,
  Mail,
  Plug,
  ReceiptText,
  ShieldCheck,
  UserRound,
} from 'lucide-react';

type Company = {
  id: string;
  name: string | null;
  razon_social: string | null;
  nif: string | null;
  status: string | null;
};

type ClientData = {
  profile: {
    id: string;
    full_name: string | null;
    email: string;
    status: string;
    active_company_id: string | null;
    profile_completed: boolean;
    billing_ready: boolean;
    onboarding_completed_at: string | null;
  };
  companies: Company[];
  cases: Array<{ id: string; service: string; state: string; status: string; company_id: string | null }>;
  subs: Array<{ id: string; plan: string; status: string; company_id: string | null }>;
  quotes: Array<{ id: string; service: string; status: string; company_id: string | null }>;
  orders: Array<{ id: string; status: string; company_id: string | null }>;
  checkoutSessions: Array<{ id: string; status: string; company_id: string | null }>;
  emailEvents: Array<{ id: string; subject: string | null; status: string }>;
  integrations: Array<{ id: string; provider: string; status: string; company_id: string | null; last_error: string | null }>;
};

function scoped<T extends { company_id: string | null }>(rows: T[], companyId: string | null): T[] {
  if (!companyId) return rows;
  return rows.filter((row) => row.company_id === companyId);
}

function StatCard({
  label,
  value,
  detail,
  href,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  detail: string;
  href: string;
  icon: React.ElementType;
}) {
  return (
    <Link href={href} className="rounded-2xl border border-[#d8cbb5] bg-white p-5 shadow-sm transition hover:border-[#c88b25]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8a9aab]">{label}</p>
          <p className="mt-2 text-2xl font-bold text-[#07111d]">{value}</p>
          <p className="mt-1 text-xs leading-5 text-[#52606d]">{detail}</p>
        </div>
        <Icon className="h-5 w-5 text-[#c88b25]" />
      </div>
    </Link>
  );
}

export default function AdminClientPortalPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [data, setData] = useState<ClientData | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(searchParams.get('companyId'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/admin/clientes/${id}`, { cache: 'no-store' });
        const json = await response.json();
        if (!response.ok) throw new Error(json.error ?? 'No se pudo cargar el cliente');
        const next = json as ClientData;
        setData(next);
        setCompanyId((current) => current || next.profile.active_company_id || next.companies[0]?.id || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error de conexión');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const view = useMemo(() => {
    if (!data) return null;
    const company = data.companies.find((item) => item.id === companyId) ?? null;
    const cases = scoped(data.cases, companyId);
    const subs = scoped(data.subs, companyId);
    const quotes = scoped(data.quotes, companyId);
    const orders = scoped(data.orders, companyId);
    const checkoutSessions = scoped(data.checkoutSessions, companyId);
    const integrations = scoped(data.integrations, companyId);

    return {
      company,
      cases,
      subs,
      quotes,
      orders,
      checkoutSessions,
      integrations,
      activeCases: cases.filter((item) => item.state !== 'finalizado' && item.state !== 'cerrado' && item.status !== 'closed').length,
      activeSub: subs.find((item) => item.status === 'active' || item.status === 'trialing') ?? null,
      holded: integrations.find((item) => item.provider === 'holded') ?? null,
    };
  }, [data, companyId]);

  if (loading && !data) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#c88b25]" /></div>;
  }

  if (error || !data || !view) {
    return <div className="mx-auto max-w-5xl px-6 py-8"><div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error || 'Cliente no disponible'}</div></div>;
  }

  const companyQuery = companyId ? `?companyId=${companyId}` : '';

  return (
    <main className="min-h-screen bg-[#f8f4eb] px-6 py-7">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-amber-800" />
            <div>
              <p className="font-bold text-amber-950">Modo Admin · Vista cliente delegada</p>
              <p className="mt-1 text-sm leading-6 text-amber-900">
                Estás trabajando con el contexto de {data.profile.full_name || data.profile.email}, pero sigues autenticada como Admin. No se crea una sesión del cliente y las acciones continúan siendo atribuibles al staff.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#d8cbb5] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f8f4eb] text-[#c88b25]"><UserRound className="h-5 w-5" /></div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8a9aab]">Panel del cliente</p>
                <h1 className="mt-1 font-serif text-2xl font-bold text-[#07111d]">{data.profile.full_name || data.profile.email}</h1>
                <p className="mt-1 text-sm text-[#52606d]">{data.profile.email}</p>
              </div>
            </div>
            <Link href={`/admin/clientes/${id}`} className="inline-flex items-center gap-1.5 rounded-xl border border-[#d8cbb5] px-4 py-2 text-xs font-bold text-[#29384a]">
              <Eye className="h-3.5 w-3.5" /> Volver a Cliente 360
            </Link>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto]">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-[#8a9aab]">Entidad de trabajo</label>
              <select
                value={companyId ?? ''}
                onChange={(event) => setCompanyId(event.target.value || null)}
                className="mt-2 w-full rounded-xl border border-[#d8cbb5] bg-white px-3 py-3 text-sm"
              >
                <option value="">Todas / contexto personal</option>
                {data.companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name || company.razon_social || company.nif || company.id}{company.nif ? ` · ${company.nif}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-xl bg-[#fbf8f2] px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#8a9aab]">Contexto actual</p>
              <p className="mt-1 text-sm font-bold text-[#07111d]">{view.company?.name || view.company?.razon_social || 'Personal / todas'}</p>
              <p className="text-xs text-[#52606d]">{view.company?.nif ?? 'Sin entidad seleccionada'}</p>
            </div>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Expedientes"
            value={view.activeCases}
            detail={`${view.cases.length} expediente(s) en el contexto seleccionado`}
            href={`/admin/clientes/${id}/operaciones${companyQuery}`}
            icon={FolderOpen}
          />
          <StatCard
            label="Suscripción"
            value={view.activeSub?.plan ?? '—'}
            detail={view.activeSub ? view.activeSub.status : 'Sin suscripción activa'}
            href={`/admin/clientes/${id}/stripe${companyQuery}`}
            icon={CreditCard}
          />
          <StatCard
            label="Holded"
            value={view.holded?.status === 'active' ? 'Conectado' : 'Sin conexión'}
            detail={view.holded?.last_error || 'Gestionar permisos y conexión por entidad'}
            href={`/admin/clientes/${id}/integraciones`}
            icon={Plug}
          />
          <StatCard
            label="Comunicaciones"
            value={data.emailEvents.length}
            detail="Emails EXPERT registrados; abrir centro unificado para conversación completa"
            href={`/admin/clientes/${id}/comunicaciones`}
            icon={Mail}
          />
        </div>

        <section className="rounded-2xl border border-[#d8cbb5] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#c88b25]" />
            <h2 className="font-serif text-xl font-bold text-[#07111d]">Trabajar con el cliente</h2>
          </div>
          <p className="mt-2 text-sm text-[#52606d]">Accesos equivalentes a los módulos del portal, pero operados desde Admin y con trazabilidad de staff.</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: 'Perfil y entidad', detail: 'Datos personales, fiscales y empresa activa', href: `/admin/clientes/${id}`, icon: UserRound },
              { label: 'Expedientes y tareas', detail: 'Estado, pendientes, documentación y siguientes acciones', href: `/admin/clientes/${id}/operaciones${companyQuery}`, icon: FolderOpen },
              { label: 'Documentos', detail: 'Documentación recibida, generada y por expediente', href: `/admin/clientes/${id}/documentos`, icon: FileText },
              { label: 'Comunicaciones', detail: 'Correo, WhatsApp y trazabilidad', href: `/admin/clientes/${id}/comunicaciones`, icon: Mail },
              { label: 'Citas / obligaciones', detail: 'Calendario y obligaciones operativas', href: `/admin/clientes/${id}/obligaciones`, icon: CalendarClock },
              { label: 'Stripe / cobros', detail: `${view.checkoutSessions.length} checkout(s), ${view.orders.length} pedido(s), ${view.quotes.length} presupuesto(s)`, href: `/admin/clientes/${id}/stripe${companyQuery}`, icon: ReceiptText },
            ].map(({ label, detail, href, icon: Icon }) => (
              <Link key={label} href={href} className="rounded-xl border border-[#e6dfd2] bg-[#fbf8f2] p-4 transition hover:border-[#c88b25]">
                <Icon className="h-4 w-4 text-[#c88b25]" />
                <p className="mt-2 text-sm font-bold text-[#07111d]">{label}</p>
                <p className="mt-1 text-xs leading-5 text-[#52606d]">{detail}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
