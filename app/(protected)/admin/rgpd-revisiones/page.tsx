import Link from 'next/link';
import { AlertTriangle, ArrowLeft, Building2, FileCheck2, UserRound } from 'lucide-react';
import { fetchWithCookies } from '@/lib/utils/server-fetch';

type ReviewItem = {
  id: string;
  version: number;
  status: string;
  user_id: string;
  company_id: string | null;
  created_at: string;
  updated_at: string;
  consent_at: string | null;
  requester: { id: string; full_name: string | null; email: string | null } | null;
  company: {
    legal_name: string | null;
    tax_id: string | null;
    activity: string | null;
    contact_email: string | null;
  };
  summary: {
    treatment_count: number;
    provider_count: number;
  };
};

type ApiResponse = {
  items: ReviewItem[];
  status: string;
  count: number;
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function statusLabel(status: string) {
  if (status === 'review_requested') return 'Revisión solicitada';
  if (status === 'archived') return 'Archivado';
  return 'Borrador';
}

export default async function AdminRgpdReviewsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const rawStatus = one(params.status);
  const status = ['draft', 'review_requested', 'archived'].includes(rawStatus)
    ? rawStatus
    : 'review_requested';

  const data = await fetchWithCookies<ApiResponse>('/api/admin/rgpd-reviews?status=' + encodeURIComponent(status));
  const loadFailed = data === null;
  const items = data?.items ?? [];

  return (
    <main className="min-h-screen bg-[#f8f4eb]">
      <div className="border-b border-[#d8cbb5] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-7 lg:px-8">
          <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-semibold text-[#29384a] hover:text-[#07111d]">
            <ArrowLeft className="h-3.5 w-3.5" /> Panel admin
          </Link>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c88b25]">Compliance · RGPD</p>
              <h1 className="mt-1 font-serif text-3xl font-bold text-[#07111d]">Revisiones RGPD</h1>
              <p className="mt-1 max-w-2xl text-sm text-[#526171]">
                Cola de snapshots guardados por clientes. Esta vista es de solo lectura: el expediente original no se modifica desde Admin.
              </p>
            </div>
            <div className="rounded-xl border border-[#e3d8c6] bg-[#fffdf8] px-5 py-3 text-center">
              <p className="font-serif text-2xl font-bold text-[#07111d]">{data?.count ?? 0}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6f665b]">{statusLabel(status)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-6 lg:px-8">
        <div className="mb-5 flex flex-wrap gap-2">
          {[
            ['review_requested', 'Pendientes de revisión'],
            ['draft', 'Borradores guardados'],
            ['archived', 'Archivados'],
          ].map(([value, label]) => (
            <Link
              key={value}
              href={'/admin/rgpd-revisiones?status=' + value}
              className={
                'rounded-xl border px-4 py-2 text-sm font-semibold transition ' +
                (status === value
                  ? 'border-[#D4A017] bg-[#D4A017]/10 text-[#07111d]'
                  : 'border-[#d8cbb5] bg-white text-[#526171] hover:border-[#D4A017]')
              }
            >
              {label}
            </Link>
          ))}
        </div>

        {loadFailed ? (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-950">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">No se pudo cargar la cola RGPD.</p>
              <p className="mt-1 text-xs">No se muestran resultados vacíos para evitar confundir un fallo de carga con ausencia de solicitudes.</p>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#d8cbb5] bg-white p-12 text-center">
            <FileCheck2 className="mx-auto h-10 w-10 text-[#c7b9a2]" />
            <h2 className="mt-4 font-serif text-lg font-bold text-[#07111d]">No hay expedientes en este estado</h2>
          </div>
        ) : (
          <div className="grid gap-4">
            {items.map((item) => (
              <article key={item.id} className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[#d7a33a]/30 bg-[#fff8e8] px-2.5 py-1 text-[11px] font-bold text-[#8a6111]">
                        Versión {item.version}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                        {statusLabel(item.status)}
                      </span>
                    </div>

                    <div className="mt-4 flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D4A017]/10 text-[#b77d16]">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="font-serif text-xl font-bold text-[#07111d]">
                          {item.company.legal_name || 'Empresa sin razón social completada'}
                        </h2>
                        <p className="mt-1 text-sm text-[#526171]">
                          {item.company.tax_id || 'NIF/CIF pendiente'}
                          {item.company.activity ? ' · ' + item.company.activity : ''}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-[#6f665b]">
                      <span>{item.summary.treatment_count} tratamientos</span>
                      <span>{item.summary.provider_count} proveedores</span>
                      <span>Guardado: {new Date(item.created_at).toLocaleString('es-ES')}</span>
                      <span>Actualizado: {new Date(item.updated_at).toLocaleString('es-ES')}</span>
                    </div>
                  </div>

                  <div className="min-w-[260px] rounded-xl border border-[#e7ddcf] bg-[#fffdf8] p-4 text-sm">
                    <div className="flex items-center gap-2 font-semibold text-[#07111d]">
                      <UserRound className="h-4 w-4 text-[#D4A017]" />
                      Solicitante
                    </div>
                    <p className="mt-2 text-[#526171]">{item.requester?.full_name || 'Sin nombre de perfil'}</p>
                    <p className="text-xs text-[#6f665b]">{item.requester?.email || item.company.contact_email || 'Email no disponible'}</p>
                    <p className="mt-3 break-all text-[10px] text-[#918677]">ID: {item.id}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
