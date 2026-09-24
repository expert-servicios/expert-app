'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, Plus, ShieldAlert, Trash2 } from 'lucide-react';

type RiskRow = {
  id: string;
  scenario: string;
  probability: 1 | 2 | 3;
  impact: 1 | 2 | 3;
  measures: string;
};

const STORAGE_KEY = 'expert-rgpd-risk-register-v1';

const DEFAULT_RISKS: RiskRow[] = [
  { id: 'unauthorized-access', scenario: 'Acceso no autorizado a cuentas, expedientes o bases de datos', probability: 2, impact: 3, measures: 'MFA, permisos mínimos, revisión periódica de accesos y registro de actividad.' },
  { id: 'wrong-recipient', scenario: 'Envío de datos o documentos al destinatario equivocado', probability: 2, impact: 2, measures: 'Verificación de destinatarios, doble revisión en documentación sensible y canales seguros.' },
  { id: 'device-loss', scenario: 'Pérdida o robo de dispositivo con acceso a datos', probability: 1, impact: 3, measures: 'Cifrado de dispositivo, bloqueo, MFA, borrado remoto y política de dispositivos.' },
  { id: 'ransomware', scenario: 'Ransomware, malware o indisponibilidad de sistemas', probability: 2, impact: 3, measures: 'Actualizaciones, EDR/antivirus, copias de seguridad y prueba de restauración.' },
  { id: 'provider-incident', scenario: 'Incidente de seguridad o indisponibilidad en un proveedor', probability: 2, impact: 2, measures: 'DPA, revisión de proveedores, backups, plan de continuidad y canal de brechas.' },
  { id: 'excess-retention', scenario: 'Conservación excesiva o ausencia de supresión', probability: 2, impact: 2, measures: 'Matriz de conservación, revisiones periódicas y borrado/anonimización.' },
];

function label(score: number) {
  if (score >= 6) return 'Alto';
  if (score >= 3) return 'Medio';
  return 'Bajo';
}

function download(rows: RiskRow[]) {
  const lines = [
    '# Análisis de riesgos RGPD — borrador',
    '',
    '> Herramienta orientativa. Un riesgo alto o un tratamiento con criterios de alto riesgo puede requerir evaluación profesional y, cuando proceda, EIPD.',
    '',
    '| Escenario | Probabilidad | Impacto | Nivel | Medidas existentes/propuestas |',
    '|---|---:|---:|---|---|',
    ...rows.map((row) => {
      const score = row.probability * row.impact;
      return '| ' + [
        row.scenario,
        row.probability,
        row.impact,
        label(score) + ' (' + score + ')',
        row.measures,
      ].map((v) => String(v).replaceAll('|', '/')).join(' | ') + ' |';
    }),
    '',
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'analisis-riesgos-rgpd-borrador.md';
  a.click();
  URL.revokeObjectURL(url);
}

export function RgpdRiskAssessment() {
  const [rows, setRows] = useState<RiskRow[]>(DEFAULT_RISKS);

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

  const summary = useMemo(() => {
    const scores = rows.map((row) => row.probability * row.impact);
    return {
      high: scores.filter((score) => score >= 6).length,
      medium: scores.filter((score) => score >= 3 && score < 6).length,
      low: scores.filter((score) => score < 3).length,
    };
  }, [rows]);

  const update = (id: string, field: keyof RiskRow, value: RiskRow[keyof RiskRow]) => {
    setRows((prev) => prev.map((row) => row.id === id ? { ...row, [field]: value } : row));
  };

  const add = () => {
    setRows((prev) => [...prev, {
      id: 'risk-' + Date.now(),
      scenario: 'Nuevo escenario de riesgo',
      probability: 1,
      impact: 1,
      measures: '',
    }]);
  };

  return (
    <section className="mt-8 border border-[#D4A017]/25 bg-white p-5 md:p-6">
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-1 h-6 w-6 shrink-0 text-[#D4A017]" />
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#D4A017]">Fase 6 · Riesgos</p>
          <h3 className="mt-1 font-serif text-2xl font-bold">Análisis de riesgos orientativo</h3>
          <p className="mt-2 text-sm leading-6 text-[#23364D]">
            Valora probabilidad e impacto de cada escenario y documenta las medidas existentes o propuestas. El resultado se guarda solo en este navegador.
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        <div className="border border-red-200 bg-red-50 p-3">
          <p className="text-xl font-bold text-red-800">{summary.high}</p>
          <p className="text-xs font-semibold text-red-700">Altos</p>
        </div>
        <div className="border border-amber-200 bg-amber-50 p-3">
          <p className="text-xl font-bold text-amber-800">{summary.medium}</p>
          <p className="text-xs font-semibold text-amber-700">Medios</p>
        </div>
        <div className="border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-xl font-bold text-emerald-800">{summary.low}</p>
          <p className="text-xs font-semibold text-emerald-700">Bajos</p>
        </div>
      </div>

      {summary.high > 0 && (
        <div className="mt-5 border-l-4 border-red-500 bg-red-50 p-4 text-sm leading-6 text-red-950">
          Hay uno o más riesgos altos. La herramienta no los da por mitigados automáticamente. Revisa medidas, necesidad de análisis adicional y posible EIPD antes de validar la implantación.
        </div>
      )}

      <div className="mt-6 space-y-4">
        {rows.map((row) => {
          const score = row.probability * row.impact;
          return (
            <div key={row.id} className="border border-[#D4A017]/20 bg-[#F8F6F1] p-4">
              <div className="flex gap-3">
                <textarea
                  value={row.scenario}
                  onChange={(e) => update(row.id, 'scenario', e.target.value)}
                  rows={2}
                  className="flex-1 border border-[#D4A017]/20 bg-white px-3 py-2 text-sm font-semibold"
                />
                <button type="button" onClick={() => setRows((prev) => prev.filter((x) => x.id !== row.id))} aria-label="Eliminar riesgo">
                  <Trash2 className="h-5 w-5 text-[#6B7280]" />
                </button>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_130px]">
                <label className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">
                  Probabilidad
                  <select
                    value={row.probability}
                    onChange={(e) => update(row.id, 'probability', Number(e.target.value) as 1 | 2 | 3)}
                    className="mt-1 min-h-10 w-full border border-[#D4A017]/20 bg-white px-3 text-sm font-normal normal-case"
                  >
                    <option value={1}>1 · Baja</option>
                    <option value={2}>2 · Media</option>
                    <option value={3}>3 · Alta</option>
                  </select>
                </label>
                <label className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">
                  Impacto
                  <select
                    value={row.impact}
                    onChange={(e) => update(row.id, 'impact', Number(e.target.value) as 1 | 2 | 3)}
                    className="mt-1 min-h-10 w-full border border-[#D4A017]/20 bg-white px-3 text-sm font-normal normal-case"
                  >
                    <option value={1}>1 · Bajo</option>
                    <option value={2}>2 · Medio</option>
                    <option value={3}>3 · Alto</option>
                  </select>
                </label>
                <div className="border border-[#D4A017]/20 bg-white p-3 text-center">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Nivel</p>
                  <p className="mt-1 font-bold">{label(score)} · {score}</p>
                </div>
              </div>

              <label className="mt-3 block text-xs font-bold uppercase tracking-wide text-[#6B7280]">
                Medidas existentes o propuestas
                <textarea
                  value={row.measures}
                  onChange={(e) => update(row.id, 'measures', e.target.value)}
                  rows={3}
                  className="mt-1 w-full border border-[#D4A017]/20 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-[#23364D]"
                />
              </label>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={add} className="inline-flex min-h-11 items-center gap-2 border border-[#D4A017]/30 px-4 text-sm font-semibold">
          <Plus className="h-4 w-4" /> Añadir riesgo
        </button>
        <button type="button" onClick={() => download(rows)} className="inline-flex min-h-11 items-center gap-2 bg-[#D4A017] px-4 text-sm font-bold text-[#0D1B2A]">
          <Download className="h-4 w-4" /> Descargar análisis
        </button>
      </div>

      <p className="mt-5 text-xs leading-5 text-[#6B7280]">
        La puntuación es una ayuda de priorización, no una metodología oficial de certificación. Debe adaptarse a la naturaleza, alcance, contexto y finalidades del tratamiento.
      </p>
    </section>
  );
}
