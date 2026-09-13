export type KiaLocale = 'es' | 'ru';

export interface ResolveKiaLocaleInput {
  explicit?: unknown;
  preferredLanguage?: unknown;
  latestMessage?: string | null;
}

export function detectKiaMessageLocale(text: string | null | undefined): KiaLocale | null {
  if (!text?.trim()) return null;
  return /[\u0400-\u04FF]/.test(text) ? 'ru' : null;
}

export function normalizeKiaPreferredLanguage(value: unknown): KiaLocale {
  // RU-007a deliberately keeps the current KIA ES/RU runtime contract.
  // English is stored in profiles but will become an active KIA locale in RU-007b.
  return value === 'ru' ? 'ru' : 'es';
}

export function resolveKiaLocale(input: ResolveKiaLocaleInput = {}): KiaLocale {
  if (input.explicit === 'es' || input.explicit === 'ru') return input.explicit;

  const messageLocale = detectKiaMessageLocale(input.latestMessage);
  if (messageLocale) return messageLocale;

  return normalizeKiaPreferredLanguage(input.preferredLanguage);
}
