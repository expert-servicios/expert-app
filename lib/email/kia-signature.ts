import { getPublicAppUrl } from '@/lib/utils/app-url';

export type KiaEmailMood =
  | 'bienvenida'
  | 'ayuda'
  | 'confianza'
  | 'exito'
  | 'celebracion'
  | 'seguimiento'
  | 'aviso';

export type KiaEmailLocale = 'es' | 'ru' | 'en';

const AVATAR_PATHS: Record<KiaEmailMood, string> = {
  bienvenida: '/avatars/kia/kia-bienvenida.webp',
  ayuda: '/avatars/kia/kia-ayuda.webp',
  confianza: '/avatars/kia/kia-confianza.webp',
  exito: '/avatars/kia/kia-exito.webp',
  celebracion: '/avatars/kia/kia-celebracion.webp',
  seguimiento: '/avatars/kia/kia-seguimiento.webp',
  aviso: '/avatars/kia/kia-aviso.webp',
};

const COPY: Record<KiaEmailLocale, {
  role: string;
  automated: string;
  humanReview: string;
}> = {
  es: {
    role: 'Asistente IA de EXPERT',
    automated: 'Este mensaje ha sido preparado y enviado automáticamente por KIA.',
    humanReview: 'Si necesitas que lo revise una persona, responde a este correo y el equipo de EXPERT lo verá.',
  },
  ru: {
    role: 'ИИ-ассистент EXPERT',
    automated: 'Это сообщение подготовлено и отправлено автоматически KIA.',
    humanReview: 'Если нужна проверка специалистом, просто ответьте на это письмо — команда EXPERT его увидит.',
  },
  en: {
    role: 'EXPERT AI Assistant',
    automated: 'This message was prepared and sent automatically by KIA.',
    humanReview: 'If you would like a person to review it, simply reply and the EXPERT team will see it.',
  },
};

export function inferKiaEmailMood(title: string): KiaEmailMood {
  const normalized = title.toLowerCase();

  if (/bloque|rechaz|fall|error|incid|atenci|pendiente de pago|no hemos podido/.test(normalized)) {
    return 'aviso';
  }
  if (/recordatorio|seguimiento|pendiente|tramitaci|documentaci[oó]n necesaria/.test(normalized)) {
    return 'seguimiento';
  }
  if (/bienven|acceso|activad/.test(normalized)) {
    return 'bienvenida';
  }
  if (/complet|confirm|recibid|aprob|resoluci|matr[ií]cula|pago|enhorabuena|felicidades/.test(normalized)) {
    return 'celebracion';
  }
  if (/listo|preparad|presupuesto|propuesta/.test(normalized)) {
    return 'exito';
  }
  return 'confianza';
}

export function kiaEmailSignatureHtml(input?: {
  mood?: KiaEmailMood;
  locale?: KiaEmailLocale;
  supportEmail?: string;
  appUrl?: string;
}): string {
  const locale = input?.locale ?? 'es';
  const mood = input?.mood ?? 'confianza';
  const supportEmail = input?.supportEmail ?? 'info@expertconsulting.es';
  const appUrl = (input?.appUrl ?? getPublicAppUrl()).replace(/\/$/, '');
  const avatarUrl = `${appUrl}${AVATAR_PATHS[mood]}`;
  const copy = COPY[locale];

  return `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="margin:30px 0 4px;border-top:1px solid #eadfce;padding-top:22px;">
      <tr>
        <td width="72" valign="top" style="padding-right:14px;">
          <img
            src="${avatarUrl}"
            width="64"
            height="64"
            alt="KIA"
            style="display:block;width:64px;height:64px;border-radius:50%;border:2px solid #d7a33a;background:#f8f4eb;object-fit:cover;"
          />
        </td>
        <td valign="middle">
          <p style="margin:0;font-size:17px;font-weight:800;color:#07111d;line-height:1.25;">
            KIA
            <span style="display:inline-block;margin-left:6px;padding:2px 7px;border-radius:999px;background:#07111d;color:#d7a33a;font-size:9px;letter-spacing:1px;vertical-align:2px;">IA</span>
          </p>
          <p style="margin:3px 0 8px;font-size:13px;font-weight:600;color:#52606d;">${copy.role}</p>
          <p style="margin:0 0 4px;font-size:11px;line-height:1.5;color:#7b8794;">${copy.automated}</p>
          <p style="margin:0;font-size:11px;line-height:1.5;color:#7b8794;">${copy.humanReview}</p>
          <p style="margin:7px 0 0;font-size:11px;">
            <a href="mailto:${supportEmail}" style="color:#b87912;text-decoration:none;">${supportEmail}</a>
          </p>
        </td>
      </tr>
    </table>`;
}
