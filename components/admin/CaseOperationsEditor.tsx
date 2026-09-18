'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarClock, CheckCircle2, Loader2 } from 'lucide-react';

type Priority = 'baja' | 'media' | 'alta' | 'critica';

export function CaseOperationsEditor({
  caseId,
  initialPriority,
  initialNextAction,
  initialDueDate,
}: {
  caseId: string;
  initialPriority: Priority | null;
  initialNextAction: string | null;
  initialDueDate: string | null;
}) {
  const router = useRouter();
  const [priority, setPriority] = useState<Priority>(initialPriority ?? 'media');
  const [nextAction, setNextAction] = useState(initialNextAction ?? '');
  const [dueDate, setDueDate] = useState(initialDueDate ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/cases/${caseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priority,
          next_action: nextAction.trim(),
          due_date: dueDate || null,
        }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) {
        setMessage(data.error ?? 'No se pudo guardar el seguimiento.');
        return;
      }
      setMessage('Seguimiento actualizado.');
      router.refresh();
    } catch {
      setMessage('No se pudo guardar el seguimiento.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-[#c88b25]" />
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">Seguimiento operativo</p>
          <p className="mt-1 text-xs text-[#52606d]">
            Define la siguiente acción y una fecha de control. Si Google Calendar está conectado, la fecha se sincroniza como recordatorio.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[160px_1fr_180px]">
        <label>
          <span className="mb-1 block text-xs font-semibold text-[#29384a]">Prioridad</span>
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value as Priority)}
            className="w-full rounded-xl border border-[#d8cbb5] bg-white px-3 py-2.5 text-sm text-[#07111d] outline-none focus:border-[#c88b25]"
          >
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
            <option value="critica">Crítica</option>
          </select>
        </label>

        <label>
          <span className="mb-1 block text-xs font-semibold text-[#29384a]">Siguiente acción</span>
          <input
            value={nextAction}
            onChange={(event) => setNextAction(event.target.value)}
            maxLength={500}
            placeholder="Ej.: revisar documentación y validar residencia legal"
            className="w-full rounded-xl border border-[#d8cbb5] bg-white px-3 py-2.5 text-sm text-[#07111d] outline-none focus:border-[#c88b25]"
          />
        </label>

        <label>
          <span className="mb-1 block text-xs font-semibold text-[#29384a]">Fecha de control</span>
          <input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            className="w-full rounded-xl border border-[#d8cbb5] bg-white px-3 py-2.5 text-sm text-[#07111d] outline-none focus:border-[#c88b25]"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || !nextAction.trim()}
          className="inline-flex items-center gap-2 rounded-full bg-[#c88b25] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-[#061321] transition hover:bg-[#b57a1e] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          {saving ? 'Guardando…' : 'Guardar seguimiento'}
        </button>
        {message && (
          <p role="status" className={`text-xs font-semibold ${message.includes('actualizado') ? 'text-green-700' : 'text-red-700'}`}>
            {message}
          </p>
        )}
      </div>
    </section>
  );
}
