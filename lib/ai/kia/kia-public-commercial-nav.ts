import { categories, services, type PublicCategorySlug, type Service } from '@/lib/utils/catalog';

export type PublicKiaQuickReply = {
  label: string;
  action: 'message' | 'link';
  kind: 'category' | 'service' | 'meeting' | 'navigation' | 'other';
  message?: string;
  href?: string;
};

const MAX_SERVICE_REPLIES = 8;
const PUBLIC_CATEGORY_SLUGS = new Set<string>(categories.map((category) => category.slug));

function isPublicService(service: Service): service is Service & { categoria: PublicCategorySlug } {
  return PUBLIC_CATEGORY_SLUGS.has(service.categoria);
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[—–]/g, '-')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function categoryHref(slug: PublicCategorySlug): string {
  return slug === 'holded' ? '/holded' : `/servicios/${slug}`;
}

function serviceHref(service: Service): string {
  return service.categoria === 'holded'
    ? '/holded'
    : `/servicios/${service.categoria}/${service.slug}`;
}

export function getPublicCategoryQuickReplies(): PublicKiaQuickReply[] {
  return [
    ...categories.map((category) => ({
      label: category.name,
      action: 'message' as const,
      kind: 'category' as const,
      message: `Quiero ver servicios de ${category.name}`,
    })),
    getMeetingQuickReply(),
  ];
}

export function getMeetingQuickReply(): PublicKiaQuickReply {
  return {
    label: 'Pedir reunión informativa',
    action: 'link',
    kind: 'meeting',
    href: '/cita?tipo=consulta-inicial',
  };
}

export function getBackToCategoriesQuickReply(): PublicKiaQuickReply {
  return {
    label: 'Ver otras categorías',
    action: 'message',
    kind: 'navigation',
    message: 'Ver categorías de servicios',
  };
}

export function getOtherCaseQuickReply(): PublicKiaQuickReply {
  return {
    label: 'Mi caso es distinto',
    action: 'message',
    kind: 'other',
    message: 'Mi caso es distinto y necesito explicarlo',
  };
}

export function findSelectedCategory(message: string) {
  const normalized = normalize(message);
  return categories.find((category) => {
    const name = normalize(category.name);
    return normalized === name
      || normalized === `quiero ver servicios de ${name}`
      || normalized === `servicios de ${name}`;
  });
}

export function findSelectedService(message: string): Service | undefined {
  const normalized = normalize(message);
  return services.filter(isPublicService).find((service) => {
    const name = normalize(service.name);
    return normalized === name
      || normalized === `servicio ${name}`
      || normalized === `quiero ${name}`;
  });
}

export function getServiceQuickRepliesForCategory(
  slug: PublicCategorySlug,
  limit = MAX_SERVICE_REPLIES,
): PublicKiaQuickReply[] {
  const matching = services
    .filter(isPublicService)
    .filter((service) => service.categoria === slug)
    .slice(0, Math.max(1, limit));

  const category = categories.find((item) => item.slug === slug);
  const replies: PublicKiaQuickReply[] = matching.map((service) => ({
    label: service.name,
    action: 'message',
    kind: 'service',
    message: service.name,
  }));

  if (category && services.filter(isPublicService).filter((service) => service.categoria === slug).length > matching.length) {
    replies.push({
      label: `Ver todos en ${category.name}`,
      action: 'link',
      kind: 'navigation',
      href: categoryHref(slug),
    });
  }

  replies.push(getBackToCategoriesQuickReply(), getMeetingQuickReply(), getOtherCaseQuickReply());
  return replies;
}

export function getServiceSelectionQuickReplies(service: Service): PublicKiaQuickReply[] {
  return [
    {
      label: 'Ver detalles y precio',
      action: 'link',
      kind: 'service',
      href: serviceHref(service),
    },
    getBackToCategoriesQuickReply(),
    getMeetingQuickReply(),
    getOtherCaseQuickReply(),
  ];
}

export function findServicesMentioned(text: string, limit = 4): Service[] {
  const normalizedText = normalize(text);
  const textTokens = new Set(normalizedText.split(' ').filter(Boolean));

  return services
    .filter(isPublicService)
    .filter((service) => {
      const normalizedName = normalize(service.name);
      if (normalizedName.length < 4) return false;
      if (` ${normalizedText} `.includes(` ${normalizedName} `)) return true;

      const serviceTokens = normalizedName
        .split(' ')
        .filter((token) => token.length >= 3 && !['para', 'con', 'del', 'los', 'las'].includes(token));

      if (serviceTokens.length === 1) {
        return serviceTokens[0].length >= 4 && textTokens.has(serviceTokens[0]);
      }

      return serviceTokens.length >= 2 && serviceTokens.every((token) => textTokens.has(token));
    })
    .slice(0, limit);
}

export function serviceMentionQuickReplies(text: string): PublicKiaQuickReply[] {
  const mentioned = findServicesMentioned(text);
  if (!mentioned.length) return [];

  return [
    ...mentioned.map((service) => ({
      label: service.name,
      action: 'message' as const,
      kind: 'service' as const,
      message: service.name,
    })),
    getMeetingQuickReply(),
    getOtherCaseQuickReply(),
  ];
}

export function isCommercialMessage(message: string): boolean {
  const normalized = normalize(message);
  if (
    /\b(servicio|servicios|precio|coste|cuanto|contratar|contratacion|presupuesto|tramitar|gestion|gestionar|necesito|ofreceis|haceis)\b/.test(normalized)
  ) {
    return true;
  }

  if (categories.some((category) => normalized.includes(normalize(category.name)))) return true;

  return services.filter(isPublicService).some((service) => {
    const name = normalize(service.name);
    return name.length >= 5 && normalized.includes(name);
  });
}

export function buildCompactCatalogPrompt(): string {
  return categories
    .map((category) => {
      const names = services
        .filter(isPublicService)
        .filter((service) => service.categoria === category.slug)
        .map((service) => service.name);
      return `${category.name}: ${names.join('; ')}`;
    })
    .join('\n');
}

export function categoryResponse(slug: PublicCategorySlug): string {
  const category = categories.find((item) => item.slug === slug);
  if (!category) return 'Selecciona el servicio que mejor encaje con lo que necesitas.';

  return `Dentro de ${category.name} tenemos estos servicios. Selecciona el que mejor encaje; si ninguno corresponde exactamente, usa «Mi caso es distinto».`;
}

export function serviceResponse(service: Service): string {
  const price = service.price ? ` Precio orientativo: ${service.price}.` : '';
  return `${service.name}: ${service.shortDescription}${price} Puedes abrir la ficha para ver requisitos, documentación, plazo y forma de contratación.`;
}

export function isCategoryNavigationMessage(message: string): boolean {
  return normalize(message) === 'ver categorias de servicios';
}

export function isOtherCaseMessage(message: string): boolean {
  return normalize(message).startsWith('mi caso es distinto');
}
