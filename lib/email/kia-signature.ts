import { getPublicAppUrl } from '@/lib/utils/app-url';

export type KiaEmailSignatureLocale = 'es' | 'ru';

export const KIA_EMAIL_SIGNATURE_COPY: Record<KiaEmailSignatureLocale, {
  introAuthored: string;
  introCopilot: string;
  ctaLabel: string;
  chatLabel: string;
  footer: string;
}> = {
  es: {
    introAuthored: 'Soy KIA 😊, asistente IA de EXPERT. Puedes seguir hablando conmigo por chat o Telegram.',
    introCopilot: '¿Te queda alguna duda? 😊 KIA, la asistente IA de EXPERT, puede seguir contigo por chat o Telegram.',
    ctaLabel: 'Hablar con KIA:',
    chatLabel: 'Chat',
    footer: 'KIA es una asistente virtual de EXPERT.',
  },
  ru: {
    introAuthored: 'Я KIA 😊 ИИ-помощница EXPERT. Можете ответить мне в чате или Telegram.',
    introCopilot: 'Остались вопросы? 😊 KIA, ИИ-помощница EXPERT, может продолжить разговор в чате или Telegram.',
    ctaLabel: 'Поговорить с KIA:',
    chatLabel: 'Чат',
    footer: 'KIA — виртуальная ассистентка EXPERT.',
  },
};

export function resolveKiaEmailSignatureLocale(metadata?: Record<string, unknown>): KiaEmailSignatureLocale {
  return metadata?.preferred_language === 'ru' || metadata?.checkout_locale === 'ru' ? 'ru' : 'es';
}

function stringMeta(metadata: Record<string, unknown> | undefined, key: string): string | null {
  const value = metadata?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/**
 * KIA is available as EXPERT's client-facing copilot in every transactional
 * email sent through sendEmail(). This is independent from authorship.
 */
export function appendKiaSignature(html: string, metadata?: Record<string, unknown>): string {
  if (metadata?.kia_signature === false) return html;
  if (html.includes('data-kia-signature=')) return html;

  const locale = resolveKiaEmailSignatureLocale(metadata);
  const copy = KIA_EMAIL_SIGNATURE_COPY[locale];
  const ru = locale === 'ru';
  const appUrl = getPublicAppUrl().replace(/\/$/, '');
  const chatHref = stringMeta(metadata, 'kia_chat_href') ?? `${appUrl}/dashboard?kia=open`;
  const telegramHref = stringMeta(metadata, 'kia_telegram_href') ?? 'https://t.me/kia_expert_bot';
  const authored = metadata?.kia_author === true;
  const avatar = `${appUrl}/avatars/kia/kia-bienvenida.webp`;

  const intro = authored ? copy.introAuthored : copy.introCopilot;
  const ctaLabel = copy.ctaLabel;
  const chatLabel = copy.chatLabel;
  const telegramLabel = 'Telegram';
  const telegramIcon = 'https://telegram.org/img/t_logo.png';

  const signature = `
    <table data-kia-signature="true" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0 8px;border-top:1px solid #e8e0d4;padding-top:20px;">
      <tr>
        <td width="64" valign="top" style="padding-right:14px;">
          <img src="${avatar}" width="56" height="56" alt="KIA" style="display:block;width:56px;height:56px;border-radius:50%;object-fit:cover;border:1px solid #d8cbb5;">
        </td>
        <td valign="top" style="font-family:Arial,sans-serif;color:#07111d;">
          <div style="font-size:15px;font-weight:700;line-height:1.35;">KIA · EXPERT</div>
          <div style="margin-top:4px;font-size:13px;line-height:1.55;color:#465567;">${intro}</div>
          <div style="margin-top:12px;font-size:12px;font-weight:700;color:#07111d;">${ctaLabel}</div>
          <table data-kia-contact-cta="true" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:8px;border-collapse:collapse;">
            <tr>
              <td valign="middle" style="padding:0 8px 8px 0;">
                <a href="${chatHref}" style="display:inline-block;min-width:92px;padding:9px 14px;background:#07111d;color:#ffffff;text-decoration:none;font-size:12px;font-weight:700;text-align:center;border-radius:6px;">${chatLabel}</a>
              </td>
              <td valign="middle" style="padding:0 0 8px 0;">
                <a href="${telegramHref}" style="display:inline-block;min-width:112px;padding:9px 14px;border:1px solid #c88b25;color:#07111d;text-decoration:none;font-size:12px;font-weight:700;text-align:center;border-radius:6px;white-space:nowrap;">
                  <img src="${telegramIcon}" width="16" height="16" alt="" style="display:inline-block;width:16px;height:16px;vertical-align:-3px;margin-right:5px;border:0;">${telegramLabel}
                </a>
              </td>
            </tr>
          </table>
          <div style="margin-top:2px;font-size:11px;color:#7b8794;">${copy.footer} · <a href="mailto:info@expertconsulting.es" style="color:#9a6700;text-decoration:none;">info@expertconsulting.es</a></div>
        </td>
      </tr>
    </table>`;

  return /<\/body>/i.test(html)
    ? html.replace(/<\/body>/i, `${signature}</body>`)
    : html + signature;
}
