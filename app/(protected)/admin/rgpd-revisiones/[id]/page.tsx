import Link from 'next/link';
import { ArrowLeft, Building2, Database, FileText, Server, ShieldCheck, UserRound } from 'lucide-react';
import { fetchWithCookies } from '@/lib/utils/server-fetch';
import { CompleteRgpdReviewForm } from '@/components/admin/CompleteRgpdReviewForm';

type ApiResponse = {
  project: {
    id: string;
    user_id: string;
    company_id: string | null;
    version: number;
    status: string;
    payload: unknown;
    consent_at: string | null;
    created_at: string;
    updated_at: string;
    reviewer_id: string | null;
    review_started_at: string | null;
    review_completed_at: string | null;
    review_task_id: string | null;
    review_summary: string | null;
    requester: { id: string; full_name: string | null; email: string | null } | null;
    reviewer: { id: string; full_name: string | null; email: string | null } | null;
  };
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function textValue(value: unknown, fallback = '—') {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function listStrings(value: unknown) {
  return asArray(value).filter((item): item is string => typeof item === 'string');
}

export default async function AdminRgpdReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await fetchWithCookies<ApiResponse>('/api/admin/rgpd-reviews/' + encodeURIComponent(id));

  if (!data?.project) {
    return (
      <main className="min-h-screen bg-[#f8f4eb] px-5 py-8 lg:px-8">
        <Link href="/admin/rgpd-revisiones" className="inline-flex items-center gap-2 text-sm font-semibold text-[#29384a]">
          <ArrowLeft className="h-4 w-4" /> Volver a revisiones RGPD
        </Link>
        <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-6 text-amber-950">
          No se pudo cargar este expediente RGPD.
        </div>
      </main>
    );
  }

  const project = data.project;
  const payload = asRecord(project.payload);
  const company = asRecord(payload.profile);
  const treatments = asRecord(payload.treatments);
  const providers = asRecord(payload.providers);
  const progress = asRecord(payload.progress);
  const retention = asArray(payload.retention);

  const selectedTreatments = listStrings(treatments.selectedIds);
  const customTreatments = asArray(treatments.customTreatments).map(asRecord);
  const selectedProviders = listStrings(providers.selectedIds);
  const customProviders = asArray(providers.custom).map(asRecord);

  return (
    <main className="min-h-screen bg-[#f8f4eb]">
      <div className="border-b border-[#d8cbb5] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-7 lg:px-8">
          <Link href="/admin/rgpd-revisiones" className="inline-flex items-center gap-2 text-xs font-semibold text-[#29384a] hover:text-[#07111d]">
            <ArrowLeft className="h-3.5 w-3.5" /> Revisiones RGPD
          </Link>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c88b25]">Snapshot de solo lectura</p>
              <h1 className="mt-1 font-serif text-3xl font-bold text-[#07111d]">
                {textValue(company.legalName, 'Expediente RGPD')}
              </h1>
              <p className="mt-2 text-sm text-[#526171]">
                Versión {project.version} · {project.status} · ID {project.id}
              </p>
            </div>
            <div className="rounded-xl border border-[#e3d8c6] bg-[#fffdf8] px-4 py-3 text-sm text-[#526171]">
              <p><strong>Guardado:</strong> {new Date(project.created_at).toLocaleString('es-ES')}</p>
              <p className="mt-1"><strong>Actualizado:</strong> {new Date(project.updated_at).toLocaleString('es-ES')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-6 lg:grid-cols-[1fr_320px] lg:px-8">
        <div className="space-y-5">
          <section className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#D4A017]" />
              <h2 className="font-serif text-xl font-bold text-[#07111d]">Perfil de empresa</h2>
            </div>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2 text-sm">
              {[
                ['Razón social', company.legalName],
                ['NIF/CIF', company.taxId],
                ['Actividad', company.activity],
                ['Email privacidad', company.contactEmail],
                ['Empleados/colaboradores', company.employees],
              ].map(([label, value]) => (
                <div key={String(label)} className="border-b border-[#eee6d9] pb-3">
                  <dt className="text-xs font-bold uppercase tracking-wide text-[#8c8173]">{String(label)}</dt>
                  <dd className="mt-1 text-[#23364D]">{textValue(value)}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#D4A017]" />
              <h2 className="font-serif text-xl font-bold text-[#07111d]">Tratamientos</h2>
            </div>
            <div className="mt-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[#8c8173]">Plantillas seleccionadas</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedTreatments.length
                  ? selectedTreatments.map((item) => <span key={item} className="rounded-full bg-[#f8f4eb] px-3 py-1 text-xs text-[#526171]">{item}</span>)
                  : <span className="text-sm text-[#8c8173]">Ninguna</span>}
              </div>
            </div>
            {customTreatments.length > 0 && (
              <div className="mt-5 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wide text-[#8c8173]">Tratamientos personalizados</p>
                {customTreatments.map((item, index) => (
                  <div key={index} className="rounded-xl border border-[#e7ddcf] bg-[#fffdf8] p-4 text-sm">
                    <p className="font-bold text-[#07111d]">{textValue(item.name, 'Tratamiento sin nombre')}</p>
                    <p className="mt-2"><strong>Finalidad:</strong> {textValue(item.purpose)}</p>
                    <p className="mt-1"><strong>Base:</strong> {textValue(item.legalBasis)}</p>
                    <p className="mt-1"><strong>Datos:</strong> {textValue(item.dataCategories)}</p>
                    <p className="mt-1"><strong>Interesados:</strong> {textValue(item.dataSubjects)}</p>
                    <p className="mt-1"><strong>Destinatarios:</strong> {textValue(item.recipients)}</p>
                    <p className="mt-1"><strong>Conservación:</strong> {textValue(item.retention)}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-[#D4A017]" />
              <h2 className="font-serif text-xl font-bold text-[#07111d]">Proveedores y transferencias</h2>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedProviders.length
                ? selectedProviders.map((item) => <span key={item} className="rounded-full bg-[#f8f4eb] px-3 py-1 text-xs text-[#526171]">{item}</span>)
                : <span className="text-sm text-[#8c8173]">Sin proveedores predefinidos seleccionados</span>}
            </div>
            {customProviders.length > 0 && (
              <div className="mt-5 space-y-3">
                {customProviders.map((item, index) => (
                  <div key={index} className="rounded-xl border border-[#e7ddcf] bg-[#fffdf8] p-4 text-sm">
                    <p className="font-bold text-[#07111d]">{textValue(item.name, 'Proveedor sin nombre')}</p>
                    <p className="mt-2"><strong>Finalidad:</strong> {textValue(item.purpose)}</p>
                    <p className="mt-1"><strong>Rol:</strong> {textValue(item.role)}</p>
                    <p className="mt-1"><strong>Ubicación:</strong> {textValue(item.location)}</p>
                    <p className="mt-1"><strong>Transferencia:</strong> {item.internationalTransfer === true ? 'Sí' : 'No / no indicada'}</p>
                    <p className="mt-1"><strong>DPA revisado:</strong> {item.dpaReviewed === true ? 'Sí' : 'No'}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-[#D4A017]" />
              <h2 className="font-serif text-xl font-bold text-[#07111d]">Conservación</h2>
            </div>
            <div className="mt-4 space-y-3">
              {retention.length === 0 ? (
                <p className="text-sm text-[#8c8173]">Sin matriz de conservación.</p>
              ) : retention.map((raw, index) => {
                const row = asRecord(raw);
                return (
                  <div key={index} className="rounded-xl border border-[#e7ddcf] bg-[#fffdf8] p-4 text-sm">
                    <p className="font-bold text-[#07111d]">{textValue(row.category, 'Categoría sin nombre')}</p>
                    <p className="mt-2"><strong>Operativa:</strong> {textValue(row.operational)}</p>
                    <p className="mt-1"><strong>Plazo/base:</strong> {textValue(row.legalBasis)}</p>
                    <p className="mt-1"><strong>Bloqueo:</strong> {textValue(row.blocking)}</p>
                    <p className="mt-1"><strong>Supresión:</strong> {textValue(row.deletion)}</p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
            <div className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-[#D4A017]" />
              <h2 className="font-bold text-[#07111d]">Solicitante</h2>
            </div>
            <p className="mt-3 text-sm text-[#23364D]">{project.requester?.full_name || 'Sin nombre'}</p>
            <p className="text-xs text-[#6f665b]">{project.requester?.email || 'Email no disponible'}</p>
          </section>

          <section className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#D4A017]" />
              <h2 className="font-bold text-[#07111d]">Consentimiento de guardado</h2>
            </div>
            <p className="mt-3 text-sm text-[#23364D]">
              {project.consent_at ? new Date(project.consent_at).toLocaleString('es-ES') : 'No consta fecha'}
            </p>
          </section>

          {project.reviewer && (
            <section className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
              <h2 className="font-bold text-[#07111d]">Revisor asignado</h2>
              <p className="mt-3 text-sm text-[#23364D]">{project.reviewer.full_name || 'Sin nombre'}</p>
              <p className="text-xs text-[#6f665b]">{project.reviewer.email || 'Email no disponible'}</p>
              {project.review_started_at && (
                <p className="mt-2 text-xs text-[#8c8173]">
                  Inicio: {new Date(project.review_started_at).toLocaleString('es-ES')}
                </p>
              )}
            </section>
          )}

          {project.status === 'in_review' && (
            <CompleteRgpdReviewForm projectId={project.id} />
          )}

          {project.status === 'completed' && project.review_summary && (
            <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <h2 className="font-bold text-emerald-950">Conclusiones profesionales</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-emerald-950">{project.review_summary}</p>
              {project.review_completed_at && (
                <p className="mt-3 text-xs text-emerald-800">
                  Cerrada: {new Date(project.review_completed_at).toLocaleString('es-ES')}
                </p>
              )}
            </section>
          )}

          <section className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
            <h2 className="font-bold text-[#07111d]">Progreso local guardado</h2>
            <p className="mt-3 text-sm text-[#23364D]">{Object.keys(progress).length} marcas registradas</p>
            <p className="mt-2 text-xs leading-5 text-[#8c8173]">
              Esta ficha es solo lectura. La revisión profesional debe crear anotaciones o tareas separadas, nunca reescribir el snapshot original.
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}
