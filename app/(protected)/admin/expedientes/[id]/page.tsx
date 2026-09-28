import Link from 'next/link';
import { Suspense } from 'react';
import { KiaWorkResults } from '@/components/admin/KiaWorkResults';
import { ArrowLeft, FolderOpen, User, Download, FileText, MessageSquare, ListTodo } from 'lucide-react';
import { AdminCaseCard } from '@/components/cases/AdminCaseCard';
import { DocStateSelect } from '@/components/admin/DocStateSelect';
import { CaseChecklistEditor } from '@/components/admin/CaseChecklistEditor';
import { HoldedSyncButton } from '@/components/admin/HoldedSyncButton';
import { AdminNoteEditor } from '@/components/admin/AdminNoteEditor';
import { AiCaseActions } from '@/components/admin/AiCaseActions';
import { AdminDeliverableUpload } from '@/components/admin/AdminDeliverableUpload';
import { CaseMessageThread } from '@/components/cases/CaseMessageThread';
import { CaseOperationsEditor } from '@/components/admin/CaseOperationsEditor';
import { CaseWorkflowPanel } from '@/components/admin/CaseWorkflowPanel';
import { fetchWithCookies } from '@/lib/utils/server-fetch';

interface Document {
  id: string;
  original_name: string;
  state: 'pendiente' | 'revisado' | 'rechazado';
  created_at: string;
  file_path: string;
  downloadUrl: string | null;
  uploaded_by_role: 'client' | 'admin';
}

interface Message {
  id: string;
  body: string;
  sender_role: string;
  created_at: string;
  profiles: { full_name: string | null } | null;
}

interface DocumentNote {
  id: string;
  item_key: string;
  item_label: string;
  comment: string | null;
  updated_at: string;
  updated_by: string | null;
}

type IrnrIntake = {
  taxYear: string;
  residenceCountry: string;
  taxIdForeign: string;
  properties: Array<{
    address: string;
    cadastralReference: string;
    acquisitionDate: string;
    ownershipPercent: string;
    use: 'available' | 'rented' | 'sold';
  }>;
};

function parseIrnrIntake(comment: string | null | undefined): IrnrIntake | null {
  if (!comment) return null;
  try {
    const parsed = JSON.parse(comment) as Partial<IrnrIntake>;
    if (!Array.isArray(parsed.properties)) return null;
    return {
      taxYear: typeof parsed.taxYear === 'string' ? parsed.taxYear : '',
      residenceCountry: typeof parsed.residenceCountry === 'string' ? parsed.residenceCountry : '',
      taxIdForeign: typeof parsed.taxIdForeign === 'string' ? parsed.taxIdForeign : '',
      properties: parsed.properties.map((property) => ({
        address: typeof property?.address === 'string' ? property.address : '',
        cadastralReference: typeof property?.cadastralReference === 'string' ? property.cadastralReference : '',
        acquisitionDate: typeof property?.acquisitionDate === 'string' ? property.acquisitionDate : '',
        ownershipPercent: typeof property?.ownershipPercent === 'string' ? property.ownershipPercent : '',
        use: property?.use === 'rented' || property?.use === 'sold' ? property.use : 'available',
      })),
    };
  } catch {
    return null;
  }
}

const irnrUseLabels: Record<IrnrIntake['properties'][number]['use'], string> = {
  available: 'A disposición / no alquilado',
  rented: 'Alquilado total o parcialmente',
  sold: 'Vendido durante el ejercicio',
};

interface CaseDetail {
  id: string;
  category: string;
  service: string;
  service_id: string | null;
  state: string;
  status: string | null;
  effective_status: 'nuevo' | 'pendiente_cliente' | 'en_revision' | 'listo_para_presentar' | 'presentado' | 'finalizado' | 'bloqueado';
  opened_at: string;
  closed_at: string | null;
  client_id: string;
  admin_note: string | null;
  docs_checklist: string[] | null;
  checklist_json: Record<string, unknown> | null;
  assigned_to: string | null;
  priority: 'baja' | 'media' | 'alta' | 'critica' | null;
  next_action: string | null;
  due_date: string | null;
  order_id: string | null;
  client: { email: string; full_name: string | null; phone: string | null };
  assignee: { full_name: string | null } | null;
}


export default async function AdminCaseDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;

  const [data, messagesData] = await Promise.all([
    fetchWithCookies<{ case: CaseDetail; documents: Document[]; documentNotes: DocumentNote[] }>(`/api/admin/cases/${id}`),
    fetchWithCookies<{ messages: Message[] }>(`/api/cases/${id}/messages`)
  ]);

  if (!data) {
    return (
      <main className="min-h-screen bg-[#f8f4eb] py-12">
        <div className="mx-auto max-w-4xl px-6">
          <Link href="/admin/expedientes" className="inline-flex items-center gap-2 text-sm font-semibold text-[#29384a] hover:text-[#07111d]">
            <ArrowLeft className="h-4 w-4" /> Volver a expedientes
          </Link>
          <p className="mt-8 text-[#29384a]">Expediente no encontrado.</p>
        </div>
      </main>
    );
  }

  const { case: c, documents } = data;
  const documentNotes = data.documentNotes ?? [];
  const irnrNote = documentNotes.find((note) => note.item_key === 'irnr-intake') ?? null;
  const irnrIntake = parseIrnrIntake(irnrNote?.comment);
  const messages = messagesData?.messages ?? [];
  const clientDocs = documents.filter((d) => d.uploaded_by_role !== 'admin');
  const deliverables = documents.filter((d) => d.uploaded_by_role === 'admin');
  const pending = clientDocs.filter((d) => d.state === 'pendiente').length;
  const unreadMessages = messages.filter((m) => m.sender_role === 'client').length;

  return (
    <main className="min-h-screen bg-[#f8f4eb] py-10">
      <div className="mx-auto max-w-4xl space-y-4 px-6">

        <Link href="/admin/expedientes" className="inline-flex items-center gap-2 text-sm font-semibold text-[#29384a] hover:text-[#07111d]">
          <ArrowLeft className="h-4 w-4" /> Volver a expedientes
        </Link>

        {/* Case state card */}
        <AdminCaseCard caseItem={c} />

        {/* Client info */}
        <div className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
          <div className="mb-3 flex items-center gap-2">
            <User className="h-4 w-4 text-[#c88b25]" />
            <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">Cliente</p>
          </div>
          <div className="grid gap-1 text-sm sm:grid-cols-3">
            <div>
              <p className="text-xs text-[#29384a]">Nombre</p>
              <p className="font-semibold text-[#07111d]">{c.client.full_name ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-[#29384a]">Email</p>
              <a href={`mailto:${c.client.email}`} className="font-semibold text-[#c88b25] hover:underline">{c.client.email}</a>
            </div>
            <div>
              <p className="text-xs text-[#29384a]">Teléfono</p>
              <p className="font-semibold text-[#07111d]">{c.client.phone ?? '—'}</p>
            </div>
          </div>
        </div>

        <CaseOperationsEditor
          caseId={id}
          initialPriority={c.priority}
          initialNextAction={c.next_action}
          initialDueDate={c.due_date}
        />

        <CaseWorkflowPanel serviceId={c.service_id} checklistJson={c.checklist_json} />

        {c.service_id?.split(',').includes('no-residentes') && (
          <section className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">IRNR · datos del cliente</p>
                <h2 className="mt-1 font-serif text-xl font-bold text-[#07111d]">Cuestionario de inmuebles</h2>
              </div>
              {irnrNote?.updated_at && (
                <p className="text-xs text-[#52606d]">
                  Actualizado {new Date(irnrNote.updated_at).toLocaleString('es-ES')}
                </p>
              )}
            </div>

            {!irnrIntake ? (
              <p className="mt-4 rounded-lg border border-dashed border-[#d8cbb5] bg-[#fffdf8] p-4 text-sm text-[#52606d]">
                El cliente todavía no ha completado el cuestionario IRNR.
              </p>
            ) : (
              <>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-[#f8f4eb] p-3">
                    <p className="text-[11px] font-bold uppercase text-[#8a6111]">Ejercicio</p>
                    <p className="mt-1 text-sm font-semibold text-[#07111d]">{irnrIntake.taxYear || '—'}</p>
                  </div>
                  <div className="rounded-lg bg-[#f8f4eb] p-3">
                    <p className="text-[11px] font-bold uppercase text-[#8a6111]">Residencia fiscal</p>
                    <p className="mt-1 text-sm font-semibold text-[#07111d]">{irnrIntake.residenceCountry || '—'}</p>
                  </div>
                  <div className="rounded-lg bg-[#f8f4eb] p-3">
                    <p className="text-[11px] font-bold uppercase text-[#8a6111]">N.º fiscal extranjero</p>
                    <p className="mt-1 break-all text-sm font-semibold text-[#07111d]">{irnrIntake.taxIdForeign || '—'}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {irnrIntake.properties.map((property, index) => (
                    <div key={`${index}-${property.cadastralReference}`} className="rounded-xl border border-[#e4d8c6] bg-[#fffdf8] p-4">
                      <p className="text-sm font-bold text-[#07111d]">Inmueble {index + 1}</p>
                      <dl className="mt-3 grid gap-x-4 gap-y-2 text-xs sm:grid-cols-2">
                        <div><dt className="text-[#7a7064]">Dirección</dt><dd className="font-semibold text-[#29384a]">{property.address || '—'}</dd></div>
                        <div><dt className="text-[#7a7064]">Referencia catastral</dt><dd className="font-semibold text-[#29384a]">{property.cadastralReference || '—'}</dd></div>
                        <div><dt className="text-[#7a7064]">Fecha de adquisición</dt><dd className="font-semibold text-[#29384a]">{property.acquisitionDate || '—'}</dd></div>
                        <div><dt className="text-[#7a7064]">Titularidad</dt><dd className="font-semibold text-[#29384a]">{property.ownershipPercent ? `${property.ownershipPercent} %` : '—'}</dd></div>
                        <div className="sm:col-span-2"><dt className="text-[#7a7064]">Uso</dt><dd className="font-semibold text-[#29384a]">{irnrUseLabels[property.use]}</dd></div>
                      </dl>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        <Link
          href={`/admin/tareas?caseId=${id}`}
          className="flex items-center justify-between rounded-2xl border border-[#d8cbb5] bg-white p-5 transition hover:border-[#c88b25]"
        >
          <div className="flex items-center gap-3">
            <ListTodo className="h-5 w-5 text-[#c88b25]" />
            <div>
              <p className="font-semibold text-[#07111d]">Workflow y tareas del expediente</p>
              <p className="mt-1 text-xs text-[#52606d]">Ver dependencias, pasos bloqueados, referencias y tareas que requieren intervención.</p>
            </div>
          </div>
          <span className="text-sm font-bold text-[#c88b25]">Abrir →</span>
        </Link>

        {/* Admin internal note */}
        <AdminNoteEditor caseId={id} initialNote={c.admin_note} />

        {/* AI actions */}
        <AiCaseActions caseId={id} />
        {process.env.KIA_WORK_CONNECTOR_ENABLED === 'true' ? (
          <Suspense fallback={<p role="status">Cargando actividad de KIA…</p>}>
            <KiaWorkResults caseId={id} />
          </Suspense>
        ) : null}

        {/* Docs checklist */}
        <div id="documentos">
          <CaseChecklistEditor caseId={id} initialItems={Array.isArray(c.docs_checklist) ? c.docs_checklist : []} />
        </div>

        {c.category !== 'extranjeria-nacionalidad' && (
          <>
          <div className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">Holded Projects</p>
                <p className="mt-1 text-sm text-[#29384a]">
                  Crear o enlazar este expediente como proyecto operativo en Holded.
                </p>
              </div>
              <HoldedSyncButton
                endpoint="/api/admin/integrations/holded/sync-project"
                payload={{ caseId: id }}
                label="Sync proyecto"
              />
            </div>
          </div>
          </>
        )}

        {/* Message thread */}
        <div className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-[#c88b25]" />
            <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">
              Mensajes con el cliente
            </p>
            {unreadMessages > 0 && (
              <span className="ml-1 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
                {unreadMessages} del cliente
              </span>
            )}
          </div>
          <CaseMessageThread
            caseId={id}
            initialMessages={messages}
            currentRole="admin"
            clientPhone={c.client.phone}
          />
        </div>

        {/* Client documents */}
        <div className="rounded-2xl border border-[#d8cbb5] bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-[#c88b25]" />
              <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">Documentación del cliente</p>
            </div>
            <div className="flex gap-3 text-xs text-[#29384a]">
              <span><strong className="text-[#07111d]">{clientDocs.length}</strong> archivos</span>
              {pending > 0 && (
                <span className="font-semibold text-[#c88b25]">{pending} pendiente{pending > 1 ? 's' : ''}</span>
              )}
            </div>
          </div>

          {clientDocs.length === 0 ? (
            <div className="rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] p-8 text-center text-sm text-[#29384a]">
              El cliente aún no ha subido documentos para este expediente.
            </div>
          ) : (
            <div className="space-y-2">
              {clientDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex flex-col gap-3 rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#c88b25]" />
                    <div>
                      <p className="text-sm font-semibold text-[#07111d]">{doc.original_name}</p>
                      <p className="text-xs text-[#29384a]">
                        Subido el {new Date(doc.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <DocStateSelect docId={doc.id} currentState={doc.state} />
                    {doc.downloadUrl && (
                      <a
                        href={doc.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8cbb5] px-3 py-1.5 text-xs font-semibold text-[#29384a] transition hover:border-[#d7a33a] hover:text-[#07111d]"
                      >
                        <Download className="h-3 w-3" />
                        Descargar
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Deliverables (admin-uploaded) */}
        <div className="rounded-2xl border border-[#d8cbb5] bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-[#c88b25]" />
              <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">Entregables para el cliente</p>
            </div>
            {deliverables.length > 0 && (
              <span className="text-xs text-[#29384a]"><strong className="text-[#07111d]">{deliverables.length}</strong> archivo{deliverables.length !== 1 ? 's' : ''}</span>
            )}
          </div>

          {deliverables.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#d8cbb5] bg-[#f8f4eb] p-6 text-center text-sm text-[#29384a]">
              Sube aquí los documentos resultado del trámite. Serán visibles para el cliente.
            </div>
          ) : (
            <div className="space-y-2">
              {deliverables.map((doc) => (
                <div
                  key={doc.id}
                  className="flex flex-col gap-3 rounded-xl border border-[#d7a33a]/40 bg-amber-50/40 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#c88b25]" />
                    <div>
                      <p className="text-sm font-semibold text-[#07111d]">{doc.original_name}</p>
                      <p className="text-xs text-[#29384a]">
                        Subido el {new Date(doc.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  {doc.downloadUrl && (
                    <a
                      href={doc.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8cbb5] px-3 py-1.5 text-xs font-semibold text-[#29384a] transition hover:border-[#d7a33a] hover:text-[#07111d]"
                    >
                      <Download className="h-3 w-3" />
                      Descargar
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          <AdminDeliverableUpload caseId={id} />
        </div>

      </div>
    </main>
  );
}
