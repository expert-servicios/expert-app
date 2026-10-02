import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Política de Cookies | EXPERT ESTUDIOS PROFESIONALES',
  description: 'Información sobre cookies y tecnologías de medición de expertconsulting.es, consentimiento y configuración.',
  alternates: { canonical: 'https://expertconsulting.es/cookies' },
};

const LAST_UPDATED = '29 de septiembre de 2026';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-serif text-2xl font-bold text-[#0D1B2A]">{title}</h2>
      <div className="mt-4 space-y-3 text-sm leading-7 text-[#23364D]">{children}</div>
    </section>
  );
}

export default function CookiesPage() {
  return (
    <main className="bg-[#F8F6F1] px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#D4A017]">Legal</p>
        <h1 className="mt-3 font-serif text-4xl font-bold text-[#0D1B2A]">Política de Cookies</h1>
        <p className="mt-3 text-sm text-[#23364D]">Última actualización: {LAST_UPDATED}</p>

        <div className="mt-10 space-y-10">
          <Section title="1. Qué son las cookies y tecnologías similares">
            <p>Las cookies y tecnologías similares permiten almacenar o recuperar información en el dispositivo del usuario. Algunas son necesarias para prestar el servicio; otras permiten medir el uso del sitio o integrar servicios de terceros.</p>
          </Section>

          <Section title="2. Criterio de EXPERT">
            <p>Las tecnologías estrictamente necesarias para autenticación, seguridad, prevención del fraude y funcionamiento pueden utilizarse sin consentimiento cuando cumplen los requisitos legales.</p>
            <p><strong>Google Analytics, Google Tag Manager y Metricool no se cargan hasta que el usuario acepta la medición opcional.</strong> Rechazar la analítica no limita el acceso al contenido ni a los servicios de EXPERT.</p>
          </Section>

          <Section title="3. Tecnologías utilizadas">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-[#0D1B2A] text-white">
                    <th className="px-4 py-3 text-left">Categoría</th>
                    <th className="px-4 py-3 text-left">Proveedor</th>
                    <th className="px-4 py-3 text-left">Finalidad</th>
                    <th className="px-4 py-3 text-left">Consentimiento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d8cbb5] bg-white">
                  <tr><td className="px-4 py-3">Técnicas</td><td className="px-4 py-3">EXPERT / Supabase</td><td className="px-4 py-3">Sesión, autenticación OAuth, seguridad y área privada.</td><td className="px-4 py-3">No, cuando son necesarias.</td></tr>
                  <tr><td className="px-4 py-3">Seguridad</td><td className="px-4 py-3">Google reCAPTCHA</td><td className="px-4 py-3">Protección de formularios y prevención automatizada de abuso cuando se utiliza.</td><td className="px-4 py-3">Se utiliza por finalidad de seguridad; revisar su activación concreta por formulario.</td></tr>
                  <tr><td className="px-4 py-3">Analítica</td><td className="px-4 py-3">Google Analytics 4</td><td className="px-4 py-3">Medición agregada de uso, navegación y rendimiento.</td><td className="px-4 py-3">Sí.</td></tr>
                  <tr><td className="px-4 py-3">Gestión de etiquetas</td><td className="px-4 py-3">Google Tag Manager</td><td className="px-4 py-3">Carga y gestión de etiquetas de medición autorizadas.</td><td className="px-4 py-3">Sí cuando contiene etiquetas no necesarias.</td></tr>
                  <tr><td className="px-4 py-3">Analítica</td><td className="px-4 py-3">Metricool</td><td className="px-4 py-3">Medición de tráfico y rendimiento de contenidos/campañas.</td><td className="px-4 py-3">Sí.</td></tr>
                  <tr><td className="px-4 py-3">Pago</td><td className="px-4 py-3">Stripe</td><td className="px-4 py-3">Seguridad, sesión de pago y prevención del fraude al iniciar un checkout.</td><td className="px-4 py-3">Según la tecnología y su carácter necesario para el pago solicitado.</td></tr>
                </tbody>
              </table>
            </div>
            <p>Los nombres concretos, duración y dominio de algunas cookies pueden cambiar cuando el proveedor actualiza su servicio. EXPERT revisa periódicamente el comportamiento real del sitio para mantener esta información alineada.</p>
          </Section>

          <Section title="4. Cómo damos y retiramos el consentimiento">
            <p>En la primera visita, o cuando vence la preferencia guardada, se muestra un aviso con las opciones <strong>Aceptar</strong> y <strong>Rechazar</strong> al mismo nivel visual.</p>
            <p>Si aceptas, se cargan las tecnologías de medición opcional. Si rechazas, esas tecnologías no se cargan.</p>
            <p>La preferencia se guarda localmente durante un máximo de <strong>24 meses</strong>; puede solicitarse nuevamente antes si cambia de forma relevante el uso de cookies, proveedores o finalidades.</p>
            <p>Puedes modificar tu elección en cualquier momento desde <strong>Configurar cookies</strong> en el pie de página.</p>
          </Section>

          <Section title="5. Navegadores y eliminación de cookies">
            <p>También puedes eliminar o bloquear cookies desde la configuración del navegador. El bloqueo de cookies técnicas puede impedir el inicio de sesión o el funcionamiento de determinadas partes del área privada.</p>
          </Section>

          <Section title="6. Transferencias internacionales">
            <p>Algunos proveedores tecnológicos pueden tratar datos fuera del Espacio Económico Europeo. Consulta la <Link href="/privacidad" className="text-[#D4A017] underline underline-offset-4">Política de Privacidad</Link> para conocer las garantías aplicables.</p>
          </Section>

          <Section title="7. Cambios">
            <p>Esta política se revisará cuando cambien las tecnologías efectivamente cargadas en la web. La descripción pública debe corresponderse con el comportamiento técnico real, no con una lista genérica.</p>
          </Section>

          <div className="border-t border-[#D4A017]/25 pt-8">
            <div className="flex flex-wrap gap-4 text-sm">
              <Link href="/privacidad" className="font-semibold text-[#D4A017]">Privacidad</Link>
              <Link href="/terminos" className="font-semibold text-[#D4A017]">Términos</Link>
              <Link href="/condiciones" className="font-semibold text-[#D4A017]">Contratación</Link>
              <Link href="/aviso-legal" className="font-semibold text-[#D4A017]">Aviso legal</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
