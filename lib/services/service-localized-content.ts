export type SupportedServiceLocale = 'es' | 'ru';

export type LocalizedServicePresentation = {
  serviceSlug: string;
  locale: SupportedServiceLocale;
  path: string;
  title: string;
  summary: string;
  categoryLabel?: string;
  socialCardTitle?: string;
  socialCardText?: string;
  indexable?: boolean;
  sitemapPriority?: number;
  sitemapChangeFrequency?: 'weekly' | 'monthly';
};

const RU_SERVICE_PRESENTATIONS: Record<string, LocalizedServicePresentation> = {
  'certificado-digital-persona-fisica': {
    serviceSlug: 'certificado-digital-persona-fisica',
    locale: 'ru',
    path: '/ru/uslugi/cifrovoi-sertifikat-fizicheskogo-litsa',
    title: 'Цифровой сертификат Camerfirma для физического лица',
    summary: 'Полностью онлайн: проверка личности, оформление, установка и проверка работы.',
    categoryLabel: 'Цифровые сертификаты',
    socialCardTitle: 'Полностью онлайн',
    socialCardText: 'Проверка, оформление, установка и проверка работы.',
    indexable: true,
    sitemapPriority: 0.85,
    sitemapChangeFrequency: 'monthly',
  },
  'certificado-digital-entidad': {
    serviceSlug: 'certificado-digital-entidad',
    locale: 'ru',
    path: '/ru/uslugi/cifrovoi-sertifikat-organizatsii',
    title: 'Цифровой сертификат Camerfirma для организации',
    summary: 'Онлайн-проверка документов и полномочий представителя, оформление и установка.',
    categoryLabel: 'Цифровые сертификаты',
    socialCardTitle: 'Полностью онлайн',
    socialCardText: 'Проверка документов, полномочий, оформление и установка.',
    indexable: true,
    sitemapPriority: 0.85,
    sitemapChangeFrequency: 'monthly',
  },
  'pack-certificados-digitales': {
    serviceSlug: 'pack-certificados-digitales',
    locale: 'ru',
    path: '/ru/uslugi/paket-cifrovyh-sertifikatov',
    title: 'Пакет цифровых сертификатов — физлицо + компания',
    summary: 'Два сертификата одним заказом: 200 € + IVA, полностью онлайн.',
    categoryLabel: 'Цифровые сертификаты',
    socialCardTitle: 'Два сертификата онлайн',
    socialCardText: 'Личный и корпоративный сертификаты одним заказом.',
    indexable: true,
    sitemapPriority: 0.9,
    sitemapChangeFrequency: 'weekly',
  },
  'arraigo-social': {
    serviceSlug: 'arraigo-social',
    locale: 'ru',
    path: '/ru/uslugi/arraigo-social',
    title: 'Arraigo Social в Испании',
    summary: 'Актуальные требования 2026: 2 года пребывания, семейные связи и средства или informe de integración social.',
    categoryLabel: 'ВНЖ и гражданство',
    socialCardTitle: 'Arraigo Social 2026',
    socialCardText: 'Проверка основания, документов, EX-10 и сопровождение подачи.',
    indexable: true,
    sitemapPriority: 0.85,
    sitemapChangeFrequency: 'monthly',
  },
  'nacionalidad-espanola-menor-nacido-en-espana': {
    serviceSlug: 'nacionalidad-espanola-menor-nacido-en-espana',
    locale: 'ru',
    path: '/ru/uslugi/grazhdanstvo-ispanii-rebenok-rozhdennyy-v-ispanii',
    title: 'Испанское гражданство для ребёнка, родившегося в Испании',
    summary: 'Подготовка и подача заявления по резиденции для несовершеннолетнего ребёнка, родившегося в Испании.',
    categoryLabel: 'ВНЖ и гражданство',
    socialCardTitle: 'Гражданство ребёнка',
    socialCardText: 'Проверка резиденции, документов, пошлины и подготовка expediente.',
    indexable: false,
    sitemapPriority: 0.7,
    sitemapChangeFrequency: 'monthly',
  },
};

export function getLocalizedServicePresentation(
  serviceSlug: string,
  locale: SupportedServiceLocale,
): LocalizedServicePresentation | undefined {
  if (locale === 'es') return undefined;
  return RU_SERVICE_PRESENTATIONS[serviceSlug];
}

export function getRuServicePath(serviceSlug: string): string | undefined {
  return RU_SERVICE_PRESENTATIONS[serviceSlug]?.path;
}

export function getLocalizedServicePresentations(locale: SupportedServiceLocale) {
  return locale === 'ru' ? Object.values(RU_SERVICE_PRESENTATIONS) : [];
}
