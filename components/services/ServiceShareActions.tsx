'use client';

import { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Facebook,
  Linkedin,
  MessageCircle,
  Send,
  Share2,
} from 'lucide-react';

type Locale = 'es' | 'ru';

type Props = {
  url: string;
  title: string;
  text?: string;
  locale?: Locale;
  compact?: boolean;
};

const LABELS = {
  es: {
    title: 'Compartir esta página',
    native: 'Compartir',
    copy: 'Copiar enlace',
    copied: 'Enlace copiado',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    linkedin: 'LinkedIn',
    facebook: 'Facebook',
  },
  ru: {
    title: 'Поделиться страницей',
    native: 'Поделиться',
    copy: 'Скопировать ссылку',
    copied: 'Ссылка скопирована',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    linkedin: 'LinkedIn',
    facebook: 'Facebook',
  },
} as const;

export function ServiceShareActions({
  url,
  title,
  text = '',
  locale = 'es',
  compact = false,
}: Props) {
  const labels = LABELS[locale];
  const [copied, setCopied] = useState(false);

  const links = useMemo(() => {
    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(text ? `${title} — ${text}` : title);

    return [
      {
        label: labels.whatsapp,
        href: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
        Icon: MessageCircle,
      },
      {
        label: labels.telegram,
        href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
        Icon: Send,
      },
      {
        label: labels.linkedin,
        href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
        Icon: Linkedin,
      },
      {
        label: labels.facebook,
        href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        Icon: Facebook,
      },
    ];
  }, [labels, text, title, url]);

  const shareNative = async () => {
    if (typeof navigator === 'undefined' || !navigator.share) return;
    try {
      await navigator.share({ title, text, url });
    } catch {
      // User cancellation is not an error state for the page.
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard permissions vary by browser; channel links remain available.
    }
  };

  const buttonClass = compact
    ? 'inline-flex min-h-10 items-center justify-center gap-2 border border-[#D4A017]/25 bg-white px-3 py-2 text-xs font-semibold text-[#23364D] transition hover:border-[#D4A017] hover:text-[#0D1B2A]'
    : 'inline-flex min-h-11 items-center justify-center gap-2 border border-[#D4A017]/25 bg-white px-4 py-2.5 text-sm font-semibold text-[#23364D] transition hover:border-[#D4A017] hover:text-[#0D1B2A]';

  return (
    <div className="border border-[#D4A017]/20 bg-[#F8F6F1] p-5">
      <div className="mb-3 flex items-center gap-2">
        <Share2 className="h-4 w-4 text-[#D4A017]" />
        <p className="text-sm font-bold text-[#0D1B2A]">{labels.title}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={shareNative} className={buttonClass}>
          <Share2 className="h-4 w-4 text-[#D4A017]" />
          {labels.native}
        </button>
        {links.map(({ label, href, Icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            className={buttonClass}
            aria-label={label}
          >
            <Icon className="h-4 w-4 text-[#D4A017]" />
            {label}
          </a>
        ))}
        <button type="button" onClick={copyLink} className={buttonClass}>
          {copied ? (
            <Check className="h-4 w-4 text-[#D4A017]" />
          ) : (
            <Copy className="h-4 w-4 text-[#D4A017]" />
          )}
          {copied ? labels.copied : labels.copy}
        </button>
      </div>
    </div>
  );
}
