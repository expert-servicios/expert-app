import type { KnowledgeDoc } from '@/lib/utils/docs';
import {
  getBatch1OperationProfiles,
  type ServiceOperationProfile,
} from '@/lib/services/service-operations';

function bullets(items: string[]): string {
  return items.map((item) => `- ${item}`).join('\n');
}

function sourceSection(profile: ServiceOperationProfile): string {
  if (!profile.officialSources.length) {
    return '## Fuente operativa\n\nDefinición comercial y operativa interna de EXPERT.';
  }
  return `## Fuentes oficiales y versión\n\nVersión operativa: **${profile.version}**.\n\n${bullets(profile.officialSources)}`;
}

function requirementGuide(profile: ServiceOperationProfile): KnowledgeDoc {
  return {
    slug: `${profile.slug}-requisitos-checklist`,
    category: profile.category === 'certificado-digital' ? 'tramites' : 'extranjeria-nacionalidad',
    title: `${profile.displayName}: checklist de requisitos`,
    excerpt: `Checklist operativo para comprobar los requisitos antes de preparar ${profile.displayName}.`,
    tags: [profile.displayName, 'requisitos', 'checklist', 'EXPERT'],
    updatedAt: '19 sep 2026',
    readTime: '5 min',
    relatedServiceSlugs: [profile.slug],
    relatedServiceCategories: [profile.category as KnowledgeDoc['relatedServiceCategories'] extends Array<infer T> ? T : never],
    seoTitle: `${profile.displayName}: requisitos y checklist | EXPERT`,
    seoDescription: `Comprueba los requisitos de ${profile.displayName} antes de iniciar el expediente. Checklist operativo actualizado por EXPERT.`,
    body: `
## Para qué sirve este checklist

Esta guía permite comprobar la situación inicial antes de recopilar todo el expediente. KIA puede ayudarte a recorrer los puntos y detectar qué debe revisar el equipo profesional.

## Requisitos

${profile.requirements.map((item) => `- **${item.required ? 'Obligatorio' : 'Según el caso'}:** ${item.label}`).join('\n')}

## Regla de seguridad

Un resultado aparentemente favorable en el checklist **no equivale a una resolución jurídica definitiva**. Los puntos marcados para revisión humana deben validarse antes de presentar o ejecutar una actuación irreversible.

## Siguiente paso

${profile.nextAction}

${sourceSection(profile)}
    `,
  };
}

function documentsGuide(profile: ServiceOperationProfile): KnowledgeDoc {
  return {
    slug: `${profile.slug}-documentacion-checklist`,
    category: profile.category === 'certificado-digital' ? 'tramites' : 'extranjeria-nacionalidad',
    title: `${profile.displayName}: documentación necesaria`,
    excerpt: `Documentación que debe prepararse y revisarse para ${profile.displayName}.`,
    tags: [profile.displayName, 'documentación', 'expediente', 'checklist'],
    updatedAt: '19 sep 2026',
    readTime: '6 min',
    relatedServiceSlugs: [profile.slug],
    relatedServiceCategories: [profile.category as KnowledgeDoc['relatedServiceCategories'] extends Array<infer T> ? T : never],
    seoTitle: `${profile.displayName}: documentos necesarios | EXPERT`,
    seoDescription: `Lista de documentos para ${profile.displayName}, con requisitos condicionales y revisión del expediente.`,
    body: `
## Documentación inicial

${profile.documents.map((item) => {
  const suffix = item.condition ? ` — ${item.condition}` : '';
  return `- **${item.required ? 'Obligatorio' : 'Según el caso'}:** ${item.label}${suffix}`;
}).join('\n')}

## Cómo trabaja EXPERT con la documentación

1. El cliente aporta los documentos desde el área segura.
2. El expediente vincula cada documento con su punto del checklist.
3. KIA puede identificar requisitos pendientes y explicar qué falta.
4. El equipo revisa vigencia, coherencia, traducciones/legalizaciones y cualquier incidencia.
5. La presentación o emisión se mantiene bajo el gate humano definido para el servicio.

## Qué ocurre si falta algo

No se fuerza el avance del expediente. El caso permanece en documentación/revisión y KIA puede explicar el pendiente tanto al usuario como al administrador.

${sourceSection(profile)}
    `,
  };
}

function processGuide(profile: ServiceOperationProfile): KnowledgeDoc {
  return {
    slug: `${profile.slug}-pasos-expediente`,
    category: profile.category === 'certificado-digital' ? 'tramites' : 'extranjeria-nacionalidad',
    title: `${profile.displayName}: pasos del expediente`,
    excerpt: `Fases, controles y tareas que sigue EXPERT para tramitar ${profile.displayName}.`,
    tags: [profile.displayName, 'pasos', 'expediente', 'KIA'],
    updatedAt: '19 sep 2026',
    readTime: '6 min',
    relatedServiceSlugs: [profile.slug],
    relatedServiceCategories: [profile.category as KnowledgeDoc['relatedServiceCategories'] extends Array<infer T> ? T : never],
    seoTitle: `${profile.displayName}: pasos del expediente | EXPERT`,
    seoDescription: `Proceso de ${profile.displayName}: fases del expediente, controles, tareas y puntos que requieren validación humana.`,
    body: `
## Flujo del expediente

${profile.process.map((step, index) => `${index + 1}. **${step.title}** — ${step.description}${step.humanGate ? ' **Requiere validación humana.**' : ''}`).join('\n')}

## Tareas iniciales que puede generar el sistema

${profile.initialTasks.map((task) => `- **${task.title}** — ${task.description}${task.requiresHumanApproval ? ' Requiere aprobación humana.' : ''}`).join('\n')}

## Papel de KIA

Para el usuario, KIA explica requisitos, documentación, pendientes y estado del expediente. Para Admin, KIA actúa como copiloto: resume el caso, señala huecos, propone la siguiente acción y prepara tareas. No sustituye los gates humanos de presentación, emisión o decisión jurídica.

## Próxima acción al abrir el expediente

**${profile.nextAction}**

${sourceSection(profile)}
    `,
  };
}

export function getBatch1OperationalKnowledgeDocs(): KnowledgeDoc[] {
  return getBatch1OperationProfiles().flatMap((profile) => [
    requirementGuide(profile),
    documentsGuide(profile),
    processGuide(profile),
  ]);
}
