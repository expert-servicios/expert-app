'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Building2, CreditCard, FileText, Mail, Plug, RefreshCw, User } from 'lucide-react';

type CompanyCoverage = {
  covered: boolean;
  source: 'direct_subscription' | 'trial' | 'included_entity' | 'none';
  companyId: string;
  subscriptionId: string | null;
  subscriptionStatus: string | null;
  planName: string | null;
  primaryCompanyId: string | null;
  primaryCompanyName: string | null;
  coverageScope: string | null;
  validFrom: string | null;
  validUntil: string | null;
  excludedServices: string[];
};

type Client360 = {
  profile: {
    id: string;
    full_name: string | null;
    email: string;
    status: string;
    active_company_id: string | null;
    profile_completed: boolean;
    billing_ready: boolean;
  };
  companies: { id: string; name: string; nif: string | null }[];
  cases: { id: string; service: string; state: string; company_id?: string | null }[];
  quotes: { id: string; service: string; status: string; amount_eur: number; company_id?: string | null }[];
  subs: { id: string; plan: string; status: string; company_id: string | null }[];
  checkoutSessions: { id: string; stripe_session_id: string; status: string; company_id: string | null; created_at: string; metadata: Record<string, unknown> | null }[];
  emailEvents: { id: number; subject: string | null; status: string | null; created_at: string }[];
  integrations: { id: string; provider: string; status: string; company_id: string | null; last_success_at: string | null; last_error: string | null }[];
  commercialCoverageByCompany: Record<string, CompanyCoverage>;
};

function Badge({ children, ok = false }: { children: React.ReactNode; ok?: boolean }) {
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${ok ? 'bg-green-100 text-green-800' : 'bg-[#f0e8d8] text-[#29384a]'}`}>{children}</span>;
}

export function Client360ContextBar({ clientId }: { clientId: string }) {
  const [data, setData] = useState<Client360 | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedCompanyId = searchParams.get('companyId');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/clientes/${clientId}`, { cache: 'no-store' });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'No se pudo cargar el cliente');
      setData(json);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [clientId]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeCompany = useMemo(() => {
    if (!data) return null;
    const requested = requestedCompanyId
      ? data.companies.find((company) => company.id === requestedCompanyId) ?? null
      : null;
    return requested
      ?? data.companies.find((company) => company.id === data.profile.active_company_id)
      ?? data.companies[0]
      ?? null;
  }, [data, requestedCompanyId]);

  const activeCoverage = activeCompany ? data?.commercialCoverageByCompany?.[activeCompany.id] ?? null : null;
  const activeSubscription = activeCompany
    ? data?.subs.find((sub) => sub.company_id === activeCompany.id && (sub.status === 'active' || sub.status === 'trialing')) ?? null
    : null;
  const openCheckout = activeCompany
    ? data?.checkoutSessions.find((session) => session.company_id === activeCompany.id && session.status === 'open') ?? null
    : null;
  const activeIntegrations = activeCompany
    ? data?.integrations.filter((integration) => integration.status === 'active' && integration.company_id === activeCompany.id) ?? []
    : [];
  const openCases = activeCompany
    ? data?.cases.filter((item) => item.state !== 'finalizado' && item.state !== 'cerrado' && item.company_id === activeCompany.id) ?? []
    : data?.cases.filter((item) => item.state !== 'finalizado' && item.state !== 'cerrado') ?? [];
  const companyQuotes = activeCompany
    ? data?.quotes.filter((quote) => quote.company_id === activeCompany.id) ?? []
    : data?.quotes ?? [];

  const commercialLabel = activeCoverage?.source === 'included_entity'
    ? `Entidad incluida · ${activeCoverage.planName ?? 'cobertura activa'}`
    : activeSubscription
      ? `${activeSubscription.plan} · ${activeSubscription.status}`
      : openCheckout
        ? `Checkout ${openCheckout.status}`
        : 'Sin cobertura activa';

  function chooseCompany(companyId: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (companyId) next.set('companyId', companyId);
    else next.delete('companyId');
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const companyQuery = activeCompany ? `companyId=${encodeURIComponent(activeCompany.id)}` : '';
  const childHref = (path: string) => companyQuery ? `${path}?${companyQuery}` : path;
  const externalHref = (path: string, params: Record<string, string>) => {
    const query = new URLSearchParams(params);
    if (activeCompany) query.set('companyId', activeCompany.id);
    return `${path}?${query.toString()}`;
  };

  if (loading && !data) {
    return <div className="border-b border-[#d8cbb5] bg-white px-6 py-3 text-xs text-[#8a9aab]"><RefreshCw className="mr-2 inline h-3.5 w-3.5 animate-spin" />Cargando contexto del cliente…</div>;
  }

  if (error || !data) {
    return <div className="border-b border-red-200 bg-red-50 px-6 py-2 text-xs text-red-700">No se pudo cargar el contexto 360: {error || 'sin datos'}</div>;
  }

  return (
    <section className="border-b border-[#d8cbb5] bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <User className="h-4 w-4 text-[#c88b25]" />
              <h1 className="font-serif text-xl font-bold text-[#07111d]">{data.profile.full_name || data.profile.email}</h1>
              <Badge ok={data.profile.status === 'active'}>{data.profile.status === 'active' ? 'Cliente activo' : data.profile.status}</Badge>
              <Badge ok={data.profile.profile_completed}>Perfil</Badge>
              <Badge ok={data.profile.billing_ready}>Facturación</Badge>
            </div>
            <p className="mt-1 text-xs text-[#8a9aab]">{data.profile.email}</p>

            {data.companies.length > 0 ? (
              <div className="mt-3 flex max-w-2xl flex-wrap items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-[#c88b25]" />
                <select
                  aria-label="Contexto de entidad en Cliente 360"
                  value={activeCompany?.id ?? ''}
                  onChange={(event) => chooseCompany(event.target.value)}
                  className="min-w-[260px] rounded-lg border border-[#d8cbb5] bg-white px-3 py-2 text-xs font-semibold text-[#29384a] outline-none focus:border-[#c88b25]"
                >
                  {data.companies.map((company) => (
                    <option key={company.id} value={company.id}>{company.name}{company.nif ? ` · ${company.nif}` : ''}</option>
                  ))}
                </select>
                {activeCompany?.id === data.profile.active_company_id
                  ? <Badge ok>Activa en portal</Badge>
                  : <Badge>Contexto Admin</Badge>}
                {activeCoverage?.source === 'included_entity' ? <Badge ok>Incluida</Badge> : null}
              </div>
            ) : (
              <div className="mt-2 flex items-center gap-2 text-xs text-[#8a9aab]">
                <Building2 className="h-3.5 w-3.5" /> Sin entidad vinculada
              </div>
            )}
            <p className="mt-1 text-[10px] text-[#8a9aab]">Cambiar este selector solo cambia el contexto de trabajo Admin; no modifica la entidad activa del portal del cliente.</p>
          </div>

          <button type="button" onClick={() => void load()} title="Actualizar contexto" className="rounded-lg border border-[#d8cbb5] p-2 text-[#29384a] hover:border-[#c88b25]">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          <Link href={externalHref('/admin/expedientes', { clientId })} className="rounded-xl border border-[#f0e8d8] bg-[#fbf8f2] p-3 hover:border-[#c88b25]">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[#8a9aab]"><FileText className="h-3.5 w-3.5" />Expedientes</p>
            <p className="mt-1 text-sm font-bold text-[#07111d]">{openCases.length} abiertos</p>
            <p className="text-[10px] text-[#8a9aab]">Contexto: {activeCompany?.name ?? 'cliente'}</p>
          </Link>
          <Link href={externalHref('/admin/presupuestos', { clientId })} className="rounded-xl border border-[#f0e8d8] bg-[#fbf8f2] p-3 hover:border-[#c88b25]">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[#8a9aab]"><CreditCard className="h-3.5 w-3.5" />Presupuesto</p>
            <p className="mt-1 text-sm font-bold text-[#07111d]">{companyQuotes[0]?.service ?? 'Sin presupuesto'}</p>
            {companyQuotes[0] && <p className="text-[10px] text-[#8a9aab]">{companyQuotes[0].status} · {companyQuotes[0].amount_eur} € base</p>}
          </Link>
          <Link href={externalHref('/admin/suscripciones', { clientId })} className="rounded-xl border border-[#f0e8d8] bg-[#fbf8f2] p-3 hover:border-[#c88b25]">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[#8a9aab]"><CreditCard className="h-3.5 w-3.5" />Cobertura</p>
            <p className="mt-1 text-sm font-bold text-[#07111d]">{commercialLabel}</p>
            {activeCoverage?.source === 'included_entity' && activeCoverage.primaryCompanyName ? (
              <p className="text-[10px] text-[#8a9aab]">Contratante: {activeCoverage.primaryCompanyName}</p>
            ) : (
              <p className="text-[10px] text-[#8a9aab]">{activeSubscription ? 'Suscripción directa' : openCheckout ? 'Checkout abierto' : 'Sin contratación activa'}</p>
            )}
          </Link>
          <Link href={childHref(`/admin/clientes/${clientId}/comunicaciones`)} className="rounded-xl border border-[#f0e8d8] bg-[#fbf8f2] p-3 hover:border-[#c88b25]">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[#8a9aab]"><Mail className="h-3.5 w-3.5" />Comunicaciones</p>
            <p className="mt-1 text-sm font-bold text-[#07111d]">{data.emailEvents.length} emails EXPERT</p>
            <p className="text-[10px] text-[#8a9aab]">Abrir historial unificado</p>
          </Link>
          <Link href={childHref(`/admin/clientes/${clientId}/integraciones`)} className="rounded-xl border border-[#f0e8d8] bg-[#fbf8f2] p-3 hover:border-[#c88b25]">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[#8a9aab]"><Plug className="h-3.5 w-3.5" />Integraciones</p>
            <p className="mt-1 text-sm font-bold text-[#07111d]">{activeIntegrations.length} activas</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {activeIntegrations.length ? activeIntegrations.map((integration) => <Badge key={integration.id} ok>{integration.provider}</Badge>) : <span className="text-[10px] text-[#8a9aab]">Sin integración para esta entidad</span>}
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
