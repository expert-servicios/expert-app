'use client';

import { useMemo, useState } from 'react';

type SignatureEvent = {
  event_type?: string;
  payload?: Record<string, unknown>;
  created_at?: string;
};

export type SignatureAction = {
  id: string;
  state: string;
  snapshot: Record<string, unknown>;
  rowVersion: number;
  latestEvent: SignatureEvent | null;
  events: SignatureEvent[];
  createdAt: string;
  updatedAt: string;
};

export type SignatureDocumentOption = {
  id: string;
  original_name: string;
  state: 'pendiente' | 'revisado' | 'rechazado';
  downloadUrl: string | null;
};

type Signer = {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  status: 'pending' | 'signed' | 'declined';
};

function signerList(action: SignatureAction): Signer[] {
  const latest = action.latestEvent?.payload;
  const eventSigners = Array.isArray(latest?.signers) ? latest?.signers : null;
  const source = eventSigners ?? (Array.isArray(action.snapshot.signers) ? action.snapshot.signers : []);
  return source.map((value) => {
    const signer = value as Record<string, unknown>;
    const status = String(signer.status ?? 'pending');
    return {
      id: typeof signer.id === 'string' ? signer.id : null,
      name: typeof signer.name === 'string' ? signer.name : null,
      email: typeof signer.email === 'string' ? signer.email : null,
      status: status === 'signed' || status === 'declined' ? status : 'pending',
    };
  });
}

function finalDocumentId(action: SignatureAction): string | null {
  const completed = [...action.events].reverse().find((event) => event.event_type === 'signature.completed');
  const value = completed?.payload?.finalDocumentId;
  return typeof value === 'string' ? value : null;
}

export function CaseSignaturePanel({
  caseId,
  initialActions,
  documents,
}: {
  caseId: string;
  initialActions: SignatureAction[];
  documents: SignatureDocumentOption[];
}) {
  const [actions, setActions] = useState(initialActions);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [signersByAction, setSignersByAction] = useState<Record<string, Signer[]>>(
    Object.fromEntries(initialActions.map((action) => [action.id, signerList(action)])),
  );
  const [finalDocByAction, setFinalDocByAction] = useState<Record<string, string>>({});

  const usableDocuments = useMemo(
    () => documents.filter((document) => document.state !== 'rechazado' && document.downloadUrl),
    [documents],
  );

  async function refresh() {
    const response = await fetch(`/api/admin/cases/${encodeURIComponent(caseId)}/signature-actions`, {
      cache: 'no-store',
    });
    if (!response.ok) return;
    const payload = await response.json() as { actions?: SignatureAction[] };
    const next = payload.actions ?? [];
    setActions(next);
    setSignersByAction(Object.fromEntries(next.map((action) => [action.id, signerList(action)])));
  }

  async function mutate(
    actionId: string,
    lifecycle: 'requested' | 'partially_signed' | 'completed' | 'cancelled',
  ) {
    setBusy(actionId);
    setMessage(null);
    try {
      const response = await fetch(
        `/api/admin/cases/${encodeURIComponent(caseId)}/signature-actions/${encodeURIComponent(actionId)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lifecycle,
            signers: signersByAction[actionId] ?? [],
            finalDocumentId: lifecycle === 'completed' ? finalDocByAction[actionId] || null : undefined,
          }),
        },
      );
      const payload = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? 'No se pudo actualizar la firma.');
      await refresh();
      setMessage('Estado de firma actualizado.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo actualizar la firma.');
    } finally {
      setBusy(null);
    }
  }

  if (actions.length === 0) return null;

  return (
    <section className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">Firma electrónica</p>
      <h2 className="mt-1 font-serif text-xl font-bold text-[#07111d]">Google eSignature · seguimiento</h2>
      <p className="mt-2 text-sm text-[#52606d]">
        El documento origen nunca se considera firmado. La finalización exige seleccionar el documento firmado final del expediente.
      </p>

      {message && <p className="mt-3 text-sm font-medium text-[#29384a]">{message}</p>}

      <div className="mt-4 space-y-4">
        {actions.map((action) => {
          const signers = signersByAction[action.id] ?? [];
          const sourceName = typeof action.snapshot.sourceDocumentName === 'string'
            ? action.snapshot.sourceDocumentName
            : 'Documento origen';
          const completedDocumentId = finalDocumentId(action);
          const completedDocument = usableDocuments.find((doc) => doc.id === completedDocumentId);
          const terminal = ['completed', 'cancelled', 'failed_safe', 'expired'].includes(action.state);
          const canLaunch = ['needs_review', 'approved', 'queued', 'claimed'].includes(action.state);

          return (
            <div key={action.id} className="rounded-xl border border-[#e4d8c6] bg-[#fffdf8] p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-[#07111d]">{sourceName}</p>
                  <p className="text-xs text-[#52606d]">Estado técnico: {action.state}</p>
                </div>
                {completedDocument && (
                  <a
                    href={completedDocument.downloadUrl ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-[#c88b25] hover:underline"
                  >
                    Abrir firmado
                  </a>
                )}
              </div>

              {signers.length > 0 && (
                <div className="mt-3 grid gap-2">
                  {signers.map((signer, index) => (
                    <div key={signer.id ?? signer.email ?? `${action.id}-${index}`} className="flex items-center gap-3">
                      <span className="min-w-0 flex-1 text-sm text-[#29384a]">
                        {signer.name || signer.email || `Firmante ${index + 1}`}
                      </span>
                      <select
                        value={signer.status}
                        disabled={terminal || busy === action.id}
                        onChange={(event) => {
                          const next = [...signers];
                          next[index] = { ...signer, status: event.target.value as Signer['status'] };
                          setSignersByAction((current) => ({ ...current, [action.id]: next }));
                        }}
                        className="rounded-lg border border-[#d8cbb5] bg-white px-2 py-1 text-xs"
                      >
                        <option value="pending">Pendiente</option>
                        <option value="signed">Firmado</option>
                        <option value="declined">Rechazado</option>
                      </select>
                    </div>
                  ))}
                </div>
              )}

              {!terminal && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {canLaunch && (
                    <button
                      type="button"
                      disabled={busy === action.id}
                      onClick={() => mutate(action.id, 'requested')}
                      className="rounded-lg bg-[#07111d] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                    >
                      Marcar enviada a firma
                    </button>
                  )}
                  {action.state === 'running' && (
                    <>
                      <button
                        type="button"
                        disabled={busy === action.id}
                        onClick={() => mutate(action.id, 'partially_signed')}
                        className="rounded-lg border border-[#d8cbb5] px-3 py-2 text-xs font-bold text-[#29384a] disabled:opacity-50"
                      >
                        Guardar firmantes
                      </button>
                      <select
                        value={finalDocByAction[action.id] ?? ''}
                        onChange={(event) => setFinalDocByAction((current) => ({
                          ...current,
                          [action.id]: event.target.value,
                        }))}
                        className="rounded-lg border border-[#d8cbb5] bg-white px-2 py-2 text-xs"
                      >
                        <option value="">Documento firmado final…</option>
                        {usableDocuments.map((document) => (
                          <option key={document.id} value={document.id}>{document.original_name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={busy === action.id || !finalDocByAction[action.id]}
                        onClick={() => mutate(action.id, 'completed')}
                        className="rounded-lg bg-[#c88b25] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                      >
                        Finalizar firma
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    disabled={busy === action.id}
                    onClick={() => mutate(action.id, 'cancelled')}
                    className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 disabled:opacity-50"
                  >
                    Cancelar solicitud
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
