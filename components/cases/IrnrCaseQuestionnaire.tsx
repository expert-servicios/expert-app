'use client';

import { useMemo, useRef, useState } from 'react';
import { CheckCircle2, Plus, Save, Trash2 } from 'lucide-react';

type Property = {
  address: string;
  cadastralReference: string;
  acquisitionDate: string;
  ownershipPercent: string;
  use: 'available' | 'rented' | 'sold';
};

type SavedPayload = {
  taxYear: string;
  residenceCountry: string;
  taxIdForeign: string;
  properties: Property[];
};

function emptyProperty(): Property {
  return { address: '', cadastralReference: '', acquisitionDate: '', ownershipPercent: '100', use: 'available' };
}

export function IrnrCaseQuestionnaire({
  caseId,
  initialComment,
}: {
  caseId: string;
  initialComment?: string | null;
}) {
  const initial = useMemo<SavedPayload>(() => {
    if (!initialComment) return { taxYear: String(new Date().getFullYear() - 1), residenceCountry: '', taxIdForeign: '', properties: [emptyProperty()] };
    try {
      const parsed = JSON.parse(initialComment) as SavedPayload;
      return {
        taxYear: parsed.taxYear || String(new Date().getFullYear() - 1),
        residenceCountry: parsed.residenceCountry || '',
        taxIdForeign: parsed.taxIdForeign || '',
        properties: Array.isArray(parsed.properties) && parsed.properties.length ? parsed.properties : [emptyProperty()],
      };
    } catch {
      return { taxYear: String(new Date().getFullYear() - 1), residenceCountry: '', taxIdForeign: '', properties: [emptyProperty()] };
    }
  }, [initialComment]);

  const [taxYear,setTaxYear] = useState(initial.taxYear);
  const [residenceCountry,setResidenceCountry] = useState(initial.residenceCountry);
  const [taxIdForeign,setTaxIdForeign] = useState(initial.taxIdForeign);
  const [properties,setProperties] = useState<Property[]>(initial.properties);
  const [saving,setSaving] = useState(false);
  const [saved,setSaved] = useState(false);
  const [error,setError] = useState('');
  const revisionRef = useRef(0);

  function markDirty() {
    revisionRef.current += 1;
    setSaved(false);
  }

  function update(index:number, patch:Partial<Property>) {
    setProperties(current => current.map((item,i) => i === index ? { ...item, ...patch } : item));
    markDirty();
  }

  async function save() {
    setSaving(true); setError('');
    const payload: SavedPayload = { taxYear,residenceCountry,taxIdForeign,properties };
    const revisionAtStart = revisionRef.current;
    try {
      const res = await fetch(`/api/cases/${caseId}/document-notes`, {
        method:'PATCH',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          itemKey:'irnr-intake',
          itemLabel:'Cuestionario IRNR — inmuebles y titulares',
          comment:JSON.stringify(payload),
        }),
      });
      const data = await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(data.error ?? 'No se pudo guardar.');
      if (revisionRef.current === revisionAtStart) setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.');
    } finally { setSaving(false); }
  }

  return (
    <section className="rounded-2xl border border-[#d8cbb5] bg-white p-6 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c88b25]">Datos fiscales del servicio</p>
      <h2 className="mt-2 font-serif text-xl font-bold text-[#07111d]">Cuestionario IRNR de inmuebles</h2>
      <p className="mt-2 text-sm leading-6 text-[#29384a]">
        Rellena estos datos después de aprobar el servicio. La fecha de adquisición es necesaria para calcular desde cuándo existe obligación por cada inmueble.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <label className="text-sm font-semibold">Ejercicio a declarar
          <input maxLength={4} value={taxYear} onChange={e=>{setTaxYear(e.target.value);markDirty();}} className="mt-1 w-full rounded-lg border border-[#d8cbb5] px-3 py-2 font-normal" />
        </label>
        <label className="text-sm font-semibold">País de residencia fiscal
          <input maxLength={100} value={residenceCountry} onChange={e=>{setResidenceCountry(e.target.value);markDirty();}} className="mt-1 w-full rounded-lg border border-[#d8cbb5] px-3 py-2 font-normal" />
        </label>
        <label className="text-sm font-semibold">N.º fiscal extranjero
          <input maxLength={80} value={taxIdForeign} onChange={e=>{setTaxIdForeign(e.target.value);markDirty();}} className="mt-1 w-full rounded-lg border border-[#d8cbb5] px-3 py-2 font-normal" />
        </label>
      </div>

      <div className="mt-6 space-y-4">
        {properties.map((property,index)=>(
          <div key={index} className="rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Inmueble {index+1}</p>
              {properties.length > 1 && <button type="button" onClick={()=>{setProperties(p=>p.filter((_,i)=>i!==index));markDirty();}} className="text-red-600"><Trash2 className="h-4 w-4" /></button>}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold">Dirección
                <input maxLength={300} value={property.address} onChange={e=>update(index,{address:e.target.value})} className="mt-1 w-full rounded-lg border border-[#d8cbb5] bg-white px-3 py-2 font-normal" />
              </label>
              <label className="text-xs font-semibold">Referencia catastral
                <input maxLength={40} value={property.cadastralReference} onChange={e=>update(index,{cadastralReference:e.target.value})} className="mt-1 w-full rounded-lg border border-[#d8cbb5] bg-white px-3 py-2 font-normal" />
              </label>
              <label className="text-xs font-semibold">Fecha de adquisición
                <input type="date" value={property.acquisitionDate} onChange={e=>update(index,{acquisitionDate:e.target.value})} className="mt-1 w-full rounded-lg border border-[#d8cbb5] bg-white px-3 py-2 font-normal" />
              </label>
              <label className="text-xs font-semibold">Porcentaje de titularidad
                <input inputMode="decimal" maxLength={10} value={property.ownershipPercent} onChange={e=>update(index,{ownershipPercent:e.target.value})} className="mt-1 w-full rounded-lg border border-[#d8cbb5] bg-white px-3 py-2 font-normal" />
              </label>
              <label className="text-xs font-semibold sm:col-span-2">Uso durante el ejercicio
                <select value={property.use} onChange={e=>update(index,{use:e.target.value as Property['use']})} className="mt-1 w-full rounded-lg border border-[#d8cbb5] bg-white px-3 py-2 font-normal">
                  <option value="available">A disposición / no alquilado</option>
                  <option value="rented">Alquilado total o parcialmente</option>
                  <option value="sold">Vendido durante el ejercicio</option>
                </select>
              </label>
            </div>
          </div>
        ))}
      </div>

      <button type="button" onClick={()=>{setProperties(p=>[...p,emptyProperty()]);markDirty();}} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#c88b25]">
        <Plus className="h-4 w-4" /> Añadir inmueble
      </button>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" onClick={save} disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#c88b25] px-5 py-2.5 text-sm font-bold text-[#061321] disabled:opacity-60">
          <Save className="h-4 w-4" /> {saving ? 'Guardando…' : 'Guardar cuestionario'}
        </button>
        {saved && <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Guardado</span>}
        {error && <span className="text-sm text-red-700">{error}</span>}
      </div>
      <p className="mt-4 text-xs leading-5 text-[#52606d]">Después, sube la escritura/nota simple, el IBI y la documentación de identidad en el checklist de documentos de este mismo expediente.</p>
    </section>
  );
}
