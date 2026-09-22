import { CheckCircle2, Circle, Clock3, ShieldCheck } from 'lucide-react';

type WorkflowTask = {
  key: string;
  title: string;
  description: string;
  humanApprovalRequired?: boolean;
};

const minorNationalityTasks: WorkflowTask[] = [
  { key: 'validate', title: 'Validar requisitos y patria potestad', description: 'Residencia legal, edad, identidad y situación de los progenitores.' },
  { key: 'review_documents', title: 'Revisar documentación', description: 'Comprobar documentos del menor y progenitores.' },
  { key: 'prepare_representation_mandate', title: 'Preparar mandato voluntario', description: 'Mandato a favor de Ksenia como persona física.' },
  { key: 'verify_signed_mandate', title: 'Validar mandato firmado', description: 'Archivar documento y evidencia de finalización.', humanApprovalRequired: true },
  { key: 'verify_legal_residence_start', title: 'Verificar inicio de residencia legal', description: 'Confirmar TIE/resolución inicial; no inferir desde nacimiento o TIE actual.', humanApprovalRequired: true },
  { key: 'prepare_official_application', title: 'Pre-rellenar modelo oficial', description: 'Preparar el modelo normalizado del Ministerio.' },
  { key: 'obtain_parent_signatures', title: 'Obtener firmas de progenitores', description: 'Firma manuscrita del modelo oficial cuando corresponda.' },
  { key: 'verify_official_application', title: 'Validar solicitud oficial', description: 'Revisar integridad, firmas y patria potestad.', humanApprovalRequired: true },
  { key: 'apply_recognized_signature', title: 'Firma electrónica reconocida de Ksenia', description: 'Aplicar certificado personal reconocido antes de presentar.', humanApprovalRequired: true },
  { key: 'fee', title: 'Pagar / registrar tasa 790-026', description: 'Usar el suplido y archivar justificante.', humanApprovalRequired: true },
  { key: 'final_review', title: 'Revisión final', description: 'Comprobar expediente completo antes de presentar.', humanApprovalRequired: true },
  { key: 'submit', title: 'Presentar en Ministerio de Justicia', description: 'Presentación profesional con aprobación final.', humanApprovalRequired: true },
  { key: 'receipt', title: 'Archivar justificante y comunicar', description: 'Guardar número de expediente y avisar a la familia.' },
  { key: 'follow_up', title: 'Seguimiento', description: 'Control de requerimientos, notificaciones y resolución.' },
];

export function CaseWorkflowPanel({
  serviceId,
  checklistJson,
}: {
  serviceId: string | null;
  checklistJson: Record<string, unknown> | null;
}) {
  if (serviceId !== 'nacionalidad-espanola-menor-nacido-en-espana') return null;

  const completed = new Set(
    Array.isArray(checklistJson?.completed_task_keys)
      ? (checklistJson?.completed_task_keys as string[])
      : [],
  );
  const activeKey = typeof checklistJson?.active_task_key === 'string'
    ? checklistJson.active_task_key
    : null;

  return (
    <section className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-[#c88b25]" />
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">Flujo jurídico-operativo</p>
          <p className="mt-1 text-xs text-[#52606d]">
            Nacionalidad de menor: mandato, solicitud oficial firmada, firma reconocida, tasa y presentación.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {minorNationalityTasks.map((task, index) => {
          const isDone = completed.has(task.key);
          const isActive = activeKey === task.key;
          return (
            <div key={task.key} className="flex gap-3 rounded-xl border border-[#eadfce] bg-[#fbf8f2] p-3">
              <div className="mt-0.5">
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 text-green-700" />
                ) : isActive ? (
                  <Clock3 className="h-4 w-4 text-[#c88b25]" />
                ) : (
                  <Circle className="h-4 w-4 text-[#a89a84]" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-[#07111d]">{index + 1}. {task.title}</p>
                  {task.humanApprovalRequired && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                      aprobación humana
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-[#52606d]">{task.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-[#52606d]">
        El SLA de 24 h solo comienza cuando mandato + solicitud oficial firmada + documentación obligatoria están validados.
      </p>
    </section>
  );
}
