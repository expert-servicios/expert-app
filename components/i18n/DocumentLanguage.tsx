'use client';

import { useEffect } from 'react';

export function DocumentLanguage({ lang }: { lang: string }) {
  useEffect(() => {
    const previous = document.documentElement.lang;
    document.documentElement.lang = lang;

    return () => {
      document.documentElement.lang = previous || 'es';
    };
  }, [lang]);

  return null;
}
