import type { Metadata } from 'next';
import { AlertTriangle, CheckCircle2, Download, FileSignature, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Cómo firmar un PDF con certificado digital | EXPERT',
  description: 'Guía práctica de EXPERT para firmar un PDF con certificado electrónico reconocido mediante AutoFirma.',
};

export default function FirmarPdfCertificadoPage() {
  return (
    <main className="min-h-screen bg-[#f8f4eb]">
      <section className="border-b border-[#e8dfc9] bg-[#07111d] px-6 py-14">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D4A017]">Guía EXPERT · ES / RU</p>
          <h1 className="mt-3 font-serif text-3xl font-bold text-white sm:text-4xl">Firmar un PDF con certificado digital</h1>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            Para documentos administrativos que exigen firma electrónica reconocida recomendamos AutoFirma, la aplicación oficial de la Administración Pública.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl space-y-8 px-6 py-10">
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <p className="text-sm text-amber-900">
              No utilices una firma dibujada, una imagen de firma ni la función “Rellenar y firmar” como sustituto de una firma electrónica con certificado cuando el trámite exige certificado reconocido.
            </p>
          </div>
        </section>

        <Section title="Opción recomendada: AutoFirma" icon={FileSignature}>
          <ol className="space-y-3 text-sm text-[#29384a]">
            {[
              'Descarga e instala AutoFirma desde la web oficial firmaelectronica.gob.es.',
              'Guarda en tu ordenador el PDF recibido de EXPERT sin modificar su contenido.',
              'Abre AutoFirma y selecciona “Firmar fichero”.',
              'Selecciona el PDF que te hemos enviado.',
              'Elige tu certificado electrónico personal cuando AutoFirma lo solicite.',
              'Para PDF, utiliza la firma PDF/PAdES que AutoFirma propone para este tipo de archivo.',
              'Guarda el fichero firmado con un nombre nuevo, por ejemplo: solicitud_Ruslana_firmada_Viacheslav.pdf.',
              'Abre el PDF firmado y comprueba que la firma aparece como válida. Después envíalo a EXPERT sin volver a imprimirlo ni escanearlo.',
            ].map((item, index) => (
              <li key={item} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#D4A017]/15 text-xs font-bold text-[#9a6b0c]">{index + 1}</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </Section>

        <Section title="Если вы подписываете документ электронной подписью" icon={ShieldCheck}>
          <ol className="space-y-3 text-sm text-[#29384a]">
            {[
              'Скачайте и установите официальную программу AutoFirma.',
              'Сохраните PDF, полученный от EXPERT, на компьютер и не изменяйте его содержание.',
              'Откройте AutoFirma и выберите подписание файла.',
              'Выберите полученный PDF.',
              'Выберите личный электронный сертификат.',
              'Для PDF используйте формат подписи PDF/PAdES, предложенный AutoFirma.',
              'Сохраните подписанный файл под новым именем.',
              'Проверьте, что электронная подпись отображается как действительная, и отправьте подписанный PDF обратно в EXPERT.',
            ].map((item, index) => (
              <li key={item} className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </Section>

        <section className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
          <div className="flex items-start gap-3">
            <Download className="mt-0.5 h-5 w-5 shrink-0 text-[#c88b25]" />
            <div className="text-sm text-[#29384a]">
              <p className="font-semibold text-[#07111d]">Fuentes oficiales</p>
              <p className="mt-2">AutoFirma y tutoriales: firmaelectronica.gob.es</p>
              <p className="mt-1">Sistemas de firma admitidos por Justicia: sede.mjusticia.gob.es</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#d8cbb5] bg-white p-6">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5 text-[#c88b25]" />
        <h2 className="font-serif text-xl font-bold text-[#07111d]">{title}</h2>
      </div>
      {children}
    </section>
  );
}
