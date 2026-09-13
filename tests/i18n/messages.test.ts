import { describe, expect, it } from 'vitest';
import { EXPERT_IDENTITY, HOLDED_BRAND_NAME } from '@/config/identity';
import { MESSAGE_CATALOGS } from '@/lib/i18n/messages';

function flattenKeys(value: unknown, prefix = ''): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];

  return Object.entries(value).flatMap(([key, nested]) => {
    const next = prefix ? `${prefix}.${key}` : key;
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      return flattenKeys(nested, next);
    }
    return [next];
  });
}

function allStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (!value || typeof value !== 'object') return [];
  return Object.values(value).flatMap(allStrings);
}

describe('message catalogs', () => {
  it('keeps identical translation keys in ES, RU and EN', () => {
    const expected = flattenKeys(MESSAGE_CATALOGS.es).sort();

    expect(flattenKeys(MESSAGE_CATALOGS.ru).sort()).toEqual(expected);
    expect(flattenKeys(MESSAGE_CATALOGS.en).sort()).toEqual(expected);
  });

  it('keeps Holded unchanged in every localized catalog', () => {
    expect(HOLDED_BRAND_NAME).toBe('Holded');

    for (const catalog of Object.values(MESSAGE_CATALOGS)) {
      const copy = allStrings(catalog).join('\n');
      expect(copy).not.toMatch(/Холдед|Холед|Холд|Хоулдед/i);
    }

    expect(MESSAGE_CATALOGS.ru.holded.verticalName).toBe('Holded на русском');
  });

  it('keeps the approved Holded credentials verbatim', () => {
    for (const catalog of Object.values(MESSAGE_CATALOGS)) {
      expect(catalog.credentials.holdedSolutionPartner).toBe(
        EXPERT_IDENTITY.credentials.holdedSolutionPartner,
      );
      expect(catalog.credentials.holdedAccreditedAdvisory).toBe(
        EXPERT_IDENTITY.credentials.holdedAccreditedAdvisory,
      );
    }
  });
});
