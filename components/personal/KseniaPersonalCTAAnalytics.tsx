'use client';

import { useEffect } from 'react';

/**
 * Optional privacy-minimal events. No cookies, contact details, text values,
 * personal identifiers or custom URL payloads are collected by this handler.
 * Events are sent only when Vercel Web Analytics is explicitly enabled.
 */
export function KseniaPersonalCTAAnalytics() {
  useEffect(() => {
    const categories = new Set(['booking', 'mentoring', 'contact', 'expert']);
    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLElement>('[data-personal-cta]');
      if (!link) return;
      const category = link.dataset.personalCta;
      if (!category || !categories.has(category)) return;
      const tracker = (window as Window & { va?: (type: string, name: string, data?: Record<string, string>) => void }).va;
      if (typeof tracker !== 'function') return;
      tracker('event', 'personal_cta_click', {
        category,
        placement: link.dataset.personalPlacement === 'editorial' ? 'editorial' : link.dataset.personalPlacement === 'mobile-nav' ? 'mobile-nav' : 'content',
      });
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);
  return null;
}
