'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2, Save, ClipboardList } from 'lucide-react';

type IntakePayload = {
  cnae?: string | null;
  iae?: string | null;
  administrator?: string | null;
  shareholders_over_25?: string | null;
  work_centers?: string | null;
  properties_and_ibi?: string | null;
  has_rent_withholding_115_180?: boolean | null;
  has_payroll_withholding_111_190?: boolean | null;
  has_nonresident_payments_216?: boolean | null;
  foreign_operations_notes?: string | null;
  accounting_notes?: string | null;
};

type IntakeResponse = {
  intake: {
    payload: IntakePayload;
    completion_percent: number;
    last_saved_at: string | null;
  };
};

const EMPTY: IntakePayload = {
  cnae: '',
  iae: '',
  administrator: '',
  shareholders_over_25: '',
  work_centers: '',
  properties_and_ibi: '',
  has_rent_withholding_115_180: null,
  has_payroll_withholding_111_190: null,
  has_nonresident_payments_216: null,
  foreign_operations_notes: '',
  accounting_notes: '',
};

export function Company360Questionnaire({ companyId, compact = false }: { companyId: string; compact?: boolean }) {
  const [form, setForm] = useState<IntakePayload>(EMPTY);
  const [completion, setCompletion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState('');
  const hydrated = useRef(false);
  const saveVersion = useRef(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/companies/${companyId}/intake`)
      .then(async (response) => {
        const data = await response.json() as IntakeResponse & { error?: string };
        if (!response.ok) throw new Error(data.error ?? 'No se pudo cargar el cuestionario.');
        if (!active) return;
        setForm({ ...EMPTY, ...(data.intake?.payload ?? {}) });
        setCompletion(data.intake?.completion_percent ?? 0);
        setSavedAt(data.intake?.last_saved_at ?? null);
        hydrated.current = true;
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'No se pudo cargar el cuestionario.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [companyId]);

  useEffect(() => {
    if (!hydrated.current || loading) return;
    const version = ++saveVersion.current;
    const timer = window.setTimeout(async () => {
      setSaving(true);
      setError('');
      try {
        const response = await fetch(`/api/companies/${companyId}/intake`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(form),
        });
        const data = await response.json() as IntakeResponse & { error?: string };
        if (!response.ok) throw new Error(data.error ?? 'No se pudo guardar.');
        if (version !== saveVersion.current) return;
        setCompletion(data.intake?.completion_percent ?? 0);
        setSavedAt(data.intake?.last_saved_at ?? new Date().toISOString());
      } catch (err) {
        if (version === saveVersion.current) setError(err instanceof Error ? err.message : 'No se pudo guardar.');
      } finally {
        if (version === saveVersion.current) setSaving(false);
      }
    }, 900);
    return () => window.clearTimeout(timer);
  }, [companyId, form, loading]);

  const set = <K extends keyof IntakePayload>(key: K, value: IntakePayload[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  if (loading) {
    return <div className="rounded-xl border border-[#d8cbb5] bg-white p-5 text-sm text-[#52606d]"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Cargando Company 360…</div>;
  }

  return (
    <section className={compact ? 'rounded-xl border border-[#d8cbb5] bg-white p-5' : 'rounded-2xl border border-[#d8cbb5] bg-white p-6 shadow-sm'}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-[#c88b25]" />
            <h2 className="font-serif text-xl font-bold text-[#07111d]">Company 360 · Cuestionario operativo</h2>
          </div>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-[#52606d]">
            Puedes completarlo por fases. EXPERT guarda automáticamente cada cambio y KIA utiliza únicamente los datos ya disponibles para preparar la hoja registral, requisitos y siguientes acciones.
          </p>
        </div>
        <div className="min-w-36 text-right">
          <p className="text-xs font-bold text-[#07111d]">{completion}% completado</p>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#eee7da]">
            <div className="h-full bg-[#c88b25] transition-all" style={{ width: `${completion}%` }} />
          </div>
          <p className="mt-1 text-[10px] text-[#8a9aab]">
            {saving ? <><Loader2 className="mr-1 inline h-3 w-3 animate-spin" />Guardando…</> : savedAt ? <><CheckCircle2 className="mr-1 inline h-3 w-3" />Guardado</> : <><Save className="mr-1 inline h-3 w-3" />Borrador</>}
          </p>
        </div>
      </div>

      {error ? <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div> : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Field label="CNAE" value={form.cnae ?? ''} onChange={(v) => set('cnae', v)} placeholder="Ej. 6201" />
        <Field label="IAE / epígrafe" value={form.iae ?? ''} onChange={(v) => set('iae', v)} placeholder="Epígrafe y descripción" />
        <Field label="Administrador / representante" value={form.administrator ?? ''} onChange={(v) => set('administrator', v)} placeholder="Nombre y cargo" />
        <Field label="Socios con participación superior al 25 %" value={form.shareholders_over_25 ?? ''} onChange={(v) => set('shareholders_over_25', v)} placeholder="Nombre, porcentaje y condición" multiline />
        <Field label="Centros de trabajo" value={form.work_centers ?? ''} onChange={(v) => set('work_centers', v)} placeholder="Direcciones y actividad" multiline />
        <Field label="Inmuebles / IBI relacionados con la actividad" value={form.properties_and_ibi ?? ''} onChange={(v) => set('properties_and_ibi', v)} placeholder="Uso, dirección, referencia si se conoce" multiline />
        <BooleanField label="¿Paga alquileres sujetos a retención 115/180?" value={form.has_rent_withholding_115_180 ?? null} onChange={(v) => set('has_rent_withholding_115_180', v)} />
        <BooleanField label="¿Tiene nóminas/profesionales con retención 111/190?" value={form.has_payroll_withholding_111_190 ?? null} onChange={(v) => set('has_payroll_withholding_111_190', v)} />
        <BooleanField label="¿Realiza pagos a no residentes sujetos al modelo 216?" value={form.has_nonresident_payments_216 ?? null} onChange={(v) => set('has_nonresident_payments_216', v)} />
        <Field label="Operaciones internacionales / observaciones" value={form.foreign_operations_notes ?? ''} onChange={(v) => set('foreign_operations_notes', v)} placeholder="UE, terceros países, plataformas, etc." multiline />
        <div className="md:col-span-2">
          <Field label="Notas contables y operativas" value={form.accounting_notes ?? ''} onChange={(v) => set('accounting_notes', v)} placeholder="Cualquier particularidad útil para KIA y el equipo EXPERT" multiline />
        </div>
      </div>
    </section>
  );
}

function Field({ label, value, onChange, placeholder, multiline = false }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; multiline?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-[#29384a]">{label}</span>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} className="w-full rounded-lg border border-[#d8cbb5] bg-[#f8f4eb] px-3 py-2 text-sm text-[#07111d] outline-none focus:border-[#d7a33a]" />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="min-h-11 w-full rounded-lg border border-[#d8cbb5] bg-[#f8f4eb] px-3 text-sm text-[#07111d] outline-none focus:border-[#d7a33a]" />
      )}
    </label>
  );
}

function BooleanField({ label, value, onChange }: { label: string; value: boolean | null; onChange: (value: boolean | null) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-[#29384a]">{label}</span>
      <select value={value === null ? '' : value ? 'yes' : 'no'} onChange={(e) => onChange(e.target.value === '' ? null : e.target.value === 'yes')} className="min-h-11 w-full rounded-lg border border-[#d8cbb5] bg-[#f8f4eb] px-3 text-sm text-[#07111d] outline-none focus:border-[#d7a33a]">
        <option value="">Pendiente de confirmar</option>
        <option value="yes">Sí</option>
        <option value="no">No</option>
      </select>
    </label>
  );
}
