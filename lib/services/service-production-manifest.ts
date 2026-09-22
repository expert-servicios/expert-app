import type { ServiceProductionStage } from './service-production-readiness';

export type ServiceProductionManifestEntry = {
  slug: string;
  stage: ServiceProductionStage;
  ruRequired: boolean;
  socialRequired: boolean;
  notes?: string;
};

export const serviceProductionManifest: ServiceProductionManifestEntry[] = [
  {
    slug: 'certificado-digital-persona-fisica',
    stage: 'production_ready',
    ruRequired: true,
    socialRequired: true,
  },
  {
    slug: 'certificado-digital-entidad',
    stage: 'production_ready',
    ruRequired: true,
    socialRequired: true,
  },
  {
    slug: 'pack-certificados-digitales',
    stage: 'production_ready',
    ruRequired: true,
    socialRequired: true,
  },
  {
    slug: 'nacionalidad-espanola-menor-nacido-en-espana',
    stage: 'content_ready',
    ruRequired: true,
    socialRequired: true,
    notes: 'Completar paquete social y gate editorial antes de campaign-ready.',
  },
  {
    slug: 'arraigo-social',
    stage: 'content_ready',
    ruRequired: true,
    socialRequired: true,
    notes: 'Contenido ES/RU cerrado; completar paquete Google y QA final para production_ready.',
  },
  {
    slug: 'arraigo-familiar',
    stage: 'commercial_ready',
    ruRequired: true,
    socialRequired: true,
    notes: 'Completar base de conocimientos, RU y paquete de canales.',
  },
  {
    slug: 'arraigo-laboral',
    stage: 'commercial_ready',
    ruRequired: true,
    socialRequired: true,
    notes: 'Pendiente suelo editorial 3 blog + 3 KB y localización.',
  },
  {
    slug: 'renovacion-residencia',
    stage: 'commercial_ready',
    ruRequired: true,
    socialRequired: true,
    notes: 'Pendiente contenido satélite, página RU y copy de representación formal para renovaciones.',
  },
  {
    slug: 'nacionalidad-espanola',
    stage: 'commercial_ready',
    ruRequired: true,
    socialRequired: true,
    notes: 'Pendiente contenido satélite y página RU; el flujo ES ya contempla mandato/poder de representante voluntario.',
  },
  {
    slug: 'reagrupacion-familiar',
    stage: 'commercial_ready',
    ruRequired: true,
    socialRequired: true,
    notes: 'Pendiente contenido satélite y página RU; incorporar copy de poder/apud acta para representación en Extranjería.',
  },
];

export function getServiceProductionManifestEntry(slug: string) {
  return serviceProductionManifest.find((entry) => entry.slug === slug);
}

export function getServicesAtStage(stage: ServiceProductionStage) {
  return serviceProductionManifest.filter((entry) => entry.stage === stage);
}
