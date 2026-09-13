import { describe, expect, it } from 'vitest';
import {
  PUBLIC_ROUTE_KEYS,
  PUBLIC_ROUTE_MAP,
  getLocalizedPublicHref,
  getRuRouteKey,
  inferPublicRouteKey,
} from '@/lib/i18n/public-routes';

describe('localized public route map', () => {
  it('keeps Spanish unprefixed and Russian under /ru', () => {
    for (const key of PUBLIC_ROUTE_KEYS) {
      expect(PUBLIC_ROUTE_MAP[key].es).not.toMatch(/^\/es(?:\/|$)/);
      expect(PUBLIC_ROUTE_MAP[key].ru).toMatch(/^\/ru(?:\/|$)/);
    }
  });

  it('contains the agreed RU MVP routes', () => {
    expect(PUBLIC_ROUTE_KEYS.map((key) => PUBLIC_ROUTE_MAP[key].ru)).toEqual([
      '/ru',
      '/ru/holded',
      '/ru/plany',
      '/ru/uslugi',
      '/ru/academy',
      '/ru/autonomo',
      '/ru/sl',
      '/ru/nalogi',
      '/ru/verifactu',
      '/ru/konsultatsiya',
    ]);
  });

  it('resolves only approved RU slugs', () => {
    expect(getRuRouteKey(undefined)).toBe('home');
    expect(getRuRouteKey(['holded'])).toBe('holded');
    expect(getRuRouteKey(['nalogi'])).toBe('taxes');
    expect(getRuRouteKey(['unknown'])).toBeNull();
    expect(getRuRouteKey(['holded', 'extra'])).toBeNull();
  });

  it('preserves semantic intent when switching locale', () => {
    expect(getLocalizedPublicHref('holded', 'es')).toBe('/holded');
    expect(getLocalizedPublicHref('holded', 'ru')).toBe('/ru/holded');
    expect(inferPublicRouteKey('/holded/pack-starter')).toBe('holded');
    expect(inferPublicRouteKey('/ru/konsultatsiya')).toBe('consultation');
    expect(inferPublicRouteKey('/servicios/declaraciones-impuestos')).toBe('taxes');
  });
});
