import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, FileSignature, FolderOpen, Mail, ShieldCheck, UserCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Cómo usar Google eSignature con EXPERT | Guía visual',
  description: 'Guía visual para solicitar firmas en Google Drive, seguir el estado y descargar el PDF final firmado desde EXPERT y KIA.',
  alternates: { canonical: 'https://expertconsulting.es/docs/firma-google-esignature' },
};

const steps = [
  ['1', 'Preparar el documento', 'EXPERT genera o revisa el PDF/Google Doc correcto y lo archiva en el expediente.'],
  ['2', 'Abrir eSignature', 'En un PDF de Drive: Más → eSignature. En Google Docs: Herramientas → Firma electrónica.'],
  ['3', 'Asignar firmantes', 'Añade hasta 10 firmantes y coloca campos de firma, iniciales, nombre, texto o fecha.'],
  ['4', 'Solicitar firma', 'Revisa título, emails, mensaje, recordatorios y pulsa “Solicitar firma”.'],
  ['5', 'Seguir el estado', 'Drive permite abrir “Ver detalles” para comprobar quién ha firmado y quién falta.'],
  ['6', 'Archivar el final', 'Cuando todos firman, Google genera el PDF final con registro de auditoría. EXPERT lo vincula al expediente.'],
] as const;

function MockWindow({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#D4A017]/25 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-[#D4A017]/20 bg-[#F8F6F1] px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#D4A017]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#D4A017]/50" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#D4A017]/25" />
        <span className="ml-2 text-xs font-semibold text-[#23364D]">{title}</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function GoogleEsignatureGuidePage() {
  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      <section className="bg-[#0D1B2A] px-6 py-14 text-[#F8F6F1]">
        <div className="mx-auto max-w-6xl">
          <Link href="/docs" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#9CA3AF] hover:text-[#D4A017]">
            <ArrowLeft className="h-4 w-4" /> Base de conocimientos
          </Link>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">Google Workspace · Firma</p>
          <h1 className="mt-3 max-w-4xl font-serif text-4xl font-bold md:text-5xl">Cómo firmar documentos con Google eSignature y EXPERT</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[#C4CBD3]">
            Flujo recomendado para mandatos, autorizaciones y otros documentos donde una firma electrónica simple con trazabilidad sea suficiente.
            KIA puede preparar, seguir y ofrecer el documento final; el envío de la solicitud se inicia desde Google Drive.
          </p>
          <p className="mt-4 text-sm text-[#9CA3AF]">Actualizado: 29 sep 2026 · 8 min</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="border border-[#D4A017]/25 bg-white p-5"><FileSignature className="h-6 w-6 text-[#D4A017]" /><h2 className="mt-3 font-bold">Firma simple trazable</h2><p className="mt-2 text-sm leading-6 text-[#23364D]">Útil para documentos donde no se exige certificado electrónico reconocido.</p></div>
          <div className="border border-[#D4A017]/25 bg-white p-5"><ShieldCheck className="h-6 w-6 text-[#D4A017]" /><h2 className="mt-3 font-bold">Auditoría incluida</h2><p className="mt-2 text-sm leading-6 text-[#23364D]">El PDF final incorpora eventos, firmantes y marcas de tiempo del ciclo de firma.</p></div>
          <div className="border border-[#D4A017]/25 bg-white p-5"><UserCheck className="h-6 w-6 text-[#D4A017]" /><h2 className="mt-3 font-bold">KIA + control humano</h2><p className="mt-2 text-sm leading-6 text-[#23364D]">KIA controla el expediente, pero “Solicitar firma” sigue siendo una acción humana en Drive.</p></div>
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="font-serif text-3xl font-bold">Flujo completo</h2>
            <div className="mt-6 space-y-4">
              {steps.map(([n,title,text]) => (
                <div key={n} className="flex gap-4 border-l-2 border-[#D4A017] bg-white p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#D4A017] text-sm font-bold">{n}</div>
                  <div><h3 className="font-bold">{title}</h3><p className="mt-1 text-sm leading-6 text-[#23364D]">{text}</p></div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <MockWindow title="Google Drive · PDF">
              <div className="flex items-center justify-between rounded-lg border border-[#D4A017]/20 p-4">
                <div className="flex items-center gap-3"><FolderOpen className="h-5 w-5 text-[#D4A017]" /><div><p className="text-sm font-bold">Mandato_representacion.pdf</p><p className="text-xs text-[#6B7280]">PDF · expediente EXPERT</p></div></div>
                <div className="rounded-md bg-[#0D1B2A] px-3 py-2 text-xs font-semibold text-white">Más ···</div>
              </div>
              <div className="mt-3 ml-auto w-48 border border-[#D4A017]/25 bg-white p-2 text-sm shadow-lg">
                <div className="px-3 py-2">Abrir con</div>
                <div className="bg-[#D4A017]/10 px-3 py-2 font-bold">eSignature</div>
                <div className="px-3 py-2">Descargar</div>
              </div>
            </MockWindow>

            <MockWindow title="Panel de eSignature">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-[#D4A017]/25 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#D4A017]">Firmante 1</p>
                  <p className="mt-2 text-sm font-semibold">Cliente</p>
                  <div className="mt-4 rounded border border-dashed border-[#D4A017] p-3 text-center text-xs">Campo de firma</div>
                </div>
                <div className="rounded-lg border border-[#D4A017]/25 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#D4A017]">Firmante 2</p>
                  <p className="mt-2 text-sm font-semibold">Segundo representante</p>
                  <div className="mt-4 rounded border border-dashed border-[#D4A017] p-3 text-center text-xs">Fecha de firma</div>
                </div>
              </div>
              <button className="mt-4 w-full rounded-md bg-[#D4A017] px-4 py-3 text-sm font-bold text-[#0D1B2A]">Solicitar firma</button>
            </MockWindow>

            <MockWindow title="KIA · expediente">
              <div className="space-y-3 text-sm">
                <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-[#EEF1F4] px-4 py-3 text-[#23364D]">¿Ya está firmado el mandato?</div>
                <div className="ml-auto max-w-[92%] rounded-2xl rounded-br-sm bg-[#0D1B2A] px-4 py-3 text-white">
                  He comprobado el expediente. La firma está completada y existe el PDF final archivado.
                  <div className="mt-3 rounded-md bg-[#D4A017] px-3 py-2 text-center text-xs font-bold text-[#0D1B2A]">Descargar documento firmado</div>
                </div>
              </div>
            </MockWindow>
          </div>
        </div>

        <section className="mt-14 rounded-2xl border border-[#D4A017]/30 bg-white p-6 md:p-8">
          <h2 className="font-serif text-2xl font-bold">Qué ocurre después de pulsar “Solicitar firma”</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div><Mail className="h-5 w-5 text-[#D4A017]" /><h3 className="mt-2 font-bold">Correo al firmante</h3><p className="mt-1 text-sm leading-6 text-[#23364D]">Google envía un enlace al PDF. Se pueden activar recordatorios automáticos.</p></div>
            <div><CheckCircle2 className="h-5 w-5 text-[#D4A017]" /><h3 className="mt-2 font-bold">Estado visible</h3><p className="mt-1 text-sm leading-6 text-[#23364D]">Desde “Ver detalles” se comprueba quién ha firmado y quién falta.</p></div>
            <div><ShieldCheck className="h-5 w-5 text-[#D4A017]" /><h3 className="mt-2 font-bold">PDF final</h3><p className="mt-1 text-sm leading-6 text-[#23364D]">Al finalizar, Google genera un PDF con registro de auditoría. EXPERT lo conserva como evidencia.</p></div>
          </div>
        </section>

        <section className="mt-10 border-l-4 border-[#D4A017] bg-[#0D1B2A] p-6 text-white">
          <h2 className="font-serif text-2xl font-bold">Importante: no todas las firmas son iguales</h2>
          <p className="mt-3 text-sm leading-7 text-[#D1D5DB]">
            Google eSignature no sustituye un certificado electrónico reconocido cuando una norma o sede exige ese nivel.
            En esos casos EXPERT utiliza certificado digital, AutoFirma o el mecanismo específico admitido por la Administración.
          </p>
        </section>

        <section className="mt-10 border border-[#D4A017]/25 bg-white p-6">
          <h2 className="font-serif text-2xl font-bold">Fuentes y ayuda oficial</h2>
          <ul className="mt-4 space-y-2 text-sm text-[#23364D]">
            <li><a className="font-semibold text-[#D4A017] underline" href="https://support.google.com/drive/answer/12315692?hl=es" target="_blank" rel="noreferrer">Google Drive: enviar solicitudes de firma y firmar documentos</a></li>
            <li><a className="font-semibold text-[#D4A017] underline" href="https://support.google.com/docs/answer/16704506" target="_blank" rel="noreferrer">Google Workspace: disponibilidad y acceso a eSignature</a></li>
          </ul>
        </section>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/docs/conectar-google-workspace-expert" className="border border-[#D4A017] px-4 py-3 text-sm font-bold">Conectar Google Workspace</Link>
          <Link href="/docs" className="bg-[#D4A017] px-4 py-3 text-sm font-bold">Volver a la base de conocimientos</Link>
        </div>
      </section>
    </main>
  );
}
