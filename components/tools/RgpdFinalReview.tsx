'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, Download, RefreshCw, TriangleAlert } from 'lucide-react';

type ReviewIssue = {
  severity: 'warning' | 'error';
  label: string;
};

function readJson(key: string) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function RgpdFinalReview() {
  const [version, setVersion] = useState(0);

  const snapshot = useMemo(() => {
    if (typeof window === 'undefined') {
      return { profile: null, treatments: null, providers: null, retention: null, progress: null };
    }

    return {
      profile: readJson('expert-rgpd-company-profile-v1'),
      treatments: readJson('expert-rgpd-treatments-v1'),
      providers: readJson('expert-rgpd-provider-inventory-v1'),
      retention: readJson('expert-rgpd-retention-matrix-v1'),
      progress: readJson('expert-rgpd-implementation-progress-v1'),
    };
  }, [version]);

  const issues = useMemo<ReviewIssue[]>(() => {
    const out: ReviewIssue[] = [];
    const p = snapshot.profile ?? {};

    if (!p.legalName) out.push({ severity: 'error', label: 'Falta la razón social.' });
    if (!p.taxId) out.push({ severity: 'error', label: 'Falta el NIF/CIF.' });
    if (!p.activity) out.push({ severity: 'warning', label: 'Falta describir la actividad principal.' });
    if (!p.contactEmail) out.push({ severity: 'warning', label: 'Falta definir un email/canal de privacidad.' });

    const selectedIds = snapshot.treatments?.selectedIds ?? [];
    const customTreatments = snapshot.treatments?.customTreatments ?? [];
    if (selectedIds.length + customTreatments.length === 0) {
      out.push({ severity: 'error', label: 'No hay tratamientos seleccionados para el RAT.' });
    }

    for (const t of customTreatments) {
      if (!t.name || !t.purpose || !t.legalBasis || !t.dataCategories || !t.dataSubjects || !t.retention) {
        out.push({ severity: 'warning', label: 'Hay tratamientos personalizados con campos incompletos.' });
        break;
      }
    }

    const providerIds = snapshot.providers?.selectedIds ?? [];
    const customProviders = snapshot.providers?.custom ?? [];
    if (providerIds.length + customProviders.length === 0) {
      out.push({ severity: 'warning', label: 'No se ha documentado ningún proveedor/encargado.' });
    }

    for (const provider of customProviders) {
      if (provider.role === 'por-revisar') {
        out.push({ severity: 'warning', label: 'Hay proveedores con el rol jurídico pendiente de revisar.' });
        break;
      }
    }

    if (!Array.isArray(snapshot.retention) || snapshot.retention.length === 0) {
      out.push({ severity: 'warning', label: 'La matriz de conservación está vacía.' });
    } else {
      for (const row of snapshot.retention) {
        if (!row.category || !row.operational || !row.legalBasis || !row.deletion) {
          out.push({ severity: 'warning', label: 'La matriz de conservación contiene filas incompletas.' });
          break;
        }
      }
    }

    return out;
  }, [snapshot]);

  const exportPackage = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      notice: 'Borrador de autoimplantación. No acredita cumplimiento ni sustituye revisión profesional cuando proceda.',
      ...snapshot,
      review: {
        issues,
        status: issues.some((i) => i.severity === 'error') ? 'incompleto' : issues.length ? 'revisar' : 'sin_huecos_basicos_detectados',
      },
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expediente-rgpd-local-borrador.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const errors = issues.filter((i) => i.severity === 'error').length;

  return (
    <section className="mt-8 border border-[#D4A017]/25 bg-[#0D1B2A] p-5 text-white md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#D4A017]">Fase 6 · Revisión final</p>
          <h3 className="mt-1 font-serif text-2xl font-bold">Expediente RGPD local</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
            Comprueba los huecos básicos y exporta una copia estructurada del trabajo realizado. El análisis se hace en tu navegador.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setVersion((v) => v + 1)}
          className="inline-flex min-h-10 shrink-0 items-center gap-2 border border-white/20 px-3 text-sm font-semibold"
        >
          <RefreshCw className="h-4 w-4" /> Revisar
        </button>
      </div>

      <div className="mt-6 border border-white/10 bg-white/5 p-4">
        {issues.length === 0 ? (
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-[#D4A017]" />
            <div>
              <p className="font-bold">No se han detectado huecos básicos en los módulos locales.</p>
              <p className="mt-1 text-sm text-white/70">
                Esto no equivale a una certificación de cumplimiento: aún deben validarse riesgo, transferencias, contratos, medidas y decisiones jurídicas aplicables.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <TriangleAlert className="h-5 w-5 text-[#D4A017]" />
              <p className="font-bold">
                {issues.length} punto{issues.length === 1 ? '' : 's'} pendiente{issues.length === 1 ? '' : 's'} · {errors} crítico{errors === 1 ? '' : 's'}
              </p>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              {issues.map((issue, index) => (
                <li key={index} className="flex gap-2">
                  <span className={issue.severity === 'error' ? 'font-bold text-[#D4A017]' : 'text-white/50'}>
                    {issue.severity === 'error' ? '!' : '•'}
                  </span>
                  {issue.label}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={exportPackage}
          className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#D4A017] px-5 text-sm font-bold text-[#0D1B2A]"
        >
          <Download className="h-4 w-4" /> Exportar expediente local
        </button>
        <p className="text-xs leading-5 text-white/60">
          La exportación incluye únicamente la información guardada localmente por esta herramienta.
        </p>
      </div>
    </section>
  );
}
