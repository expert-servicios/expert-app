import type { SupportedLocale } from '@/lib/i18n/config';

export const PUBLIC_ROUTE_KEYS = [
  'home',
  'holded',
  'plans',
  'services',
  'academy',
  'autonomo',
  'sl',
  'taxes',
  'verifactu',
  'consultation',
] as const;

export type PublicRouteKey = (typeof PUBLIC_ROUTE_KEYS)[number];

export const PUBLIC_ROUTE_MAP: Record<PublicRouteKey, Record<SupportedLocale, string>> = {
  home: { es: '/', ru: '/ru', en: '/en' },
  holded: { es: '/holded', ru: '/ru/holded', en: '/en/holded' },
  plans: { es: '/planes', ru: '/ru/plany', en: '/en/plans' },
  services: { es: '/servicios', ru: '/ru/uslugi', en: '/en/services' },
  academy: { es: '/academy', ru: '/ru/academy', en: '/en/academy' },
  autonomo: { es: '/servicios/empresas-autonomos', ru: '/ru/autonomo', en: '/en/self-employed' },
  sl: { es: '/servicios/empresas-autonomos', ru: '/ru/sl', en: '/en/company' },
  taxes: { es: '/servicios/declaraciones-impuestos', ru: '/ru/nalogi', en: '/en/taxes' },
  verifactu: { es: '/holded', ru: '/ru/verifactu', en: '/en/verifactu' },
  consultation: { es: '/cita', ru: '/ru/konsultatsiya', en: '/en/consultation' },
};

const RU_SLUG_TO_KEY: Record<string, PublicRouteKey> = {
  '': 'home',
  holded: 'holded',
  plany: 'plans',
  uslugi: 'services',
  academy: 'academy',
  autonomo: 'autonomo',
  sl: 'sl',
  nalogi: 'taxes',
  verifactu: 'verifactu',
  konsultatsiya: 'consultation',
};

export function getLocalizedPublicHref(route: PublicRouteKey, locale: SupportedLocale): string {
  return PUBLIC_ROUTE_MAP[route][locale];
}

export function getRuRouteKey(slugParts: string[] | undefined): PublicRouteKey | null {
  const slug = (slugParts ?? []).join('/');
  return RU_SLUG_TO_KEY[slug] ?? null;
}

export function inferPublicRouteKey(pathname: string): PublicRouteKey {
  const normalized = pathname.split('?')[0]?.replace(/\/$/, '') || '/';

  for (const route of PUBLIC_ROUTE_KEYS) {
    if (Object.values(PUBLIC_ROUTE_MAP[route]).includes(normalized)) return route;
  }

  if (normalized.startsWith('/ru/')) return 'home';
  if (normalized.startsWith('/en/')) return 'home';
  if (normalized.startsWith('/holded')) return 'holded';
  if (normalized.startsWith('/planes')) return 'plans';
  if (normalized.startsWith('/academy')) return 'academy';
  if (normalized.includes('declaraciones-impuestos')) return 'taxes';
  if (normalized.includes('empresas-autonomos')) return 'services';
  if (normalized.startsWith('/servicios')) return 'services';
  if (normalized.startsWith('/cita') || normalized.startsWith('/contacto')) return 'consultation';

  return 'home';
}
