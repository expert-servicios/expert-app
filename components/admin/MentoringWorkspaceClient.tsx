'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FilePlus2, Save, Sparkles } from 'lucide-react';

type Engagement = {
  id: string;
  project_name: string;
  mentee_name: string;
};

export function MentoringWorkspaceClient({ engagements }: { engagements: Engagement[] }) {
  const router = useRouter();
  const defaultEngagement = useMemo(() => engagements[0]?.id ?? '', [engagements]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function submitSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const res = await fetch('/api/admin/mentoring', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ kind: 'session', ...payload }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setMessage(data.error ?? 'No se pudo guardar la sesión.');
      return;
    }
    event.currentTarget.reset();
    setMessage('Sesión guardada.');
    router.refresh();
  }

  async function submitPublication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const res = await fetch('/api/admin/mentoring', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ kind: 'publication', ...payload }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setMessage(data.error ?? 'No se pudo crear la idea editorial.');
      return;
    }
    event.currentTarget.reset();
    setMessage('Idea editorial añadida.');
    router.refresh();
  }

  if (engagements.length === 0) return null;

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <form onSubmit={submitSession} className="rounded-2xl border border-[#d8cbb5] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Save className="h-4 w-4 text-[#c88b25]" />
          <h2 className="font-serif text-lg font-bold text-[#07111d]">Documentar sesión</h2>
        </div>
        <p className="mt-1 text-xs text-[#6f665b]">Lo interno permanece privado. Registra hechos, decisiones, evidencia y siguiente acción.</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <select name="engagement_id" defaultValue={defaultEngagement} className="rounded-xl border border-[#d8cbb5] bg-[#fffdf8] px-3 py-2.5 text-sm sm:col-span-2">
            {engagements.map((item) => <option key={item.id} value={item.id}>{item.project_name} · {item.mentee_name}</option>)}
          </select>
          <input name="occurred_at" type="datetime-local" className="rounded-xl border border-[#d8cbb5] bg-[#fffdf8] px-3 py-2.5 text-sm" />
          <input name="duration_minutes" type="number" min="1" max="1440" placeholder="Duración (min)" className="rounded-xl border border-[#d8cbb5] bg-[#fffdf8] px-3 py-2.5 text-sm" />
          <input name="session_number" type="number" min="1" placeholder="N.º sesión" className="rounded-xl border border-[#d8cbb5] bg-[#fffdf8] px-3 py-2.5 text-sm" />
          <input name="objective" placeholder="Objetivo de la sesión" className="rounded-xl border border-[#d8cbb5] bg-[#fffdf8] px-3 py-2.5 text-sm" />
        </div>
        <textarea name="summary" rows={3} placeholder="Resumen factual" className="mt-3 w-full rounded-xl border border-[#d8cbb5] bg-[#fffdf8] px-3 py-2.5 text-sm" />
        <textarea name="decisions" rows={2} placeholder="Decisiones tomadas" className="mt-3 w-full rounded-xl border border-[#d8cbb5] bg-[#fffdf8] px-3 py-2.5 text-sm" />
        <textarea name="evidence" rows={2} placeholder="Evidencia obtenida / datos observables" className="mt-3 w-full rounded-xl border border-[#d8cbb5] bg-[#fffdf8] px-3 py-2.5 text-sm" />
        <textarea name="next_actions" rows={2} placeholder="Siguiente acción" className="mt-3 w-full rounded-xl border border-[#d8cbb5] bg-[#fffdf8] px-3 py-2.5 text-sm" />
        <textarea name="private_notes" rows={2} placeholder="Notas privadas de mentora (nunca públicas)" className="mt-3 w-full rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm" />
        <button disabled={busy} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#07111d] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
          <Save className="h-4 w-4" /> Guardar sesión
        </button>
      </form>

      <form onSubmit={submitPublication} className="rounded-2xl border border-[#d8cbb5] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#c88b25]" />
          <h2 className="font-serif text-lg font-bold text-[#07111d]">Crear idea para la web</h2>
        </div>
        <p className="mt-1 text-xs text-[#6f665b]">Crear una idea no la publica. Pasa después por revisión y consentimiento.</p>
        <select name="engagement_id" defaultValue={defaultEngagement} className="mt-4 w-full rounded-xl border border-[#d8cbb5] bg-[#fffdf8] px-3 py-2.5 text-sm">
          {engagements.map((item) => <option key={item.id} value={item.id}>{item.project_name} · {item.mentee_name}</option>)}
        </select>
        <select name="publication_type" defaultValue="blog" className="mt-3 w-full rounded-xl border border-[#d8cbb5] bg-[#fffdf8] px-3 py-2.5 text-sm">
          <option value="blog">Artículo blog</option>
          <option value="case_study">Caso práctico</option>
          <option value="note">Nota / aprendizaje</option>
          <option value="quote">Testimonio</option>
          <option value="landing_block">Bloque para landing</option>
        </select>
        <input name="title" required placeholder="Título provisional" className="mt-3 w-full rounded-xl border border-[#d8cbb5] bg-[#fffdf8] px-3 py-2.5 text-sm" />
        <textarea name="summary" rows={5} placeholder="Qué aprendizaje merece convertirse en contenido y qué evidencia lo respalda" className="mt-3 w-full rounded-xl border border-[#d8cbb5] bg-[#fffdf8] px-3 py-2.5 text-sm" />
        <button disabled={busy} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#c88b25] bg-[#fff8e8] px-4 py-2.5 text-sm font-bold text-[#8a6111] disabled:opacity-50">
          <FilePlus2 className="h-4 w-4" /> Añadir al pipeline editorial
        </button>
      </form>

      {message && <p className="xl:col-span-2 rounded-xl border border-[#d8cbb5] bg-white px-4 py-3 text-sm text-[#29384a]">{message}</p>}
    </div>
  );
}
