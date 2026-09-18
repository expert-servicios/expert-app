import Link from 'next/link';
import { ArrowLeft, Bot, CheckCircle2, Info, MessageSquare, XCircle } from 'lucide-react';
import { KiaGuidanceCard } from '@/components/kia/KiaGuidanceCard';

const PUEDO: { icon: string; title: string; desc: string }[] = [
  {
    icon: '📋',
    title: 'Orientar sobre trámites',
    desc: 'Explica pasos, plazos y documentación para IRPF, IVA, autónomos, extranjería, certificados digitales y otros procedimientos dentro de su alcance.',
  },
  {
    icon: '📊',
    title: 'Informar sobre servicios EXPERT',
    desc: 'Describe qué incluye cada plan o gestión, muestra precios públicos disponibles y guía para solicitar presupuesto o reservar cita.',
  },
  {
    icon: '🔐',
    title: 'Usar contexto autorizado de tu cuenta',
    desc: 'En el Espacio Cliente autenticado puede utilizar datos de perfil, empresas vinculadas, estado de expedientes y documentación pendiente cuando esa información está autorizada para tu sesión y entidad.',
  },
  {
    icon: '🏛️',
    title: 'Compartir fuentes oficiales',
    desc: 'Puede apoyarse en fuentes oficiales disponibles y señalar cuándo una cuestión requiere verificación normativa o revisión profesional.',
  },
  {
    icon: '📅',
    title: 'Orientar sobre obligaciones fiscales',
    desc: 'Ayuda a interpretar los estados y plazos que aparecen en el calendario fiscal sin convertir un aviso de calendario en una conclusión automática sobre deuda, sanción o incumplimiento.',
  },
  {
    icon: '🌍',
    title: 'Atender en español y ruso',
    desc: 'Puede adaptar la respuesta al idioma detectado o configurado para la interacción.',
  },
  {
    icon: '🔗',
    title: 'Redirigir a la superficie segura',
    desc: 'Para operaciones formales, credenciales o acciones sensibles, deriva al área privada, al flujo autorizado o al equipo EXPERT cuando corresponde.',
  },
];

const NO_PUEDO: { title: string; desc: string }[] = [
  {
    title: 'Dar asesoramiento legal o fiscal vinculante',
    desc: 'Kia orienta y organiza información, pero no sustituye la revisión profesional cuando una decisión tiene consecuencias legales, fiscales, laborales o económicas relevantes.',
  },
  {
    title: 'Acceder a datos fuera de tu ámbito autorizado',
    desc: 'Kia no puede saltarse autenticación, permisos ni separación entre empresas. El contexto de cuenta, expedientes, documentos e integraciones debe pertenecer al usuario y a la entidad autorizada.',
  },
  {
    title: 'Pedir o exponer secretos por chat',
    desc: 'No debes enviar API keys, contraseñas, códigos 2FA, tokens ni datos bancarios completos por WhatsApp, email o chat. Las credenciales se gestionan únicamente en los flujos seguros habilitados.',
  },
  {
    title: 'Dar por realizada una operación sin confirmación',
    desc: 'Kia no debe afirmar que una presentación, pago, conexión o trámite está completado si el sistema autorizado no ha confirmado ese estado.',
  },
  {
    title: 'Mantener conversaciones sin relación con EXPERT',
    desc: 'Los temas ajenos a trámites, empresa, fiscalidad, contabilidad, laboral o servicios de EXPERT quedan fuera de su ámbito operativo y se redirigen de forma breve.',
  },
];

const BUENAS: { num: string; title: string; desc: string }[] = [
  {
    num: '01',
    title: 'Sé específico sobre tu situación',
    desc: 'Indicar el tipo de trámite, el estado que ves y qué quieres conseguir ayuda a que Kia dé una orientación más concreta y útil.',
  },
  {
    num: '02',
    title: 'Una cuestión principal cada vez',
    desc: 'Si tienes varias consultas independientes, sepáralas para que cada respuesta mantenga un contexto claro y pueda indicar el siguiente paso correcto.',
  },
  {
    num: '03',
    title: 'Usa el Espacio Cliente para datos y gestiones',
    desc: 'El panel autenticado es la superficie adecuada para consultar expedientes, documentación, empresas vinculadas, integraciones y operaciones que requieren contexto de cuenta.',
  },
  {
    num: '04',
    title: 'No compartas credenciales en la conversación',
    desc: 'Si una integración necesita una API key, token o autorización, utiliza exclusivamente el formulario o enlace seguro que Kia o EXPERT te indiquen.',
  },
  {
    num: '05',
    title: 'Si la respuesta no es clara, pide reformulación',
    desc: 'Puedes pedir que explique un concepto de otra forma, que resuma los pasos o que distinga hechos confirmados de cuestiones que todavía requieren revisión.',
  },
  {
    num: '06',
    title: 'Escala los casos sensibles cuando sea necesario',
    desc: 'Requerimientos, sanciones, inspecciones, decisiones jurídicas o situaciones con impacto económico relevante pueden requerir una consulta con el equipo EXPERT.',
  },
];

export default function KiaAyudaPage() {
  return (
    <main className="min-h-screen bg-[#f8f4eb]">

      <div className="border-b border-[#d8cbb5] bg-white">
        <div className="mx-auto max-w-3xl px-6 py-6">
          <Link
            href="/dashboard"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-[#5f7282] hover:text-[#29384a]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Volver al panel
          </Link>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#d7a33a]/10">
              <Bot className="h-5 w-5 text-[#c88b25]" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold text-[#07111d]">Cómo usar Kia</h1>
              <p className="mt-0.5 text-sm text-[#29384a]">
                Capacidades, límites y buenas prácticas del copiloto de EXPERT
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-10 px-6 py-8">
        <KiaGuidanceCard
          state="explicacion"
          title="Aquí puedes comprobar qué puede hacer Kia y qué límites mantiene"
          message="Las capacidades dependen del canal, de que estés autenticado y de los permisos disponibles para tu cuenta y empresa. Kia no debe ampliar ese ámbito por su cuenta."
        />

        <section className="rounded-2xl border border-[#d8cbb5] bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <Info className="h-4 w-4 text-[#c88b25]" />
            <h2 className="font-serif text-lg font-bold text-[#07111d]">¿Qué es Kia?</h2>
          </div>
          <p className="text-sm leading-relaxed text-[#29384a]">
            Kia es la asistente y copiloto virtual de EXPERT. Puede orientar sobre trámites, fiscalidad,
            contabilidad, gestión laboral y servicios, y en superficies autenticadas puede utilizar el contexto
            autorizado de tu cuenta para dar respuestas más útiles y situadas.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[#29384a]">
            El alcance depende del canal y de tus permisos. Kia separa hechos confirmados de orientaciones,
            no debe inventar estados ni ejecutar operaciones sensibles fuera de los flujos y autorizaciones
            previstos por EXPERT.
          </p>
        </section>

        <section>
          <div className="mb-5 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <h2 className="font-serif text-lg font-bold text-[#07111d]">Lo que Kia puede hacer</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {PUEDO.map((item) => (
              <div key={item.title} className="flex gap-3 rounded-xl border border-[#d8cbb5] bg-white p-4">
                <span className="text-xl leading-none">{item.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-[#07111d]">{item.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#5f7282]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-5 flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <h2 className="font-serif text-lg font-bold text-[#07111d]">Límites de Kia</h2>
          </div>
          <div className="space-y-3">
            {NO_PUEDO.map((item) => (
              <div key={item.title} className="flex gap-3 rounded-xl border border-red-100 bg-red-50/50 p-4">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <div>
                  <p className="text-sm font-semibold text-[#07111d]">{item.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#5f7282]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-5 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-[#c88b25]" />
            <h2 className="font-serif text-lg font-bold text-[#07111d]">Buenas prácticas</h2>
          </div>
          <div className="space-y-4">
            {BUENAS.map((item) => (
              <div key={item.num} className="flex gap-4 rounded-xl border border-[#d8cbb5] bg-white p-5">
                <span className="mt-0.5 shrink-0 font-mono text-xs font-bold text-[#c88b25]">{item.num}</span>
                <div>
                  <p className="text-sm font-semibold text-[#07111d]">{item.title}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#5f7282]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[#d7a33a]/30 bg-[#d7a33a]/5 p-6">
          <h2 className="mb-3 font-serif text-base font-bold text-[#07111d]">¿Qué pasa si la conversación se desvía?</h2>
          <p className="text-sm leading-relaxed text-[#29384a]">
            Si la consulta se sale del ámbito operativo de EXPERT, Kia debe indicarlo brevemente y redirigir
            hacia una pregunta relacionada con trámites, empresa o servicios. Si una cuestión requiere revisión
            profesional, puede proponer la superficie o el contacto adecuado en lugar de improvisar una respuesta.
          </p>
        </section>

        <section className="rounded-2xl border border-[#d8cbb5] bg-white p-6">
          <h2 className="mb-3 font-serif text-base font-bold text-[#07111d]">Privacidad y datos</h2>
          <ul className="space-y-2 text-sm text-[#29384a]">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
              El contexto de cliente y empresa se utiliza únicamente dentro del ámbito autenticado y autorizado disponible para la interacción.
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
              No envíes API keys, contraseñas, códigos 2FA, tokens ni datos bancarios completos por conversación. Utiliza los flujos seguros del portal.
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
              Las interacciones pueden quedar registradas para operación, seguridad, auditoría y mejora de calidad conforme a las políticas de EXPERT.
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
              Para formalizar operaciones o conectar servicios externos, usa siempre la superficie privada y el flujo de autorización correspondiente.
            </li>
          </ul>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/dashboard/citas"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d7a33a] px-5 py-2.5 text-sm font-bold text-[#061321] transition hover:bg-[#f0bf54]"
          >
            Reservar cita con asesor
          </Link>
          <Link
            href="/solicitar-presupuesto"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d8cbb5] bg-white px-5 py-2.5 text-sm font-semibold text-[#07111d] transition hover:bg-[#f8f4eb]"
          >
            Solicitar presupuesto
          </Link>
        </div>

        <p className="pb-2 text-center text-xs text-[#8899aa]">
          Versión de política: septiembre 2026 · EXPERT · Kia AI Assistant
        </p>
      </div>
    </main>
  );
}
