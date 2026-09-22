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
  'transferencia-vehiculo': {
    serviceSlug: 'transferencia-vehiculo',
    locale: 'ru',
    path: '/ru/uslugi/perevod-avtomobilya-na-novogo-vladeltsa',
    title: 'Перерегистрация автомобиля в DGT',
    summary: 'Переоформление владельца автомобиля при покупке б/у: проверка документов, ITP и получение нового permiso de circulación.',
    categoryLabel: 'Транспорт и морская администрация',
    socialCardTitle: 'Перерегистрация авто',
    socialCardText: 'Проверка договора, уплата ITP и получение нового permiso de circulación.',
    indexable: false,
    sitemapPriority: 0.6,
    sitemapChangeFrequency: 'monthly',
  },
  'duplicado-permiso': {
    serviceSlug: 'duplicado-permiso',
    locale: 'ru',
    path: '/ru/uslugi/dublikat-voditelskih-dokumentov',
    title: 'Дубликат документов ГИБДД Испании (DGT)',
    summary: 'Оформление дубликата водительского удостоверения, permiso de circulación или технического паспорта.',
    categoryLabel: 'Транспорт и морская администрация',
    socialCardTitle: 'Дубликат документов',
    socialCardText: 'Права, permiso de circulación или ficha técnica — оформление дубликата в DGT.',
    indexable: false,
    sitemapPriority: 0.6,
    sitemapChangeFrequency: 'monthly',
  },
  'hipoteca-cancelacion': {
    serviceSlug: 'hipoteca-cancelacion',
    locale: 'ru',
    path: '/ru/uslugi/snyatie-ipoteki-s-reestra',
    title: 'Снятие ипотеки с регистрации (cancelación de hipoteca)',
    summary: 'Погасили ипотечный кредит — снимаем обременение с Registro de la Propiedad: банковские документы, нотариальный акт и подача в реестр.',
    categoryLabel: 'Нотариат и недвижимость',
    socialCardTitle: 'Снятие ипотеки',
    socialCardText: 'Справка банка, нотариальный акт и снятие обременения с недвижимости.',
    indexable: false,
    sitemapPriority: 0.65,
    sitemapChangeFrequency: 'monthly',
  },
  'certificado-digital-sin-animo-lucro': {
    serviceSlug: 'certificado-digital-sin-animo-lucro',
    locale: 'ru',
    path: '/ru/uslugi/cifrovoi-sertifikat-nekommercheskoi-organizatsii',
    title: 'Цифровой сертификат Camerfirma для некоммерческой организации',
    summary: 'Сертификат для ассоциаций, фондов и НКО: онлайн-проверка представителя и полномочий, оформление и установка.',
    categoryLabel: 'Цифровые сертификаты',
    socialCardTitle: 'Сертификат для НКО',
    socialCardText: 'Для ассоциаций и фондов. Проверка, оформление и установка онлайн.',
    indexable: false,
    sitemapPriority: 0.6,
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
