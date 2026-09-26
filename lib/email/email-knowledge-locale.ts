import { getPublicAppUrl } from '@/lib/utils/app-url';

export type EmailContentLocale = 'es' | 'ru';

const APP_ORIGIN = new URL(getPublicAppUrl()).origin;

function metadataLocale(metadata?: Record<string, unknown>): EmailContentLocale | null {
  for (const key of ['locale', 'language', 'checkout_locale', 'kia_locale', 'email_locale']) {
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
  html: string;
  metadata?: Record<string, unknown>;
}): EmailContentLocale {
  const explicit = metadataLocale(input.metadata);
  if (explicit) return explicit;

  const text = `${input.subject} ${visibleText(input.html)}`;
  const cyrillic = (text.match(/[А-Яа-яЁё]/g) ?? []).length;
  const latin = (text.match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g) ?? []).length;
  return cyrillic > 20 && cyrillic >= latin * 0.25 ? 'ru' : 'es';
}

function isInternalKnowledgePath(pathname: string): boolean {
  return pathname.startsWith('/docs/')
    || pathname.startsWith('/blog/')
    || pathname.startsWith('/ru/docs/')
    || pathname.startsWith('/ru/blog/');
}

function linkLocale(pathname: string): EmailContentLocale {
  return pathname.startsWith('/ru/') ? 'ru' : 'es';
}

/**
 * Russian client emails must not recommend Spanish-only EXPERT guides/blog posts.
 * Official external sources are intentionally preserved regardless of language.
 */
export function keepEmailKnowledgeLinksInLocale(input: {
  subject: string;
  html: string;
  metadata?: Record<string, unknown>;
}): string {
  const locale = resolveEmailContentLocale(input);

  return input.html.replace(
    /<a\b([^>]*?)href=(["'])([^"']+)\2([^>]*)>([\s\S]*?)<\/a>/gi,
    (full, before: string, quote: string, href: string, after: string, label: string) => {
      try {
        const url = new URL(href, getPublicAppUrl());
        if (url.origin !== APP_ORIGIN || !isInternalKnowledgePath(url.pathname)) return full;
        if (linkLocale(url.pathname) === locale) return full;

        // Preserve the readable label without a misleading cross-language link.
        return label;
      } catch {
        return full;
      }
    },
  );
}
