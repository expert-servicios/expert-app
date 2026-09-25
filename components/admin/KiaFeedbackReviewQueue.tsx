'use client';

import { useEffect, useState } from 'react';
import { Check, RefreshCw, X } from 'lucide-react';

interface FeedbackItem {
  id: string;
  rating: 'positive' | 'negative';
  channel: string;
  user_message: string | null;
  kia_reply: string | null;
  intent: string | null;
  task_type: string | null;
  approved_for_learning: boolean;
  created_at: string;
}

export function KiaFeedbackReviewQueue() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/kia-feedback', { cache: 'no-store' });
      const data = await response.json();
      setItems(Array.isArray(data.items) ? data.items : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function setApproved(item: FeedbackItem, approved: boolean) {
    setUpdating(item.id);
    try {
      const response = await fetch('/api/admin/kia-feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, approved }),
      });
      if (response.ok) {
        setItems((previous) => previous.map((entry) =>
          entry.id === item.id ? { ...entry, approved_for_learning: approved } : entry
        ));
      }
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#07111d]">Ejemplos para aprendizaje</h2>
          <p className="text-sm text-[#657283]">
            Solo las respuestas positivas aprobadas aquí pueden volver al prompt de KIA como few-shot.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-[#ddd2c2] bg-white px-3 py-2 text-sm font-medium text-[#29384a] disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {items.length === 0 && !loading ? (
        <div className="rounded-xl border border-dashed border-[#ddd2c2] bg-white p-6 text-sm text-[#657283]">
          Todavía no hay feedback positivo con pregunta y respuesta completas.
        </div>
      ) : null}

      <div className="space-y-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-xl border border-[#e8e0d4] bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-[#7a6e5f]">
              <span>{item.channel}</span>
              <span>·</span>
              <span>{item.task_type ?? 'sin task'}</span>
              <span>·</span>
              <span>{new Date(item.created_at).toLocaleString('es-ES')}</span>
              <span className={`ml-auto rounded-full px-2 py-1 font-semibold ${
                item.approved_for_learning ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
              }`}>
                {item.approved_for_learning ? 'Aprobado' : 'Pendiente'}
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg bg-[#faf8f4] p-3">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#7a6e5f]">Usuario</p>
                <p className="whitespace-pre-wrap text-sm text-[#29384a]">{item.user_message}</p>
              </div>
              <div className="rounded-lg bg-[#f5f1eb] p-3">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#7a6e5f]">KIA</p>
                <p className="whitespace-pre-wrap text-sm text-[#07111d]">{item.kia_reply}</p>
              </div>
            </div>

            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => void setApproved(item, false)}
                disabled={updating === item.id || !item.approved_for_learning}
                className="inline-flex items-center gap-1 rounded-lg border border-[#ddd2c2] px-3 py-2 text-xs font-semibold text-[#657283] disabled:opacity-40"
              >
                <X className="h-3.5 w-3.5" />
                No usar
              </button>
              <button
                type="button"
                onClick={() => void setApproved(item, true)}
                disabled={updating === item.id || item.approved_for_learning}
                className="inline-flex items-center gap-1 rounded-lg bg-[#0D1B2A] px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
              >
                <Check className="h-3.5 w-3.5" />
                Aprobar aprendizaje
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
