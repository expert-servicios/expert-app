import { getRequestConfig } from 'next-intl/server';
import { DEFAULT_LOCALE } from '@/lib/i18n/config';
import { getMessages } from '@/lib/i18n/messages';

/**
 * RU-004b installs the next-intl runtime without changing public routing yet.
 * Spanish remains the only runtime locale until RU-005 wires /ru and /en route
 * prefixes plus the public release gates.
 */
export default getRequestConfig(async () => {
  const locale = DEFAULT_LOCALE;

  return {
    locale,
    messages: getMessages(locale),
  };
});
