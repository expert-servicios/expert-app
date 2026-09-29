import { createHash } from 'node:crypto';
import { notifyAdmins } from '@/lib/integrations/push';
import { sendEmailOnce } from '@/lib/email/send';
import { absoluteAppUrl } from '@/lib/utils/app-url';

export async function notifyKiaAdminEscalation(input: {
  title: string;
  summary: string;
  actionTaken: string;
  interventionNeeded: string;
  url: string;
  eventRef: string;
  priority: 'high' | 'critical';
}) {
  const absoluteUrl = absoluteAppUrl(input.url);
  const body = [
    input.summary,
    `KIA: ${input.actionTaken}`,
    `Necesita de ti: ${input.interventionNeeded}`,
  ].join(' · ').slice(0, 420);

  await Promise.all([
    notifyAdmins({
      title: input.priority === 'critical' ? `URGENTE · ${input.title}` : input.title,
      body,
      url: absoluteUrl,
      tag: `kia-escalation-${createHash('sha256').update(input.eventRef).digest('hex').slice(0, 20)}`,
    }),
    sendEmailOnce({
      to: 'soy@kseniailicheva.com',
      from: 'KIA Alertas <noreply@expertconsulting.es>',
      eventType: 'kia.admin_escalation',
      subject: input.priority === 'critical'
        ? `[URGENTE] KIA necesita tu intervención · ${input.title}`
        : `KIA necesita tu intervención · ${input.title}`,
      html: `
        <div style="font-family:Arial,sans-serif;color:#07111d;line-height:1.55">
          <p style="font-size:12px;font-weight:700;color:#c88b25;text-transform:uppercase">KIA · control operativo</p>
          <h2 style="font-size:18px;margin:0 0 14px">${escapeHtml(input.title)}</h2>
          <p><strong>Resumen:</strong> ${escapeHtml(input.summary)}</p>
          <p><strong>Qué ha hecho KIA:</strong> ${escapeHtml(input.actionTaken)}</p>
          <p><strong>Qué necesita de ti:</strong> ${escapeHtml(input.interventionNeeded)}</p>
          <p><a href="${absoluteUrl}" style="display:inline-block;background:#07111d;color:#fff;text-decoration:none;padding:10px 14px;border-radius:8px">Abrir en EXPERT</a></p>
        </div>
      `,
      metadata: {
        kia_author: true,
        kia_contextual_cta: false,
        priority: input.priority,
        email_event_ref: input.eventRef,
        admin_escalation: true,
      },
      idempotencyKey: `kia-admin-escalation/${createHash('sha256').update(input.eventRef).digest('hex')}`.slice(0, 256),
    }),
  ]);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
