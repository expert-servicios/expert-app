import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og.js';
import { categories, services, type CategorySlug } from '../lib/utils/catalog';

/**
 * Generates one branded PNG per service (category palette + icon letter + service
 * name) so the Meta catalog export has an image_url to point at. Pure asset
 * generation: never touches Supabase, never calls Meta. Output lands under
 * public/catalog/servicios/<slug>.png, matched by the backfill script via slug.
 */

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'catalog', 'servicios');
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

const NAVY = '#0D1B2A';
const CREAM = '#F8F6F1';
const GRAY = '#9CA3AF';

function buildCardElement(serviceName: string, categorySlug: CategorySlug) {
  const style = CATEGORY_STYLE[categorySlug];
  const initial = style.label.charAt(0).toUpperCase();

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
            style: { display: 'flex', width: '100%', height: 8, background: style.accent, borderRadius: 4 },
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
                    background: style.accent,
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
                    color: style.accent,
                  },
                  children: style.label,
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
                  children: 'Gestoría',
                },
              },
            ],
          },
        },
      ],
    },
  };
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const missingCategories = services.filter((service) => !CATEGORY_STYLE[service.categoria]);
  if (missingCategories.length > 0) {
    throw new Error(`Falta estilo para categorías: ${missingCategories.map((s) => s.categoria).join(', ')}`);
  }

  let written = 0;
  for (const service of services) {
    const element = buildCardElement(service.name, service.categoria);
    const response = new ImageResponse(element as never, { width: CARD_SIZE, height: CARD_SIZE });
    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(path.join(OUTPUT_DIR, `${service.slug}.png`), buffer);
    written += 1;
  }

  console.log(`Generadas ${written} tarjetas de servicio en ${path.relative(process.cwd(), OUTPUT_DIR)}`);
  console.log(`Categorías conocidas: ${categories.length + 1} (incluye 'formacion')`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
