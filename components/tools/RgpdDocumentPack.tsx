'use client';

import { Download, FileStack } from 'lucide-react';

type Profile = {
  legalName?: string;
  taxId?: string;
  activity?: string;
  contactEmail?: string;
};

function readJson(key: string) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function downloadMarkdown(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function profile(): Profile {
  return readJson('expert-rgpd-company-profile-v1') ?? {};
}

function baseHeader(title: string, p: Profile) {
  return [
    '# ' + title,
    '',
    'Empresa: ' + (p.legalName || '[razón social pendiente]'),
    'NIF/CIF: ' + (p.taxId || '[pendiente]'),
    'Actividad: ' + (p.activity || '[pendiente]'),
    'Contacto de privacidad: ' + (p.contactEmail || '[pendiente]'),
    '',
    '> Borrador generado por la herramienta gratuita EXPERT. Debe adaptarse a los tratamientos reales y validarse antes de utilizarse.',
    '',
  ];
}

function privacyNotice() {
  const p = profile();
  const treatments = readJson('expert-rgpd-treatments-v1') ?? {};
  const selected = Array.isArray(treatments.selectedIds) ? treatments.selectedIds : [];
  const custom = Array.isArray(treatments.customTreatments) ? treatments.customTreatments : [];
  const purposes = custom
    .map((t: Record<string, unknown>) => typeof t.purpose === 'string' ? t.purpose : '')
    .filter(Boolean);

  return [
    ...baseHeader('Borrador de cláusula informativa de protección de datos', p),
    '## Responsable',
    (p.legalName || '[responsable]') + ', NIF/CIF ' + (p.taxId || '[pendiente]') + '.',
    '',
    '## Finalidades',
    purposes.length
      ? purposes.map((x: string) => '- ' + x).join('\n')
      : '- Gestionar la relación, atender solicitudes y prestar los servicios correspondientes.',
    '',
    'Tratamientos predefinidos seleccionados: ' + (selected.length ? selected.join(', ') : '[revisar]') + '.',
    '',
    '## Legitimación',
    'Identificar y documentar la base jurídica correspondiente a cada finalidad (contrato, obligación legal, consentimiento, interés legítimo u otra base aplicable).',
    '',
    '## Destinatarios y encargados',
    'Revisar el inventario de proveedores/encargados de la herramienta y reflejar únicamente los destinatarios reales.',
    '',
    '## Transferencias internacionales',
    'Indicar, cuando proceda, países/organizaciones y garantías aplicables.',
    '',
    '## Conservación',
    'Aplicar la matriz de conservación aprobada para cada categoría de datos.',
    '',
    '## Derechos',
    'Las personas pueden solicitar acceso, rectificación, supresión, oposición, limitación y portabilidad cuando proceda, así como retirar el consentimiento.',
    '',
    'Canal de ejercicio: ' + (p.contactEmail || '[email de privacidad pendiente]') + '.',
    '',
    '## Reclamación',
    'Las personas interesadas pueden presentar reclamación ante la Agencia Española de Protección de Datos (AEPD): https://www.aepd.es',
    '',
  ].join('\n');
}

function rightsProcedure() {
  const p = profile();
  return [
    ...baseHeader('Procedimiento interno para ejercicio de derechos', p),
    '## Canal',
    '- Email/canal designado: ' + (p.contactEmail || '[pendiente]'),
    '- Registrar fecha de entrada y derecho solicitado.',
    '',
    '## Pasos',
    '1. Registrar la solicitud.',
    '2. Verificar identidad de forma proporcionada.',
    '3. Identificar tratamientos y sistemas afectados.',
    '4. Valorar el derecho y posibles límites legales.',
    '5. Ejecutar las acciones necesarias en sistemas y proveedores.',
    '6. Preparar respuesta clara.',
    '7. Conservar evidencia de la gestión.',
    '',
    '## Plazo',
    'Regla general RGPD: un mes, con posible ampliación en los supuestos legalmente previstos.',
    '',
    '## Escalado',
    'Los casos complejos, solicitudes repetitivas, datos de terceros o dudas sobre excepciones deben escalarse a revisión profesional.',
    '',
  ].join('\n');
}

function breachRegister() {
  const p = profile();
  return [
    ...baseHeader('Registro y protocolo de brechas de datos personales', p),
    '## Ficha de incidente',
    '- ID interno:',
    '- Fecha/hora de detección:',
    '- Fecha/hora de conocimiento por el responsable:',
    '- Persona que informa:',
    '- Sistemas/proveedores afectados:',
    '- Categorías de datos:',
    '- Número aproximado de afectados:',
    '- Descripción del incidente:',
    '',
    '## Contención',
    '- Medidas inmediatas:',
    '- Evidencias preservadas:',
    '',
    '## Evaluación',
    '- Riesgos para las personas:',
    '- Probabilidad:',
    '- Gravedad:',
    '- Medidas mitigadoras:',
    '',
    '## Decisión',
    '- ¿Notificación a AEPD?: Sí / No',
    '- Motivo:',
    '- Fecha de notificación, si procede:',
    '- ¿Comunicación a afectados?: Sí / No',
    '- Motivo:',
    '',
    '## Cierre',
    '- Causa raíz:',
    '- Medidas correctivas:',
    '- Responsable del cierre:',
    '- Fecha de cierre:',
    '',
  ].join('\n');
}

function processorChecklist() {
  const p = profile();
  const providers = readJson('expert-rgpd-provider-inventory-v1') ?? {};
  const selected = Array.isArray(providers.selectedIds) ? providers.selectedIds : [];
  const custom = Array.isArray(providers.custom) ? providers.custom : [];

  return [
    ...baseHeader('Checklist de encargados, proveedores y transferencias', p),
    '## Proveedores seleccionados',
    selected.length ? selected.map((x: string) => '- ' + x).join('\n') : '- [ninguno seleccionado]',
    '',
    '## Proveedores personalizados',
    custom.length
      ? custom.map((x: Record<string, unknown>) => '- ' + String(x.name ?? '[sin nombre]') + ' — rol: ' + String(x.role ?? 'por revisar')).join('\n')
      : '- [ninguno]',
    '',
    '## Revisar para cada proveedor',
    '- Rol real: encargado / responsable independiente / otro.',
    '- DPA o contrato del artículo 28 cuando corresponda.',
    '- Subencargados.',
    '- Ubicación y accesos remotos.',
    '- Transferencias internacionales y garantías.',
    '- Medidas de seguridad.',
    '- Retención/devolución/supresión al finalizar.',
    '- Asistencia en derechos y brechas.',
    '- Fecha de última revisión.',
    '',
  ].join('\n');
}

const DOCS = [
  ['clausula-informativa-rgpd-borrador.md', 'Cláusula informativa', privacyNotice],
  ['procedimiento-derechos-rgpd.md', 'Procedimiento de derechos', rightsProcedure],
  ['registro-brechas-rgpd.md', 'Registro de brechas', breachRegister],
  ['checklist-encargados-rgpd.md', 'Encargados y transferencias', processorChecklist],
] as const;

export function RgpdDocumentPack() {
  return (
    <section className="mt-8 border border-[#D4A017]/25 bg-white p-5 md:p-6">
      <div className="flex items-start gap-3">
        <FileStack className="mt-1 h-6 w-6 shrink-0 text-[#D4A017]" />
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#D4A017]">Fase 6 · Paquete documental</p>
          <h3 className="mt-1 font-serif text-2xl font-bold">Generar borradores base</h3>
          <p className="mt-2 text-sm leading-6 text-[#23364D]">
            Los documentos se generan en tu navegador con la información ya rellenada. No se envían a EXPERT.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {DOCS.map(([filename, label, build]) => (
          <button
            key={filename}
            type="button"
            onClick={() => downloadMarkdown(filename, build())}
            className="flex min-h-14 items-center justify-between gap-3 border border-[#D4A017]/20 bg-[#F8F6F1] px-4 py-3 text-left text-sm font-semibold transition hover:border-[#D4A017]"
          >
            <span>{label}</span>
            <Download className="h-4 w-4 shrink-0 text-[#D4A017]" />
          </button>
        ))}
      </div>

      <div className="mt-5 border-l-4 border-[#D4A017] bg-[#D4A017]/8 p-4 text-xs leading-5 text-[#526171]">
        Estos borradores no sustituyen el análisis de riesgos, el RAT, los contratos con encargados ni una EIPD cuando proceda. Antes de utilizarlos deben revisarse las finalidades, bases jurídicas, destinatarios, transferencias y plazos reales.
      </div>
    </section>
  );
}
