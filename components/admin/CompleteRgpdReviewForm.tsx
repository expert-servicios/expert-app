'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';

export function CompleteRgpdReviewForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [summary, setSummary] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (saving || summary.trim().length < 20) return;
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/admin/rgpd-reviews/' + projectId + '/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary: summary.trim() }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? 'No se pudo completar la revisión.');
        return;
      }

      router.refresh();
    } catch {
      setError('No se pudo completar la revisión.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-[#D4A017]/35 bg-[#fff8e8] p-5">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-[#b77d16]" />
        <h2 className="font-bold text-[#07111d]">Cerrar revisión profesional</h2>
      </div>
      <p className="mt-2 text-sm leading-6 text-[#526171]">
        Resume las conclusiones y acciones recomendadas. Este texto se guarda separado del snapshot original del cliente.
      </p>
      <textarea
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        rows={8}
        maxLength={10000}
        placeholder="Conclusiones, incoherencias detectadas, documentos pendientes y siguientes acciones…"
        className="mt-4 w-full rounded-xl border border-[#d8cbb5] bg-white px-3 py-3 text-sm text-[#07111d] outline-none focus:border-[#D4A017]"
      />
      <div className="mt-2 flex items-center justify-between gap-3 text-xs text-[#8c8173]">
        <span>Mínimo 20 caracteres</span>
        <span>{summary.length}/10000</span>
      </div>
      <button
        type="button"
        onClick={submit}
        disabled={saving || summary.trim().length < 20}
        className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#07111d] px-4 text-sm font-bold text-white disabled:opacity-40"
      >
        <CheckCircle2 className="h-4 w-4 text-[#D4A017]" />
        {saving ? 'Cerrando…' : 'Completar revisión'}
      </button>
      {error && <p className="mt-3 text-xs font-semibold text-red-700">{error}</p>}
    </section>
  );
}
