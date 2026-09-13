import en from '@/messages/en.json';
import es from '@/messages/es.json';
import ru from '@/messages/ru.json';
import type { SupportedLocale } from '@/lib/i18n/config';

export type MessageCatalog = typeof es;

const catalogs = {
  es,
  ru,
  en,
} satisfies Record<SupportedLocale, MessageCatalog>;

export function getMessages(locale: SupportedLocale): MessageCatalog {
  return catalogs[locale];
}

export { catalogs as MESSAGE_CATALOGS };
