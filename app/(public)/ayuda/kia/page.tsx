import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Shield, MessageCircle, FileText, CreditCard, Globe,
  AlertTriangle, CheckCircle2, HelpCircle, BookOpen, Phone,
} from 'lucide-react';
import { KiaGuidanceCard } from '@/components/kia/KiaGuidanceCard';
import { getCalDemoUrl } from '@/lib/utils/cal';

export const metadata: Metadata = {
  title: 'Cómo usar Kia, la asistente virtual de EXPERT',
  description: 'Guía de buenas prácticas para interactuar con Kia de forma segura y eficaz: capacidades, límites, privacidad y operaciones seguras.',
};

const WA_NUMBER = '34669045528';
const PORTAL_URL = '/dashboard';
const VIABILITY_URL = '/solicitar-presupuesto';
const CAL_URL = getCalDemoUrl() ?? '/cita';

export default function KiaGuiaPage() {
  return (
    <div className="min-h-screen bg-[#f8f4eb]">
      <section className="border-b border-[#e8dfc9] bg-[#07111d] px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D4A017]">Guía de usuario</p>
          <h1 className="mt-3 font-serif text-3xl font-bold text-white sm:text-4xl">Cómo usar Kia de forma segura</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/70">
            Kia es la asistente y copiloto virtual de EXPERT. Puede orientarte, ayudarte a preparar gestiones y,
            cuando estás autenticado o utilizas un canal correctamente vinculado, trabajar con el contexto que
            tengas autorizado. El equipo EXPERT puede intervenir cuando el caso requiere revisión profesional.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl space-y-10 px-6 py-12">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <p className="font-semibold text-red-800">Aviso de seguridad importante</p>
              <p className="mt-1 text-sm text-red-700">
                Nunca envíes contraseñas, claves API, códigos de verificación, tokens, datos bancarios completos
                ni datos completos de tarjetas por WhatsApp, email o chat. Utiliza siempre el flujo seguro que te indique EXPERT.
              </p>
            </div>
          </div>
        </div>

        <KiaGuidanceCard
          state="explicacion"
          title="Las capacidades de Kia dependen del canal y de tus permisos"
          message="Una conversación pública no tiene el mismo acceso que tu Espacio Cliente autenticado. Kia no debe ampliar el contexto disponible ni asumir estados que el sistema no haya confirmado."
        />

        <Section icon={CheckCircle2} title="Qué puede hacer Kia" color="text-emerald-700">
          <ul className="space-y-2">
            {[
              'Orientarte sobre servicios de gestión, fiscal, extranjería, empresa, contabilidad y laboral dentro de su alcance.',
              'Ayudarte a comprobar viabilidad o preparación de un trámite cuando existe un flujo específico para ello.',
              'Preparar la contratación de servicios y guiarte hacia el siguiente paso seguro.',
              'Indicar qué datos o documentos son necesarios para una gestión.',
              'Ayudarte a completar tu perfil en el Espacio Cliente.',
              'Guiarte para conectar Holded desde la superficie privada y autorizada.',
              'Consultar contexto de tu cuenta —como empresas vinculadas, estado de expedientes o documentación pendiente— cuando la sesión y los permisos lo autorizan.',
              'Orientarte sobre estados y plazos visibles en tu calendario fiscal sin convertirlos automáticamente en conclusiones sobre deuda o sanción.',
              'Ayudarte a reservar una llamada o derivarte al equipo cuando corresponde.',
              'Responder en español o en ruso según el contexto disponible.',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-[#29384a]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                {item}
              </li>
            ))}
          </ul>
        </Section>

        <Section icon={AlertTriangle} title="Qué no hace Kia" color="text-red-700">
          <ul className="space-y-2">
            {[
              'No sustituye la revisión profesional del equipo de EXPERT cuando es necesaria.',
              'No debe afirmar que ha presentado un impuesto, realizado un pago o completado un trámite si el sistema autorizado no lo confirma.',
              'No modifica contabilidad ni ejecuta operaciones sensibles fuera de los permisos y validaciones establecidos.',
              'No pide ni expone claves API, contraseñas, tokens, códigos 2FA ni datos bancarios completos por conversación.',
              'No puede saltarse autenticación, permisos ni separación entre clientes o empresas.',
              'No decide sola cuestiones complejas con implicaciones jurídicas, fiscales, laborales o económicas relevantes.',
              'No muestra datos de otros clientes ni de empresas fuera del ámbito autorizado.',
              'No debe convertir un aviso o estado intermedio en un resultado final no confirmado.',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-[#29384a]">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                {item}
              </li>
            ))}
          </ul>
        </Section>

        <Section icon={MessageCircle} title="Cómo pedir ayuda correctamente" color="text-blue-700">
          <ul className="space-y-2">
            {[
              'Indica el servicio, trámite o resultado que quieres conseguir.',
              'Explica la cuestión principal con claridad y separa consultas independientes.',
              'Para información de tu cuenta utiliza el Espacio Cliente o un canal correctamente vinculado.',
              'Sube documentos y facilita datos personales únicamente en las superficies seguras habilitadas.',
              'Si necesitas una conclusión profesional, solicita revisión o reserva una consulta.',
              'Para contratar o conectar servicios, utiliza siempre el flujo seguro de EXPERT.',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-[#29384a]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                {item}
              </li>
            ))}
          </ul>
        </Section>

        <Section icon={Shield} title="Seguridad de tus datos" color="text-[#07111d]">
          <div className="space-y-4">
            <InfoCard color="red">
              <p className="text-sm text-[#29384a]">
                <strong>Datos que no debes enviar por conversación:</strong> contraseñas, claves API, tokens de acceso,
                códigos 2FA, números completos de tarjeta o credenciales bancarias.
              </p>
            </InfoCard>
            <p className="text-sm text-[#29384a]">
              Si recibes un mensaje sospechoso pidiendo secretos o credenciales en nombre de EXPERT, no los facilites.
              Inicia la operación desde el Espacio Cliente o desde un enlace que hayas abierto a través de una superficie oficial de EXPERT.
            </p>
          </div>
        </Section>

        <Section icon={Globe} title="Conectar Holded de forma segura" color="text-[#07111d]">
          <div className="space-y-3 text-sm text-[#29384a]">
            <p>
              Cuando un servicio requiera Holded, Kia puede explicarte el proceso y llevarte a la superficie de conexión,
              pero no debes pegar API keys ni credenciales en WhatsApp, email o chat.
            </p>
            <InfoCard color="amber">
              <p className="text-sm text-[#29384a]">
                La disponibilidad real de Holded depende del estado de la integración y de los permisos habilitados para la empresa correspondiente.
              </p>
            </InfoCard>
          </div>
        </Section>

        <Section icon={CreditCard} title="Pagos seguros" color="text-[#07111d]">
          <div className="space-y-3 text-sm text-[#29384a]">
            <p>
              Kia puede guiarte hacia un checkout o enlace de contratación cuando el flujo lo permite y los requisitos previos están completos.
              No compartas datos completos de tarjeta por conversación.
            </p>
            <InfoCard color="amber">
              <p className="text-sm text-[#29384a]">
                Si tienes dudas sobre un pago, vuelve al Espacio Cliente o confirma el enlace con el equipo EXPERT antes de continuar.
              </p>
            </InfoCard>
          </div>
        </Section>

        <Section icon={FileText} title="Documentos y expedientes" color="text-[#07111d]">
          <div className="space-y-3 text-sm text-[#29384a]">
            <p>
              En un contexto autenticado y autorizado, Kia puede ayudarte a consultar el estado de expedientes y documentación pendiente.
              También puede intervenir en flujos de clasificación o preparación documental cuando esa capacidad está habilitada.
            </p>
            <p>→ Sube documentos únicamente desde las superficies de EXPERT preparadas para ello.</p>
            <p>→ No asumas que un documento está revisado, aceptado o presentado hasta que el estado autorizado lo confirme.</p>
          </div>
        </Section>

        <Section icon={Globe} title="Idiomas" color="text-[#07111d]">
          <p className="text-sm text-[#29384a]">
            Kia puede trabajar en <strong>español</strong> y <strong>ruso</strong>. El idioma se resuelve a partir de la configuración y del contexto disponible de la interacción.
          </p>
        </Section>

        <Section icon={BookOpen} title="Aviso profesional" color="text-[#07111d]">
          <div className="rounded-xl border border-[#d8cbb5] bg-white p-4 text-sm leading-relaxed text-[#29384a]">
            Las respuestas de Kia ayudan a organizar información, preparar trámites y utilizar los servicios de EXPERT.
            Las decisiones fiscales, jurídicas, laborales o económicas relevantes pueden requerir revisión profesional.
            Kia debe distinguir entre orientación y hechos confirmados por los sistemas autorizados.
          </div>
        </Section>

        <section className="rounded-2xl border border-[#d8cbb5] bg-white p-6">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#c88b25]">¿Listo/a para empezar?</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <a
              href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Hola, quiero información sobre los servicios de EXPERT.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#20b858]"
            >
              <MessageCircle className="h-4 w-4 shrink-0" />
              Contactar por WhatsApp
            </a>
            <Link
              href={VIABILITY_URL}
              className="flex items-center gap-3 rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] px-4 py-3 text-sm font-semibold text-[#07111d] transition hover:border-[#c88b25]"
            >
              <HelpCircle className="h-4 w-4 shrink-0" />
              Comprobar viabilidad
            </Link>
            <Link
              href={PORTAL_URL}
              className="flex items-center gap-3 rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] px-4 py-3 text-sm font-semibold text-[#07111d] transition hover:border-[#c88b25]"
            >
              <Shield className="h-4 w-4 shrink-0" />
              Acceder al Espacio Cliente
            </Link>
            <a
              href={CAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-[#D4A017] bg-[#D4A017]/10 px-4 py-3 text-sm font-semibold text-[#07111d] transition hover:bg-[#D4A017]/20"
            >
              <Phone className="h-4 w-4 shrink-0" />
              Reservar llamada
            </a>
          </div>
        </section>

        <p className="text-center text-xs text-[#8899aa]">Versión de política: septiembre 2026 · EXPERT · Kia AI Assistant</p>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, color, children }: {
  icon: React.ElementType;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <Icon className={`h-5 w-5 shrink-0 ${color}`} />
        <h2 className="font-serif text-xl font-bold text-[#07111d]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function InfoCard({ color, children }: { color: 'red' | 'amber' | 'blue'; children: React.ReactNode }) {
  const styles = {
    red: 'border-red-200 bg-red-50',
    amber: 'border-amber-200 bg-amber-50',
    blue: 'border-blue-100 bg-blue-50',
  };
  return <div className={`rounded-xl border p-4 ${styles[color]}`}>{children}</div>;
}
