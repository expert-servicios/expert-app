/**
 * WEB-P1 (19/10/2026): contrato editorial para la futura navegación pública.
 * No sustituye las categorías legadas ni cambia rutas, checkout, auth o KIA.
 * ÚNICAMENTE datos de lectura para preparar UI y filtros en PR posterior.
 *
 * IMPORTANTE: los destinos RU de tipo "broad" son hubs más generales,
 * NO equivalentes traducidos. Nunca generar hreflang desde estos mapas.
 */

export const PUBLIC_TOPIC_IDS = [
  'empresas-autonomos',
  'fiscalidad-contabilidad',
  'laboral-seguridad-social',
  'mercantil-registros',
  'tramites-certificados',
  'proteccion-datos',
  'extranjeria-nacionalidad',
  'digitalizacion-gestion',
] as const;

export type PublicTopicId = (typeof PUBLIC_TOPIC_IDS)[number];
export type PublicContentLocale = 'es' | 'ru'; // 'en': futura extensión, no activa.
export type PublicTopic = {
  id: PublicTopicId;
  label: Record<PublicContentLocale, string>;
  description: Record<PublicContentLocale, string>;
  /** Destinos REALES existentes en main, no futuras páginas pilar. */
  href: Record<PublicContentLocale, string>;
  ruDestinationType: 'subject' | 'broader-hub';
};

export const PUBLIC_TOPICS: readonly PublicTopic[] = [
  {
    id: 'empresas-autonomos',
    label: { es: 'Empresas y autónomos', ru: 'Компании и самозанятые' },
    description: { es: 'Crear, organizar y gestionar tu actividad o sociedad', ru: 'Создание и управление бизнесом и деятельностью autónomo' },
    href: { es: '/categoria/empresas', ru: '/ru/autonomo' },
    ruDestinationType: 'subject',
  },
  {
    id: 'fiscalidad-contabilidad',
    label: { es: 'Fiscalidad y contabilidad', ru: 'Налоги и бухгалтерский учёт' },
    description: { es: 'Impuestos, declaraciones, libros y cuentas', ru: 'Налоги, отчётность и бухгалтерские обязанности' },
    href: { es: '/categoria/fiscalidad', ru: '/ru/nalogi' },
    ruDestinationType: 'subject',
  },
  {
    id: 'laboral-seguridad-social',
    label: { es: 'Laboral y Seguridad Social', ru: 'Трудовые вопросы и Seguridad Social' },
    description: { es: 'Contratos, nóminas, cotizaciones y trámites TGSS/SEPE', ru: 'Трудовые договоры, зарплаты, взносы и TGSS/SEPE' },
    href: { es: '/blog', ru: '/ru/blog' },
    ruDestinationType: 'broader-hub',
  },
  {
    id: 'mercantil-registros',
    label: { es: 'Mercantil, notaría y registros', ru: 'Корпоративное право, нотариус и реестры' },
    description: { es: 'Sociedades, escrituras, operaciones y registros públicos', ru: 'Учредительные документы, нотариат и официальные реестры' },
    href: { es: '/servicios/notaria-propiedades', ru: '/ru/uslugi' },
    ruDestinationType: 'broader-hub',
  },
  {
    id: 'tramites-certificados',
    label: { es: 'Trámites y certificados', ru: 'Госуслуги и цифровые сертификаты' },
    description: { es: 'Certificados digitales, administraciones, DGT y otros trámites', ru: 'Цифровая подпись, государственные учреждения и документы' },
    href: { es: '/categoria/tramites', ru: '/ru/uslugi' },
    ruDestinationType: 'broader-hub',
  },
  {
    id: 'proteccion-datos',
    label: { es: 'Protección de datos', ru: 'Защита персональных данных' },
    description: { es: 'RGPD, privacidad y recursos AEPD', ru: 'RGPD, политика конфиденциальности и инструменты AEPD' },
    href: { es: '/herramientas/rgpd', ru: '/ru/instrumenty/rgpd' },
    ruDestinationType: 'subject',
  },
  {
    id: 'extranjeria-nacionalidad',
    label: { es: 'Extranjería y nacionalidad', ru: 'Миграционные вопросы и гражданство' },
    description: { es: 'Residencia, arraigo, nacionalidad y documentación', ru: 'ВНЖ, arraigo, гражданство и документы' },
    href: { es: '/categoria/extranjeria-nacionalidad', ru: '/ru/uslugi' },
    ruDestinationType: 'broader-hub',
  },
  {
    id: 'digitalizacion-gestion',
    label: { es: 'Herramientas de gestión y digitalización', ru: 'Цифровые инструменты управления' },
    description: { es: 'Holded, facturación y herramientas inteligentes', ru: 'Holded, выставление счетов и цифровое управление' },
    href: { es: '/categoria/holded', ru: '/ru/holded' },
    ruDestinationType: 'subject',
  },
];

type LegacyContent = {
  slug: string;
  categoria?: string; // Service
  category?: string; // Article / KnowledgeDoc
};

// Slugs con un tema transversal distinto de su contenedor comercial actual.
export const SERVICE_TOPIC_OVERRIDES: Readonly<Record<string, PublicTopicId>> = {
  'contabilidad-mensual': 'fiscalidad-contabilidad',
  'impuestos-trimestrales': 'fiscalidad-contabilidad',
  'cuentas-anuales': 'mercantil-registros',
  'apoderamientos-mercantiles': 'mercantil-registros',
  'holded-migracion-laboral': 'laboral-seguridad-social',
  'holded-modulo-laboral': 'laboral-seguridad-social',
  'formacion-laboral-rrhh': 'laboral-seguridad-social',
  'formacion-rgpd-aepd': 'proteccion-datos',
  'formacion-fiscal-contable': 'fiscalidad-contabilidad',
  'formacion-planificacion-fiscal': 'fiscalidad-contabilidad',
  'formacion-holded': 'digitalizacion-gestion',
  'holded-modulo-formacion': 'digitalizacion-gestion',
  'formacion-administraciones-publicas': 'tramites-certificados',
  'formacion-alta-autonomo-sl': 'empresas-autonomos',
};

const LEGACY_SERVICE_CATEGORY_TOPICS: Readonly<Record<string, PublicTopicId>> = {
  'declaraciones-impuestos': 'fiscalidad-contabilidad',
  'extranjeria-nacionalidad': 'extranjeria-nacionalidad',
  'empresas-autonomos': 'empresas-autonomos',
  holded: 'digitalizacion-gestion',
  'certificado-digital': 'tramites-certificados',
  'trafico-capitania-maritima': 'tramites-certificados',
  'notaria-propiedades': 'mercantil-registros',
  formacion: 'empresas-autonomos',
};

const LEGACY_BLOG_CATEGORY_TOPICS: Readonly<Record<string, PublicTopicId>> = {
  Fiscalidad: 'fiscalidad-contabilidad',
  Empresas: 'empresas-autonomos',
  'Extranjería': 'extranjeria-nacionalidad',
  Holded: 'digitalizacion-gestion',
  'Trámites': 'tramites-certificados',
  Formación: 'empresas-autonomos',
  Laboral: 'laboral-seguridad-social',
  'Protección de datos': 'proteccion-datos',
};

const LEGACY_DOC_CATEGORY_TOPICS: Readonly<Record<string, PublicTopicId>> = {
  fiscalidad: 'fiscalidad-contabilidad',
  empresas: 'empresas-autonomos',
  'extranjeria-nacionalidad': 'extranjeria-nacionalidad',
  holded: 'digitalizacion-gestion',
  tramites: 'tramites-certificados',
  'proteccion-datos': 'proteccion-datos',
};

// Solo cuando el título/slug refiere claramente a una materia diferente.
const rgpdSlug = /(?:rgpd|aepd|proteccion-datos|privacidad|cookies|tratamiento-datos|datos-personales)/i;
const laborSlug = /(?:nominas|nomina|seguridad-social|sepe|cotizaciones|laboral|recursos-humanos)/i;
const mercantilSlug = /(?:apoderamientos|cuentas-anuales|registro-mercantil|estatutos|herencia|donacion|hipoteca|compraventa-inmueble)/i;

export function topicForService(service: LegacyContent): PublicTopicId | null {
  if (SERVICE_TOPIC_OVERRIDES[service.slug]) return SERVICE_TOPIC_OVERRIDES[service.slug];
  return LEGACY_SERVICE_CATEGORY_TOPICS[service.categoria ?? ''] ?? null;
}

export function topicForArticle(article: LegacyContent): PublicTopicId | null {
  if (rgpdSlug.test(article.slug)) return 'proteccion-datos';
  if (laborSlug.test(article.slug)) return 'laboral-seguridad-social';
  if (mercantilSlug.test(article.slug)) return 'mercantil-registros';
  return LEGACY_BLOG_CATEGORY_TOPICS[article.category ?? ''] ?? null;
}

export function topicForDoc(doc: LegacyContent): PublicTopicId | null {
  if (rgpdSlug.test(doc.slug)) return 'proteccion-datos';
  if (laborSlug.test(doc.slug)) return 'laboral-seguridad-social';
  if (mercantilSlug.test(doc.slug)) return 'mercantil-registros';
  return LEGACY_DOC_CATEGORY_TOPICS[doc.category ?? ''] ?? null;
}

export type PublicNavLink = {
  id: string;
  label: Record<PublicContentLocale, string>;
  href: Record<PublicContentLocale, string>;
  /** RU ruta original para ese tema o un hub general con RU parcial. */
  ruDestinationType: 'subject' | 'broader-hub';
};

export const PUBLIC_NAV_DRAFT: readonly PublicNavLink[] = [
  { id: 'home', label: { es: 'Inicio', ru: 'Главная' }, href: { es: '/', ru: '/ru' }, ruDestinationType: 'subject' },
  { id: 'procedures', label: { es: 'Trámites', ru: 'Процедуры' }, href: { es: '/categoria', ru: '/ru/uslugi' }, ruDestinationType: 'broader-hub' },
  { id: 'knowledge', label: { es: 'Conocimientos', ru: 'Материалы' }, href: { es: '/docs', ru: '/ru/blog' }, ruDestinationType: 'broader-hub' },
  { id: 'tools', label: { es: 'Herramientas', ru: 'Инструменты' }, href: { es: '/herramientas/rgpd', ru: '/ru/instrumenty/rgpd' }, ruDestinationType: 'subject' },
  { id: 'training', label: { es: 'Formación', ru: 'Обучение' }, href: { es: '/academy', ru: '/ru/academy' }, ruDestinationType: 'subject' },
  { id: 'services', label: { es: 'Servicios', ru: 'Услуги' }, href: { es: '/servicios', ru: '/ru/uslugi' }, ruDestinationType: 'subject' },
  { id: 'plans', label: { es: 'Planes', ru: 'Тарифы' }, href: { es: '/planes', ru: '/ru/plany' }, ruDestinationType: 'subject' },
  { id: 'login', label: { es: 'Acceder', ru: 'Войти' }, href: { es: '/auth/login', ru: '/auth/login' }, ruDestinationType: 'broader-hub' },
];

/** KIA mantiene su widget existente: no inventar una ruta a un chat inexistente. */
export const PUBLIC_KIA_ENTRY = {
  id: 'kia',
  label: { es: 'Preguntar a KIA', ru: 'Спросить KIA' },
  action: 'open-existing-kia-widget',
} as const;
