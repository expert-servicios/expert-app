import { SERVICE_OPERATION_PROFILES } from './service-operations';

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
  return Object.values(SERVICE_OPERATION_PROFILES).flatMap((profile) => {
    const category = CATEGORY_MAP[profile.category] ?? 'tramites';
    const sourceBlock = profile.officialSources.length
      ? `\n## Fuentes oficiales\n\n${bullets(profile.officialSources)}\n`
      : '';

    return [
      {
        slug: `${profile.slug}-requisitos-checklist`,
        category,
        title: `${profile.displayName}: checklist de requisitos`,
        excerpt: `Checklist operativo de requisitos para ${profile.displayName}, conectado al expediente EXPERT y a KIA.`,
        tags: ['checklist', 'requisitos', profile.displayName],
        updatedAt: '19 sep 2026',
        readTime: '6 min',
        relatedServiceSlugs: [profile.slug],
        seoTitle: `${profile.displayName}: requisitos y checklist | EXPERT`,
        seoDescription: `Requisitos de ${profile.displayName} organizados como checklist operativo antes de preparar el expediente.`,
        body: `
## Antes de empezar

Este checklist sirve para ordenar la revisión inicial. No sustituye la validación profesional cuando el supuesto requiere interpretación jurídica.

## Requisitos

${bullets(profile.requirements.map((item) => item.label))}

## Qué hace KIA con este checklist

KIA puede explicar cada punto, detectar qué información falta y preparar la siguiente acción. Los puntos marcados para revisión humana no se consideran cumplidos automáticamente.

## Siguiente paso

${profile.clientSummary}
${sourceBlock}
        `.trim(),
      },
      {
        slug: `${profile.slug}-documentacion-checklist`,
        category,
        title: `${profile.displayName}: documentación necesaria`,
        excerpt: `Documentación necesaria para preparar ${profile.displayName} y vincular cada documento al expediente.`,
        tags: ['documentación', 'expediente', profile.displayName],
        updatedAt: '19 sep 2026',
        readTime: '7 min',
        relatedServiceSlugs: [profile.slug],
        seoTitle: `Documentos para ${profile.displayName} | Checklist EXPERT`,
        seoDescription: `Lista de documentos para ${profile.displayName}, con requisitos condicionales y revisión antes de presentar.`,
        body: `
## Documentos del expediente

${bullets(profile.documents.map((item) => item.condition ? `${item.label} — ${item.condition}` : item.label))}

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
        title: `${profile.displayName}: pasos del expediente`,
        excerpt: `Flujo operativo de ${profile.displayName}: desde la revisión inicial hasta la presentación y seguimiento.`,
        tags: ['pasos', 'trámite', 'KIA', profile.displayName],
        updatedAt: '19 sep 2026',
        readTime: '7 min',
        relatedServiceSlugs: [profile.slug],
        seoTitle: `${profile.displayName}: pasos del expediente | EXPERT`,
        seoDescription: `Proceso paso a paso de ${profile.displayName}, con tareas automáticas y controles humanos.`,
        body: `
## Flujo del expediente

${numbered(profile.process)}

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
  return Object.values(SERVICE_OPERATION_PROFILES).flatMap((profile) => {
    const reqs = profile.requirements.map((item) => item.label);
    const docs = profile.documents.map((item) => item.label);

    return [
      {
        slug: `${profile.slug}-requisitos-operativos-2026`,
        category: profile.category === 'certificado-digital' ? 'Trámites' : 'Extranjería',
        title: `${profile.displayName}: requisitos que conviene revisar antes de contratar`,
        excerpt: `Qué comprobar antes de iniciar ${profile.displayName} y qué puntos requieren revisión profesional.`,
        date: '19 sep 2026',
        readTime: '6 min',
        tags: [profile.displayName, 'requisitos', '2026'],
        relatedServiceSlugs: [profile.slug],
        body: `
## La revisión previa evita expedientes mal orientados

Antes de iniciar ${profile.displayName}, conviene comprobar los requisitos de base y distinguir los puntos objetivos de los que requieren análisis profesional.

## Requisitos principales

${bullets(reqs)}

## Qué ocurre si falta un requisito

No todos los huecos tienen la misma consecuencia. Algunos impiden seguir, otros permiten completar documentación y otros requieren elegir una vía distinta. Por eso EXPERT y KIA separan la recogida de información de la decisión profesional.

## Cómo empezar

${profile.clientSummary}
        `.trim(),
      },
      {
        slug: `${profile.slug}-documentos-y-errores-frecuentes`,
        category: profile.category === 'certificado-digital' ? 'Trámites' : 'Extranjería',
        title: `${profile.displayName}: documentos y errores frecuentes`,
        excerpt: `Documentos que se revisan en ${profile.displayName} y errores que suelen generar retrasos o revisión adicional.`,
        date: '19 sep 2026',
        readTime: '7 min',
        tags: [profile.displayName, 'documentos', 'errores'],
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
        title: `${profile.displayName}: proceso paso a paso`,
        excerpt: `Cómo se organiza ${profile.displayName} desde la contratación hasta la preparación, presentación o cierre.`,
        date: '19 sep 2026',
        readTime: '7 min',
        tags: [profile.displayName, 'paso a paso', 'expediente'],
        relatedServiceSlugs: [profile.slug],
        body: `
## Proceso

${numbered(profile.process)}

## Qué se automatiza

EXPERT automatiza apertura del expediente, checklist, tareas, recordatorios y contexto de KIA siempre que la operación sea segura.

## Qué no se automatiza

Las decisiones de viabilidad compleja y las actuaciones finales con efectos jurídicos o administrativos permanecen bajo aprobación humana.
        `.trim(),
      },
    ];
  });
}
