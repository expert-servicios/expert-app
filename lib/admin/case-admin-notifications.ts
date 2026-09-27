import { getAdminNotificationEmails } from '@/lib/admin/admin-notification-recipients';
import { sendEmailOnce } from '@/lib/email/send';
import { notifyAdmins } from '@/lib/integrations/push';
import { absoluteAppUrl } from '@/lib/utils/app-url';

export type AdminCaseActivityKind =
  | 'status_changed'
  | 'next_action_changed'
  | 'client_message'
  | 'document_uploaded'
  | 'document_ready_for_review'
  | 'inbound_email'
  | 'case_updated';

export interface AdminCaseActivityInput {
  kind: AdminCaseActivityKind;
  caseId: string;
  service: string;
  clientName?: string | null;
  detail: string;
  eventRef: string;
  occurredAt?: string;
}

function titleFor(kind: AdminCaseActivityKind): string {
  switch (kind) {
    case 'status_changed': return 'Expediente · cambio de estado';
    case 'next_action_changed': return 'Expediente · siguiente acción actualizada';
    case 'client_message': return 'Expediente · mensaje del cliente';
    case 'document_uploaded': return 'Expediente · documento recibido';
    case 'document_ready_for_review': return 'Expediente · documentación lista para revisar';
    case 'inbound_email': return 'Expediente · correo recibido';
    default: return 'Expediente · actividad nueva';
  }
}

function htmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function notifyAdminCaseActivity(input: AdminCaseActivityInput): Promise<void> {
  const adminUrl = absoluteAppUrl(`/admin/expedientes/${input.caseId}`);
  const title = titleFor(input.kind);
  const client = input.clientName?.trim() || 'Cliente';
  const body = `${input.service} · ${client} · ${input.detail}`;

  // PushApp + Telegram admin share the canonical notifyAdmins fan-out.
  await notifyAdmins({
    title,
    body,
    url: `/admin/expedientes/${input.caseId}`,
    tag: `case-admin-${input.caseId}-${input.kind}`,
  }).catch(() => {});

  const recipients = await getAdminNotificationEmails();
  if (!recipients.length) return;

  const subject = `[EXPERT] ${title} · ${input.service}`;
  const html = `
    <div style="font-family:Arial,sans-serif;color:#07111d;line-height:1.55;">
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#c88b25;text-transform:uppercase;letter-spacing:.08em;">KIA · seguimiento operativo</p>
      <h2 style="margin:0 0 12px;font-size:18px;">${htmlEscape(title)}</h2>
      <p style="margin:0 0 6px;"><strong>Expediente:</strong> ${htmlEscape(input.service)}</p>
      <p style="margin:0 0 6px;"><strong>Cliente:</strong> ${htmlEscape(client)}</p>
      <p style="margin:0 0 16px;"><strong>Novedad:</strong> ${htmlEscape(input.detail)}</p>
      <p style="margin:0;">
        <a href="${adminUrl}" style="display:inline-block;background:#0D1B2A;color:#fff;text-decoration:none;padding:10px 14px;border-radius:8px;font-weight:700;">Abrir expediente</a>
      </p>
    </div>`;

  await sendEmailOnce({
    to: recipients,
    eventType: `admin.case_activity.${input.kind}`,
    subject,
    html,
    metadata: {
      case_id: input.caseId,
      kia_signature: false,
      admin_operational_alert: true,
      occurred_at: input.occurredAt ?? new Date().toISOString(),
    },
    idempotencyKey: `admin-case/${input.kind}/${input.caseId}/${input.eventRef}`.slice(0, 256),
  }).catch((error) => {
    console.error('[admin-case-notifications] email failed:', error instanceof Error ? error.message : error);
  });
}
