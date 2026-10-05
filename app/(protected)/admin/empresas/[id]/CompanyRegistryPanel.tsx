'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpenCheck, Clock3, History, Loader2, Pencil, Plus, RotateCcw, Save, ShieldCheck, X } from 'lucide-react';

type RegistryFact = {
  id: string;
  fact_key: string;
  category: string;
  fact_value: string;
  valid_from: string;
  source_ref: string | null;
  updated_at: string;
};

type RegistryInstruction = {
  id: string;
  instruction_key: string;
  scope: string;
  instruction_text: string;
  priority: number;
  valid_from: string;
  source_ref: string | null;
  updated_at: string;
};

type RegistryEvent = {
  id: string;
  event_type: string;
  occurred_at: string;
  title: string | null;
  summary: string | null;
  channel: string | null;
  direction: string | null;
  importance: number;
  source_ref: string | null;
  case_id: string | null;
};

type RegistrySummary = {
  id: string;
  period_start: string;
  period_end: string;
  summary_text: string;
  event_count: number;
  generated_at: string;
};

type RegistryPayload = {
  subjectId: string;
  lifecycleStage: string;
  detailWindowMonths: number;
  retentionYears: number;
  facts: RegistryFact[];
  instructions: RegistryInstruction[];
  events: RegistryEvent[];
  summaries: RegistrySummary[];
};

type EditState =
  | { kind: 'fact'; id?: string; category: string; value: string }
  | { kind: 'instruction'; id?: string; scope: string; text: string; priority: number }
  | null;

function dateLabel(value: string) {
  try {
    return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value));
  } catch {
    return value;
  }
}

export function CompanyRegistryPanel({ companyId }: { companyId: string }) {
  const [data, setData] = useState<RegistryPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [edit, setEdit] = useState<EditState>(null);
  const [showTimeline, setShowTimeline] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/empresas/${companyId}/registro`, { cache: 'no-store' });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'No se pudo cargar la hoja registral');
      setData(json as RegistryPayload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const recentEvents = useMemo(() => data?.events.slice(0, showTimeline ? 150 : 12) ?? [], [data, showTimeline]);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!edit) return;
    setSaving(true);
    setError('');
    try {
      const body = edit.kind === 'fact'
        ? { kind: 'fact', id: edit.id, category: edit.category, value: edit.value }
        : { kind: 'instruction', id: edit.id, scope: edit.scope, text: edit.text, priority: edit.priority };
      const response = await fetch(`/api/admin/empresas/${companyId}/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'No se pudo guardar');
      setEdit(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setSaving(false);
    }
  }

  async function revoke(kind: 'fact' | 'instruction', id: string) {
    if (!window.confirm('¿Desactivar este registro? La versión quedará conservada en el histórico y dejará de usarse como contexto activo de KIA.')) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/empresas/${companyId}/registro`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, id }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'No se pudo desactivar');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setSaving(false);
    }
  }

  if (loading && !data) {
    return (
      <section className="rounded-2xl border border-[#d8cbb5] bg-white p-6 shadow-sm">
        <Loader2 className="mr-2 inline h-4 w-4 animate-spin text-[#c88b25]" />
        <span className="text-sm text-[#52606d]">Cargando Hoja Registral…</span>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[#d8cbb5] bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BookOpenCheck className="h-5 w-5 text-[#c88b25]" />
            <h2 className="font-serif text-xl font-bold text-[#07111d]">Hoja Registral KIA</h2>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#52606d]">
            Contexto específico de esta empresa. Los cambios manuales se versionan: la información anterior no se borra ni se reescribe.
          </p>
          {data && (
            <p className="mt-1 text-xs text-[#8a9aab]">
              Ventana detallada: {data.detailWindowMonths} meses · trazabilidad histórica de referencia: {data.retentionYears} años.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8cbb5] px-3 py-2 text-xs font-bold text-[#29384a] disabled:opacity-50"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Actualizar
        </button>
      </div>

      {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <div className="rounded-xl border border-[#e6dfd2] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#07111d]">Hechos estructurales</h3>
              <p className="mt-1 text-xs text-[#8a9aab]">Datos estables confirmados que KIA debe recordar mientras sigan vigentes.</p>
            </div>
            <button
              type="button"
              onClick={() => setEdit({ kind: 'fact', category: 'general', value: '' })}
              className="inline-flex items-center gap-1 rounded-lg bg-[#07111d] px-3 py-2 text-xs font-bold text-white"
            >
              <Plus className="h-3.5 w-3.5" /> Añadir
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {data?.facts.length ? data.facts.map((fact) => (
              <div key={fact.id} className="rounded-xl bg-[#fbf8f2] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#52606d]">{fact.category}</span>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-5 text-[#07111d]">{fact.fact_value}</p>
                    <p className="mt-2 text-[10px] text-[#8a9aab]">Vigente desde {dateLabel(fact.valid_from)}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      aria-label="Editar hecho"
                      onClick={() => setEdit({ kind: 'fact', id: fact.id, category: fact.category, value: fact.fact_value })}
                      className="rounded-lg border border-[#d8cbb5] bg-white p-2 text-[#52606d]"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Desactivar hecho"
                      onClick={() => void revoke('fact', fact.id)}
                      className="rounded-lg border border-red-200 bg-white p-2 text-red-700"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )) : <p className="rounded-xl bg-[#fbf8f2] px-4 py-5 text-xs text-[#8a9aab]">Todavía no hay hechos estructurales confirmados.</p>}
          </div>
        </div>

        <div className="rounded-xl border border-[#e6dfd2] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#07111d]">Instrucciones operativas</h3>
              <p className="mt-1 text-xs text-[#8a9aab]">Reglas específicas de trabajo de esta empresa. No sustituyen normativa ni fuentes vivas.</p>
            </div>
            <button
              type="button"
              onClick={() => setEdit({ kind: 'instruction', scope: 'general', text: '', priority: 3 })}
              className="inline-flex items-center gap-1 rounded-lg bg-[#07111d] px-3 py-2 text-xs font-bold text-white"
            >
              <Plus className="h-3.5 w-3.5" /> Añadir
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {data?.instructions.length ? data.instructions.map((item) => (
              <div key={item.id} className="rounded-xl bg-[#fbf8f2] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#52606d]">{item.scope}</span>
                      <span className="rounded-full bg-[#efe6d7] px-2 py-0.5 text-[10px] font-bold text-[#8a5d12]">Prioridad {item.priority}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-5 text-[#07111d]">{item.instruction_text}</p>
                    <p className="mt-2 text-[10px] text-[#8a9aab]">Vigente desde {dateLabel(item.valid_from)}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      aria-label="Editar instrucción"
                      onClick={() => setEdit({ kind: 'instruction', id: item.id, scope: item.scope, text: item.instruction_text, priority: item.priority })}
                      className="rounded-lg border border-[#d8cbb5] bg-white p-2 text-[#52606d]"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Desactivar instrucción"
                      onClick={() => void revoke('instruction', item.id)}
                      className="rounded-lg border border-red-200 bg-white p-2 text-red-700"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )) : <p className="rounded-xl bg-[#fbf8f2] px-4 py-5 text-xs text-[#8a9aab]">Todavía no hay instrucciones operativas específicas.</p>}
          </div>
        </div>
      </div>

      {edit && (
        <form onSubmit={save} className="mt-5 rounded-xl border border-[#c88b25]/40 bg-[#fffaf1] p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-[#07111d]">{edit.id ? 'Editar registro' : 'Nuevo registro'}</h3>
            <button type="button" onClick={() => setEdit(null)} className="rounded-lg p-1.5 text-[#52606d]"><X className="h-4 w-4" /></button>
          </div>

          {edit.kind === 'fact' ? (
            <div className="mt-3 grid gap-3 md:grid-cols-[180px_1fr]">
              <label className="text-xs font-semibold text-[#52606d]">
                Categoría
                <input
                  value={edit.category}
                  onChange={(event) => setEdit({ ...edit, category: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-[#d8cbb5] bg-white px-3 py-2 text-sm"
                  placeholder="general, inmuebles, fiscal…"
                />
              </label>
              <label className="text-xs font-semibold text-[#52606d]">
                Hecho confirmado
                <textarea
                  value={edit.value}
                  onChange={(event) => setEdit({ ...edit, value: event.target.value })}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-[#d8cbb5] bg-white px-3 py-2 text-sm"
                  placeholder="Ej.: Sociedad patrimonial con cinco viviendas en alquiler."
                />
              </label>
            </div>
          ) : (
            <div className="mt-3 grid gap-3 md:grid-cols-[180px_110px_1fr]">
              <label className="text-xs font-semibold text-[#52606d]">
                Ámbito
                <input
                  value={edit.scope}
                  onChange={(event) => setEdit({ ...edit, scope: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-[#d8cbb5] bg-white px-3 py-2 text-sm"
                  placeholder="correo, fiscal…"
                />
              </label>
              <label className="text-xs font-semibold text-[#52606d]">
                Prioridad
                <select
                  value={edit.priority}
                  onChange={(event) => setEdit({ ...edit, priority: Number(event.target.value) })}
                  className="mt-1 w-full rounded-lg border border-[#d8cbb5] bg-white px-3 py-2 text-sm"
                >
                  {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
              <label className="text-xs font-semibold text-[#52606d]">
                Instrucción
                <textarea
                  value={edit.text}
                  onChange={(event) => setEdit({ ...edit, text: event.target.value })}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-[#d8cbb5] bg-white px-3 py-2 text-sm"
                  placeholder="Ej.: No enviar comunicaciones externas durante la reconstrucción contable interna."
                />
              </label>
            </div>
          )}

          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={saving || (edit.kind === 'fact' ? !edit.value.trim() : !edit.text.trim())}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#07111d] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Guardar versión
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-xl border border-[#e6dfd2] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-[#c88b25]" />
              <h3 className="text-sm font-bold text-[#07111d]">Timeline verificada</h3>
            </div>
            {(data?.events.length ?? 0) > 12 && (
              <button type="button" onClick={() => setShowTimeline((value) => !value)} className="text-xs font-bold text-[#8a5d12]">
                {showTimeline ? 'Ver menos' : 'Ver todo'}
              </button>
            )}
          </div>
          <div className="mt-4 space-y-2">
            {recentEvents.length ? recentEvents.map((event) => (
              <div key={event.id} className="grid gap-1 border-l-2 border-[#e6dfd2] pl-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold text-[#8a9aab]">{dateLabel(event.occurred_at)}</span>
                  <span className="rounded-full bg-[#fbf8f2] px-2 py-0.5 text-[10px] font-bold text-[#52606d]">{event.event_type}</span>
                </div>
                <p className="text-sm font-semibold text-[#07111d]">{event.title ?? event.event_type}</p>
                {event.summary && <p className="text-xs leading-5 text-[#52606d]">{event.summary}</p>}
              </div>
            )) : <p className="text-xs text-[#8a9aab]">Sin eventos registrales todavía.</p>}
          </div>
        </div>

        <div className="rounded-xl border border-[#e6dfd2] p-4">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-[#c88b25]" />
            <h3 className="text-sm font-bold text-[#07111d]">Histórico consolidado</h3>
          </div>
          <div className="mt-4 space-y-3">
            {data?.summaries.length ? data.summaries.map((summary) => (
              <div key={summary.id} className="rounded-xl bg-[#fbf8f2] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-[#07111d]">{summary.period_start} — {summary.period_end}</p>
                  <span className="text-[10px] text-[#8a9aab]">{summary.event_count} eventos</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-[#52606d]">{summary.summary_text}</p>
              </div>
            )) : <p className="text-xs text-[#8a9aab]">Aún no hay periodos anteriores consolidados.</p>}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs leading-5 text-green-900">
        <ShieldCheck className="mr-2 inline h-4 w-4" />
        Los cambios aquí afectan al contexto activo de KIA para esta empresa, pero no modifican documentos, expedientes, contabilidad ni otras fuentes canónicas.
      </div>
    </section>
  );
}
