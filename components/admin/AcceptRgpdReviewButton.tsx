'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';

export function AcceptRgpdReviewButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const accept = async () => {
    if (loading) return;
    if (!window.confirm('¿Aceptar esta revisión RGPD y crear la tarea interna asignada a ti?')) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/rgpd-reviews/' + projectId + '/accept', {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? 'No se pudo aceptar la revisión.');
        return;
      }

      router.refresh();
    } catch {
      setError('No se pudo aceptar la revisión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={accept}
        disabled={loading}
        className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#07111d] px-4 text-xs font-bold text-white transition hover:bg-[#142235] disabled:opacity-50"
      >
        <CheckCircle2 className="h-4 w-4 text-[#D4A017]" />
        {loading ? 'Aceptando…' : 'Aceptar revisión'}
      </button>
      {error && <p className="mt-2 max-w-56 text-xs text-red-700">{error}</p>}
    </div>
  );
}
