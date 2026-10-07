'use client';

import { useEffect } from 'react';

export function DocumentLanguage({ lang }: { lang: string }) {
  useEffect(() => {
    document.documentElement.lang = lang;

    return () => {
      document.documentElement.lang = 'es';
    };
  }, [lang]);

  return null;
}
