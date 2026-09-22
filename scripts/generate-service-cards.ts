import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og.js';
import { categories, services, type CategorySlug } from '../lib/utils/catalog';
import { getLocalizedServicePresentations } from '../lib/services/service-localized-content';
import { isArchivedService, MONTHLY_PLANS } from '../lib/marketing/meta-catalog-archive';

/**
 * Generates one branded PNG per catalog item (EXPERT logo mark + category
 * label + name + a row of 3 category-specific feature pills) so the Meta
 * catalog export has an image_url to point at. Pure asset generation: never
 * touches Supabase, never calls Meta. Output lands under
 * public/catalog/servicios/<slug>.png (Spanish) and public/catalog/servicios/ru/<slug>.png
 * (Russian, only for services with a vetted translation in service-localized-content.ts —
 * this repo does not invent legal/fiscal terminology on its own), matched by the
 * backfill script via slug.
 *
 * Ksenia (2026-09-22): wants a cream/navy/gold "premium" look closer to the
 * marketing cards she showed as a reference (photorealistic 3D renders
 * aren't something this script can produce — no AI image generation tool is
 * available here — but the layout, real EXPERT logo mark, and per-category
 * "feature pill" row below the title are). Confirmed she wants this script
 * to generate every card so they stay visually consistent, rather than
 * hand-placing individually designed images.
 *
 * Archived services (subscription-only "gestión empresarial" services +
 * anything with no fixed/floor price — see lib/marketing/meta-catalog-archive.ts)
 * get no card, and any stale card left over from a previous run is deleted.
 * The 3 monthly plans get a card too, filed under "Empresas y Autónomos"
 * since that's the category the backfill script uses for them.
 */

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'catalog', 'servicios');
const RU_OUTPUT_DIR = path.join(OUTPUT_DIR, 'ru');
const LOGO_PATH = path.join(process.cwd(), 'public', 'logo_expert_new.png');
const CARD_SIZE = 800;

const NAVY = '#0D1B2A';
const CREAM = '#F8F6F1';
const GOLD = '#D4A017';
const GRAY = '#6B7280';

const CATEGORY_LABEL: Record<CategorySlug, string> = {
  'declaraciones-impuestos': 'Fiscalidad',
  'extranjeria-nacionalidad': 'Extranjería y Nacionalidad',
  'empresas-autonomos': 'Empresas y Autónomos',
  holded: 'Holded',
  'certificado-digital': 'Certificado digital',
  'trafico-capitania-maritima': 'Tráfico y Capitanía Marítima',
  'notaria-propiedades': 'Notaría y Propiedades',
  formacion: 'Formación',
};

// 3 short feature words per category, echoing the pattern in Ksenia's
// reference images (e.g. Holded: "Migración · Configuración · Formación").
const CATEGORY_FEATURES_ES: Record<CategorySlug, [string, string, string]> = {
  'declaraciones-impuestos': ['Revisión fiscal', 'Presentación online', 'Seguimiento'],
  'extranjeria-nacionalidad': ['Estudio del caso', 'Trámite oficial', 'Seguimiento personalizado'],
  'empresas-autonomos': ['Estudio previo', 'Trámites online', 'Soporte profesional'],
  holded: ['Migración', 'Configuración', 'Formación'],
  'certificado-digital': ['Solicitud', 'Verificación', 'Entrega'],
  'trafico-capitania-maritima': ['Gestión del trámite', 'Presentación oficial', 'Seguimiento'],
  'notaria-propiedades': ['Revisión', 'Firma notarial', 'Registro'],
  formacion: ['Contenido práctico', 'Sesión en vivo', 'Certificado'],
};

const PLAN_FEATURES_ES: [string, string, string] = ['Revisión mensual', 'Alertas', 'Soporte prioritario'];

// Only translated for the 2 categories that currently have a vetted RU
// service (see lib/services/service-localized-content.ts) — plain
// process words, not fiscal/legal terminology, so no review dependency.
const CATEGORY_FEATURES_RU: Partial<Record<CategorySlug, [string, string, string]>> = {
  'certificado-digital': ['Заявка', 'Проверка', 'Выдача'],
  'extranjeria-nacionalidad': ['Изучение дела', 'Официальная процедура', 'Сопровождение'],
};

function buildCardElement(
  title: string,
  categoryLabel: string,
  features: [string, string, string],
  logoDataUri: string,
) {
  return {
    type: 'div',
    props: {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: CREAM,
        padding: 56,
      },
      children: [
        { type: 'img', props: { src: logoDataUri, width: 96, height: 96 } },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              marginTop: 12,
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 6,
              color: NAVY,
            },
            children: 'EXPERT',
          },
        },
        {
          type: 'div',
          props: {
            style: { display: 'flex', alignItems: 'center', marginTop: 16, width: 220 },
            children: [
              { type: 'div', props: { style: { display: 'flex', flexGrow: 1, height: 1, background: GOLD }, children: [] } },
              { type: 'div', props: { style: { display: 'flex', width: 6, height: 6, borderRadius: 3, background: GOLD, margin: '0 10px' }, children: [] } },
              { type: 'div', props: { style: { display: 'flex', flexGrow: 1, height: 1, background: GOLD }, children: [] } },
            ],
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              marginTop: 20,
              fontSize: 22,
              letterSpacing: 3,
              textTransform: 'uppercase',
              color: GOLD,
              fontWeight: 700,
            },
            children: categoryLabel,
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexGrow: 1,
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '0 20px',
            },
            children: {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  color: NAVY,
                  fontSize: title.length > 40 ? 46 : 56,
                  fontWeight: 700,
                  lineHeight: 1.2,
                  textAlign: 'center',
                },
                children: title,
              },
            },
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              width: '100%',
              justifyContent: 'space-between',
              borderTop: `1px solid ${GOLD}`,
              paddingTop: 28,
            },
            children: features.map((feature) => ({
              type: 'div',
              props: {
                style: { display: 'flex', flexDirection: 'column', alignItems: 'center', width: '31%' },
                children: [
                  {
                    // A plain vector bullet (no glyph) — satori has to fetch a
                    // dynamic Google Font for any character outside the base
                    // font, which fails offline/sandboxed (Status: 400).
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        background: NAVY,
                      },
                      children: {
                        type: 'div',
                        props: {
                          style: { display: 'flex', width: 12, height: 12, borderRadius: 6, background: GOLD },
                          children: [],
                        },
                      },
                    },
                  },
                  {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        marginTop: 10,
                        fontSize: 17,
                        fontWeight: 600,
                        color: GRAY,
                        textAlign: 'center',
                      },
                      children: feature,
                    },
                  },
                ],
              },
            })),
          },
        },
      ],
    },
  };
}

async function writeCard(outputPath: string, element: ReturnType<typeof buildCardElement>) {
  const response = new ImageResponse(element as never, { width: CARD_SIZE, height: CARD_SIZE });
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(outputPath, buffer);
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  await mkdir(RU_OUTPUT_DIR, { recursive: true });

  const missingCategories = services.filter((service) => !CATEGORY_LABEL[service.categoria]);
  if (missingCategories.length > 0) {
    throw new Error(`Falta estilo para categorías: ${missingCategories.map((s) => s.categoria).join(', ')}`);
  }

  const logoBuffer = await readFile(LOGO_PATH);
  const logoDataUri = `data:image/png;base64,${logoBuffer.toString('base64')}`;

  let written = 0;
  let archived = 0;
  for (const service of services) {
    if (isArchivedService(service)) {
      archived += 1;
      // Delete any stale card left over from before this service was archived.
      await rm(path.join(OUTPUT_DIR, `${service.slug}.png`), { force: true });
      await rm(path.join(RU_OUTPUT_DIR, `${service.slug}.png`), { force: true });
      continue;
    }
    const element = buildCardElement(service.name, CATEGORY_LABEL[service.categoria], CATEGORY_FEATURES_ES[service.categoria], logoDataUri);
    await writeCard(path.join(OUTPUT_DIR, `${service.slug}.png`), element);
    written += 1;
  }

  console.log(`Generadas ${written} tarjetas de servicio (ES) en ${path.relative(process.cwd(), OUTPUT_DIR)}`);
  console.log(`${archived} servicios archivados (sin tarjeta, sin precio fijo o solo por suscripción).`);
  console.log(`Categorías conocidas: ${categories.length + 1} (incluye 'formacion')`);

  let writtenPlans = 0;
  for (const plan of MONTHLY_PLANS) {
    const element = buildCardElement(plan.name, 'Planes mensuales', PLAN_FEATURES_ES, logoDataUri);
    await writeCard(path.join(OUTPUT_DIR, `${plan.slug}.png`), element);
    writtenPlans += 1;
  }

  console.log(`Generadas ${writtenPlans} tarjetas de planes mensuales en ${path.relative(process.cwd(), OUTPUT_DIR)}`);

  // Solo para servicios con traducción ya vetada en service-localized-content.ts —
  // el resto del catálogo aún no tiene nombre/descripción en ruso (ver RU backlog).
  const ruPresentations = getLocalizedServicePresentations('ru');
  let writtenRu = 0;
  for (const presentation of ruPresentations) {
    const service = services.find((item) => item.slug === presentation.serviceSlug);
    if (!service || isArchivedService(service)) continue;
    const categoryLabel = presentation.categoryLabel ?? CATEGORY_LABEL[service.categoria];
    const features = CATEGORY_FEATURES_RU[service.categoria] ?? CATEGORY_FEATURES_ES[service.categoria];
    const element = buildCardElement(presentation.title, categoryLabel, features, logoDataUri);
    await writeCard(path.join(RU_OUTPUT_DIR, `${service.slug}.png`), element);
    writtenRu += 1;
  }

  console.log(`Generadas ${writtenRu} tarjetas de servicio (RU) en ${path.relative(process.cwd(), RU_OUTPUT_DIR)}`);
  console.log(`${services.length - archived - writtenRu} servicios activos sin traducción al ruso todavía (fuera de alcance de este script).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
