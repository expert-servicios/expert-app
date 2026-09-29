import { describe, expect, it } from 'vitest';
import { articles } from '@/lib/utils/blog';
import { docs } from '@/lib/utils/docs';
import {
  buildTelegramContentPayload,
  parseTelegramContentPayload,
  telegramContentFingerprint,
} from '@/lib/marketing/telegram-content-origin';
import { resolveTelegramContentOrigin } from '@/lib/marketing/telegram-content-origin-server';

describe('Telegram content attribution', () => {
  it('keeps every public payload below Telegram deep-link limits', () => {
    for (const item of articles) {
      expect(buildTelegramContentPayload('blog', item.slug).length).toBeLessThanOrEqual(64);
    }
    for (const item of docs) {
      expect(buildTelegramContentPayload('docs', item.slug).length).toBeLessThanOrEqual(64);
    }
  });

  it('resolves compact fingerprints back to one canonical origin', () => {
    const sampleBlog = articles.find((item) => item.slug.length > 40) ?? articles[0];
    const sampleDoc = docs.find((item) => item.slug.length > 40) ?? docs[0];
    expect(sampleBlog).toBeTruthy();
    expect(sampleDoc).toBeTruthy();

    const blogPayload = buildTelegramContentPayload('blog', sampleBlog!.slug);
    const docsPayload = buildTelegramContentPayload('docs', sampleDoc!.slug);

    expect(parseTelegramContentPayload(blogPayload)).toEqual({
      kind: 'blog',
      fingerprint: telegramContentFingerprint(sampleBlog!.slug),
    });
    expect(resolveTelegramContentOrigin(blogPayload)).toBe(`blog:${sampleBlog!.slug}`);
    expect(resolveTelegramContentOrigin(docsPayload)).toBe(`docs:${sampleDoc!.slug}`);
  });

  it('fails closed for unknown payloads', () => {
    expect(resolveTelegramContentOrigin('src_b_zzzzzzz')).toBeNull();
    expect(resolveTelegramContentOrigin('ctx_secret')).toBeNull();
    expect(resolveTelegramContentOrigin('link_secret')).toBeNull();
  });
});
