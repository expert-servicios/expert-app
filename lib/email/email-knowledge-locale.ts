import { getPublicAppUrl } from '@/lib/utils/app-url';

export type EmailContentLocale = 'es' | 'ru';

const APP_ORIGIN = new URL(getPublicAppUrl()).origin;

function metadataLocale(metadata?: Record<string, unknown>): EmailContentLocale | null {
  for (const key of ['locale', 'language', 'preferred_language', 'checkout_locale', 'kia_locale', 'email_locale']) {
    const value = metadata?.[key];
    if (value === 'ru') return 'ru';
    if (value === 'es') return 'es';
  }
  return null;
}

function visibleText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-zA-Z0-9#]+;/g, ' ');
}

export function resolveEmailContentLocale(input: {
  subject: string;
  html?: string;
  text?: string;
  metadata?: Record<string, unknown>;
}): EmailContentLocale {
  const explicit = metadataLocale(input.metadata);
  if (explicit) return explicit;

  const text = `${input.subject} ${input.html ? visibleText(input.html) : ''} ${input.text ?? ''}`;
  const cyrillic = (text.match(/[А-Яа-яЁё]/g) ?? []).length;
  const latin = (text.match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g) ?? []).length;
  return cyrillic > 20 && cyrillic >= latin * 0.25 ? 'ru' : 'es';
}

function isInternalKnowledgePath(pathname: string): boolean {
  return pathname === '/docs'
    || pathname.startsWith('/docs/')
    || pathname === '/blog'
    || pathname.startsWith('/blog/')
    || pathname === '/ru/docs'
    || pathname.startsWith('/ru/docs/')
    || pathname === '/ru/blog'
    || pathname.startsWith('/ru/blog/');
}

function linkLocale(pathname: string): EmailContentLocale {
  return pathname.startsWith('/ru/') ? 'ru' : 'es';
}

function isMismatchedKnowledgeUrl(rawHref: string, locale: EmailContentLocale): boolean {
  try {
    const url = new URL(rawHref, getPublicAppUrl());
    return url.origin === APP_ORIGIN
      && isInternalKnowledgePath(url.pathname)
      && linkLocale(url.pathname) !== locale;
  } catch {
    return false;
  }
}

function stripMismatchedAbsoluteKnowledgeUrls(value: string, locale: EmailContentLocale): string {
  return value.replace(/https?:\/\/[^\s<>"']+/gi, (raw) => {
    const match = raw.match(/^(.*?)([.,;:!?]+)?$/);
    const candidate = match?.[1] ?? raw;
    const punctuation = match?.[2] ?? '';
    return isMismatchedKnowledgeUrl(candidate, locale) ? punctuation : raw;
  });
}

export function keepEmailKnowledgeLinksInLocale(input: {
  subject: string;
  html: string;
  metadata?: Record<string, unknown>;
}): string {
  const locale = resolveEmailContentLocale(input);

  const anchorsFiltered = input.html.replace(
    /<a\b([^>]*?)href=(["'])([^"']+)\2([^>]*)>([\s\S]*?)<\/a>/gi,
    (full, _before: string, _quote: string, href: string, _after: string, label: string) =>
      isMismatchedKnowledgeUrl(href, locale) ? label : full,
  );

  // Filter only text nodes so URLs in attributes are never corrupted.
  return anchorsFiltered
    .split(/(<[^>]+>)/g)
    .map((part) => part.startsWith('<') ? part : stripMismatchedAbsoluteKnowledgeUrls(part, locale))
    .join('');
}

export function keepEmailKnowledgeTextLinksInLocale(input: {
  subject: string;
  text: string;
  html?: string;
  metadata?: Record<string, unknown>;
}): string {
  const locale = resolveEmailContentLocale(input);
  return stripMismatchedAbsoluteKnowledgeUrls(input.text, locale);
}

export function keepEmailKnowledgeContentInLocale(input: {
  subject: string;
  html: string;
  text?: string;
  metadata?: Record<string, unknown>;
}): { html: string; text?: string } {
  const html = keepEmailKnowledgeLinksInLocale(input);
  const text = input.text === undefined
    ? undefined
    : keepEmailKnowledgeTextLinksInLocale({
        subject: input.subject,
        text: input.text,
        html,
        metadata: input.metadata,
      });
  return { html, text };
}
