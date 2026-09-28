'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { CalendarDays, FileQuestion, Send, MessageCircle } from 'lucide-react';
import { trackPublicContentIntent } from '@/lib/utils/analytics';

const ServicePriceCalculator = dynamic(
  () => import('@/components/services/ServicePriceCalculator').then((module) => module.ServicePriceCalculator),
);

type ResolvedService = {
  slug: string;
  categoria: string;
  name: string;
  hasCheckout: boolean;
  priceCalculator?: 'irnr' | 'irpf' | 'patrimonio';
};

type Props = {
  sourceKind: 'docs' | 'blog';
  sourceSlug: string;
  relatedServiceSlugs?: string[];
  service?: ResolvedService | null;
};

export function ArticleIntentCTA({ sourceKind, sourceSlug, relatedServiceSlugs = [], service = null }: Props) {
  const primaryServiceSlug = service?.slug ?? relatedServiceSlugs[0] ?? null;
  const origin = `${sourceKind}:${sourceSlug}`;
  const serviceHref = service?.hasCheckout
    ? `/servicios/${service.categoria}/${service.slug}?origen=${encodeURIComponent(origin)}`
    : service
      ? `/solicitar-presupuesto?servicio=${encodeURIComponent(service.slug)}&origen=${encodeURIComponent(origin)}`
      : `/solicitar-presupuesto?origen=${encodeURIComponent(origin)}`;
  const consultationHref = `/consulta-gratuita?origen=${encodeURIComponent(origin)}${primaryServiceSlug ? `&servicio=${encodeURIComponent(primaryServiceSlug)}` : ''}`;
  const meetingHref = `/cita?tipo=consulta-inicial&origen=${encodeURIComponent(origin)}`;

  return (
    <section className="mt-10 border border-[#D4A017]/30 bg-white p-6 md:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4A017]">¿Qué quieres hacer ahora?</p>
      <h2 className="mt-2 font-serif text-2xl font-bold text-[#0D1B2A]">Elige el siguiente paso que te resulte más útil</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-[#23364D]">
        Puedes resolver una duda sin compromiso, solicitar directamente el servicio o hablar 15 minutos con EXPERT antes de decidir.
      </p>

      {service?.priceCalculator && (
        <div className="mt-6">
          <ServicePriceCalculator kind={service.priceCalculator} compact origin={origin} />
        </div>
      )}

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <Link
          href={consultationHref}
          onClick={() => trackPublicContentIntent({ intent: 'free_consultation', source_kind: sourceKind, source_slug: sourceSlug, service_slug: primaryServiceSlug ?? undefined })}
          className="flex min-h-28 flex-col justify-between border border-[#D4A017]/30 bg-[#F8F6F1] p-4 transition hover:border-[#D4A017]"
        >
          <FileQuestion className="h-5 w-5 text-[#D4A017]" />
          <div>
            <p className="font-bold text-[#0D1B2A]">Tengo una consulta</p>
            <p className="mt-1 text-xs leading-5 text-[#52606D]">Formulario gratuito. Nos ayuda a estudiar tu caso y también a detectar nuevas necesidades.</p>
          </div>
        </Link>

        <Link
          href={serviceHref}
          onClick={() => trackPublicContentIntent({ intent: 'service', source_kind: sourceKind, source_slug: sourceSlug, service_slug: primaryServiceSlug ?? undefined })}
          className="flex min-h-28 flex-col justify-between bg-[#D4A017] p-4 text-[#0D1B2A] transition hover:bg-[#F2C14E]"
        >
          <Send className="h-5 w-5" />
          <div>
            <p className="font-bold">{service ? 'Quiero este servicio' : 'Solicitar un servicio'}</p>
            <p className="mt-1 text-xs leading-5">{service ? service.name : 'Cuéntanos qué necesitas y te orientamos.'}</p>
          </div>
        </Link>

        <Link
          href={meetingHref}
          onClick={() => trackPublicContentIntent({ intent: 'meeting_15m', source_kind: sourceKind, source_slug: sourceSlug, service_slug: primaryServiceSlug ?? undefined })}
          className="flex min-h-28 flex-col justify-between border border-[#0D1B2A]/15 bg-white p-4 transition hover:border-[#D4A017]"
        >
          <CalendarDays className="h-5 w-5 text-[#D4A017]" />
          <div>
            <p className="font-bold text-[#0D1B2A]">Reunión informativa · 15 min</p>
            <p className="mt-1 text-xs leading-5 text-[#52606D]">Gratuita. Para confirmar el enfoque antes de contratar.</p>
          </div>
        </Link>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-[#52606D]">
        <span>También puedes hablar con KIA:</span>
        <Link href="/dashboard?kia=open" onClick={() => trackPublicContentIntent({ intent: 'kia_chat', source_kind: sourceKind, source_slug: sourceSlug, service_slug: primaryServiceSlug ?? undefined })} className="font-semibold text-[#D4A017] hover:underline">Chat</Link>
        <a href="https://t.me/kia_expert_bot" onClick={() => trackPublicContentIntent({ intent: 'telegram', source_kind: sourceKind, source_slug: sourceSlug, service_slug: primaryServiceSlug ?? undefined })} className="inline-flex items-center gap-1 font-semibold text-[#D4A017] hover:underline">
          <MessageCircle className="h-3.5 w-3.5" /> Telegram
        </a>
      </div>
    </section>
  );
}
