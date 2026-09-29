export type TelegramContentKind = 'blog' | 'docs';

export function telegramContentFingerprint(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36).padStart(7, '0');
}

export function buildTelegramContentPayload(kind: TelegramContentKind, slug: string): string {
  return `src_${kind === 'blog' ? 'b' : 'd'}_${telegramContentFingerprint(slug)}`;
}

export function parseTelegramContentPayload(payload: string): { kind: TelegramContentKind; fingerprint: string } | null {
  const match = /^src_(b|d)_([a-z0-9]{7})$/.exec(payload);
  if (!match) return null;
  return {
    kind: match[1] === 'b' ? 'blog' : 'docs',
    fingerprint: match[2],
  };
}
