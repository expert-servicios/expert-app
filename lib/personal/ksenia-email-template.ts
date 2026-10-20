import { KSENIA_SOCIAL_PROFILES } from '@/lib/personal/ksenia-social-profiles';

export type PersonalMailLocale = 'es' | 'ru';

export interface KseniaPersonalMailInput {
  locale: PersonalMailLocale;
  subject: string;
  paragraphs: string[];
  recipientName?: string;
  /** Sender identity must be verified with the email provider before sending. */
  senderEmail?: string;
  cta?: { label: string; url: string };
}

const DEFAULT_SENDER = 'soy@kseniailicheva.com';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function safeHttpsUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== 'https:') throw new Error('CTA must use HTTPS');
  return escapeHtml(url.toString());
}

/** Render-only utility, separate from transactional EXPERT/KIA email senders. */
export function renderKseniaPersonalEmail(input: KseniaPersonalMailInput): { subject: string; html: string; text: string; from: string } {
  if (!input.subject.trim() || !input.paragraphs.length) throw new Error('Subject and message are required');
  const from = (input.senderEmail ?? DEFAULT_SENDER).trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(from)) throw new Error('Sender email is invalid');
  const ru = input.locale === 'ru';
  const displayName = input.recipientName?.trim();
  const greeting = ru ? 'Здравствуйте' + (displayName ? ', ' + displayName : '') + '!' : 'Hola' + (displayName ? ', ' + displayName : '') + ':';
  const signOff = ru ? 'С уважением,' : 'Un saludo,';
  const descriptor = ru ? 'Экономист · консультант · наставник' : 'Economista · asesora · mentora';
  const footer = ru ? 'Вы получили это письмо в рамках нашей переписки.' : 'Has recibido este correo como parte de nuestra conversación.';
  const safeSubject = escapeHtml(input.subject.trim());
  const paragraphsHtml = input.paragraphs.map(p => '<p style="margin:0 0 18px;line-height:1.75;font-size:15px;color:#3A4A50;">' + escapeHtml(p).replace(/\n/g, '<br>') + '</p>').join('');
  const socialHtml = KSENIA_SOCIAL_PROFILES.map(p => '<a href="' + safeHttpsUrl(p.url) + '" style="font-size:12px;color:#182A32;text-decoration:underline;margin-right:12px;">' + escapeHtml(p.label) + '</a>').join('');
  const ctaUrl = input.cta ? safeHttpsUrl(input.cta.url) : null;
  const ctaHtml = input.cta && ctaUrl ? '<p style="margin:26px 0;"><a href="' + ctaUrl + '" style="display:inline-block;padding:12px 22px;background:#182A32;color:#FFFFFF;text-decoration:none;font-weight:bold;font-size:13px;">' + escapeHtml(input.cta.label) + '</a></p>' : '';
  const safeFrom = escapeHtml(from);
  const html = '<!doctype html><html lang="' + input.locale + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>' + safeSubject + '</title></head><body style="margin:0;background:#F7F4EE;padding:20px 12px;font-family:Arial,Helvetica,sans-serif;">'
    + '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:620px;margin:0 auto;background:#FFFFFF;border:1px solid #E4DACB;"><tr><td style="background:#182A32;padding:26px 32px;">'
    + '<p style="margin:0;font-size:24px;color:#FFFFFF;font-family:Georgia,serif;">Ksenia Ilicheva<span style="color:#D3AD73;">.</span></p>'
    + '<p style="margin:8px 0 0;font-size:11px;letter-spacing:1px;color:#D3AD73;">' + escapeHtml(descriptor) + '</p></td></tr>'
    + '<tr><td style="padding:30px 32px;"><p style="font-size:15px;margin:0 0 22px;color:#182A32;">' + escapeHtml(greeting) + '</p>'
    + paragraphsHtml + ctaHtml
    + '<p style="margin:28px 0 0;color:#182A32;line-height:1.65;font-size:14px;">' + escapeHtml(signOff) + '<br><strong>Ksenia Ilicheva</strong><br>'
    + '<a href="mailto:' + safeFrom + '" style="color:#A57931;">' + safeFrom + '</a><br>'
    + '<a href="https://kseniailicheva.com" style="color:#A57931;">kseniailicheva.com</a></p>'
    + '</td></tr><tr><td style="padding:18px 32px;background:#F7F4EE;border-top:1px solid #E4DACB;">'
    + '<p style="margin:0 0 10px;">' + socialHtml + '</p><p style="margin:0;font-size:11px;color:#6E7775;">' + escapeHtml(footer) + '</p>'
    + '</td></tr></table></body></html>';
  const text = greeting + '\n\n' + input.paragraphs.join('\n\n') + (input.cta ? '\n\n' + input.cta.label + ': ' + input.cta.url : '') + '\n\n' + signOff + '\nKsenia Ilicheva\n' + from + '\nhttps://kseniailicheva.com\n\n' + KSENIA_SOCIAL_PROFILES.map(p => p.label + ': ' + p.url).join('\n');
  return { subject: input.subject.trim(), html, text, from };
}
