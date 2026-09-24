'use client';

import { useEffect, useState } from 'react';
import { Clock3, Download, Plus, Trash2 } from 'lucide-react';

type RetentionRow = {
  id: string;
  category: string;
  operational: string;
  legalBasis: string;
  blocking: string;
  deletion: string;
};

const STORAGE_KEY = 'expert-rgpd-retention-matrix-v1';

const DEFAULT_ROWS: RetentionRow[] = [
  { id: 'leads', category: 'Leads no convertidos', operational: 'Definir plazo interno', legalBasis: 'Revisar base y finalidad', blocking: 'No aplica normalmente', deletion: 'Borrado o anonimización al vencer el plazo' },
  { id: 'clients', category: 'Expedientes de clientes', operational: 'Mientras dure la relación', legalBasis: 'Revisar plazos legales por servicio', blocking: 'Bloqueo cuando proceda', deletion: 'Supresión/anonimización al finalizar plazos' },
  { id: 'billing', category: 'Facturación y contabilidad', operational: 'Mientras sea necesaria', legalBasis: 'Fiscal/mercantil: revisar normativa aplicable', blocking: 'Conservar bloqueado si procede', deletion: 'Destrucción segura tras plazos' },
  { id: 'hr', category: 'Personal y laboral', operational: 'Durante relación laboral', legalBasis: 'Laboral, SS, prevención y fiscal', blocking: 'Según obligación/legal claims', deletion: 'Supresión segura al finalizar plazos' },
  { id: 'marketing', category: 'Marketing', operational: 'Hasta baja/oposición', legalBasis: 'Consentimiento o base aplicable', blocking: 'Lista de supresión mínima', deletion: 'Eliminar de campañas y conservar solo evidencia necesaria' },
];

export function RgpdRetentionMatrix() {
  const [rows, setRows] = useState<RetentionRow[]>(DEFAULT_ROWS);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setRows(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    } catch {}
  }, [rows]);

  const update = (id: string, field: keyof RetentionRow, value: string) => {
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r));
  };

  const add = () => {
    setRows((prev) => [...prev, {
      id: 'retention-' + Date.now(),
      category: 'Nueva categoría',
      operational: '',
      legalBasis: '',
      blocking: '',
      deletion: '',
    }]);
  };

  const download = () => {
    const lines = [
      '# Matriz de conservación y supresión — borrador',
      '',
      '| Categoría | Conservación operativa | Base/plazo legal | Bloqueo | Supresión |',
      '|---|---|---|---|---|',
      ...rows.map((r) => '| ' + [r.category, r.operational, r.legalBasis, r.blocking, r.deletion].map((v) => v.replaceAll('|', '/')).join(' | ') + ' |'),
      '',
      '> Los plazos legales deben validarse antes de aprobar esta matriz.',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'matriz-conservacion-rgpd-borrador.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="mt-8 border border-[#D4A017]/25 bg-white p-5 md:p-6">
      <div className="flex items-start gap-3">
        <Clock3 className="mt-1 h-6 w-6 shrink-0 text-[#D4A017]" />
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#D4A017]">Fase 5 · Conservación</p>
          <h3 className="mt-1 font-serif text-2xl font-bold">Matriz de conservación, bloqueo y supresión</h3>
          <p className="mt-2 text-sm leading-6 text-[#23364D]">
            Define una regla por categoría. No uses un único plazo para todos los datos.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {rows.map((r) => (
          <div key={r.id} className="border border-[#D4A017]/20 bg-[#F8F6F1] p-4">
            <div className="flex gap-3">
              <input value={r.category} onChange={(e) => update(r.id, 'category', e.target.value)} className="min-h-10 flex-1 border border-[#D4A017]/25 bg-white px-3 font-semibold" />
              <button type="button" onClick={() => setRows((prev) => prev.filter((x) => x.id !== r.id))} aria-label="Eliminar categoría">
                <Trash2 className="h-5 w-5 text-[#6B7280]" />
              </button>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <textarea value={r.operational} onChange={(e) => update(r.id, 'operational', e.target.value)} rows={2} placeholder="Conservación operativa" className="border border-[#D4A017]/20 bg-white px-3 py-2 text-sm" />
              <textarea value={r.legalBasis} onChange={(e) => update(r.id, 'legalBasis', e.target.value)} rows={2} placeholder="Plazo/base legal" className="border border-[#D4A017]/20 bg-white px-3 py-2 text-sm" />
              <textarea value={r.blocking} onChange={(e) => update(r.id, 'blocking', e.target.value)} rows={2} placeholder="Bloqueo" className="border border-[#D4A017]/20 bg-white px-3 py-2 text-sm" />
              <textarea value={r.deletion} onChange={(e) => update(r.id, 'deletion', e.target.value)} rows={2} placeholder="Supresión/anonimización" className="border border-[#D4A017]/20 bg-white px-3 py-2 text-sm" />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={add} className="inline-flex min-h-11 items-center gap-2 border border-[#D4A017]/30 px-4 text-sm font-semibold">
          <Plus className="h-4 w-4" /> Añadir categoría
        </button>
        <button type="button" onClick={download} className="inline-flex min-h-11 items-center gap-2 bg-[#D4A017] px-4 text-sm font-bold text-[#0D1B2A]">
          <Download className="h-4 w-4" /> Descargar matriz
        </button>
      </div>
    </section>
  );
}
