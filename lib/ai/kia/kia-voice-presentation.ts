import { detectKiaMessageLocale, type KiaLocale } from '@/lib/ai/kia/kia-locale';

export const KIA_DEFAULT_VOICE = 'coral';

export function kiaVoiceLocale(text: string, fallback: KiaLocale = 'es'): KiaLocale {
  return detectKiaMessageLocale(text) ?? fallback;
}

/** Do not pronounce markdown syntax, code fences, HTML tags or URLs. */
export function kiaTextForSpeech(source: string): string {
  return source
    .replace(/\x60\x60\x60[\s\S]*?\x60\x60\x60/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/https?:\/\/[^\s)]+/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/^\s{0,3}(?:[-*•]|\d+[.)])\s+/gm, '')
    .replace(/(\*\*|__|(?<!\*)\*(?!\*)|(?<!_)_(?!_)|\x60|#{1,6}\s)/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function chooseKiaBrowserVoice<T extends { lang: string; name: string }>(
  voices: T[],
  locale: KiaLocale,
): T | undefined {
  const target = locale === 'ru' ? 'ru' : 'es';
  const candidates = voices.filter(v => v.lang.toLowerCase().startsWith(target));
  return candidates.find(v => v.lang.toLowerCase() === (locale === 'ru' ? 'ru-ru' : 'es-es'))
    ?? candidates[0];
}
