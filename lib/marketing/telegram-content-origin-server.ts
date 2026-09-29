import { articles } from '@/lib/utils/blog';
import { docs } from '@/lib/utils/docs';
import { parseTelegramContentPayload, telegramContentFingerprint } from '@/lib/marketing/telegram-content-origin';

export function resolveTelegramContentOrigin(payload: string): string | null {
  const parsed = parseTelegramContentPayload(payload);
  if (!parsed) return null;

  const candidates = parsed.kind === 'blog' ? articles : docs;
  const matches = candidates.filter((item) => telegramContentFingerprint(item.slug) === parsed.fingerprint);
  if (matches.length !== 1) return null;
  return `${parsed.kind}:${matches[0].slug}`;
}
