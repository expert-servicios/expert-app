'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Calculator, Plus, Trash2 } from 'lucide-react';
import { trackPublicContentIntent } from '@/lib/utils/analytics';

type PropertyRow = {
  holders: number;
  rented: boolean;
};

export function IrnrPriceCalculator({ compact = false, origin = 'service:no-residentes' }: { compact?: boolean; origin?: string }) {
  const [properties, setProperties] = useState<PropertyRow[]>([{ holders: 1, rented: false }]);

  const units = useMemo(
    () => properties.reduce((total, property) => total + Math.max(1, property.holders), 0),
    [properties],
  );
  const net = units > 0 ? 80 + Math.max(0, units - 1) * 30 : 0;
  const vat = Math.round(net * 0.21 * 100) / 100;
  const total = Math.round((net + vat) * 100) / 100;
  const hasRental = properties.some((property) => property.rented);

  const updateProperty = (index: number, patch: Partial<PropertyRow>) => {
    setProperties((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
  };

  const rentedIndexes = properties
    .map((property, index) => property.rented ? index + 1 : null)
    .filter((value): value is number => value !== null);
  const holderDistribution = properties.map((property) => property.holders).join(',');
  const summary = [
    `Inmuebles: ${properties.length}`,
    `titulares por inmueble: ${holderDistribution}`,
    `unidades declarativas estimadas: ${units}`,
    rentedIndexes.length ? `inmuebles alquilados: ${rentedIndexes.join(',')}` : 'sin inmuebles alquilados',
    `honorarios estimados para renta imputada: ${net} EUR + IVA`,
  ].join('; ');

  const requestHref = `/solicitar-presupuesto?servicio=no-residentes&origen=${encodeURIComponent(origin)}&resumen=${encodeURIComponent(summary)}`;
  const [originKind, ...originSlugParts] = origin.split(':');
  const sourceKind: 'docs' | 'blog' | 'service' =
    originKind === 'docs' || originKind === 'blog' ? originKind : 'service';
  const sourceSlug = originSlugParts.join(':') || 'no-residentes';

  return (
    <div className={compact ? 'border border-[#D4A017]/25 bg-[#F8F6F1] p-5' : 'border border-[#D4A017]/25 bg-white p-6'}>
      <div className="flex items-start gap-3">
        <Calculator className="mt-0.5 h-5 w-5 text-[#D4A017]" />
        <div>
          <h3 className="font-serif text-xl font-bold text-[#0D1B2A]">Calculadora IRNR · inmuebles en España</h3>
          <p className="mt-1 text-sm leading-6 text-[#52606D]">
            Para inmuebles a disposición/no alquilados: 80 € + IVA la primera unidad declarativa y 30 € + IVA cada unidad adicional.
            Una unidad es un inmueble por cada titular no residente.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {properties.map((property, index) => (
          <div key={index} className="grid gap-3 border border-[#0D1B2A]/10 bg-white p-4 sm:grid-cols-[1fr_150px_160px_auto] sm:items-end">
            <div>
              <p className="text-sm font-bold text-[#0D1B2A]">Inmueble {index + 1}</p>
              <p className="mt-1 text-xs text-[#6B7280]">Solo necesitamos estos datos para estimar el precio.</p>
            </div>
            <label className="text-xs font-semibold text-[#23364D]">
              Titulares no residentes
              <select
                value={property.holders}
                onChange={(event) => updateProperty(index, { holders: Number(event.target.value) })}
                className="mt-1 w-full border border-[#D4A017]/30 bg-white px-3 py-2 text-sm"
              >
                {[1, 2, 3, 4].map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <label className="flex min-h-10 items-center gap-2 text-xs font-semibold text-[#23364D]">
              <input
                type="checkbox"
                checked={property.rented}
                onChange={(event) => updateProperty(index, { rented: event.target.checked })}
              />
              Está alquilado
            </label>
            {properties.length > 1 && (
              <button
                type="button"
                onClick={() => setProperties((current) => current.filter((_, rowIndex) => rowIndex !== index))}
                className="inline-flex h-10 w-10 items-center justify-center border border-red-200 text-red-600 hover:bg-red-50"
                aria-label={`Eliminar inmueble ${index + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setProperties((current) => [...current, { holders: 1, rented: false }])}
        className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-[#D4A017]"
      >
        <Plus className="h-4 w-4" /> Añadir otro inmueble
      </button>

      <div className="mt-5 border-t border-[#D4A017]/20 pt-5">
        <p className="text-xs uppercase tracking-wider text-[#6B7280]">Estimación</p>
        <p className="mt-1 text-2xl font-bold text-[#0D1B2A]">{net.toLocaleString('es-ES', { minimumFractionDigits: 2 })} € + IVA</p>
        <p className="mt-1 text-sm text-[#52606D]">
          {units} unidad{units !== 1 ? 'es' : ''} declarativa{units !== 1 ? 's' : ''} · total con IVA: {total.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
        </p>
        {hasRental && (
          <p className="mt-3 border border-amber-300 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
            Has marcado al menos un inmueble alquilado. La estimación anterior corresponde a renta imputada por inmuebles a disposición/no alquilados.
            Los periodos de alquiler requieren revisar el alcance antes de confirmar precio.
          </p>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href={requestHref}
          onClick={() => trackPublicContentIntent({ intent: 'irnr_quote', source_kind: sourceKind, source_slug: sourceSlug, service_slug: 'no-residentes' })}
          className="inline-flex min-h-11 items-center justify-center bg-[#D4A017] px-5 py-2.5 text-sm font-bold text-[#0D1B2A] hover:bg-[#F2C14E]"
        >
          Solicitar este servicio
        </Link>
        <Link
          href={`/cita?tipo=consulta-inicial&origen=${encodeURIComponent(origin)}`}
          onClick={() => trackPublicContentIntent({ intent: 'meeting_15m', source_kind: sourceKind, source_slug: sourceSlug, service_slug: 'no-residentes' })}
          className="inline-flex min-h-11 items-center justify-center border border-[#D4A017]/50 px-5 py-2.5 text-sm font-semibold text-[#0D1B2A]"
        >
          Reunión informativa · 15 min
        </Link>
      </div>
    </div>
  );
}
