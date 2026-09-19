import { getServiceOperationalBlueprint } from './service-operational-blueprints';

type OperationalGuide = {
  slug: string;
  category: 'extranjeria-nacionalidad';
  title: string;
  excerpt: string;
  tags: string[];
  updatedAt: string;
  readTime: string;
  relatedServiceSlugs: string[];
  relatedServiceCategories: ['extranjeria-nacionalidad'];
  seoTitle: string;
  seoDescription: string;
  body: string;
};

const TARGETS = [
  'arraigo-familiar',
  'arraigo-laboral',
  'renovacion-residencia',
  'nacionalidad-espanola',
  'reagrupacion-familiar',
] as const;

function checklist(slug: string): OperationalGuide[] {
  const blueprint = getServiceOperationalBlueprint(slug);
  if (!blueprint) throw new Error(`Missing operational blueprint for ${slug}`);

  const reqList = blueprint.requirements
    .map((item) => `- **${item.label}**${item.reviewIf ? ` — revisión: ${item.reviewIf}` : ''}`)
    .join('\n');

  const docList = blueprint.documents
    .map((item) => {
      const suffix = item.required
        ? ' — obligatorio'
        : item.conditionalWhen
          ? ` — condicional: ${item.conditionalWhen}`
          : ' — según el caso';
      return `- **${item.label}**${suffix}${item.notes ? `. ${item.notes}` : ''}`;
    })
    .join('\n');

  const stepList = blueprint.steps
    .map((item, index) => `${index + 1}. **${item.title}** — ${item.description}${item.humanApprovalRequired ? ' Requiere validación humana.' : ''}`)
    .join('\n');

  const escalation = blueprint.kia.escalationRules.map((item) => `- ${item}`).join('\n');

  const common = {
    category: 'extranjeria-nacionalidad' as const,
    tags: ['EXPERT', blueprint.canonicalName, 'checklist', 'documentación', 'trámite'],
    updatedAt: '19 sep 2026',
    readTime: '6 min',
    relatedServiceSlugs: [blueprint.slug],
    relatedServiceCategories: ['extranjeria-nacionalidad'] as ['extranjeria-nacionalidad'],
  };

  return [
    {
      ...common,
      slug: `${blueprint.slug}-requisitos-checklist`,
      title: `${blueprint.canonicalName}: checklist de requisitos`,
      excerpt: `Checklist operativo para comprobar los requisitos de ${blueprint.canonicalName} antes de preparar el expediente.`,
      seoTitle: `${blueprint.canonicalName}: requisitos y checklist | EXPERT`,
      seoDescription: `Requisitos de ${blueprint.canonicalName}: checklist previo, puntos que requieren revisión y criterios para preparar el expediente.`,
      body: `## Antes de recopilar documentos

Este checklist sirve para comprobar primero si el caso encaja en **${blueprint.canonicalName}**. No sustituye la revisión profesional cuando existe una incidencia o un supuesto especial.

## Requisitos que comprobamos

${reqList}

## Cuándo debe intervenir un profesional

${escalation}

## Cómo usa EXPERT este checklist

KIA puede utilizar estos puntos para orientar al usuario y señalar información pendiente. La decisión de presentar un expediente, resolver una incidencia jurídica o confirmar un requisito dudoso queda reservada a revisión profesional.

La ficha operativa del servicio y el expediente usan la misma definición, de modo que el checklist no cambia según el canal desde el que se consulte.
`,
    },
    {
      ...common,
      slug: `${blueprint.slug}-documentacion-necesaria`,
      title: `${blueprint.canonicalName}: documentación necesaria`,
      excerpt: `Documentación obligatoria y condicional para preparar ${blueprint.canonicalName} con EXPERT.`,
      seoTitle: `Documentos para ${blueprint.canonicalName} | EXPERT`,
      seoDescription: `Lista de documentos obligatorios y condicionales para ${blueprint.canonicalName}, con revisión previa de EXPERT.`,
      body: `## Documentación del expediente

La documentación se organiza por requisito. Un documento marcado como condicional solo se solicita cuando el supuesto concreto lo exige.

${docList}

## Reglas de revisión

- Los documentos deben estar vigentes y ser legibles.
- Los datos personales deben coincidir entre pasaporte, TIE/NIE, certificados y formularios.
- Los documentos extranjeros pueden requerir legalización o apostilla y traducción jurada.
- KIA puede indicar qué falta, pero no valida por sí sola autenticidad, suficiencia jurídica ni representación.

## Después de subir los documentos

El expediente pasa a revisión. EXPERT registra qué requisito cubre cada documento, los faltantes y la siguiente acción para que el usuario y el equipo trabajen sobre el mismo checklist.
`,
    },
    {
      ...common,
      slug: `${blueprint.slug}-pasos-expediente`,
      title: `${blueprint.canonicalName}: pasos del expediente`,
      excerpt: `Flujo de trabajo desde la revisión inicial hasta la presentación y seguimiento de ${blueprint.canonicalName}.`,
      seoTitle: `Pasos de ${blueprint.canonicalName}: expediente y seguimiento | EXPERT`,
      seoDescription: `Cómo se tramita ${blueprint.canonicalName}: revisión, documentación, preparación, presentación y seguimiento del expediente.`,
      body: `## Flujo operativo

${stepList}

## Tareas internas

A partir del servicio contratado, EXPERT crea un expediente y genera tareas vinculadas a estas fases. Las tareas de presentación o cualquier actuación que produzca efectos ante la Administración requieren intervención humana.

## KIA como copiloto

Para el usuario, KIA puede explicar el siguiente paso, mostrar documentación pendiente y consultar el estado del expediente.

Para Admin, KIA puede resumir requisitos, documentación, pasos y puntos de escalado. Las acciones sensibles no se ejecutan automáticamente por una conversación.
`,
    },
  ];
}

export const serviceOperationalGuides: OperationalGuide[] = TARGETS.flatMap(checklist);
