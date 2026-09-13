import { describe, expect, it } from 'vitest';
import { leadAttributionSchema } from '@/lib/marketing/acquisition-taxonomy';

describe('lead acquisition taxonomy', () => {
  it('parses a Holded на русском lead without creating locale-specific products', () => {
    const result = leadAttributionSchema.parse({
      locale: 'ru',
      source: 'telegram',
      campaign: 'holded-na-russkom-launch',
      intent: 'start_using_holded',
      customerType: 'sl',
      usesHolded: 'no',
      originPath: '/ru/holded',
      utmSource: 'telegram',
      utmMedium: 'organic',
    });

    expect(result.locale).toBe('ru');
    expect(result.intent).toBe('start_using_holded');
    expect(result.customerType).toBe('sl');
    expect(result.usesHolded).toBe('no');
  });

  it('defaults source and Holded usage conservatively', () => {
    const result = leadAttributionSchema.parse({ locale: 'es' });

    expect(result.source).toBe('direct');
    expect(result.usesHolded).toBe('unknown');
  });

  it('rejects unsupported locales and customer types', () => {
    expect(() => leadAttributionSchema.parse({ locale: 'de' })).toThrow();
    expect(() => leadAttributionSchema.parse({ locale: 'ru', customerType: 'russian_client' })).toThrow();
  });
});
