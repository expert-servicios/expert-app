'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw, Scale, Sparkles } from 'lucide-react';

type Summary = {
  lastRun: {
    run_type: string;
    status: string;
    sources_checked: number;
    sources_changed: number;
    started_at: string;
    finished_at: string | null;
  } | null;
  pendingChanges: Array<{
    id: string;
    status: string;
    severity: string | null;
    change_type: string | null;
    summary: string | null;
    effective_date: string | null;
    created_at: string;
    source: { source_key: string; authority: string; title: string } | Array<{ source_key: string; authority: string; title: string }> | null;
  }>;
  values: Array<{
    value_key: string;
    label: string;
    numeric_value: number | null;
    text_value: string | null;
    unit: string | null;
    period_key: string;
    valid_from: string;
    valid_to: string | null;
    verified_at: string;
  }>;
  sources: Array<{
    source_key: string;
    authority: string;
    title: string;
    priority: string;
    last_checked_at: string | null;
    last_success_at: string | null;
    last_error: string | null;
    last_changed_at: string | null;
  }>;
};

export default function RegulatoryPulsePage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/regulatory', { cache: 'no-store' });
      if (!response.ok) throw new Error('No se pudo cargar Regulatory Pulse');
      const payload = await response.json() as { summary: Summary };
      setSummary(payload.summary);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const run = async (nextAction: 'pulse' | 'worker') => {
    setAction(nextAction);
    try {
      const response = await fetch('/api/admin/regulatory', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: nextAction }),
      });
      if (!response.ok) throw new Error('La operación regulatoria ha fallado');
      await load();
    } finally {
      setAction(null);
    }
  };

  if (!summary) {
    return <main className="p-8">{loading ? 'Cargando Regulatory Pulse…' : 'No se pudo cargar el registro regulatorio.'}</main>;
  }

  const sourceErrors = summary.sources.filter((source) => source.last_error);
  const critical = summary.pendingChanges.filter((change) => change.severity === 'critical');

  return (
    <main className="min-h-screen bg-[#f8f4eb] px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="h-6 w-6 text-[#c88b25]" />
              <h1 className="font-serif text-3xl font-bold text-[#07111d]">KIA Regulatory Pulse</h1>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5b6470]">
              Fuentes oficiales, cambios detectados y valores operativos canónicos. La revisión automática no publica ni modifica contenido de producción.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void run('pulse')} disabled={Boolean(action)}
              className="inline-flex items-center gap-2 rounded-xl border border-[#d8cbb5] bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${action === 'pulse' ? 'animate-spin' : ''}`} /> Revisar fuentes
            </button>
            <button type="button" onClick={() => void run('worker')} disabled={Boolean(action)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#07111d] px-4 py-2 text-sm font-semibold text-[#d7a33a] disabled:opacity-50">
              <Sparkles className="h-4 w-4" /> Clasificar pendientes
            </button>
          </div>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-4">
          <Metric label="Fuentes" value={summary.sources.length} />
          <Metric label="Cambios pendientes" value={summary.pendingChanges.length} />
          <Metric label="Críticos" value={critical.length} />
          <Metric label="Fuentes con error" value={sourceErrors.length} />
        </div>

        {sourceErrors.length > 0 && (
          <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
            <div className="flex items-center gap-2 font-bold text-red-800">
              <AlertTriangle className="h-4 w-4" /> Fuentes con incidencia
            </div>
            {sourceErrors.map((source) => (
              <p key={source.source_key} className="mt-2 text-xs text-red-700">
                {source.authority} · {source.title}: {source.last_error}
              </p>
            ))}
          </section>
        )}

        <section className="mt-6 overflow-hidden rounded-2xl border border-[#d8cbb5] bg-white">
          <div className="border-b border-[#eee6d8] p-5">
            <h2 className="font-serif text-xl font-bold">Cambios pendientes</h2>
          </div>
          <div className="divide-y divide-[#eee6d8]">
            {summary.pendingChanges.length === 0 ? (
              <p className="p-5 text-sm text-[#5b6470]">Sin cambios pendientes.</p>
            ) : summary.pendingChanges.map((change) => {
              const source = Array.isArray(change.source) ? change.source[0] : change.source;
              return (
                <div key={change.id} className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{source?.authority ?? 'Fuente'}</span>
                    <span className="rounded-full bg-[#f8f4eb] px-2 py-1 text-xs">{change.severity ?? 'pending'}</span>
                    <span className="text-xs text-[#6b7280]">{change.status}</span>
                  </div>
                  <p className="mt-2 text-sm">{change.summary ?? 'Pendiente de clasificación KIA.'}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-[#d8cbb5] bg-white">
          <div className="border-b border-[#eee6d8] p-5">
            <h2 className="font-serif text-xl font-bold">Valores canónicos</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#f8f4eb] text-left text-xs uppercase text-[#6b7280]">
                <tr><th className="px-4 py-3">Clave</th><th className="px-4 py-3">Valor</th><th className="px-4 py-3">Periodo</th><th className="px-4 py-3">Vigencia</th></tr>
              </thead>
              <tbody className="divide-y divide-[#eee6d8]">
                {summary.values.map((value) => (
                  <tr key={`${value.value_key}-${value.period_key}-${value.valid_from}`}>
                    <td className="px-4 py-3"><span className="font-mono text-xs">{value.value_key}</span><br /><span className="text-xs text-[#6b7280]">{value.label}</span></td>
                    <td className="px-4 py-3 font-semibold">{value.numeric_value ?? value.text_value ?? '—'} {value.unit ?? ''}</td>
                    <td className="px-4 py-3">{value.period_key}</td>
                    <td className="px-4 py-3">{value.valid_from} → {value.valid_to ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-[#d8cbb5] bg-white">
          <div className="border-b border-[#eee6d8] p-5">
            <h2 className="font-serif text-xl font-bold">Salud de fuentes</h2>
          </div>
          <div className="divide-y divide-[#eee6d8]">
            {summary.sources.map((source) => (
              <div key={source.source_key} className="flex flex-col gap-1 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold">{source.authority} · {source.title}</p>
                  <p className="font-mono text-xs text-[#6b7280]">{source.source_key}</p>
                </div>
                <div className={`inline-flex items-center gap-1 text-xs font-semibold ${source.last_error ? 'text-red-700' : 'text-green-700'}`}>
                  {source.last_error ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                  {source.last_error ? 'Incidencia' : source.last_success_at ? 'Última lectura OK' : 'Pendiente baseline'}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6b7280]">{label}</p>
      <p className="mt-2 font-serif text-3xl font-bold text-[#07111d]">{value}</p>
    </div>
  );
}
