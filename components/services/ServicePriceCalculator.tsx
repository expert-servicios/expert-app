'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Calculator } from 'lucide-react';
import { IrnrPriceCalculator } from '@/components/services/IrnrPriceCalculator';
import { trackPublicContentIntent } from '@/lib/utils/analytics';

export type ServicePriceCalculatorKind = 'irnr' | 'irpf' | 'patrimonio';

type Props = {
  kind: ServicePriceCalculatorKind;
  compact?: boolean;
  origin: string;
};

function money(value: number) {
  return value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function sourceFromOrigin(origin: string) {
  const [originKind, ...originSlugParts] = origin.split(':');
  const sourceKind: 'docs' | 'blog' | 'service' =
    originKind === 'docs' || originKind === 'blog' ? originKind : 'service';
  return { sourceKind, sourceSlug: originSlugParts.join(':') || 'servicio' };
}

function CalculatorShell({
  compact,
  title,
  description,
  children,
}: {
  compact: boolean;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className={compact ? 'border border-[#D4A017]/25 bg-[#F8F6F1] p-5' : 'border border-[#D4A017]/25 bg-white p-6'}>
      <div className="flex items-start gap-3">
        <Calculator className="mt-0.5 h-5 w-5 shrink-0 text-[#D4A017]" />
        <div>
          <h3 className="font-serif text-xl font-bold text-[#0D1B2A]">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-[#52606D]">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function IrpfPriceCalculator({ compact = false, origin }: Omit<Props, 'kind'>) {
  const [filing, setFiling] = useState<'individual' | 'joint'>('individual');
  const [capitalOrRentals, setCapitalOrRentals] = useState(false);

  const net = capitalOrRentals ? 200 : filing === 'joint' ? 150 : 120;
  const total = Math.round(net * 1.21 * 100) / 100;
  const summary = [
    'Calculadora IRPF',
    filing === 'joint' ? 'declaración conjunta' : 'declaración individual',
    capitalOrRentals ? 'con alquileres/rendimientos de capital' : 'sin bloque adicional de alquileres/capital',
    `honorarios calculados: ${net} EUR + IVA`,
  ].join('; ');
  const requestHref = `/solicitar-presupuesto?servicio=irpf&origen=${encodeURIComponent(origin)}&resumen=${encodeURIComponent(summary)}`;
  const freeQuestionHref = `/consulta-gratuita?servicio=irpf&origen=${encodeURIComponent(origin)}`;
  const { sourceKind, sourceSlug } = sourceFromOrigin(origin);

  return (
    <CalculatorShell
      compact={compact}
      title="Calculadora · Declaración de la Renta"
      description="Calcula los honorarios según el tipo de declaración y si existe el bloque adicional de alquileres o rendimientos de capital."
    >
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="border border-[#0D1B2A]/10 bg-white p-4 text-sm text-[#23364D]">
          <span className="block text-xs font-bold uppercase tracking-wide text-[#0D1B2A]">Modalidad</span>
          <select
            value={filing}
            onChange={(event) => setFiling(event.target.value as 'individual' | 'joint')}
            className="mt-2 w-full border border-[#D4A017]/30 bg-white px-3 py-2"
          >
            <option value="individual">Individual · 120 € + IVA</option>
            <option value="joint">Conjunta · 150 € + IVA</option>
          </select>
        </label>
        <label className="flex cursor-pointer items-start gap-3 border border-[#0D1B2A]/10 bg-white p-4 text-sm text-[#23364D]">
          <input
            type="checkbox"
            checked={capitalOrRentals}
            onChange={(event) => setCapitalOrRentals(event.target.checked)}
            className="mt-1 h-4 w-4 accent-[#D4A017]"
          />
          <span>
            <span className="block font-bold text-[#0D1B2A]">Alquileres o rendimientos de capital</span>
            <span className="mt-1 block text-xs leading-5 text-[#6B7280]">
              Activa la tarifa de 200 € + IVA para la declaración con este bloque adicional.
            </span>
          </span>
        </label>
      </div>

      <div className="mt-5 border-t border-[#D4A017]/20 pt-5">
        <p className="text-xs uppercase tracking-wider text-[#6B7280]">Precio calculado</p>
        <p className="mt-1 text-2xl font-bold text-[#0D1B2A]">{money(net)} € + IVA</p>
        <p className="mt-1 text-sm text-[#52606D]">Total con IVA: {money(total)} €</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href={requestHref}
          onClick={() => trackPublicContentIntent({ intent: 'service', source_kind: sourceKind, source_slug: sourceSlug, service_slug: 'irpf' })}
          className="inline-flex min-h-11 items-center justify-center bg-[#D4A017] px-5 py-2.5 text-sm font-bold text-[#0D1B2A] hover:bg-[#F2C14E]"
        >
          Solicitar con este precio
        </Link>
        <Link
          href={freeQuestionHref}
          onClick={() => trackPublicContentIntent({ intent: 'free_consultation', source_kind: sourceKind, source_slug: sourceSlug, service_slug: 'irpf' })}
          className="inline-flex min-h-11 items-center justify-center border border-[#D4A017]/50 px-5 py-2.5 text-sm font-semibold text-[#0D1B2A]"
        >
          Consulta gratuita
        </Link>
      </div>
    </CalculatorShell>
  );
}

function PatrimonioPriceCalculator({ compact = false, origin }: Omit<Props, 'kind'>) {
  const [declarations, setDeclarations] = useState(1);
  const [complex, setComplex] = useState(false);

  const net = useMemo(() => declarations * 250, [declarations]);
  const total = Math.round(net * 1.21 * 100) / 100;
  const summary = [
    'Calculadora Impuesto sobre el Patrimonio',
    `declaraciones/titulares: ${declarations}`,
    complex ? 'estructura patrimonial compleja: requiere revisión previa' : 'estructura estándar',
    complex ? 'precio sujeto a revisión' : `honorarios calculados: ${net} EUR + IVA`,
  ].join('; ');
  const requestHref = `/solicitar-presupuesto?servicio=impuesto-patrimonio&origen=${encodeURIComponent(origin)}&resumen=${encodeURIComponent(summary)}`;
  const freeQuestionHref = `/consulta-gratuita?servicio=impuesto-patrimonio&origen=${encodeURIComponent(origin)}`;
  const { sourceKind, sourceSlug } = sourceFromOrigin(origin);

  return (
    <CalculatorShell
      compact={compact}
      title="Calculadora · Impuesto sobre el Patrimonio"
      description="La declaración estándar parte de 250 € + IVA por titular. Si hay una estructura patrimonial que requiere valoración especial, KIA deriva el caso a revisión antes de cerrar precio."
    >
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="border border-[#0D1B2A]/10 bg-white p-4 text-sm text-[#23364D]">
          <span className="block text-xs font-bold uppercase tracking-wide text-[#0D1B2A]">Número de declaraciones</span>
          <input
            type="number"
            min={1}
            max={20}
            inputMode="numeric"
            value={declarations}
            onChange={(event) => {
              const value = Number.parseInt(event.target.value, 10);
              setDeclarations(Number.isFinite(value) ? Math.min(20, Math.max(1, value)) : 1);
            }}
            className="mt-2 w-full border border-[#D4A017]/30 bg-white px-3 py-2"
          />
          <span className="mt-1 block text-xs text-[#6B7280]">250 € + IVA por declaración estándar.</span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 border border-[#0D1B2A]/10 bg-white p-4 text-sm text-[#23364D]">
          <input
            type="checkbox"
            checked={complex}
            onChange={(event) => setComplex(event.target.checked)}
            className="mt-1 h-4 w-4 accent-[#D4A017]"
          />
          <span>
            <span className="block font-bold text-[#0D1B2A]">Necesito valoración especial</span>
            <span className="mt-1 block text-xs leading-5 text-[#6B7280]">
              Por ejemplo: sociedades no cotizadas, usufructo/nuda propiedad, bienes en el extranjero o dudas de valoración.
            </span>
          </span>
        </label>
      </div>

      <div className="mt-5 border-t border-[#D4A017]/20 pt-5">
        <p className="text-xs uppercase tracking-wider text-[#6B7280]">{complex ? 'Siguiente paso' : 'Precio calculado'}</p>
        {complex ? (
          <>
            <p className="mt-1 text-xl font-bold text-[#0D1B2A]">Revisión previa gratuita</p>
            <p className="mt-1 text-sm leading-6 text-[#52606D]">
              No cerramos un precio automático cuando la valoración puede alterar de forma material el trabajo.
            </p>
          </>
        ) : (
          <>
            <p className="mt-1 text-2xl font-bold text-[#0D1B2A]">{money(net)} € + IVA</p>
            <p className="mt-1 text-sm text-[#52606D]">Total con IVA: {money(total)} €</p>
          </>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href={requestHref}
          onClick={() => trackPublicContentIntent({ intent: 'service', source_kind: sourceKind, source_slug: sourceSlug, service_slug: 'impuesto-patrimonio' })}
          className="inline-flex min-h-11 items-center justify-center bg-[#D4A017] px-5 py-2.5 text-sm font-bold text-[#0D1B2A] hover:bg-[#F2C14E]"
        >
          {complex ? 'Solicitar revisión' : 'Solicitar con este precio'}
        </Link>
        <Link
          href={freeQuestionHref}
          onClick={() => trackPublicContentIntent({ intent: 'free_consultation', source_kind: sourceKind, source_slug: sourceSlug, service_slug: 'impuesto-patrimonio' })}
          className="inline-flex min-h-11 items-center justify-center border border-[#D4A017]/50 px-5 py-2.5 text-sm font-semibold text-[#0D1B2A]"
        >
          Consulta gratuita
        </Link>
      </div>
    </CalculatorShell>
  );
}

export function ServicePriceCalculator({ kind, compact = false, origin }: Props) {
  if (kind === 'irnr') {
    return <IrnrPriceCalculator compact={compact} origin={origin} />;
  }
  if (kind === 'irpf') {
    return <IrpfPriceCalculator compact={compact} origin={origin} />;
  }
  return <PatrimonioPriceCalculator compact={compact} origin={origin} />;
}
