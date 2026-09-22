import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og.js';
import { categories, services, type CategorySlug } from '../lib/utils/catalog';
import { getLocalizedServicePresentations } from '../lib/services/service-localized-content';
import { isArchivedService, MONTHLY_PLANS } from '../lib/marketing/meta-catalog-archive';

/**
 * Generates one branded PNG per catalog item (category palette + icon letter +
 * name) so the Meta catalog export has an image_url to point at. Pure asset
 * generation: never touches Supabase, never calls Meta. Output lands under
 * public/catalog/servicios/<slug>.png (Spanish) and public/catalog/servicios/ru/<slug>.png
 * (Russian, only for services with a vetted translation in service-localized-content.ts —
 * this repo does not invent legal/fiscal terminology on its own), matched by the
 * backfill script via slug.
 *
 * Ksenia (2026-09-22): archived services (subscription-only "gestión
 * empresarial" services + anything with no fixed/floor price — see
 * lib/marketing/meta-catalog-archive.ts) get no card, and any stale card
 * left over from a previous run is deleted. The 3 monthly plans get a card
 * instead, sharing the "Empresas y Autónomos" accent since that's the
 * category the backfill script files them under.
 */

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'catalog', 'servicios');
const RU_OUTPUT_DIR = path.join(OUTPUT_DIR, 'ru');
const CARD_SIZE = 800;

const CATEGORY_STYLE: Record<CategorySlug, { accent: string; label: string }> = {
  'declaraciones-impuestos': { accent: '#D4A017', label: 'Fiscalidad' },
  'extranjeria-nacionalidad': { accent: '#6B8CAE', label: 'Extranjería y Nacionalidad' },
  'empresas-autonomos': { accent: '#4C9A6A', label: 'Empresas y Autónomos' },
  holded: { accent: '#B8548C', label: 'Holded' },
  'certificado-digital': { accent: '#5E7CE2', label: 'Certificado digital' },
  'trafico-capitania-maritima': { accent: '#3FA7A0', label: 'Tráfico y Capitanía Marítima' },
  'notaria-propiedades': { accent: '#C77B3D', label: 'Notaría y Propiedades' },
  formacion: { accent: '#8B6FD4', label: 'Formación' },
};

const PLAN_STYLE = { accent: CATEGORY_STYLE['empresas-autonomos'].accent, label: 'Planes mensuales' };

const NAVY = '#0D1B2A';
const CREAM = '#F8F6F1';
const GRAY = '#9CA3AF';

function buildCardElement(serviceName: string, accent: string, categoryLabel: string, footerText: string) {
  const initial = categoryLabel.charAt(0).toUpperCase();

  return {
    type: 'div',
    props: {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: NAVY,
        padding: 64,
      },
      children: [
        {
          type: 'div',
          props: {
            style: { display: 'flex', width: '100%', height: 8, background: accent, borderRadius: 4 },
            children: [],
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'center',
              marginTop: 56,
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    background: accent,
                    color: NAVY,
                    fontSize: 34,
                    fontWeight: 700,
                  },
                  children: initial,
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    marginLeft: 24,
                    fontSize: 26,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    color: accent,
                  },
                  children: categoryLabel,
                },
              },
            ],
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexGrow: 1,
              alignItems: 'center',
            },
            children: {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  color: CREAM,
                  fontSize: serviceName.length > 40 ? 52 : 64,
                  fontWeight: 700,
                  lineHeight: 1.15,
                },
                children: serviceName,
              },
            },
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: `1px solid ${GRAY}`,
              paddingTop: 24,
            },
            children: [
              {
                type: 'div',
                props: {
                  style: { display: 'flex', color: CREAM, fontSize: 28, fontWeight: 700, letterSpacing: 4 },
                  children: 'EXPERT',
                },
              },
              {
                type: 'div',
                props: {
                  style: { display: 'flex', color: GRAY, fontSize: 20 },
                  children: footerText,
                },
              },
            ],
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

  const missingCategories = services.filter((service) => !CATEGORY_STYLE[service.categoria]);
  if (missingCategories.length > 0) {
    throw new Error(`Falta estilo para categorías: ${missingCategories.map((s) => s.categoria).join(', ')}`);
  }

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
    const style = CATEGORY_STYLE[service.categoria];
    const element = buildCardElement(service.name, style.accent, style.label, 'Gestoría');
    await writeCard(path.join(OUTPUT_DIR, `${service.slug}.png`), element);
    written += 1;
  }

  console.log(`Generadas ${written} tarjetas de servicio (ES) en ${path.relative(process.cwd(), OUTPUT_DIR)}`);
  console.log(`${archived} servicios archivados (sin tarjeta, sin precio fijo o solo por suscripción).`);
  console.log(`Categorías conocidas: ${categories.length + 1} (incluye 'formacion')`);

  let writtenPlans = 0;
  for (const plan of MONTHLY_PLANS) {
    const element = buildCardElement(plan.name, PLAN_STYLE.accent, PLAN_STYLE.label, 'Gestoría');
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
    const categoryLabel = presentation.categoryLabel ?? CATEGORY_STYLE[service.categoria].label;
    const element = buildCardElement(presentation.title, CATEGORY_STYLE[service.categoria].accent, categoryLabel, 'Испания');
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
