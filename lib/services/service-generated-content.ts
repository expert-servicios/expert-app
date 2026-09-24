import { BATCH1_OPERATIONAL_BLUEPRINTS } from './service-operational-blueprints';

const OFFICIAL_SOURCES: Record<string, string[]> = {
  'nacionalidad-espanola-menor-nacido-en-espana': ['https://sede.mjusticia.gob.es/es/tramites/nacionalidad-espanola'],
  'arraigo-social': ['https://www.inclusion.gob.es/web/migraciones/w/autorizacion-residencia-temporal-por-circunstancias-excepcionales.-arraigo-social'],
  'arraigo-familiar': ['https://www.inclusion.gob.es/web/migraciones/w/autorizacion-residencia-temporal-por-circunstancias-excepcionales.-arraigo-familiar'],
  'arraigo-laboral': ['https://www.inclusion.gob.es/web/migraciones/w/29.-autorizacion-de-residencia-temporal-por-circunstancias-excepcionales.-arraigo-sociolaboral.'],
  'renovacion-residencia': ['https://www.inclusion.gob.es/web/migraciones/vivir-en-espana'],
  'nacionalidad-espanola': ['https://sede.mjusticia.gob.es/es/tramites/nacionalidad-espanola'],
  'reagrupacion-familiar': ['https://www.inclusion.gob.es/web/migraciones/w/autorizacion-de-residencia-temporal-por-reagrupacion-familiar'],
};

const CATEGORY_MAP: Record<string, 'extranjeria-nacionalidad' | 'tramites'> = {
  'extranjeria-nacionalidad': 'extranjeria-nacionalidad',
  'certificado-digital': 'tramites',
};

function bullets(items: string[]) {
  return items.map((item) => `- ${item}`).join('\n');
}

function numbered(items: Array<{ title: string; description: string }>) {
  return items.map((item, index) => `${index + 1}. **${item.title}** — ${item.description}`).join('\n');
}

export function getGeneratedBatch1KnowledgeDocs() {
  return BATCH1_OPERATIONAL_BLUEPRINTS.flatMap((profile) => {
    const category = CATEGORY_MAP[profile.category] ?? 'tramites';
    const officialSources = OFFICIAL_SOURCES[profile.slug] ?? [];
    const sourceBlock = officialSources.length
      ? `\n## Fuentes oficiales\n\n${bullets(officialSources)}\n`
      : '';

    return [
      {
        slug: `${profile.slug}-requisitos-checklist`,
        category,
        title: `${profile.canonicalName}: checklist de requisitos`,
        excerpt: `Checklist operativo de requisitos para ${profile.canonicalName}, conectado al expediente EXPERT y a KIA.`,
        tags: ['checklist', 'requisitos', profile.canonicalName],
        updatedAt: '19 sep 2026',
        readTime: '6 min',
        relatedServiceSlugs: [profile.slug],
        seoTitle: `${profile.canonicalName}: requisitos y checklist | EXPERT`,
        seoDescription: `Requisitos de ${profile.canonicalName} organizados como checklist operativo antes de preparar el expediente.`,
        body: `
## Antes de empezar

Este checklist sirve para ordenar la revisión inicial. No sustituye la validación profesional cuando el supuesto requiere interpretación jurídica.

## Requisitos

${bullets(profile.requirements.map((item) => item.label))}

## Qué hace KIA con este checklist

KIA puede explicar cada punto, detectar qué información falta y preparar la siguiente acción. Los puntos marcados para revisión humana no se consideran cumplidos automáticamente.

## Siguiente paso

${profile.kia.userSummary}
${sourceBlock}
        `.trim(),
      },
      {
        slug: `${profile.slug}-documentacion-checklist`,
        category,
        title: `${profile.canonicalName}: documentación necesaria`,
        excerpt: `Documentación necesaria para preparar ${profile.canonicalName} y vincular cada documento al expediente.`,
        tags: ['documentación', 'expediente', profile.canonicalName],
        updatedAt: '19 sep 2026',
        readTime: '7 min',
        relatedServiceSlugs: [profile.slug],
        seoTitle: `Documentos para ${profile.canonicalName} | Checklist EXPERT`,
        seoDescription: `Lista de documentos para ${profile.canonicalName}, con requisitos condicionales y revisión antes de presentar.`,
        body: `
## Documentos del expediente

${bullets(profile.documents.map((item) => item.conditionalWhen ? `${item.label} — ${item.conditionalWhen}` : item.label))}

## Cómo se controla en EXPERT

Cada documento se vincula al requisito correspondiente del expediente. Un archivo subido no se considera automáticamente válido: debe comprobarse vigencia, integridad, traducción, legalización o representación cuando proceda.

## Documentos pendientes

KIA puede informar al usuario de lo que falta y al Admin de lo que requiere revisión, sin inventar que un requisito está cumplido por el mero hecho de existir un archivo.
${sourceBlock}
        `.trim(),
      },
      {
        slug: `${profile.slug}-pasos-expediente`,
        category,
        title: `${profile.canonicalName}: pasos del expediente`,
        excerpt: `Flujo operativo de ${profile.canonicalName}: desde la revisión inicial hasta la presentación y seguimiento.`,
        tags: ['pasos', 'trámite', 'KIA', profile.canonicalName],
        updatedAt: '19 sep 2026',
        readTime: '7 min',
        relatedServiceSlugs: [profile.slug],
        seoTitle: `${profile.canonicalName}: pasos del expediente | EXPERT`,
        seoDescription: `Proceso paso a paso de ${profile.canonicalName}, con tareas automáticas y controles humanos.`,
        body: `
## Flujo del expediente

${numbered(profile.steps)}

## Control humano

La presentación ante una Administración, emisión definitiva o cualquier actuación que produzca efectos jurídicos queda sometida al control humano definido en el expediente.

## Papel de KIA

Para el usuario, KIA explica requisitos, documentos y estado. Para Admin, KIA resume huecos, propone siguiente acción y prepara tareas; no sustituye la aprobación profesional.
${sourceBlock}
        `.trim(),
      },
    ];
  });
}

export function getGeneratedBatch1BlogArticles() {
  return BATCH1_OPERATIONAL_BLUEPRINTS.flatMap((profile) => {
    const reqs = profile.requirements.map((item) => item.label);
    const docs = profile.documents.map((item) => item.conditionalWhen ? `${item.label} — ${item.conditionalWhen}` : item.label);

    return [
      {
        slug: `${profile.slug}-requisitos-operativos-2026`,
        category: profile.category === 'certificado-digital' ? 'Trámites' : 'Extranjería',
        title: `${profile.canonicalName}: requisitos que conviene revisar antes de contratar`,
        excerpt: `Qué comprobar antes de iniciar ${profile.canonicalName} y qué puntos requieren revisión profesional.`,
        date: '19 sep 2026',
        readTime: '6 min',
        tags: [profile.canonicalName, 'requisitos', '2026'],
        relatedServiceSlugs: [profile.slug],
        body: `
## La revisión previa evita expedientes mal orientados

Antes de iniciar ${profile.canonicalName}, conviene comprobar los requisitos de base y distinguir los puntos objetivos de los que requieren análisis profesional.

## Requisitos principales

${bullets(reqs)}

## Qué ocurre si falta un requisito

No todos los huecos tienen la misma consecuencia. Algunos impiden seguir, otros permiten completar documentación y otros requieren elegir una vía distinta. Por eso EXPERT y KIA separan la recogida de información de la decisión profesional.

## Cómo empezar

${profile.kia.userSummary}
        `.trim(),
      },
      {
        slug: `${profile.slug}-documentos-y-errores-frecuentes`,
        category: profile.category === 'certificado-digital' ? 'Trámites' : 'Extranjería',
        title: `${profile.canonicalName}: documentos y errores frecuentes`,
        excerpt: `Documentos que se revisan en ${profile.canonicalName} y errores que suelen generar retrasos o revisión adicional.`,
        date: '19 sep 2026',
        readTime: '7 min',
        tags: [profile.canonicalName, 'documentos', 'errores'],
        relatedServiceSlugs: [profile.slug],
        body: `
## Documentación que debes preparar

${bullets(docs)}

## Errores frecuentes

Los problemas más habituales son documentos caducados, datos que no coinciden entre archivos, traducciones o legalizaciones pendientes, documentos incompletos y pruebas que no acreditan exactamente el requisito exigido.

## Cómo trabaja el expediente EXPERT

Cada documento se vincula a un punto de checklist. KIA puede señalar huecos y explicar qué se solicita, pero la validación final se mantiene bajo control humano cuando afecta a viabilidad o presentación.
        `.trim(),
      },
      {
        slug: `${profile.slug}-proceso-paso-a-paso`,
        category: profile.category === 'certificado-digital' ? 'Trámites' : 'Extranjería',
        title: `${profile.canonicalName}: proceso paso a paso`,
        excerpt: `Cómo se organiza ${profile.canonicalName} desde la contratación hasta la preparación, presentación o cierre.`,
        date: '19 sep 2026',
        readTime: '7 min',
        tags: [profile.canonicalName, 'paso a paso', 'expediente'],
        relatedServiceSlugs: [profile.slug],
        body: `
## Proceso

${numbered(profile.steps)}

## Qué se automatiza

EXPERT automatiza apertura del expediente, checklist, tareas, recordatorios y contexto de KIA siempre que la operación sea segura.

## Qué no se automatiza

Las decisiones de viabilidad compleja y las actuaciones finales con efectos jurídicos o administrativos permanecen bajo aprobación humana.
        `.trim(),
      },
    ];
  });
}
