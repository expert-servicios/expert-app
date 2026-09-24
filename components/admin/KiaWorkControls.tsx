'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Clipboard, KeyRound, Loader2, RefreshCcw, ShieldX } from 'lucide-react';

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  task_key: string | null;
  dependencies: { id: string; title: string; status: string }[];
  delegatable: boolean;
  blocked_by: string[];
  blocked_reason: string | null;
};

type Connection = {
  id: string;
  expires_at: string;
  revoked_at: string | null;
  created_at: string;
  task_ids: string[];
  active: boolean;
};

type EvidenceOption = { value: string; label: string };
type ActionOption = EvidenceOption & { state: string; human_gate: boolean };

type WorkResult = {
  id: string;
  title: string;
  state: 'pending' | 'processing' | 'applied' | 'review';
  outcome: 'succeeded' | 'blocked' | 'failed' | 'cancelled' | null;
  received_at: string;
  reason: string | null;
  error_code: string | null;
  requires_review: boolean;
};

type WorkData = {
  results: WorkResult[];
  tasks: Task[];
  connections: Connection[];
  evidence: {
    documents: EvidenceOption[];
    emails: EvidenceOption[];
    administrative_actions: ActionOption[];
  };
};

const KIND_LABELS = {
  document_archived: 'Documento archivado',
  email_sent: 'Correo registrado como enviado',
  administrative_action_completed: 'Actuación administrativa completada',
} as const;

type EvidenceKind = keyof typeof KIND_LABELS;

function reviewGuidance(code: string | null) {
  switch (code) {
    case 'connection_expired':
    case 'work_unauthorized':
      return 'La delegación ha caducado o fue revocada. Crea una delegación nueva antes de reintentar.';
    case 'scope_changed':
    case 'work_scope_changed':
      return 'Cambió el ámbito del expediente. Revisa cliente, entidad y tenant antes de continuar.';
    case 'work_stale_claim':
      return 'La tarea cambió o la reserva caducó. Comprueba el estado actual antes de volver a delegarla.';
    case 'work_evidence_changed':
    case 'verification_failed':
      return 'La evidencia ya no coincide con la registrada. Revisa el documento, correo o actuación y reintenta solo después de corregirla.';
    case 'work_dependencies_pending':
      return 'Aún hay dependencias pendientes. Completa primero los pasos anteriores.';
    default:
      return 'Comprueba la evidencia y el estado actual. Reintentar solo vuelve a verificar; no repite la acción externa.';
  }
}

export function KiaWorkControls({ caseId, data }: { caseId: string; data: WorkData }) {
  const router = useRouter();
  const delegatableTasks = data.tasks.filter(task => task.delegatable);
  const [taskId, setTaskId] = useState(delegatableTasks[0]?.id ?? '');
  const [kind, setKind] = useState<EvidenceKind>('document_archived');
  const [target, setTarget] = useState('');
  const [ttl, setTtl] = useState(8);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [secret, setSecret] = useState<{ token: string; expires_at: string } | null>(null);

  const targets = useMemo(() => {
    if (kind === 'document_archived') return data.evidence.documents;
    if (kind === 'email_sent') return data.evidence.emails;
    return data.evidence.administrative_actions;
  }, [data.evidence, kind]);

  const selectedTarget = target && targets.some(option => option.value === target) ? target : targets[0]?.value ?? '';

  async function delegate() {
    if (!taskId || !selectedTarget) {
      setMessage('Selecciona una tarea y una evidencia verificable.');
      return;
    }
    setBusy('delegate');
    setMessage(null);
    setSecret(null);
    try {
      const response = await fetch('/api/admin/kia/work-connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: caseId,
          ttl_hours: ttl,
          tasks: [{ id: taskId, policy: { kind, target: selectedTarget, dependencies: [] } }],
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error ?? 'No se pudo crear la delegación.');
        return;
      }
      setSecret({ token: result.token, expires_at: result.expires_at });
      setMessage('Delegación creada. La clave solo se muestra en esta sesión.');
      router.refresh();
    } catch {
      setMessage('No se pudo conectar con el servicio.');
    } finally {
      setBusy(null);
    }
  }

  async function revoke(connectionId: string) {
    setBusy(connectionId);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/kia/work-connections', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ case_id: caseId, connection_id: connectionId }),
      });
      const result = await response.json();
      setMessage(response.ok ? 'Delegación revocada.' : result.error ?? 'No se pudo revocar.');
      if (response.ok) router.refresh();
    } catch {
      setMessage('No se pudo conectar con el servicio.');
    } finally {
      setBusy(null);
    }
  }

  async function retryReview(eventId: string) {
    setBusy(eventId);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/kia/work-connections', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ case_id: caseId, event_id: eventId, action: 'retry_verification' }),
      });
      const result = await response.json();
      setMessage(response.ok
        ? result.state === 'applied' ? 'Evidencia verificada y resultado aplicado.' : 'La revisión se ha vuelto a comprobar.'
        : result.error ?? 'No se pudo reintentar la verificación.');
      router.refresh();
    } catch {
      setMessage('No se pudo conectar con el servicio.');
    } finally {
      setBusy(null);
    }
  }

  async function copyToken() {
    if (!secret) return;
    await navigator.clipboard.writeText(secret.token);
    setMessage('Clave copiada. No la guardes en chats, URLs ni documentos compartidos.');
  }

  return (
    <div className="mt-5 space-y-5">
      <div className="rounded-xl border border-[#e5ded1] bg-[#f8f4eb] p-4">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-[#c88b25]" />
          <h3 className="font-semibold text-[#07111d]">Delegar una tarea a Work</h3>
        </div>
        <p className="mt-1 text-xs text-[#52606d]">
          Solo se ofrecen tareas cuyo workflow puede resolverse de forma segura. La delegación registra resultados; no autoriza firma, pago ni presentación.
        </p>

        {delegatableTasks.length === 0 ? (
          <p className="mt-3 text-sm text-[#29384a]">No hay tareas delegables con dependencias verificadas en este momento.</p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="text-xs font-semibold text-[#29384a]">
              Tarea
              <select value={taskId} onChange={event => setTaskId(event.target.value)}
                className="mt-1 w-full rounded-lg border border-[#d8cbb5] bg-white p-2 text-sm font-normal text-[#07111d]">
                {delegatableTasks.map(task => <option key={task.id} value={task.id}>{task.title}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-[#29384a]">
              Evidencia que cerrará la tarea
              <select value={kind} onChange={event => { setKind(event.target.value as EvidenceKind); setTarget(''); }}
                className="mt-1 w-full rounded-lg border border-[#d8cbb5] bg-white p-2 text-sm font-normal text-[#07111d]">
                {Object.entries(KIND_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-[#29384a] md:col-span-2">
              Evidencia exacta
              <select value={selectedTarget} onChange={event => setTarget(event.target.value)}
                disabled={targets.length === 0}
                className="mt-1 w-full rounded-lg border border-[#d8cbb5] bg-white p-2 text-sm font-normal text-[#07111d] disabled:opacity-50">
                {targets.length === 0 ? <option value="">No hay evidencias de este tipo en el expediente</option>
                  : targets.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-[#29384a]">
              Vigencia
              <select value={ttl} onChange={event => setTtl(Number(event.target.value))}
                className="mt-1 w-full rounded-lg border border-[#d8cbb5] bg-white p-2 text-sm font-normal text-[#07111d]">
                {[1, 2, 4, 8, 12, 24].map(hours => <option key={hours} value={hours}>{hours} h</option>)}
              </select>
            </label>
            <div className="flex items-end">
              <button type="button" onClick={delegate} disabled={busy === 'delegate' || !selectedTarget}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#07111d] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {busy === 'delegate' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Crear delegación
              </button>
            </div>
          </div>
        )}

        {secret ? (
          <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-900">Clave de una sola visualización</p>
            <code className="mt-2 block break-all text-xs text-[#07111d]">{secret.token}</code>
            <p className="mt-1 text-xs text-[#52606d]">Caduca: {new Intl.DateTimeFormat('es-ES', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Madrid' }).format(new Date(secret.expires_at))}</p>
            <button type="button" onClick={copyToken}
              className="mt-2 inline-flex items-center gap-2 rounded-lg border border-amber-400 bg-white px-3 py-1.5 text-xs font-semibold">
              <Clipboard className="h-3.5 w-3.5" /> Copiar clave
            </button>
          </div>
        ) : null}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-[#07111d]">Delegaciones recientes</h3>
        {data.connections.length === 0 ? <p className="mt-2 text-sm text-[#29384a]">No hay delegaciones creadas.</p> : (
          <ul className="mt-2 space-y-2">
            {data.connections.map(connection => (
              <li key={connection.id} className="flex flex-col gap-2 rounded-xl border border-[#e5ded1] p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium">{connection.active ? 'Activa' : connection.revoked_at ? 'Revocada' : 'Caducada'} · {connection.task_ids.length} tarea{connection.task_ids.length === 1 ? '' : 's'}</p>
                  <p className="text-xs text-[#64748b]">Caduca {new Intl.DateTimeFormat('es-ES', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Madrid' }).format(new Date(connection.expires_at))}</p>
                </div>
                {connection.active ? (
                  <button type="button" onClick={() => revoke(connection.id)} disabled={busy === connection.id}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-50">
                    {busy === connection.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldX className="h-3.5 w-3.5" />}
                    Revocar
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      {data.results.some(result => result.requires_review) ? (
        <div>
          <h3 className="text-sm font-semibold text-[#07111d]">Requieren conciliación</h3>
          <ul className="mt-2 space-y-3">
            {data.results.filter(result => result.requires_review).map(result => (
              <li key={result.id} className="rounded-xl border border-amber-300 bg-amber-50 p-3">
                <p className="font-medium">{result.title}</p>
                <p className="mt-1 text-sm text-[#29384a]">{reviewGuidance(result.error_code)}</p>
                {result.error_code ? <code className="mt-1 block text-xs text-[#64748b]">{result.error_code}</code> : null}
                <button type="button" onClick={() => retryReview(result.id)} disabled={busy === result.id}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-400 bg-white px-3 py-1.5 text-xs font-semibold disabled:opacity-50">
                  {busy === result.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />}
                  Volver a verificar
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {message ? <p role="status" className="text-sm text-[#29384a]">{message}</p> : null}
    </div>
  );
}
