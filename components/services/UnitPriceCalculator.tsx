'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calculator } from 'lucide-react';
import { trackPublicContentIntent } from '@/lib/utils/analytics';

export type UnitPriceCalculatorConfig = {
  unitPrice: number;
  unitLabel: string;
  unitLabelPlural?: string;
  minUnits?: number;
  defaultUnits?: number;
  maxUnits?: number;
  note?: string;
};

export function UnitPriceCalculator({
  config,
  serviceSlug,
  origin,
  compact = false,
}: {
  config: UnitPriceCalculatorConfig;
  serviceSlug: string;
  origin: string;
  compact?: boolean;
}) {
  const min = Math.max(1, config.minUnits ?? 1);
  const max = Math.max(min, config.maxUnits ?? 99);
  const [units, setUnits] = useState(Math.min(max, Math.max(min, config.defaultUnits ?? min)));
  const net = Math.round(config.unitPrice * units * 100) / 100;
  const total = Math.round(net * 1.21 * 100) / 100;
  const label = units === 1 ? config.unitLabel : (config.unitLabelPlural ?? `${config.unitLabel}s`);
  const summary = [
    `Calculadora ${serviceSlug}`,
    `${units} ${label}`,
    `${config.unitPrice} EUR por unidad`,
    `honorarios calculados: ${net} EUR + IVA`,
  ].join('; ');
  const requestHref = `/solicitar-presupuesto?servicio=${encodeURIComponent(serviceSlug)}&origen=${encodeURIComponent(origin)}&resumen=${encodeURIComponent(summary)}`;
  const freeHref = `/consulta-gratuita?servicio=${encodeURIComponent(serviceSlug)}&origen=${encodeURIComponent(origin)}`;

  const [kind, ...slugParts] = origin.split(':');
  const sourceKind: 'docs' | 'blog' | 'service' = kind === 'docs' || kind === 'blog' ? kind : 'service';
  const sourceSlug = slugParts.join(':') || serviceSlug;

  return (
    <div className={compact ? 'border border-[#D4A017]/25 bg-[#F8F6F1] p-5' : 'border border-[#D4A017]/25 bg-white p-6'}>
      <div className="flex items-start gap-3">
        <Calculator className="mt-0.5 h-5 w-5 shrink-0 text-[#D4A017]" />
        <div>
          <h3 className="font-serif text-xl font-bold text-[#0D1B2A]">Calcula el precio</h3>
          <p className="mt-1 text-sm leading-6 text-[#52606D]">
            {config.unitPrice.toLocaleString('es-ES', { minimumFractionDigits: 2 })} € + IVA por {config.unitLabel}.
            {min > 1 ? ` Pedido mínimo: ${min} ${config.unitLabelPlural ?? `${config.unitLabel}s`}.` : ''}
          </p>
        </div>
      </div>

      <label className="mt-5 block text-xs font-bold uppercase tracking-wide text-[#23364D]">
        Número de {config.unitLabelPlural ?? `${config.unitLabel}s`}
        <input
          type="number"
          min={min}
          max={max}
          inputMode="numeric"
          value={units}
          onChange={(event) => {
            const value = Number.parseInt(event.target.value, 10);
            setUnits(Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min);
          }}
          className="mt-1 w-full border border-[#D4A017]/30 bg-white px-3 py-2 text-sm text-[#0D1B2A]"
        />
      </label>

      {config.note && <p className="mt-2 text-xs leading-5 text-[#6B7280]">{config.note}</p>}

      <div className="mt-5 border-t border-[#D4A017]/20 pt-5">
        <p className="text-xs uppercase tracking-wider text-[#6B7280]">Precio calculado</p>
        <p className="mt-1 text-2xl font-bold text-[#0D1B2A]">
          {net.toLocaleString('es-ES', { minimumFractionDigits: 2 })} € + IVA
        </p>
        <p className="mt-1 text-sm text-[#52606D]">
          Total con IVA: {total.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href={requestHref}
          onClick={() => trackPublicContentIntent({ intent: 'service', source_kind: sourceKind, source_slug: sourceSlug, service_slug: serviceSlug })}
          className="inline-flex min-h-11 items-center justify-center bg-[#D4A017] px-5 py-2.5 text-sm font-bold text-[#0D1B2A] hover:bg-[#F2C14E]"
        >
          Solicitar con este precio
        </Link>
        <Link
          href={freeHref}
          onClick={() => trackPublicContentIntent({ intent: 'free_consultation', source_kind: sourceKind, source_slug: sourceSlug, service_slug: serviceSlug })}
          className="inline-flex min-h-11 items-center justify-center border border-[#D4A017]/50 px-5 py-2.5 text-sm font-semibold text-[#0D1B2A]"
        >
          Consulta gratuita
        </Link>
      </div>
    </div>
  );
}
