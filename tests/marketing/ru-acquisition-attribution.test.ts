import { describe, expect, it } from 'vitest';
import { inferLeadSource, inferRouteContext } from '@/lib/marketing/client-attribution';
import { attributionFromMetadata } from '@/lib/marketing/server-attribution';

describe('RU acquisition attribution', () => {
  it('maps Russian commercial routes to useful lead intent without inferring nationality', () => {
    expect(inferRouteContext('/ru/sl')).toEqual({
      intent: 'open_business_in_spain',
      customerType: 'sl',
    });
    expect(inferRouteContext('/ru/autonomo')).toEqual({
      intent: 'open_business_in_spain',
      customerType: 'autonomo',
    });
    expect(inferRouteContext('/ru/holded')).toEqual({ intent: 'start_using_holded' });
    expect(inferRouteContext('/ru/academy')).toEqual({ intent: 'learn_self_management' });
    expect(inferRouteContext('/ru/verifactu')).toEqual({ intent: 'organize_existing_business' });
  });

  it('normalizes common acquisition channels', () => {
    expect(inferLeadSource('telegram', null)).toBe('telegram');
    expect(inferLeadSource('google', 'cpc')).toBe('paid_search');
    expect(inferLeadSource('instagram', 'social')).toBe('social');
    expect(inferLeadSource(null, null)).toBe('direct');
  });

  it('reads only valid acquisition metadata on the server', () => {
    expect(attributionFromMetadata({
      acquisition: {
        locale: 'ru',
        source: 'telegram',
        campaign: 'holded-ru-webinar',
        intent: 'start_using_holded',
        usesHolded: 'unknown',
        originPath: '/ru/holded',
      },
    })).toMatchObject({
      locale: 'ru',
      source: 'telegram',
      intent: 'start_using_holded',
      originPath: '/ru/holded',
    });

    expect(attributionFromMetadata({ acquisition: { locale: 'xx' } })).toBeNull();
    expect(attributionFromMetadata(null)).toBeNull();
  });
});
