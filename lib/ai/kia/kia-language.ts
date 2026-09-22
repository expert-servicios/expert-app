export type KiaLocale = 'es' | 'ru';

const CYRILLIC_RE = /[\u0400-\u04FF]/;
const SPANISH_SIGNAL_RE = /\b(que|qué|como|cómo|cuando|cuándo|donde|dónde|gracias|hola|quiero|necesito|puedo|podemos|tengo|tenemos|mi|mis|el|la|los|las|para|por|con|sin|expediente|documento|pago|firma|residencia|nacionalidad)\b/i;

export function detectKiaLocaleFromLastMessage(
  message: string,
  fallback: KiaLocale = 'es',
): KiaLocale {
  const text = message.trim();
  if (!text) return fallback;

  if (CYRILLIC_RE.test(text)) return 'ru';
  if (SPANISH_SIGNAL_RE.test(text)) return 'es';

  return fallback;
}
