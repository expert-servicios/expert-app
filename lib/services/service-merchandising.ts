import {
  getCatalogService,
  getServicesByCategory,
  type CategorySlug,
  type Service,
} from '@/lib/utils/catalog';

const EXCLUDED_CATEGORIES = new Set<CategorySlug>(['holded', 'formacion']);

const SERVICE_COMPANIONS: Readonly<Record<string, readonly string[]>> = {
  'certificado-digital-persona-fisica': [
    'pack-certificados-digitales',
    'alta-autonomo',
    'nie-pasaporte',
  ],
  'certificado-digital-entidad': [
    'pack-certificados-digitales',
    'constitucion-sl',
    'apoderamientos-mercantiles',
  ],
  'pack-certificados-digitales': [
    'constitucion-sl',
    'apoderamientos-mercantiles',
    'impuesto-sociedades',
  ],
  'certificado-digital-sin-animo-lucro': [
    'certificado-digital-entidad',
    'apoderamientos-mercantiles',
    'modelos-informativos',
  ],
};

const CATEGORY_COMPANIONS: Partial<Record<CategorySlug, readonly string[]>> = {
  'declaraciones-impuestos': [
    'certificado-digital-persona-fisica',
    'alta-autonomo',
    'no-residentes',
  ],
  'extranjeria-nacionalidad': [
    'certificado-digital-persona-fisica',
    'nie-pasaporte',
    'nacionalidad-espanola',
  ],
  'empresas-autonomos': [
    'certificado-digital-entidad',
    'pack-certificados-digitales',
    'impuesto-sociedades',
  ],
  'trafico-capitania-maritima': [
    'certificado-digital-persona-fisica',
    'nie-pasaporte',
    'transferencia-vehiculo',
  ],
  'notaria-propiedades': [
    'certificado-digital-persona-fisica',
    'apoderamientos-mercantiles',
    'donacion',
  ],
  'certificado-digital': [
    'alta-autonomo',
    'constitucion-sl',
    'apoderamientos-mercantiles',
  ],
};

function addCandidate(
  target: Service[],
  seen: Set<string>,
  sourceSlug: string,
  candidateSlug: string,
) {
  if (candidateSlug === sourceSlug || seen.has(candidateSlug)) return;
  const candidate = getCatalogService(candidateSlug);
  if (!candidate || EXCLUDED_CATEGORIES.has(candidate.categoria)) return;

  seen.add(candidateSlug);
  target.push(candidate);
}

/**
 * Cross-sell for punctual professional services.
 *
 * Order:
 * 1. service-specific companions;
 * 2. category-level companions;
 * 3. same-category fallback.
 *
 * Holded and training products are deliberately excluded from this template.
 */
export function getCompanionServices(service: Service, limit = 3): Service[] {
  if (EXCLUDED_CATEGORIES.has(service.categoria) || limit <= 0) return [];

  const result: Service[] = [];
  const seen = new Set<string>([service.slug]);

  for (const slug of SERVICE_COMPANIONS[service.slug] ?? []) {
    addCandidate(result, seen, service.slug, slug);
    if (result.length >= limit) return result;
  }

  for (const slug of CATEGORY_COMPANIONS[service.categoria] ?? []) {
    addCandidate(result, seen, service.slug, slug);
    if (result.length >= limit) return result;
  }

  for (const candidate of getServicesByCategory(service.categoria)) {
    addCandidate(result, seen, service.slug, candidate.slug);
    if (result.length >= limit) break;
  }

  return result;
}

export function isPunctualService(service: Service) {
  return !EXCLUDED_CATEGORIES.has(service.categoria);
}
