import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { sendEmail } from '@/lib/email/send';
import { appendKiaSignature } from '@/lib/email/kia-signature';
import { maybeAppendKiaContextualCta } from '@/lib/email/kia-contextual-cta';
import { sendNewGmailSA } from '@/lib/integrations/gmail';

export interface BookingEmailAttachment {
  filename: string;
  content: string;
  type?: string;
}

export interface BookingEmailInput {
  to: string;
  eventType: string;
  subject: string;
  html: string;
  metadata?: Record<string, unknown>;
  idempotencyKey: string;
  attachments?: BookingEmailAttachment[];
}

export async function sendBookingEmail(input: BookingEmailInput): Promise<{
  transport: 'gmail' | 'resend';
  providerId: string;
}> {
  const admin = getSupabaseAdmin();
  let metadata = {
    ...(input.metadata ?? {}),
    event_type: input.eventType,
    email_subject: input.subject,
    email_event_ref: `email:${input.idempotencyKey}`,
    idempotency_key: input.idempotencyKey,
  };

  const contextual = await maybeAppendKiaContextualCta({
    admin,
    recipients: [input.to],
    html: input.html,
    metadata,
  });
  metadata = contextual.metadata ?? metadata;

  let gmailMessageId: string;
  try {
    const html = appendKiaSignature(contextual.html, metadata);
    gmailMessageId = await sendNewGmailSA({
      to: input.to,
      subject: input.subject,
      body: html,
      bodyHtml: true,
      attachments: input.attachments,
    });

    try {
      const { error: auditError } = await admin.from('email_events').insert({
        event_type: input.eventType,
        recipient_email: input.to,
        subject: input.subject,
        html,
        resend_id: gmailMessageId || null,
        status: 'sent',
        metadata: {
          ...metadata,
          transport: 'gmail',
          gmail_message_id: gmailMessageId || null,
        },
      });
      if (auditError) {
        console.error('[booking-email] Gmail audit insert failed:', auditError.message);
      }
    } catch (auditError) {
      console.error(
        '[booking-email] Gmail audit persistence failed after successful send:',
        auditError instanceof Error ? auditError.message : auditError,
      );
    }

    return { transport: 'gmail', providerId: gmailMessageId };
  } catch (gmailError) {
    console.error(
      '[booking-email] Gmail failed; falling back to Resend:',
      gmailError instanceof Error ? gmailError.message : gmailError,
    );
  }

  const resendId = await sendEmail({
    to: input.to,
    eventType: input.eventType,
    subject: input.subject,
    html: contextual.html,
    metadata: {
      ...metadata,
      transport: 'resend_fallback',
    },
    idempotencyKey: input.idempotencyKey,
    attachments: input.attachments,
  });

  return { transport: 'resend', providerId: resendId };
}
