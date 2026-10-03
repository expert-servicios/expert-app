export type CatalogImageLocale = 'es' | 'ru';

export type CatalogImageCategoryKey =
  | 'declaraciones-impuestos'
  | 'extranjeria-nacionalidad'
  | 'empresas-autonomos'
  | 'holded'
  | 'certificado-digital'
  | 'trafico-capitania-maritima'
  | 'notaria-propiedades'
  | 'formacion';

type LocalePreset = {
  categoryLabel: string;
  subtitle: string;
  features: [string, string, string];
};

type CategoryPreset = {
  scene: string;
  es: LocalePreset;
  ru: LocalePreset;
};

export const EXPERT_CATALOG_IMAGE_DEFAULT_MODEL = 'gpt-image-2.5-sunburst';
export const EXPERT_CATALOG_IMAGE_SIZE = 1024;
export const EXPERT_CATALOG_IMAGE_STYLE_VERSION = 'expert-premium-v2';

const PRESETS: Record<CatalogImageCategoryKey, CategoryPreset> = {
  'declaraciones-impuestos': {
    scene:
      'premium tax advisory still life: elegant ivory tax return document, euro motif, calculator or financial worksheet, navy-and-gold professional shield, subtle official-document cues',
    es: {
      categoryLabel: 'Fiscalidad',
      subtitle: 'Renta • Impuestos • Revisión',
      features: ['Revisión fiscal', 'Presentación online', 'Soporte profesional'],
    },
    ru: {
      categoryLabel: 'Налоги',
      subtitle: 'Декларации • Налоги • Проверка',
      features: ['Налоговая проверка', 'Онлайн-подача', 'Поддержка эксперта'],
    },
  },
  'extranjeria-nacionalidad': {
    scene:
      'premium immigration and nationality still life: elegant residence permit or passport-like document without real personal data, Spain silhouette motif, official folder, navy-and-gold legal shield',
    es: {
      categoryLabel: 'Extranjería y Nacionalidad',
      subtitle: 'Residencia • Nacionalidad • Renovaciones',
      features: ['Revisión documental', 'Presentación online', 'Soporte profesional'],
    },
    ru: {
      categoryLabel: 'ВНЖ и гражданство',
      subtitle: 'Резиденция • Гражданство • Продление',
      features: ['Проверка документов', 'Онлайн-подача', 'Сопровождение'],
    },
  },
  'empresas-autonomos': {
    scene:
      'premium business administration still life: ivory business folder, elegant small office building or briefcase, clean business charts, navy-and-gold corporate shield',
    es: {
      categoryLabel: 'Empresas y Autónomos',
      subtitle: 'Alta • Sociedad • Gestión',
      features: ['Estudio previo', 'Trámites online', 'Soporte profesional'],
    },
    ru: {
      categoryLabel: 'Бизнес и самозанятые',
      subtitle: 'Регистрация • Компания • Управление',
      features: ['Предварительный анализ', 'Онлайн-процедуры', 'Поддержка'],
    },
  },
  holded: {
    scene:
      'premium business digitalization still life: elegant laptop with a generic ERP dashboard, invoices flowing into a clean digital workflow, ivory configuration cards, coral-red geometric software accents, navy-and-gold professional shield; do not render any software brand name',
    es: {
      categoryLabel: 'Digitalización y Holded',
      subtitle: 'Migración • Configuración • Formación',
      features: ['Procesos online', 'Automatización', 'Soporte experto'],
    },
    ru: {
      categoryLabel: 'Цифровизация и Holded',
      subtitle: 'Миграция • Настройка • Обучение',
      features: ['Онлайн-процессы', 'Автоматизация', 'Поддержка'],
    },
  },
  'certificado-digital': {
    scene:
      'premium secure digital identity still life: elegant ivory digital certificate document, USB security token or smart card, professional folder, navy-and-gold shield with lock motif',
    es: {
      categoryLabel: 'Certificado digital',
      subtitle: 'Persona física • Entidad • Trámites',
      features: ['Identidad digital', 'Firma segura', 'Soporte profesional'],
    },
    ru: {
      categoryLabel: 'Цифровой сертификат',
      subtitle: 'Физлицо • Компания • Онлайн',
      features: ['Цифровая идентификация', 'Безопасная подпись', 'Поддержка'],
    },
  },
  'trafico-capitania-maritima': {
    scene:
      'premium transport administration still life: elegant permit documents, refined white passenger car, tasteful motor yacht, gold ship wheel or anchor motif, navy-and-gold maritime shield; no government logos or readable agency names',
    es: {
      categoryLabel: 'Tráfico y Capitanía Marítima',
      subtitle: 'Vehículos • Náutica • Trámites',
      features: ['Documentación revisada', 'Presentación online', 'Soporte profesional'],
    },
    ru: {
      categoryLabel: 'Транспорт и морские услуги',
      subtitle: 'Авто • Судоходство • Процедуры',
      features: ['Проверка документов', 'Онлайн-подача', 'Поддержка'],
    },
  },
  'notaria-propiedades': {
    scene:
      'premium property and notarial still life: elegant property deed folder, refined house or building model, notarial stamp or seal motif, navy-and-gold legal shield',
    es: {
      categoryLabel: 'Notaría y Propiedades',
      subtitle: 'Hipotecas • Registros • Gestiones',
      features: ['Documentación revisada', 'Trámites online', 'Soporte profesional'],
    },
    ru: {
      categoryLabel: 'Нотариат и недвижимость',
      subtitle: 'Ипотека • Реестры • Сделки',
      features: ['Проверка документов', 'Онлайн-процедуры', 'Поддержка'],
    },
  },
  formacion: {
    scene:
      'premium professional education still life: elegant laptop with a generic training dashboard, ivory workbook, printed workflow or study plan, navy-and-gold graduation shield',
    es: {
      categoryLabel: 'Formación profesional',
      subtitle: 'Fiscal • Laboral • Empresas',
      features: ['Sesiones guiadas', 'Flujos de trabajo', 'Soporte experto'],
    },
    ru: {
      categoryLabel: 'Профессиональное обучение',
      subtitle: 'Налоги • Труд • Бизнес',
      features: ['Практические занятия', 'Рабочие процессы', 'Поддержка эксперта'],
    },
  },
};

export function isCatalogImageCategoryKey(value: string): value is CatalogImageCategoryKey {
  return Object.prototype.hasOwnProperty.call(PRESETS, value);
}

export function getExpertCatalogImagePreset(
  categoryKey: string,
  locale: CatalogImageLocale,
): LocalePreset & { scene: string } {
  const normalized: CatalogImageCategoryKey = isCatalogImageCategoryKey(categoryKey)
    ? categoryKey
    : 'empresas-autonomos';
  const preset = PRESETS[normalized];
  return { ...preset[locale], scene: preset.scene };
}

export function buildExpertCatalogArtworkPrompt(input: {
  categoryKey: string;
  locale: CatalogImageLocale;
  serviceName: string;
  shortDescription?: string | null;
  customBrief?: string | null;
}): string {
  const preset = getExpertCatalogImagePreset(input.categoryKey, input.locale);
  const description = input.shortDescription?.trim()
    ? `Service context: ${input.shortDescription.trim()}`
    : '';
  const custom = input.customBrief?.trim()
    ? `Additional art direction: ${input.customBrief.trim()}`
    : '';

  return [
    'Create a square 1:1 premium corporate service artwork for the EXPERT professional-services brand.',
    'This request is ONLY for the background illustration and 3D still-life artwork.',
    'DO NOT render any words, letters, numbers, logos, signatures, QR codes, watermarks, UI labels, agency marks, or readable document text.',
    'Reserve generous clean cream negative space on the LEFT half for a headline and logo that will be overlaid later.',
    'Reserve a clean strip across the BOTTOM for three feature cards that will be overlaid later.',
    'Place the main realistic 3D still-life composition on the RIGHT half, slightly lower than center.',
    'Visual language: warm ivory/cream background, deep navy blue, restrained metallic gold accents, premium studio lighting, soft shadows, rounded ivory pedestal, subtle thin gold arcs, elegant legal/professional aesthetic.',
    'Avoid busy backgrounds, people, stock-photo look, cartoon style, neon colors, excessive gold, floating text, fake logos, or fake official seals.',
    `Service: ${input.serviceName.trim()}.`,
    `Category visual: ${preset.scene}.`,
    description,
    custom,
    'The final result should look like a luxury professional-service campaign key visual, coherent with an accounting/legal consultancy brand.',
  ].filter(Boolean).join('\n');
}

export function catalogImageTitleSize(title: string): number {
  const length = title.trim().length;
  if (length <= 22) return 78;
  if (length <= 34) return 68;
  if (length <= 48) return 58;
  return 50;
}

export function truncateCatalogImageSupport(text: string | null | undefined): string {
  const normalized = (text ?? '').replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  if (normalized.length <= 110) return normalized;
  const clipped = normalized.slice(0, 107);
  const boundary = clipped.lastIndexOf(' ');
  return `${clipped.slice(0, boundary > 70 ? boundary : 107).trim()}…`;
}
