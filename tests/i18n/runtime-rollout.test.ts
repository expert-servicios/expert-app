import { describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE } from '@/lib/i18n/config';
import { getMessages } from '@/lib/i18n/messages';

describe('next-intl runtime rollout', () => {
  it('keeps Spanish as the runtime default before RU-005 routing', () => {
    expect(DEFAULT_LOCALE).toBe('es');
    expect(getMessages(DEFAULT_LOCALE).common.brand).toBe('EXPERT');
    expect(getMessages(DEFAULT_LOCALE).holded.verticalName).toBe('Holded en español');
  });
});
