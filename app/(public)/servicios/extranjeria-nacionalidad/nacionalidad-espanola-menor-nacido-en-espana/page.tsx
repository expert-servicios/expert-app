import Link from 'next/link';
import type { Metadata } from 'next';
import { Check, FileText, ShieldCheck, AlertCircle } from 'lucide-react';
import { AddToCartButton } from '@/components/services/AddToCartButton';
import { NATIONALITY_MINOR_SERVICE } from '@/lib/services/nationality-minor';

const SERVICE_URL = 'https://expertconsulting.es/servicios/extranjeria-nacionalidad/nacionalidad-espanola-menor-nacido-en-espana';
const CART_ITEM = {
  priceId     : NATIONALITY_MINOR_SERVICE.stripePriceId,
  name        : 'Nacionalidad española para menor nacido en España',
  displayPrice: '302,50 € honorarios + 104,05 € tasa',
  slug        : NATIONALITY_MINOR_SERVICE.slug,
  category    : 'extranjeria-nacionalidad',
  disbursements: [NATIONALITY_MINOR_SERVICE.disbursementKey],
  disbursementNotice:
    'Incluye tasa obligatoria Ministerio de Justicia 790-026: 104,05 € como suplido separado de los honorarios.',
};

export const metadata: Metadata = {
  title: 'Nacionalidad española para menor nacido en España | EXPERT',
  description:
    'Servicio completo de preparación y presentación de nacionalidad española para menor nacido en España. Honorarios 302,50 € IVA incluido + tasa 790-026 de 104,05 € como suplido obligatorio.',
  alternates: {
    canonical: SERVICE_URL,
  },
  openGraph: {
    title: 'Nacionalidad española para menor nacido en España | EXPERT',
    description:
      'Honorarios 302,50 € IVA incluido + tasa 790-026 de 104,05 € como suplido obligatorio.',
    url: SERVICE_URL,
    type: 'website',
  },
};

const includedItems = [
  'Revisión previa de viabilidad del caso.',
  'Comprobación del plazo de 1 año de residencia legal del menor.',
  'Revisión de NIE/TIE, pasaportes, certificado de nacimiento, empadronamiento y documentación familiar.',
  'Preparación del expediente documental y formularios oficiales.',
  'Gestión del pago de la tasa administrativa 790-026 como suplido, con justificante a nombre de la menor solicitante.',
  'Presentación telemática ante el Ministerio de Justicia, cuando proceda.',
  'Entrega del justificante de presentación y número de expediente.',
  'Seguimiento básico inicial del expediente y orientación sobre requerimientos ordinarios.',
];

const documentGroups = [
  {
    title: 'Documentación del menor',
    items: [
      'Certificación literal de nacimiento española expedida por el Registro Civil.',
      'Pasaporte completo y en vigor, con copia de todas las páginas.',
      'NIE/TIE o documento acreditativo de residencia legal en España.',
      'Tarjeta de residencia anterior, si existe.',
      'Resolución inicial de concesión de residencia o protección temporal, si existe.',
      'Certificado de empadronamiento familiar o colectivo actualizado.',
      'Certificado del centro escolar o educativo cuando corresponda por la edad y escolarización del menor.',
    ],
  },
  {
    title: 'Documentación de los progenitores',
    items: [
      'Pasaporte completo y en vigor de ambos progenitores.',
      'NIE/TIE de ambos progenitores por ambas caras.',
      'Certificado de empadronamiento familiar, si no se aporta por separado.',
      'Datos de contacto: teléfono, correo electrónico y domicilio actual.',
      'Firmas y asistencia de los representantes legales según la edad del menor y la patria potestad.',
      'Documentación adicional si solo uno de los progenitores puede firmar.',
    ],
  },
];

const processSteps = [
  {
    title: 'Contratación y mandato de suplido',
    text:
      'Al contratar el servicio se pagan los honorarios profesionales y la tasa oficial obligatoria. La tasa 790-026 se cobra como suplido para abonarla en nombre y por cuenta del cliente.',
  },
  {
    title: 'Envío de documentación',
    text: 'Después del pago, EXPERT abre el expediente y la documentación se carga en el área privada segura; WhatsApp queda para consultas y coordinación.',
  },
  {
    title: 'Revisión de viabilidad',
    text: 'Comprobamos el requisito de 1 año de residencia legal, continuidad y documentación disponible.',
  },
  {
    title: 'Preparación y presentación',
    text: 'Preparamos la solicitud, formularios y documentación digitalizada, y presentamos el expediente cuando proceda.',
  },
  {
    title: 'Justificante y seguimiento inicial',
    text: 'Entregamos el justificante de presentación, el número de expediente y una primera orientación de seguimiento.',
  },
];

const notIncludedItems = [
  'Traducciones juradas, si fueran necesarias.',
  'Apostillas o legalizaciones, si fueran necesarias.',
  'Certificados oficiales adicionales que deban solicitarse aparte.',
  'Actuaciones extraordinarias por requerimientos complejos.',
  'Recursos administrativos o judiciales en caso de denegación.',
  'Trámites posteriores no incluidos expresamente.',
];

const faqItems = [
  {
    q: '¿La tasa está incluida en el precio?',
    a:
      'Sí. Al contratar este servicio se cobran los honorarios profesionales y, además, la tasa oficial 790-026 de 104,05 € como suplido. La tasa no forma parte de nuestros honorarios ni de la base imponible del servicio; se abona en nombre y por cuenta del cliente.',
  },
  {
    q: '¿Mi hijo obtiene la nacionalidad automáticamente por haber nacido en España?',
    a:
      'No. Nacer en España puede reducir el plazo exigido para solicitar la nacionalidad por residencia a 1 año, pero no concede automáticamente la nacionalidad española en todos los casos.',
  },
  {
    q: '¿Cuándo se puede presentar la solicitud?',
    a:
      'Cuando el menor haya cumplido 1 año de residencia legal, continuada e inmediatamente anterior a la solicitud.',
  },
  {
    q: '¿Pueden pagar ustedes la tasa por mí?',
    a:
      'Sí. En este servicio la tasa se incluye al contratar como suplido obligatorio, previa autorización del cliente, y se abona a nombre de la menor solicitante.',
  },
  {
    q: '¿Tienen que firmar los dos progenitores?',
    a:
      'En menores de 14 años actúan los representantes legales. Si ambos ejercen la patria potestad y existe acuerdo, deben intervenir conforme al modelo aplicable; si no existe acuerdo, revisamos la resolución de jurisdicción voluntaria necesaria. Entre 14 y 17 años, el menor formula la solicitud asistido por sus representantes legales.',
  },
  {
    q: '¿El menor tiene que hacer CCSE o DELE?',
    a:
      'No. Los menores de edad están exentos de la prueba CCSE y los menores de 18 años están exentos del DELE A2 a efectos de nacionalidad por residencia. Revisamos la documentación educativa que corresponda para acreditar integración.',
  },
];

export default function NacionalidadMenorPage() {
  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Nacionalidad española para menor nacido en España',
    description:
      'Servicio completo de preparación y presentación de nacionalidad española para menor nacido en España. Honorarios 302,50 € IVA incluido + tasa 790-026 de 104,05 € como suplido obligatorio.',
    serviceType: 'Extranjería y Nacionalidad',
    provider: {
      '@type': 'Organization',
      name: 'EXPERT',
    },
    areaServed: {
      '@type': 'Country',
      name: 'España',
    },
    url: SERVICE_URL,
    offers: {
      '@type': 'Offer',
      price: '406.55',
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      url: SERVICE_URL,
    },
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: a,
      },
    })),
  };

  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <section className="bg-[#0D1B2A] px-6 py-12 text-[#F8F6F1] md:py-16">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/servicios/extranjeria-nacionalidad"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.24em] text-[#D4A017] hover:text-[#F2C14E]"
          >
            ← Extranjería y Nacionalidad
          </Link>
          <h1 className="mt-4 font-serif text-3xl font-bold leading-tight md:text-4xl lg:text-5xl">
            Nacionalidad española para menor nacido en España
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/65">
            Preparación y presentación de solicitud de nacionalidad española por residencia para menores nacidos en España.
            Revisamos residencia legal, continuidad, documentación familiar y requisitos de firma de los representantes legales.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="border border-white/12 bg-white/5 p-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4A017]">Honorarios</p>
              <p className="mt-2 text-2xl font-bold text-white">302,50 €</p>
              <p className="mt-1 text-xs leading-5 text-white/55">250 € + IVA 21 %</p>
            </div>
            <div className="border border-white/12 bg-white/5 p-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4A017]">Tasa obligatoria</p>
              <p className="mt-2 text-2xl font-bold text-white">104,05 €</p>
              <p className="mt-1 text-xs leading-5 text-white/55">Modelo 790-026 como suplido</p>
            </div>
            <div className="border border-[#D4A017]/50 bg-[#D4A017]/10 p-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4A017]">Total a pagar</p>
              <p className="mt-2 text-2xl font-bold text-white">406,55 €</p>
              <p className="mt-1 text-xs leading-5 text-white/55">Pago online seguro</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <AddToCartButton
              item={CART_ITEM}
              label="Contratar — 302,50 € + tasa 104,05 €"
              className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#D4A017] px-8 py-3 text-sm font-bold text-[#0D1B2A] shadow-lg shadow-[#D4A017]/20 transition hover:bg-[#F2C14E] disabled:cursor-not-allowed disabled:opacity-60"
            />
            <Link
              href="/solicitar-presupuesto?servicio=nacionalidad-espanola-menor-nacido-en-espana&tipo=caso-complejo"
              className="inline-flex min-h-12 items-center justify-center border border-[#D4A017] px-8 py-3 text-sm font-semibold text-[#D4A017] transition hover:bg-[#D4A017] hover:text-[#0D1B2A]"
            >
              Caso complejo
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-10 px-6 py-12 lg:grid-cols-[1fr_320px] lg:items-start md:py-16">
        <div className="space-y-10">
          <div className="border border-[#D4A017]/25 bg-white p-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-[#D4A017]" />
              <div>
                <h2 className="font-serif text-2xl font-bold text-[#0D1B2A]">Tasa incluida como suplido obligatorio</h2>
                <p className="mt-3 text-sm leading-7 text-[#23364D]">
                  Al aceptar el servicio, el cliente paga los honorarios profesionales y autoriza a EXPERT a abonar la tasa oficial 790-026 en nombre de la menor solicitante. La tasa se cobra por su importe exacto como suplido y queda separada de la base de honorarios.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-serif text-2xl font-bold text-[#0D1B2A]">¿Qué incluye?</h2>
            <ul className="mt-5 space-y-3">
              {includedItems.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#D4A017]" strokeWidth={2.5} />
                  <span className="text-[15px] leading-6 text-[#23364D]">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-serif text-2xl font-bold text-[#0D1B2A]">Documentación necesaria</h2>
            <div className="mt-5 grid gap-4">
              {documentGroups.map((group) => (
                <div key={group.title} className="border border-[#D4A017]/20 bg-white p-5">
                  <div className="flex items-center gap-2.5">
                    <FileText className="h-4 w-4 text-[#D4A017]" />
                    <h3 className="font-semibold text-[#0D1B2A]">{group.title}</h3>
                  </div>
                  <ul className="mt-4 space-y-2.5">
                    {group.items.map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A017]" strokeWidth={2.5} />
                        <span className="text-sm leading-6 text-[#23364D]">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-serif text-2xl font-bold text-[#0D1B2A]">Cómo funciona el proceso</h2>
            <ol className="mt-6 space-y-4">
              {processSteps.map((step, index) => (
                <li key={step.title} className="grid grid-cols-[40px_1fr] gap-4">
                  <span className="flex h-10 w-10 items-center justify-center bg-[#D4A017] text-sm font-bold text-[#0D1B2A]">
                    {index + 1}
                  </span>
                  <div className="pt-1">
                    <h3 className="font-semibold text-[#0D1B2A]">{step.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-[#23364D]">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="border border-amber-200 bg-amber-50/60 p-5">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-amber-700">No incluido</p>
            <ul className="space-y-2.5">
              {notIncludedItems.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <span className="text-sm leading-5 text-[#23364D]">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-serif text-2xl font-bold text-[#0D1B2A]">Preguntas frecuentes</h2>
            <div className="mt-6 space-y-5">
              {faqItems.map(({ q, a }) => (
                <div key={q} className="border-l-2 border-[#D4A017] pl-5">
                  <p className="font-semibold text-[#0D1B2A]">{q}</p>
                  <p className="mt-2 text-sm leading-6 text-[#23364D]">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-6">
          <div className="overflow-hidden border border-[#D4A017]/30 bg-white">
            <div className="border-b border-[#D4A017]/20 bg-[#D4A017]/8 px-6 py-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#D4A017]">Precio final</p>
              <p className="mt-1 text-2xl font-bold text-[#0D1B2A]">406,55 €</p>
              <p className="mt-2 text-xs leading-5 text-[#23364D]/65">
                302,50 € de honorarios con IVA + 104,05 € de tasa 790-026 como suplido obligatorio.
              </p>
            </div>
            <div className="space-y-3 px-6 py-5">
              <AddToCartButton
                item={CART_ITEM}
                label="Añadir a la cesta"
                className="inline-flex w-full min-h-11 items-center justify-center gap-2 bg-[#D4A017] px-4 py-2.5 text-sm font-bold text-[#0D1B2A] shadow-md shadow-[#D4A017]/20 transition hover:bg-[#F2C14E] disabled:opacity-60"
              />
              <a
                href="https://wa.me/34669045528"
                className="block w-full border border-[#D4A017]/30 px-4 py-2.5 text-center text-sm font-semibold text-[#23364D] transition hover:border-[#D4A017] hover:bg-[#D4A017]/5"
              >
                Preguntar por WhatsApp
              </a>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
