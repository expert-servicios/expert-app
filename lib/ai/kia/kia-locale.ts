export type KiaLocale = 'es' | 'ru';

export interface ResolveKiaLocaleInput {
  explicit?: unknown;
  preferredLanguage?: unknown;
  latestMessage?: string | null;
}

const CYRILLIC_RE = /[\u0400-\u04FF]/;
const SPANISH_SIGNAL_RE = /\b(que|qué|como|cómo|cuando|cuándo|donde|dónde|gracias|hola|quiero|necesito|puedo|podemos|tengo|tenemos|mi|mis|el|la|los|las|para|por|con|sin|expediente|documento|pago|firma|residencia|nacionalidad|empresa|factura|impuesto)\b/i;

export function detectKiaMessageLocale(text: string | null | undefined): KiaLocale | null {
  const value = text?.trim() ?? '';
  if (!value) return null;
  if (CYRILLIC_RE.test(value)) return 'ru';
  if (SPANISH_SIGNAL_RE.test(value)) return 'es';
  return null;
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
