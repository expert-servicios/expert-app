'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  FileText,
  FolderOpen,
  Link2,
  Loader2,
  Plug,
  Search,
  ShieldCheck,
  Unlink,
  UserPlus,
  Users,
} from 'lucide-react';

type Person = {
  id: string;
  membershipRole: 'owner' | 'admin' | 'member';
  name: string;
  email: string | null;
  phone: string | null;
  taxId: string | null;
  profileRole: string | null;
  status: string | null;
  isActiveCompany: boolean;
  href: string;
};

type CompanyPayload = {
  company: {
    id: string;
    displayName: string;
    razon_social: string | null;
    nombre_comercial: string | null;
    cif_nif: string | null;
    forma_juridica: string | null;
    status: string;
    email: string | null;
    telefono: string | null;
    direccion: string | null;
    ciudad: string | null;
    provincia: string | null;
    codigo_postal: string | null;
    pais: string | null;
    web: string | null;
    stripe_customer_id: string | null;
  };
  people: Person[];
  subscriptions: Array<{ id: string; client_id: string; plan_name: string; status: string }>;
  cases: Array<{ id: string; client_id: string; service: string; state: string; status: string; next_action: string | null }>;
  integrations: Array<{ id: string; provider: string; status: string; last_success_at: string | null; last_error: string | null }>;
  quotes: Array<{ id: string; client_id: string; title: string; status: string; amount_eur: number }>;
  orders: Array<{ id: string; client_id: string | null; status: string; amount_eur: number; currency: string; holded_invoice_id: string | null; holded_sync_error: string | null }>;
  checkoutSessions: Array<{ id: string; user_id: string | null; status: string; stripe_session_id: string }>;
  documents: Array<{ id: string; client_id: string | null; title: string | null; original_name: string | null; state: string | null }>;
  tasks: Array<{ id: string; client_id: string | null; title: string; status: string; priority: string | null; due_date: string | null }>;
  summary: {
    linkedPeople: number;
    activeCases: number;
    openTasks: number;
    pendingDocuments: number;
    activeSubscription: string | null;
    holdedConnected: boolean;
    integrationErrors: number;
    openCheckouts: number;
  };
};

type Candidate = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  taxId: string | null;
  status: string;
  linked: boolean;
  membershipRole: string | null;
  isActiveCompany: boolean;
};

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-[#d8cbb5] bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#8a9aab]">{label}</p>
          <p className="mt-1 text-xl font-bold text-[#07111d]">{value}</p>
        </div>
        <Icon className="h-4 w-4 text-[#c88b25]" />
      </div>
    </div>
  );
}

export default function Company360Page() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<CompanyPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyPersonId, setBusyPersonId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [peopleSearch, setPeopleSearch] = useState('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchingPeople, setSearchingPeople] = useState(false);
  const [membershipRole, setMembershipRole] = useState<'owner' | 'admin' | 'member'>('owner');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/empresas/${id}`, { cache: 'no-store' });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'No se pudo cargar la empresa');
      setData(json as CompanyPayload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const searchPeople = useCallback(async () => {
    const q = peopleSearch.trim();
    if (q.length < 2) {
      setCandidates([]);
      return;
    }
    setSearchingPeople(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/empresas/${id}/personas?q=${encodeURIComponent(q)}`, { cache: 'no-store' });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'No se pudieron buscar clientes');
      setCandidates((json.candidates ?? []) as Candidate[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setSearchingPeople(false);
    }
  }, [id, peopleSearch]);

  useEffect(() => {
    const timer = window.setTimeout(() => void searchPeople(), 250);
    return () => window.clearTimeout(timer);
  }, [searchPeople]);

  async function linkPerson(profileId: string) {
    setBusyPersonId(profileId);
    setError('');
    try {
      const response = await fetch(`/api/admin/empresas/${id}/personas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, role: membershipRole }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'No se pudo vincular el cliente');
      await Promise.all([load(), searchPeople()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setBusyPersonId(null);
    }
  }

  async function unlinkPerson(profileId: string) {
    if (!window.confirm('¿Desvincular esta persona de la empresa? No se borrará ningún expediente, documento ni histórico.')) return;
    setBusyPersonId(profileId);
    setError('');
    try {
      const response = await fetch(`/api/admin/empresas/${id}/personas`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'No se pudo desvincular el cliente');
      await Promise.all([load(), searchPeople()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setBusyPersonId(null);
    }
  }

  const holded = useMemo(
    () => data?.integrations.find((item) => item.provider === 'holded' && item.status === 'active') ?? null,
    [data],
  );

  if (loading && !data) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#c88b25]" /></div>;
  }

  if (!data) {
    return <div className="mx-auto max-w-6xl px-6 py-8"><div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error || 'Empresa no disponible'}</div></div>;
  }

  const company = data.company;

  return (
    <main className="min-h-screen bg-[#f8f4eb]">
      <div className="border-b border-[#d8cbb5] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <Link href="/admin/directorio" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#52606d] hover:text-[#07111d]">
            <ArrowLeft className="h-3.5 w-3.5" /> Directorio 360
          </Link>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f8f4eb] text-[#c88b25]"><Building2 className="h-6 w-6" /></div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-serif text-3xl font-bold text-[#07111d]">{company.displayName}</h1>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${company.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{company.status}</span>
                </div>
                <p className="mt-1 font-mono text-sm text-[#52606d]">{company.cif_nif ?? 'Sin CIF/NIF'}</p>
                <p className="mt-1 text-xs text-[#8a9aab]">
                  {[company.forma_juridica, company.ciudad, company.provincia].filter(Boolean).join(' · ') || 'Sin datos adicionales'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href={`/admin/empresas/${id}/integraciones`} className="inline-flex items-center gap-1.5 rounded-xl bg-[#07111d] px-4 py-2 text-xs font-bold text-white">
                <Plug className="h-3.5 w-3.5" /> {holded ? 'Gestionar Holded' : 'Conectar Holded'}
              </Link>
              {company.stripe_customer_id && (
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#d8cbb5] bg-white px-4 py-2 text-xs font-bold text-[#29384a]">
                  <CreditCard className="h-3.5 w-3.5" /> Stripe vinculado
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-5 px-6 py-6">
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
          <Stat label="Personas" value={data.summary.linkedPeople} icon={Users} />
          <Stat label="Expedientes" value={data.summary.activeCases} icon={FolderOpen} />
          <Stat label="Tareas" value={data.summary.openTasks} icon={CheckCircle2} />
          <Stat label="Docs pendientes" value={data.summary.pendingDocuments} icon={FileText} />
          <Stat label="Plan" value={data.summary.activeSubscription ?? '—'} icon={CreditCard} />
          <Stat label="Holded" value={data.summary.holdedConnected ? 'Sí' : 'No'} icon={Plug} />
          <Stat label="Checkouts" value={data.summary.openCheckouts} icon={CalendarClock} />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-2xl border border-[#d8cbb5] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#c88b25]" />
              <h2 className="font-serif text-xl font-bold text-[#07111d]">Personas vinculadas</h2>
            </div>
            <p className="mt-2 text-sm text-[#52606d]">Este vínculo define qué clientes pueden trabajar con esta entidad. Desvincular no borra históricos.</p>

            <div className="mt-5 space-y-3">
              {data.people.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#d8cbb5] bg-[#fbf8f2] px-4 py-8 text-center text-sm text-[#8a9aab]">
                  Esta empresa todavía no tiene ninguna persona vinculada.
                </div>
              ) : data.people.map((person) => (
                <div key={person.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e6dfd2] p-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={person.href} className="font-bold text-[#07111d] hover:underline">{person.name}</Link>
                      <span className="rounded-full bg-[#f8f4eb] px-2 py-0.5 text-[10px] font-bold text-[#52606d]">{person.membershipRole}</span>
                      {person.isActiveCompany && <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-800">Entidad activa del cliente</span>}
                    </div>
                    <p className="mt-1 text-xs text-[#8a9aab]">{[person.email, person.taxId].filter(Boolean).join(' · ')}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/admin/clientes/${person.id}/portal?companyId=${id}`} className="inline-flex items-center gap-1 rounded-lg border border-[#d8cbb5] px-3 py-2 text-xs font-bold text-[#29384a]">
                      <ExternalLink className="h-3.5 w-3.5" /> Vista cliente
                    </Link>
                    <button
                      type="button"
                      disabled={busyPersonId === person.id}
                      onClick={() => void unlinkPerson(person.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 disabled:opacity-50"
                    >
                      <Unlink className="h-3.5 w-3.5" /> Desvincular
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[#d8cbb5] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-[#c88b25]" />
              <h2 className="font-serif text-xl font-bold text-[#07111d]">Vincular cliente existente</h2>
            </div>
            <p className="mt-2 text-sm text-[#52606d]">Búsqueda explícita. EXPERT no fusiona ni vincula personas automáticamente por nombre o email.</p>

            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_150px]">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-[#8a9aab]" />
                <input
                  value={peopleSearch}
                  onChange={(event) => setPeopleSearch(event.target.value)}
                  placeholder="Nombre, email, DNI/NIE…"
                  className="w-full rounded-xl border border-[#d8cbb5] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#c88b25]"
                />
              </div>
              <select
                value={membershipRole}
                onChange={(event) => setMembershipRole(event.target.value as typeof membershipRole)}
                className="rounded-xl border border-[#d8cbb5] bg-white px-3 py-2.5 text-sm"
              >
                <option value="owner">Titular / owner</option>
                <option value="admin">Administrador</option>
                <option value="member">Miembro</option>
              </select>
            </div>

            <div className="mt-4 space-y-2">
              {searchingPeople && <p className="text-xs text-[#8a9aab]"><Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" />Buscando…</p>}
              {!searchingPeople && peopleSearch.trim().length >= 2 && candidates.length === 0 && (
                <p className="rounded-xl bg-[#fbf8f2] px-4 py-3 text-xs text-[#8a9aab]">No hay clientes coincidentes.</p>
              )}
              {candidates.map((candidate) => (
                <div key={candidate.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#e6dfd2] px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#07111d]">{candidate.name}</p>
                    <p className="truncate text-xs text-[#8a9aab]">{[candidate.email, candidate.taxId].filter(Boolean).join(' · ')}</p>
                  </div>
                  {candidate.linked ? (
                    <span className="rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-bold text-green-800">Ya vinculado</span>
                  ) : (
                    <button
                      type="button"
                      disabled={busyPersonId === candidate.id}
                      onClick={() => void linkPerson(candidate.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#07111d] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                    >
                      <Link2 className="h-3.5 w-3.5" /> Vincular
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-[#d8cbb5] bg-white p-6 shadow-sm">
          <h2 className="font-serif text-xl font-bold text-[#07111d]">Operación de la entidad</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl bg-[#fbf8f2] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#8a9aab]">Expedientes</p>
              <p className="mt-2 text-sm font-bold text-[#07111d]">{data.cases.length} total</p>
              <div className="mt-2 space-y-1">{data.cases.slice(0, 4).map((item) => <Link key={item.id} href={`/admin/expedientes/${item.id}`} className="block truncate text-xs text-[#52606d] hover:underline">{item.service} · {item.state}</Link>)}</div>
            </div>
            <div className="rounded-xl bg-[#fbf8f2] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#8a9aab]">Tareas</p>
              <p className="mt-2 text-sm font-bold text-[#07111d]">{data.tasks.length} registradas</p>
              <div className="mt-2 space-y-1">{data.tasks.slice(0, 4).map((item) => <p key={item.id} className="truncate text-xs text-[#52606d]">{item.title} · {item.status}</p>)}</div>
            </div>
            <div className="rounded-xl bg-[#fbf8f2] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#8a9aab]">Facturación / cobro</p>
              <p className="mt-2 text-sm font-bold text-[#07111d]">{data.orders.length} pedido(s)</p>
              <p className="mt-1 text-xs text-[#52606d]">{data.quotes.length} presupuesto(s) · {data.checkoutSessions.length} checkout(s)</p>
            </div>
            <div className="rounded-xl bg-[#fbf8f2] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#8a9aab]">Integraciones</p>
              <div className="mt-2 flex flex-wrap gap-1.5">{data.integrations.length ? data.integrations.map((item) => <span key={item.id} className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{item.provider} · {item.status}</span>) : <span className="text-xs text-[#8a9aab]">Sin integraciones</span>}</div>
              {data.summary.integrationErrors > 0 && <p className="mt-2 text-xs font-semibold text-red-700">{data.summary.integrationErrors} integración(es) con error</p>}
            </div>
          </div>
        </section>

        {holded && (
          <section className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
            <ShieldCheck className="mr-2 inline h-4 w-4" /> Holded activo para esta empresa.
          </section>
        )}
      </div>
    </main>
  );
}
