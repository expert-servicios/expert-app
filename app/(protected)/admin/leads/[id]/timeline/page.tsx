'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

type TimelineEvent = { id: string; at: string; kind: string; title: string; description: string; href?: string; source: string };
type TimelineResponse = { lead: { id: string; name: string }; events: TimelineEvent[]; limited: Record<string, boolean> };

export default function LeadTimelinePage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<TimelineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch(`/api/admin/leads/${encodeURIComponent(id)}/timeline`, { cache: 'no-store' });
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || 'Error al cargar el historial');
        if (!cancelled) setData(json as TimelineResponse);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error desconocido');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [id]);
  return (
    <main className="min-h-screen bg-[#f8f4eb] px-5 py-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin/leads?segment=all" className="text-sm font-semibold text-[#8a6111] hover:underline">← Volver a solicitudes y leads</Link>
        <h1 className="mt-4 font-serif text-3xl font-bold text-[#07111d]">Historial verificado del lead</h1>
        <p className="mt-2 text-sm text-[#52606d]">Solo actividad vinculada directamente al identificador del lead. No se atribuyen coincidencias por email, nombre o teléfono.</p>
        {loading && <p role="status" className="mt-6 text-sm">Cargando historial…</p>}
        {error && <p role="alert" className="mt-6 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
        {data && <>
          <h2 className="mt-6 text-xl font-semibold">{data.lead.name}</h2>
          {Object.values(data.limited).some(Boolean) && <p role="status" className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm">Historial parcial: alguna fuente alcanzó el límite de consulta. Consulta su módulo de origen para más registros.</p>}
          {data.events.length === 0 && <p className="mt-5 text-sm">No hay actividad vinculada.</p>}
          <ol className="mt-5 space-y-3">
            {data.events.map(event => <li key={event.id} className="rounded-xl border border-[#ded2bf] bg-white p-4">
              <p className="text-xs font-semibold uppercase text-[#8a6111]">{event.kind} · {new Date(event.at).toLocaleString('es-ES')}</p>
              <h3 className="mt-1 font-semibold text-[#07111d]">{event.title}</h3>
              <p className="mt-1 text-sm text-[#52606d]">{event.description}</p>
              <p className="mt-1 text-xs text-[#8a9aab]">Fuente: {event.source}</p>
              {event.href && <Link className="mt-2 inline-block text-sm font-semibold text-[#8a6111] hover:underline" href={event.href}>Abrir origen →</Link>}
            </li>)}
          </ol>
        </>}
      </div>
    </main>
  );
}
