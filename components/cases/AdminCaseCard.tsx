'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FolderOpen, ExternalLink, Bot } from 'lucide-react';
import { ALLOWED_TRANSITIONS, CASE_STATUS_LABELS, type CaseStatus } from '@/lib/cases/case-status';
import StaffAssigneeSelect from '@/components/admin/StaffAssigneeSelect';

interface Case {
  id: string;
  category: string;
  service: string;
  state: string;
  status?: string | null;
  effective_status?: CaseStatus;
  opened_at: string;
  closed_at: string | null;
  client_id: string;
  assigned_to?: string | null;
  client?: { full_name: string | null; email: string };
}

export function AdminCaseCard({ caseItem }: { caseItem: Case }) {
  const router = useRouter();
  const initialStatus = caseItem.effective_status ?? (caseItem.status as CaseStatus | null) ?? 'nuevo';
  const [status, setStatus] = useState<CaseStatus>(initialStatus);
  const caseStatuses = [initialStatus, ...ALLOWED_TRANSITIONS[initialStatus]];
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [assignedTo, setAssignedTo] = useState<string | null>(caseItem.assigned_to ?? null);
  const [assigning, setAssigning] = useState(false);
  const [kiaTesting, setKiaTesting] = useState(false);
  const [kiaTestSent, setKiaTestSent] = useState(false);

  const handleAssign = async (nextAssignee: string | null) => {
    setAssigning(true);
    try {
      const response = await fetch(`/api/admin/cases/${caseItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to: nextAssignee }),
      });
      if (response.ok) {
        setAssignedTo(nextAssignee);
        router.refresh();
      }
    } finally {
      setAssigning(false);
    }
  };

  const statusChanged = status !== initialStatus;

  const handleKiaTest = async () => {
    if (!window.confirm('Enviar una prueba de KIA a tu propio correo de Admin usando este expediente?')) return;
    setKiaTesting(true);
    setKiaTestSent(false);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/kia/client-preview-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ case_id: caseItem.id, scenario: 'status' }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data.error ?? 'No se pudo enviar la prueba de KIA.');
        return;
      }
      setKiaTestSent(true);
      setMessage('Prueba KIA enviada a tu correo Admin.');
    } catch {
      setMessage('No se pudo enviar la prueba de KIA.');
    } finally {
      setKiaTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const payload: Record<string, unknown> = { status };
      if (note.trim()) payload.admin_note = note.trim();

      const response = await fetch(`/api/admin/cases/${caseItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error ?? 'No se pudo actualizar el expediente');
        return;
      }
      setMessage('Estado actualizado correctamente.');
      setNote('');
      router.refresh();
    } catch {
      setMessage('Error al actualizar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-3xl border border-[#d8cbb5] bg-[#f8f4eb] p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <FolderOpen className="mt-0.5 h-5 w-5 shrink-0 text-[#c88b25]" />
          <div>
            <p className="text-sm font-semibold text-[#07111d]">{caseItem.service}</p>
            <p className="text-xs text-[#29384a]">{caseItem.category}</p>
            {caseItem.client && (
              <p className="mt-1 text-xs text-[#29384a]">
                {caseItem.client.full_name
                  ? `${caseItem.client.full_name} · ${caseItem.client.email}`
                  : caseItem.client.email}
              </p>
            )}
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center rounded-full bg-[#061321] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#F8F6F1]">
          {CASE_STATUS_LABELS[initialStatus]}
        </span>
      </div>

      <div className="mt-3 text-xs text-[#29384a]">
        Abierto el {new Date(caseItem.opened_at).toLocaleDateString('es-ES')}
        {caseItem.closed_at ? ` · Cerrado el ${new Date(caseItem.closed_at).toLocaleDateString('es-ES')}` : ''}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value as CaseStatus); setMessage(null); }}
          aria-label="Estado del expediente"
          className="rounded-xl border border-[#d8cbb5] bg-white px-4 py-2 text-sm text-[#07111d] outline-none focus:border-[#c88b25]"
        >
          {caseStatuses.map((s) => (
            <option key={s} value={s}>{CASE_STATUS_LABELS[s]}</option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !statusChanged}
          className="inline-flex items-center gap-2 rounded-full bg-[#c88b25] px-5 py-2 text-sm font-bold uppercase tracking-[0.18em] text-[#061321] transition hover:bg-[#b57a1e] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Guardando…' : 'Cambiar estado'}
        </button>

        <StaffAssigneeSelect
          value={assignedTo}
          disabled={assigning}
          onChange={(id) => void handleAssign(id)}
          className="rounded-xl border border-[#d8cbb5] bg-white px-3 py-2 text-sm text-[#07111d] outline-none focus:border-[#c88b25]"
        />

        <button
          type="button"
          onClick={() => void handleKiaTest()}
          disabled={kiaTesting}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-[#c88b25] bg-white px-4 py-2 text-xs font-semibold text-[#07111d] transition hover:bg-[#fff8e8] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Bot className="h-3 w-3 text-[#c88b25]" />
          {kiaTesting ? 'Enviando…' : kiaTestSent ? 'Prueba enviada' : 'Probar KIA'}
        </button>

        <Link
          href={`/admin/expedientes/${caseItem.id}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#d8cbb5] px-4 py-2 text-xs font-semibold text-[#29384a] transition hover:border-[#c88b25] hover:text-[#07111d]"
        >
          <ExternalLink className="h-3 w-3" />
          Ver detalle
        </Link>
      </div>

      {/* Extra fields — only visible when status changes */}
      {statusChanged && (
        <div className="mt-4 space-y-3 rounded-2xl border border-[#d8cbb5] bg-white p-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#29384a]">
              Mensaje al cliente <span className="text-xs font-normal text-[#29384a]">(opcional — se guarda como nota operativa y puede incluirse en la notificación)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej: Hemos recibido tu documentación y comenzamos la tramitación esta semana…"
              rows={3}
              className="w-full resize-none rounded-xl border border-[#d8cbb5] px-4 py-2 text-sm text-[#07111d] outline-none focus:border-[#c88b25]"
            />
          </div>
        </div>
      )}

      {message && (
        <p className={`mt-3 text-sm font-semibold ${message.includes('correctamente') ? 'text-green-700' : 'text-red-600'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
