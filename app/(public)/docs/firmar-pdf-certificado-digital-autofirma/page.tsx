import type { Metadata } from 'next';
import Link from 'next/link';

const PAGE_URL = 'https://expertconsulting.es/docs/firmar-pdf-certificado-digital-autofirma';
const RU_URL = 'https://expertconsulting.es/ru/docs/podpisat-pdf-cifrovym-sertifikatom-autofirma';

export const metadata: Metadata = {
  title: 'Cómo firmar un PDF con certificado digital y AutoFirma | EXPERT',
  description: 'Guía paso a paso para firmar un PDF con certificado digital en AutoFirma, comprobar la firma y evitar invalidarla después.',
  alternates: {
    canonical: PAGE_URL,
    languages: { 'es-ES': PAGE_URL, 'ru-RU': RU_URL, 'x-default': PAGE_URL }
  },
  openGraph: {
    type: 'article',
    title: 'Cómo firmar un PDF con certificado digital y AutoFirma | EXPERT',
    description: 'Guía práctica para firmar un PDF con certificado digital y AutoFirma.',
    url: PAGE_URL
  }
};

export default function Page() {
  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      <section className="bg-[#0D1B2A] px-6 py-14 text-[#F8F6F1]">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#D4A017]">EXPERT Docs</p>
          <h1 className="mt-3 font-serif text-3xl font-bold leading-tight md:text-5xl">Cómo firmar un PDF con certificado digital y AutoFirma</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[#D1D5DB]">
            Guía para firmar un documento PDF con certificado digital en España, comprobar que la firma queda incorporada y evitar acciones que puedan invalidarla.
          </p>
          <div className="mt-6 text-sm text-[#D1D5DB]">
            <Link href={RU_URL} className="underline decoration-[#D4A017] underline-offset-4 hover:text-[#D4A017]">Русская версия</Link>
          </div>
        </div>
      </section>

      <article className="mx-auto max-w-4xl space-y-10 px-6 py-12">
        <section>
          <h2 className="font-serif text-2xl font-bold">Antes de empezar</h2>
          <ul className="mt-4 list-disc space-y-2 pl-6 leading-7 text-[#23364D]">
            <li>Necesitas un certificado digital válido instalado o disponible en el equipo desde el que vas a firmar.</li>
            <li>Instala AutoFirma desde la página oficial de la Administración General del Estado.</li>
            <li>Trabaja siempre sobre el PDF definitivo: si el documento cambia después, la firma puede dejar de ser válida.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-bold">Firmar el PDF paso a paso</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-6 leading-7 text-[#23364D]">
            <li>Guarda el PDF en tu ordenador y ábrelo solo para comprobar que el contenido es correcto.</li>
            <li>Abre <strong>AutoFirma</strong>.</li>
            <li>Selecciona la opción para firmar un fichero y elige el PDF que quieres firmar.</li>
            <li>Cuando AutoFirma muestre los certificados disponibles, selecciona tu certificado personal.</li>
            <li>Confirma la firma. Si el certificado está protegido con contraseña o PIN, introdúcelo cuando se solicite.</li>
            <li>Guarda el nuevo PDF firmado en una ubicación fácil de localizar.</li>
            <li>Envía ese archivo firmado, no una copia impresa ni una captura.</li>
          </ol>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-bold">Si deben firmar dos personas</h2>
          <p className="mt-4 leading-7 text-[#23364D]">
            La segunda persona debe firmar <strong>el mismo PDF que ya contiene la primera firma</strong>. No hay que volver a generar el documento desde el original ni imprimirlo entre una firma y otra.
          </p>
          <ol className="mt-4 list-decimal space-y-3 pl-6 leading-7 text-[#23364D]">
            <li>La primera persona firma el PDF y guarda el archivo resultante.</li>
            <li>Ese archivo se entrega a la segunda persona.</li>
            <li>La segunda persona abre AutoFirma y firma ese mismo PDF ya firmado.</li>
            <li>Se conserva y envía el archivo final con ambas firmas.</li>
          </ol>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-bold">Qué no debes hacer después de firmar</h2>
          <ul className="mt-4 list-disc space-y-2 pl-6 leading-7 text-[#23364D]">
            <li>No edites el contenido del PDF.</li>
            <li>No lo conviertas a Word ni lo vuelvas a exportar como PDF.</li>
            <li>No lo comprimas con herramientas que regeneren el archivo.</li>
            <li>No lo imprimas y vuelvas a escanear si necesitas conservar la firma electrónica.</li>
            <li>No insertes una imagen de la firma como sustituto del certificado digital.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-bold">Cómo comprobar que la firma está bien</h2>
          <p className="mt-4 leading-7 text-[#23364D]">
            Abre el PDF firmado en un visor compatible con firmas digitales, por ejemplo Adobe Acrobat Reader, y comprueba que aparece la firma y que el visor no indica que el documento haya sido modificado después de firmarse.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-bold">Fuentes oficiales</h2>
          <ul className="mt-4 list-disc space-y-2 pl-6 leading-7 text-[#23364D]">
            <li><a className="underline decoration-[#D4A017] underline-offset-4" href="https://firmaelectronica.gob.es/Home/Descargas.html">Portal oficial de Firma Electrónica - descarga de AutoFirma</a></li>
            <li><a className="underline decoration-[#D4A017] underline-offset-4" href="https://firmaelectronica.gob.es/">Portal oficial de Firma Electrónica</a></li>
          </ul>
        </section>

        <section className="border-l-4 border-[#D4A017] bg-white p-5">
          <p className="font-semibold">Importante</p>
          <p className="mt-2 leading-7 text-[#23364D]">
            Las instrucciones pueden variar ligeramente según el sistema operativo y la versión de AutoFirma. Si el PDF debe conservar varias firmas, utiliza siempre el archivo firmado más reciente como base para la siguiente firma.
          </p>
        </section>
      </article>
    </main>
  );
}
