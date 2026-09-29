import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Política de Privacidad | EXPERT ESTUDIOS PROFESIONALES',
  description: 'Información RGPD y LOPDGDD sobre el tratamiento de datos en EXPERT, KIA, integraciones, expedientes y servicios profesionales.',
  alternates: { canonical: 'https://expertconsulting.es/privacidad' },
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

export default function PrivacidadPage() {
  return (
    <main className="bg-[#F8F6F1] px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#D4A017]">Legal · RGPD</p>
        <h1 className="mt-3 font-serif text-4xl font-bold text-[#0D1B2A]">Política de Privacidad</h1>
        <p className="mt-3 text-sm text-[#23364D]">Última actualización: {LAST_UPDATED}</p>

        <div className="mt-10 space-y-10">
          <Section title="1. Responsable del tratamiento">
            <p><strong>EXPERT ESTUDIOS PROFESIONALES, SLU</strong> · CIF B44991776 · C/ Pintor Agrassot, 19, 03110 Mutxamel (Alicante), España.</p>
            <p>Contacto general y de privacidad: <a className="text-[#D4A017] underline underline-offset-4" href="mailto:info@expertconsulting.es">info@expertconsulting.es</a>.</p>
            <p>Cuando EXPERT presta un servicio profesional por cuenta de un cliente que actúa como responsable de sus propios datos, EXPERT puede actuar también como encargado del tratamiento respecto de la información tratada siguiendo las instrucciones de ese cliente.</p>
          </Section>

          <Section title="2. Qué datos tratamos">
            <ul className="list-disc space-y-1 pl-6">
              <li>Identificación y contacto: nombre, apellidos, NIF/NIE/pasaporte, email, teléfono y domicilio.</li>
              <li>Datos profesionales, societarios, fiscales, contables, laborales y administrativos necesarios para cada servicio.</li>
              <li>Documentación de expedientes y archivos que el cliente aporta o autoriza a consultar.</li>
              <li>Datos de facturación, pedidos, pagos y conciliación; EXPERT no almacena números completos de tarjeta.</li>
              <li>Comunicaciones por email, formularios, KIA, Telegram u otros canales vinculados cuando el usuario los utiliza.</li>
              <li>Datos técnicos de seguridad, autenticación, logs, dispositivo y uso de la plataforma.</li>
              <li>Datos procedentes de integraciones que el usuario conecta de forma expresa, dentro de los permisos concedidos.</li>
            </ul>
            <p>En algunos encargos profesionales pueden aparecer categorías especiales de datos o información especialmente sensible. Solo se tratarán cuando resulte necesario para el servicio, exista una base jurídica válida y se apliquen controles de acceso reforzados.</p>
          </Section>

          <Section title="3. Finalidades y bases jurídicas">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead><tr className="bg-[#0D1B2A] text-white"><th className="px-4 py-3 text-left">Finalidad</th><th className="px-4 py-3 text-left">Base jurídica principal</th></tr></thead>
                <tbody className="divide-y divide-[#d8cbb5] bg-white">
                  <tr><td className="px-4 py-3">Responder consultas, preparar presupuestos y realizar actuaciones precontractuales</td><td className="px-4 py-3">Art. 6.1.b RGPD</td></tr>
                  <tr><td className="px-4 py-3">Prestar servicios, gestionar expedientes, documentos, citas, firma y comunicaciones</td><td className="px-4 py-3">Art. 6.1.b RGPD y, cuando proceda, 6.1.c</td></tr>
                  <tr><td className="px-4 py-3">Facturación, contabilidad, prevención del fraude y cumplimiento normativo</td><td className="px-4 py-3">Art. 6.1.c y 6.1.f RGPD</td></tr>
                  <tr><td className="px-4 py-3">Seguridad, auditoría, prevención de abuso, continuidad y mejora operativa</td><td className="px-4 py-3">Art. 6.1.f RGPD</td></tr>
                  <tr><td className="px-4 py-3">Comunicaciones comerciales cuando sean legalmente procedentes</td><td className="px-4 py-3">Consentimiento o base legal aplicable, con derecho de oposición/baja</td></tr>
                  <tr><td className="px-4 py-3">Analítica web opcional</td><td className="px-4 py-3">Consentimiento</td></tr>
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="4. KIA e inteligencia artificial">
            <p><strong>KIA es una asistente virtual basada en inteligencia artificial</strong>. Cuando una persona conversa con KIA, la interfaz y las comunicaciones deben identificarla como asistente virtual de EXPERT.</p>
            <p>KIA puede resumir información, localizar documentos, explicar estados, preparar borradores, clasificar solicitudes, proponer próximos pasos y ejecutar herramientas autorizadas de bajo riesgo. Las acciones sensibles mantienen controles de permisos, trazabilidad y, cuando corresponde, aprobación humana.</p>
            <p>EXPERT no utiliza KIA para adoptar por sí sola decisiones con efectos jurídicos o de importancia similar sobre una persona sin la intervención y garantías que exija la normativa. El usuario puede solicitar revisión humana cuando corresponda.</p>
            <p>Los datos enviados a proveedores de IA se limitan a lo necesario para la función solicitada y se aplican medidas de minimización, redacción y separación de contexto. Los prompts internos, credenciales y secretos no deben exponerse al cliente ni utilizarse como contenido de entrenamiento propio.</p>
          </Section>

          <Section title="5. Google Workspace, Microsoft 365 y otras integraciones">
            <p>Cuando el usuario conecta una integración, EXPERT trata únicamente los datos y permisos necesarios para las funciones autorizadas. La conexión es revocable.</p>
            <h3 className="font-semibold text-[#0D1B2A]">Google Workspace</h3>
            <p>Según la modalidad autorizada, EXPERT puede acceder a Gmail (lectura, envío y gestión), Google Calendar (lectura y gestión de eventos), Google Drive (lectura o escritura de archivos autorizados), identidad de la cuenta y funcionalidades vinculadas a reuniones/Meet. Los permisos efectivos son los mostrados por Google en la pantalla de consentimiento.</p>
            <p>Los documentos que EXPERT sincroniza a Google Drive pueden utilizarse como copia operativa. EXPERT mantiene su propio control de expediente y autorización; un identificador de Drive por sí solo no concede acceso a un cliente.</p>
            <h3 className="font-semibold text-[#0D1B2A]">Google eSignature</h3>
            <p>Cuando se utilice Google Workspace eSignature para una firma adecuada al nivel jurídico requerido, se tratarán datos de firmantes, direcciones de correo, documento objeto de firma, eventos y marcas de tiempo del proceso. El PDF final y su evidencia de auditoría pueden archivarse en el expediente.</p>
            <h3 className="font-semibold text-[#0D1B2A]">Microsoft 365</h3>
            <p>Cuando se conecte Microsoft 365, EXPERT puede utilizar Outlook, Calendar, OneDrive/SharePoint y otras funciones autorizadas a través de Microsoft Graph, siempre dentro de los permisos concedidos.</p>
          </Section>

          <Section title="6. Proveedores y destinatarios">
            <p>EXPERT utiliza proveedores tecnológicos para prestar el servicio. La relación exacta puede variar según las funciones activadas y el expediente.</p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead><tr className="bg-[#0D1B2A] text-white"><th className="px-4 py-3 text-left">Proveedor/categoría</th><th className="px-4 py-3 text-left">Uso</th></tr></thead>
                <tbody className="divide-y divide-[#d8cbb5] bg-white">
                  <tr><td className="px-4 py-3">Supabase</td><td className="px-4 py-3">Base de datos, autenticación y almacenamiento; proyecto de producción en región eu-west-2 (Londres).</td></tr>
                  <tr><td className="px-4 py-3">Vercel</td><td className="px-4 py-3">Alojamiento y despliegue de la aplicación.</td></tr>
                  <tr><td className="px-4 py-3">Google Workspace / Google Cloud</td><td className="px-4 py-3">Correo, calendario, Drive, reuniones, firma y servicios conectados cuando se autoricen.</td></tr>
                  <tr><td className="px-4 py-3">Microsoft 365</td><td className="px-4 py-3">Correo, calendario y archivos cuando el cliente conecta esta opción.</td></tr>
                  <tr><td className="px-4 py-3">Stripe</td><td className="px-4 py-3">Procesamiento de pagos, prevención del fraude y gestión de cobros.</td></tr>
                  <tr><td className="px-4 py-3">Resend / infraestructura de correo</td><td className="px-4 py-3">Envío de comunicaciones transaccionales cuando corresponda.</td></tr>
                  <tr><td className="px-4 py-3">Holded</td><td className="px-4 py-3">Facturación/contabilidad y otras funciones autorizadas para clientes conectados.</td></tr>
                  <tr><td className="px-4 py-3">OpenAI y otros proveedores de IA configurados</td><td className="px-4 py-3">Funciones de KIA, análisis y asistencia, con minimización y controles por herramienta.</td></tr>
                </tbody>
              </table>
            </div>
            <p>Cuando un proveedor implica transferencias internacionales, EXPERT aplica las garantías disponibles y exigibles, como decisiones de adecuación, el Marco de Privacidad de Datos UE-EE. UU. cuando resulte aplicable o cláusulas contractuales tipo, según el proveedor y el tratamiento.</p>
          </Section>

          <Section title="7. Conservación">
            <p>No utilizamos un único plazo genérico para todos los datos. La conservación depende de la finalidad, el tipo de expediente, las obligaciones legales y la necesidad de atender responsabilidades.</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Expedientes y documentación profesional: durante la relación y los plazos legales/profesionales aplicables.</li>
              <li>Facturación y registros contables/fiscales: durante los plazos exigidos por la normativa correspondiente.</li>
              <li>Leads no convertidos: durante el plazo interno aprobado y mientras exista finalidad legítima, con depuración periódica.</li>
              <li>Consentimientos, bajas y oposición: se conserva evidencia suficiente para acreditar el cumplimiento.</li>
              <li>Logs de seguridad: durante el plazo proporcional a la finalidad de seguridad y auditoría.</li>
            </ul>
          </Section>

          <Section title="8. Derechos de las personas">
            <p>Puedes solicitar acceso, rectificación, supresión, limitación, portabilidad y oposición; retirar el consentimiento cuando sea la base del tratamiento; y ejercer los derechos vinculados a decisiones automatizadas cuando sean aplicables.</p>
            <p>La solicitud puede enviarse a <a className="text-[#D4A017] underline underline-offset-4" href="mailto:info@expertconsulting.es">info@expertconsulting.es</a>. EXPERT podrá pedir información adicional únicamente cuando existan dudas razonables sobre la identidad.</p>
            <p>Responderemos sin dilación indebida y, en todo caso, dentro de <strong>un mes</strong> desde la recepción. Este plazo puede ampliarse otros dos meses cuando sea necesario por complejidad o número de solicitudes, informando de la ampliación y sus motivos dentro del primer mes.</p>
            <p>También puedes reclamar ante la <a className="text-[#D4A017] underline underline-offset-4" href="https://www.aepd.es" target="_blank" rel="noreferrer">Agencia Española de Protección de Datos (AEPD)</a>.</p>
          </Section>

          <Section title="9. Cookies y medición">
            <p>Las tecnologías técnicas necesarias pueden utilizarse sin consentimiento cuando cumplen los requisitos legales. Google Analytics, Google Tag Manager y Metricool se cargan únicamente después de que el usuario acepte la medición opcional.</p>
            <p>Puedes rechazar la analítica sin perder acceso al sitio y modificar tu elección desde el enlace <strong>Configurar cookies</strong> del pie de página. Consulta la <Link className="text-[#D4A017] underline underline-offset-4" href="/cookies">Política de Cookies</Link>.</p>
          </Section>

          <Section title="10. Seguridad y confidencialidad">
            <p>Aplicamos controles de acceso, segregación por usuario/empresa/expediente, autenticación, registros de auditoría, enlaces temporales para documentos y medidas técnicas y organizativas proporcionales al riesgo. Ninguna medida elimina por completo el riesgo, por lo que mantenemos procedimientos de incidencias y revisión.</p>
          </Section>

          <Section title="11. Cambios y contacto">
            <p>Esta política se revisa cuando cambian tratamientos, proveedores, integraciones, capacidades de KIA o normativa aplicable. Los cambios relevantes se comunicarán cuando corresponda.</p>
            <p>Para consultas de privacidad: <a className="text-[#D4A017] underline underline-offset-4" href="mailto:info@expertconsulting.es">info@expertconsulting.es</a>.</p>
          </Section>

          <div className="border-t border-[#D4A017]/25 pt-8 text-sm">
            <div className="flex flex-wrap gap-4">
              <Link href="/cookies" className="font-semibold text-[#D4A017]">Cookies</Link>
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
