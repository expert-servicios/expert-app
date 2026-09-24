import { fetchWithCookies } from '@/lib/utils/server-fetch';
import { KiaWorkControls } from '@/components/admin/KiaWorkControls';

interface WorkResult {
  id: string;
  title: string;
  state: 'pending' | 'processing' | 'applied' | 'review';
  outcome: 'succeeded' | 'blocked' | 'failed' | 'cancelled' | null;
  received_at: string;
  reason: string | null;
  error_code: string | null;
  requires_review: boolean;
}

interface WorkTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  task_key: string | null;
  dependencies: { id: string; title: string; status: string }[];
  delegatable: boolean;
  blocked_by: string[];
  blocked_reason: string | null;
}

interface WorkConnection {
  id: string;
  expires_at: string;
  revoked_at: string | null;
  created_at: string;
  task_ids: string[];
  active: boolean;
}

interface EvidenceOption { value: string; label: string }
interface ActionOption extends EvidenceOption { state: string; human_gate: boolean }

interface WorkData {
  results: WorkResult[];
  tasks: WorkTask[];
  connections: WorkConnection[];
  evidence: {
    documents: EvidenceOption[];
    emails: EvidenceOption[];
    administrative_actions: ActionOption[];
  };
}

export async function KiaWorkResults({ caseId }: { caseId: string }) {
  const data = await fetchWithCookies<WorkData>(
    `/api/admin/kia/work-connections?case_id=${encodeURIComponent(caseId)}`,
  ).catch(() => null);
  return (
    <section aria-labelledby="kia-work-results" className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
      <h2 id="kia-work-results" className="font-semibold text-[#07111d]">Actividad y delegación de KIA</h2>
      <p className="mt-1 text-sm text-[#29384a]">Resultados verificados, delegaciones activas y conciliación de incidencias de Work.</p>
      {!data ? <p role="status" className="mt-3 text-sm">No se ha podido comprobar la actividad. Vuelve a cargar el expediente.</p>
        : <>
          {data.results.length === 0 ? <p className="mt-3 text-sm">Todavía no hay resultados registrados desde Work.</p>
            : <ul className="mt-4 space-y-3">
              {data.results.map(result => (
                <li key={result.id} className="rounded-xl border border-[#e5ded1] p-3">
                  <p className="font-medium">{result.title}</p>
                  <p className="text-sm">{result.requires_review ? 'Necesita revisión del equipo'
                    : result.state !== 'applied' ? 'Resultado recibido · comprobación pendiente'
                    : result.outcome === 'succeeded' ? 'Completada · resultado verificado'
                    : 'Resultado registrado · tarea pendiente'}</p>
                  {result.reason ? <p className="mt-1 text-sm text-[#29384a]">{result.reason}</p> : null}
                  {result.requires_review ? <p className="mt-1 text-sm">Comprueba la evidencia y el estado actual antes de repetir la tarea.</p> : null}
                  <time dateTime={result.received_at} className="mt-1 block text-xs text-[#64748b]">
                    {new Intl.DateTimeFormat('es-ES', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Madrid' }).format(new Date(result.received_at))}
                  </time>
                </li>
              ))}
            </ul>}
          <KiaWorkControls caseId={caseId} data={data} />
        </>}
    </section>
  );
}
