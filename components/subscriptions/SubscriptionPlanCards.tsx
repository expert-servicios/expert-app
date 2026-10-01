'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, CreditCard, FileText, Gift } from 'lucide-react';

type BillingMode = 'mensual' | 'anual';

interface PlanData {
  slug          : string;
  name          : string;
  tagline       : string;
  monthlyPrice  : string;
  annualTotal   : string;
  annualMonthly : string;
  monthlyPriceId: string;
  annualPriceId : string;
  highlighted   : boolean;
  features      : string[];
  isQuote       : boolean;
}

interface Props {
  planSupervisionMonthlyId  : string;
  planAvanzadoMonthlyId     : string;
  planColaborativoMonthlyId : string;
  planSupervisionAnnualId   : string;
  planAvanzadoAnnualId      : string;
  planColaborativoAnnualId  : string;
  initialBilling            : BillingMode;
  companyId                 : string;
}

const FEATURES_SUPERVISION = [
  'Plataforma EXPERT + Kia básico',
  'Revisión mensual básica de Holded',
  'Preparación y presentación de impuestos periódicos básicos si corresponde',
  'Autónomos: reunión mensual de 30 min incluida',
  'Alertas básicas de errores y anomalías',
  'Revisión de facturas y categorías principales',
  'Resumen mensual generado por Kia',
  'Estado de empresa básico',
  'Soporte por email y WhatsApp',
  'Licencia Holded obligatoria (no incluida)',
];

const FEATURES_AVANZADO = [
  'Plataforma EXPERT + Kia fiscal',
  'Onboarding inicial de 60 min incluido',
  'Revisión mensual de Holded',
  'Reunión mensual: 60 min por sociedad / 30 min por autónomo',
  'Impuestos trimestrales básicos si aplica',
  'Revisión de cierre trimestral',
  'Calendario fiscal y alertas Kia',
  'Estado de empresa completo',
  'Renta anual sencilla del titular autónomo según alcance',
  'Soporte 48 h',
  'Licencia Holded obligatoria (no incluida)',
];

const FEATURES_COLABORATIVO = [
  'Plataforma EXPERT + Kia avanzado',
  'Tú subes facturas o las organizas en Holded',
  'EXPERT revisa y valida mensualmente',
  'Preparación y presentación de impuestos periódicos según alcance',
  'Informe mensual',
  'Alertas Kia de anomalías',
  'Estado de empresa completo',
  'Soporte prioritario — 24 h',
  'Licencia Holded obligatoria (no incluida)',
];

const FEATURES_PERSONALIZADO = [
  'Plataforma EXPERT + Kia premium',
  'Contabilidad y fiscalidad completa',
  'Gestión laboral y nóminas (si aplica)',
  'Trámites de extranjería',
  'Asesoramiento fiscal estratégico',
  'Precio ajustado a tu volumen real',
];

function PlanCard({ plan, billing, companyId }: { plan: PlanData; billing: BillingMode; companyId: string }) {
  const priceId = billing === 'anual' ? plan.annualPriceId : plan.monthlyPriceId;
  const isAnnual = billing === 'anual';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCta() {
    if (plan.isQuote || !priceId || loading) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ priceId, companyId }),
      });
      const data = await response.json().catch(() => ({})) as { url?: string; error?: string };
      if (!response.ok || !data.url) throw new Error(data.error ?? 'No se pudo iniciar la contratación.');
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar la contratación.');
      setLoading(false);
    }
  }

  return (
    <div className={`relative flex flex-col rounded-3xl border p-6 ${
      plan.highlighted
        ? 'border-[#d7a33a] bg-white shadow-[0_8px_32px_rgba(212,160,23,0.18)]'
        : 'border-[#d8cbb5] bg-[#f8f4eb]'
    }`}>
      {plan.highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#d7a33a] px-4 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#07111d]">
          Más popular
        </span>
      )}

      <p className="text-sm uppercase tracking-[0.2em] text-[#c88b25]">{plan.name}</p>
      <p className="mt-0.5 text-xs text-[#29384a]">{plan.tagline}</p>

      {isAnnual ? (
        <div className="mt-3">
          <span className="inline-block rounded-full bg-[#c88b25] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
            2 meses gratis
          </span>
          <p className="mt-1 font-serif text-3xl font-bold text-[#07111d]">{plan.annualTotal}</p>
          <p className="text-xs text-[#6b7280]">≈ {plan.annualMonthly}/mes · antes {plan.monthlyPrice}</p>
        </div>
      ) : (
        <p className="mt-3 font-serif text-3xl font-bold text-[#07111d]">{plan.monthlyPrice}</p>
      )}

      <ul className="mt-4 flex-1 space-y-2">
        {plan.features.map((feature) => (
          <li key={feature} className={`flex items-start gap-2 text-xs ${
            feature.includes('obligatoria')
              ? 'font-semibold text-[#c88b25]'
              : feature.includes('Plataforma EXPERT')
                ? 'font-bold text-[#07111d]'
                : 'text-[#29384a]'
          }`}>
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#c88b25]" />
            {feature}
          </li>
        ))}
      </ul>

      <div className="mt-6">
        {plan.isQuote ? (
          <Link
            href="/solicitar-presupuesto?servicio=plan-personalizado"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#07111d] px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:bg-[#1a2d40]"
          >
            <FileText className="h-4 w-4" />
            Solicitar presupuesto
          </Link>
        ) : (
          <>
            <button
              type="button"
              onClick={handleCta}
              disabled={!priceId || loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#c88b25] px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-[#061321] transition hover:bg-[#b57a1e] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CreditCard className="h-4 w-4" />
              {loading ? 'Preparando alta…' : isAnnual ? 'Formalizar plan anual' : 'Formalizar suscripción'}
            </button>
            {error ? <p className="mt-2 text-center text-xs text-red-700">{error}</p> : null}
          </>
        )}

        {!plan.isQuote && (
          <div className="mt-3 space-y-1 text-center text-[10px]">
            <Link href={`/planes/${plan.slug}`} className="block font-semibold text-[#29384a] transition hover:text-[#c88b25]">
              Ver qué incluye y qué no incluye
            </Link>
            <Link href="/cita?tipo=demo-holded" className="block text-[#c88b25] transition hover:underline">
              <Gift className="mr-1 inline-block h-3 w-3" />
              Reservar demo Holded gratuita
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export function SubscriptionPlanCards({
  planSupervisionMonthlyId,
  planAvanzadoMonthlyId,
  planColaborativoMonthlyId,
  planSupervisionAnnualId,
  planAvanzadoAnnualId,
  planColaborativoAnnualId,
  initialBilling,
  companyId,
}: Props) {
  const [billing, setBilling] = useState<BillingMode>(initialBilling);

  const plans: PlanData[] = [
    {
      slug: 'supervision', name: 'Plan Supervisión', tagline: 'Tú llevas Holded, Kia y EXPERT supervisan',
      monthlyPrice: '49 €/mes + IVA', annualTotal: '490 €/año + IVA', annualMonthly: '40,83 €',
      monthlyPriceId: planSupervisionMonthlyId, annualPriceId: planSupervisionAnnualId,
      highlighted: false, features: FEATURES_SUPERVISION, isQuote: false,
    },
    {
      slug: 'avanzado', name: 'Plan Avanzado', tagline: 'Revisión + impuestos básicos',
      monthlyPrice: '99 €/mes + IVA', annualTotal: '990 €/año + IVA', annualMonthly: '82,50 €',
      monthlyPriceId: planAvanzadoMonthlyId, annualPriceId: planAvanzadoAnnualId,
      highlighted: false, features: FEATURES_AVANZADO, isQuote: false,
    },
    {
      slug: 'colaborativo', name: 'Plan Colaborativo', tagline: 'Tú organizas, EXPERT revisa y valida',
      monthlyPrice: '199 €/mes + IVA', annualTotal: '1.990 €/año + IVA', annualMonthly: '165,83 €',
      monthlyPriceId: planColaborativoMonthlyId, annualPriceId: planColaborativoAnnualId,
      highlighted: true, features: FEATURES_COLABORATIVO, isQuote: false,
    },
    {
      slug: 'personalizado', name: 'Plan Personalizado', tagline: 'Gestión avanzada a medida',
      monthlyPrice: 'Consultar', annualTotal: 'Consultar', annualMonthly: '',
      monthlyPriceId: '', annualPriceId: '',
      highlighted: false, features: FEATURES_PERSONALIZADO, isQuote: true,
    },
  ];

  return (
    <>
      <div className="mb-8 flex justify-center">
        <div className="flex items-center gap-1 rounded-full border border-[#d8cbb5] bg-[#f8f4eb] p-1">
          <button
            type="button"
            onClick={() => setBilling('mensual')}
            className={`rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wide transition ${
              billing === 'mensual'
                ? 'bg-[#07111d] text-white'
                : 'text-[#6b7280] hover:text-[#07111d]'
            }`}
          >
            Mensual
          </button>
          <button
            type="button"
            onClick={() => setBilling('anual')}
            className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wide transition ${
              billing === 'anual'
                ? 'bg-[#c88b25] text-[#07111d]'
                : 'text-[#6b7280] hover:text-[#07111d]'
            }`}
          >
            <Gift className="h-3 w-3" />
            Anual — 2 meses gratis
          </button>
        </div>
      </div>

      {billing === 'anual' && (
        <p className="mb-6 text-center text-xs text-[#6b7280]">
          Pago único anual equivalente a 10 mensualidades. 2 meses de regalo.
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => (
          <PlanCard key={plan.slug} plan={plan} billing={billing} companyId={companyId} />
        ))}
      </div>
    </>
  );
}
