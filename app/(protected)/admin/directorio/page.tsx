'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  ExternalLink,
  KeyRound,
  Loader2,
  Search,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react';

type DirectoryItem = {
  id: string;
  kind: 'person' | 'company';
  name: string;
  subtitle: string;
  identifier: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  role: string | null;
  isClient: boolean;
  hasPortalAccess: boolean;
  linkedCompanies: number;
  linkedPeople: number;
  activeCases: number;
  activeSubscription: string | null;
  holdedConnected: boolean;
  href: string;
  portalHref: string | null;
  holdedHref: string | null;
};

type DirectoryResponse = {
  items: DirectoryItem[];
  summary: {
    total: number;
    people: number;
    companies: number;
    clients: number;
    portalUsers: number;
    unlinkedCompanies: number;
    holdedConnected: number;
  };
};

type Filter = 'all' | 'clients' | 'users' | 'companies' | 'unlinked' | 'holded';

const EMPTY_SUMMARY: DirectoryResponse['summary'] = {
  total: 0,
  people: 0,
  companies: 0,
  clients: 0,
  portalUsers: 0,
  unlinkedCompanies: 0,
  holdedConnected: 0,
};

export default function AdminDirectoryPage() {
  const [data, setData] = useState<DirectoryResponse>({ items: [], summary: EMPTY_SUMMARY });
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/directorio', { cache: 'no-store' });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'No se pudo cargar el directorio');
      setData(json as DirectoryResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.items.filter((item) => {
      const filterMatch =
        filter === 'all' ||
        (filter === 'clients' && item.isClient) ||
        (filter === 'users' && item.kind === 'person' && item.hasPortalAccess) ||
        (filter === 'companies' && item.kind === 'company') ||
        (filter === 'unlinked' && item.kind === 'company' && item.linkedPeople === 0) ||
        (filter === 'holded' && item.holdedConnected);

      if (!filterMatch) return false;
      if (!q) return true;
      return [
        item.name,
        item.subtitle,
        item.identifier,
        item.email,
        item.phone,
        item.role,
      ].some((value) => value?.toLowerCase().includes(q));
    });
  }, [data.items, filter, query]);

  const filters: Array<{ key: Filter; label: string; count: number }> = [
    { key: 'all', label: 'Todos', count: data.summary.total },
    { key: 'clients', label: 'Clientes', count: data.summary.clients },
    { key: 'users', label: 'Usuarios con acceso', count: data.summary.portalUsers },
    { key: 'companies', label: 'Empresas', count: data.summary.companies },
    { key: 'unlinked', label: 'Empresas sin persona', count: data.summary.unlinkedCompanies },
    { key: 'holded', label: 'Holded conectado', count: data.summary.holdedConnected },
  ];

  return (
    <main className="min-h-screen bg-[#f8f4eb]">
      <div className="border-b border-[#d8cbb5] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#c88b25]">Admin 360</p>
              <h1 className="mt-1 font-serif text-3xl font-bold text-[#07111d]">Directorio 360</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#52606d]">
                Personas y empresas en una sola vista. “Usuario” significa acceso al portal; “cliente” es una condición operativa; “empresa” es la entidad fiscal.
              </p>
            </div>
            <Link
              href="/admin/onboarding"
              className="rounded-xl border border-[#d8cbb5] bg-white px-4 py-2 text-sm font-bold text-[#07111d] hover:border-[#c88b25]"
            >
              Alta / onboarding
            </Link>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {filters.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={`rounded-xl border px-3 py-3 text-left transition ${
                  filter === item.key
                    ? 'border-[#07111d] bg-[#07111d] text-white'
                    : 'border-[#d8cbb5] bg-white text-[#29384a] hover:border-[#c88b25]'
                }`}
              >
                <span className="block text-xl font-bold">{item.count}</span>
                <span className="text-[11px] font-semibold">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-4 px-6 py-6">
        <div className="rounded-2xl border border-[#d8cbb5] bg-white p-4 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-[#8a9aab]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre, email, teléfono, DNI/NIE/CIF o razón social…"
              className="w-full rounded-xl border border-[#d8cbb5] bg-[#fbf8f2] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#c88b25]"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#c88b25]" /></div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#d8cbb5] bg-white py-16 text-center text-sm text-[#8a9aab]">
            No hay resultados para este filtro.
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {filtered.map((item) => (
              <article key={`${item.kind}-${item.id}`} className="rounded-2xl border border-[#d8cbb5] bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f8f4eb] text-[#c88b25]">
                    {item.kind === 'company' ? <Building2 className="h-5 w-5" /> : <UserRound className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate font-serif text-lg font-bold text-[#07111d]">{item.name}</h2>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        item.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}>{item.status}</span>
                    </div>
                    <p className="mt-1 text-xs text-[#8a9aab]">{item.subtitle}</p>
                    {item.identifier && <p className="mt-1 font-mono text-xs text-[#29384a]">{item.identifier}</p>}
                    {item.email && <p className="mt-1 truncate text-xs text-[#52606d]">{item.email}</p>}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {item.isClient && <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">Cliente</span>}
                  {item.hasPortalAccess && <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-700">Acceso portal</span>}
                  {item.kind === 'company' && item.linkedPeople === 0 && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-800">Sin persona vinculada</span>}
                  {item.holdedConnected && <span className="rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-bold text-green-800">Holded</span>}
                  {item.activeSubscription && <span className="rounded-full bg-[#f8f4eb] px-2.5 py-1 text-[10px] font-bold text-[#29384a]">{item.activeSubscription}</span>}
                  {item.activeCases > 0 && <span className="rounded-full bg-[#f8f4eb] px-2.5 py-1 text-[10px] font-bold text-[#29384a]">{item.activeCases} expediente(s) activo(s)</span>}
                </div>

                <div className="mt-4 grid gap-2 rounded-xl bg-[#fbf8f2] p-3 sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#8a9aab]">{item.kind === 'person' ? 'Entidades vinculadas' : 'Personas vinculadas'}</p>
                    <p className="mt-1 text-sm font-bold text-[#07111d]">{item.kind === 'person' ? item.linkedCompanies : item.linkedPeople}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#8a9aab]">Portal</p>
                    <p className="mt-1 text-sm font-bold text-[#07111d]">{item.kind === 'person' ? (item.hasPortalAccess ? 'Sí' : 'No') : 'Por vínculo'}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={item.href} className="inline-flex items-center gap-1.5 rounded-lg bg-[#07111d] px-3 py-2 text-xs font-bold text-white">
                    <ExternalLink className="h-3.5 w-3.5" /> Abrir
                  </Link>
                  {item.portalHref && (
                    <Link href={item.portalHref} className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8cbb5] px-3 py-2 text-xs font-bold text-[#29384a]">
                      <Users className="h-3.5 w-3.5" /> Vista cliente
                    </Link>
                  )}
                  {item.holdedHref && (
                    <Link href={item.holdedHref} className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8cbb5] px-3 py-2 text-xs font-bold text-[#29384a]">
                      {item.holdedConnected ? <ShieldCheck className="h-3.5 w-3.5" /> : <KeyRound className="h-3.5 w-3.5" />} Holded
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
