import type { Metadata } from 'next';
import Link from 'next/link';

const PAGE_URL = 'https://expertconsulting.es/docs/firmar-solicitud-nacionalidad-menor-progenitores';
const RU_URL = 'https://expertconsulting.es/ru/docs/podpisat-zayavlenie-grazhdanstvo-rebenka-roditeli';

export const metadata: Metadata = {
  title: 'Cómo firmar la solicitud de nacionalidad de un menor | EXPERT',
  description:
    'Guía práctica para saber dónde firman los progenitores en la solicitud de nacionalidad española por residencia de un menor y qué hacer con los bloques de representante legal y voluntario.',
  alternates: {
    canonical: PAGE_URL,
    languages: { 'es-ES': PAGE_URL, 'ru-RU': RU_URL, 'x-default': PAGE_URL }
  },
  openGraph: {
    type: 'article',
    title: 'Cómo firmar la solicitud de nacionalidad de un menor | EXPERT',
    description:
      'Dónde firman los progenitores y cómo corregir una firma colocada por error en el bloque de representante voluntario.',
    url: PAGE_URL
  }
};

export default function Page() {
  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      <section className="bg-[#0D1B2A] px-6 py-14 text-[#F8F6F1]">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#D4A017]">EXPERT Docs</p>
          <h1 className="mt-3 font-serif text-3xl font-bold leading-tight md:text-5xl">
            Cómo firmar la solicitud de nacionalidad de un menor
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[#D1D5DB]">
            Guía para evitar el error más frecuente en la página de firmas: colocar la segunda firma de uno de los progenitores en el bloque reservado al representante voluntario.
          </p>
          <div className="mt-6 text-sm text-[#D1D5DB]">
            <Link href={RU_URL} className="underline decoration-[#D4A017] underline-offset-4 hover:text-[#D4A017]">
              Русская версия
            </Link>
          </div>
        </div>
      </section>

      <article className="mx-auto max-w-4xl space-y-10 px-6 py-12">
        <section>
          <h2 className="font-serif text-2xl font-bold">Regla básica</h2>
          <p className="mt-4 leading-7 text-[#23364D]">
            Cuando el solicitante es menor de 14 años y ambos progenitores ejercen la patria potestad, la solicitud normalizada debe quedar firmada por ambos como <strong>representantes legales</strong>, salvo que exista una situación jurídica que permita actuar a uno solo y se acredite documentalmente.
          </p>
          <p className="mt-3 leading-7 text-[#23364D]">
            Si la solicitud se presenta electrónicamente, puede efectuar la presentación uno de los representantes, pero cuando existen varios representantes legales se adjunta el modelo normalizado firmado por todos los que deban intervenir.
          </p>
        </section>

        <section className="border-l-4 border-[#D4A017] bg-white p-5">
          <h2 className="font-serif text-2xl font-bold">Dónde debe firmar cada persona</h2>
          <ul className="mt-4 list-disc space-y-3 pl-6 leading-7 text-[#23364D]">
            <li>
              <strong>Padre y madre / progenitores:</strong> dentro del bloque <strong>«Representante legal (si procede)»</strong>.
            </li>
            <li>
              <strong>«Representante voluntario (si procede)»:</strong> no es el espacio para la segunda firma del progenitor. Está reservado a la persona que actúa por mandato o poder, por ejemplo un profesional autorizado.
            </li>
            <li>
              <strong>«Interesado»:</strong> en un menor de 14 años normalmente no corresponde la firma del menor. En mayores de 14 y menores de 18 no emancipados cambia la regla: firma también el interesado, asistido por sus representantes legales.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-bold">Si ambos progenitores firman a mano</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-6 leading-7 text-[#23364D]">
            <li>Imprime las páginas del modelo que deben firmarse.</li>
            <li>Comprueba primero que nombres, apellidos y demás datos sean correctos.</li>
            <li>Completa «Lugar y fecha» con el lugar real y la fecha de firma.</li>
            <li>Ambos progenitores firman dentro del recuadro de <strong>Representante legal</strong>.</li>
            <li>No utilices el recuadro de <strong>Representante voluntario</strong> para una de las firmas de los padres.</li>
            <li>Escanea el documento completo en un único PDF legible, sin cortar márgenes ni firmas.</li>
            <li>Conserva el original en papel hasta que el expediente quede presentado y revisado.</li>
          </ol>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-bold">Si una firma se puso en el recuadro equivocado</h2>
          <p className="mt-4 leading-7 text-[#23364D]">
            No conviene tachar, recortar ni mover una firma digitalmente. La opción más limpia es volver a imprimir la página de firmas y repetirla correctamente.
          </p>
          <ol className="mt-4 list-decimal space-y-3 pl-6 leading-7 text-[#23364D]">
            <li>Mantén el resto del formulario sin cambios.</li>
            <li>Repite únicamente la página afectada si los demás datos son correctos.</li>
            <li>Coloca las dos firmas de los progenitores en el bloque <strong>Representante legal</strong>.</li>
            <li>Deja el bloque <strong>Representante voluntario</strong> para que lo complete el representante autorizado si procede.</li>
            <li>Vuelve a generar un único PDF con todas las páginas en el orden original.</li>
          </ol>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-bold">Firma electrónica y firma mixta</h2>
          <p className="mt-4 leading-7 text-[#23364D]">
            En presentación telemática, la normativa permite que cuando un mismo documento requiera varias firmas una sea electrónica y las demás manuscritas y escaneadas en el propio documento.
          </p>
          <p className="mt-3 leading-7 text-[#23364D]">
            Si vais a firmar electrónicamente el PDF, utiliza siempre la última versión ya firmada: la segunda firma debe añadirse sobre el mismo archivo que contiene la primera.
          </p>
          <p className="mt-3 leading-7 text-[#23364D]">
            Consulta también la guía específica de AutoFirma:{' '}
            <Link href="/docs/firmar-pdf-certificado-digital-autofirma" className="underline decoration-[#D4A017] underline-offset-4">
              cómo firmar un PDF con certificado digital
            </Link>.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-bold">Casos en los que no deben firmar necesariamente ambos progenitores</h2>
          <p className="mt-4 leading-7 text-[#23364D]">
            Puede existir una regla distinta en familias monoparentales, pérdida o ejercicio individual de la patria potestad, ausencia de uno de los progenitores acreditada en la forma admitida o resolución judicial. Estos casos deben documentarse antes de presentar.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-bold">Fuentes oficiales</h2>
          <ul className="mt-4 list-disc space-y-3 pl-6 leading-7 text-[#23364D]">
            <li>
              <a className="underline decoration-[#D4A017] underline-offset-4" href="https://sede.mjusticia.gob.es/es/tramites/nacionalidad-espanola">
                Ministerio de Justicia — Nacionalidad española por residencia
              </a>
            </li>
            <li>
              <a className="underline decoration-[#D4A017] underline-offset-4" href="https://www.boe.es/buscar/act.php?id=BOE-A-2016-9314#a4">
                Orden JUS/1625/2016 — artículo 4, representantes legales
              </a>
            </li>
            <li>
              <a className="underline decoration-[#D4A017] underline-offset-4" href="https://www.boe.es/buscar/act.php?id=BOE-A-2016-9314#a5">
                Orden JUS/1625/2016 — artículo 5, menores mayores de 14 años asistidos
              </a>
            </li>
            <li>
              <a className="underline decoration-[#D4A017] underline-offset-4" href="https://www.mjusticia.gob.es/es/Ciudadano/TramitesGestiones/Documents/19-01-2022Solicitud%20de%20Nacionalidad%20por%20Residencia.pdf">
                Ministerio de Justicia — documentación adicional según los casos
              </a>
            </li>
          </ul>
          <p className="mt-4 text-sm leading-6 text-[#6B7280]">Fuentes revisadas el 25/09/2026.</p>
        </section>
      </article>
    </main>
  );
}
