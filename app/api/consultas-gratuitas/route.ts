import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { notifyAdmins } from '@/lib/integrations/push';
import { verifyRecaptchaToken } from '@/lib/utils/recaptcha';
import { checkSpam, checkRateLimit, getClientIp } from '@/lib/utils/spam-guard';
import { buildLeadAttributionFields } from '@/lib/marketing/server-attribution';
import { describeContentOrigin, normalizeContentOrigin } from '@/lib/marketing/content-origin';
import { getAdminNotificationEmails } from '@/lib/admin/admin-notification-recipients';
import { sendEmail } from '@/lib/email/send';
import { freeConsultationReceivedAdmin } from '@/lib/email/templates';

const schema = z.object({
  hp_url: z.string().optional(),
  name: z.string().trim().min(2).max(100),
  email: z.string().email().max(200),
  phone: z.string().trim().max(30).optional(),
  service: z.string().trim().max(120).optional(),
  origin: z.string().trim().max(240).optional(),
  question: z.string().trim().min(10).max(3000),
  recaptcha_token: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (String(body.hp_url ?? '').trim()) return NextResponse.json({ success: true });

    const ip = getClientIp(request.headers);
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Inténtalo más tarde.' }, { status: 429 });
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Revisa los datos del formulario.' }, { status: 400 });
    }

    const spam = checkSpam({
      name: parsed.data.name,
      email: parsed.data.email,
      message: parsed.data.question,
    });
    if (spam.isSpam) return NextResponse.json({ success: true });

    const recaptcha = await verifyRecaptchaToken({
      token: String(parsed.data.recaptcha_token ?? ''),
      action: 'free_consultation',
    });
    if (!recaptcha.ok) {
      return NextResponse.json({ error: 'Verificación anti-spam fallida. Inténtalo de nuevo.' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const attribution = buildLeadAttributionFields(request);
    const sourceKey = `free-consultation:${crypto.randomUUID()}`;
    const normalizedEmail = parsed.data.email.toLowerCase();
    const normalizedPhone = parsed.data.phone?.trim() || null;
    const contentOrigin = normalizeContentOrigin(parsed.data.origin, 'form:consulta-gratuita');
    const contentOriginLabel = describeContentOrigin(contentOrigin);
    const interaction = {
      at: new Date().toISOString(),
      intent: 'free_question',
      origin: contentOrigin,
      service: parsed.data.service || null,
      source_key: sourceKey,
      contact: {
        email: normalizedEmail,
        phone: normalizedPhone,
      },
    };

    const escapedEmail = [...normalizedEmail]
        .map((char) => (char === '%' || char === '_' || char === '\\' ? `\\${char}` : char))
        .join('');
    const { data: emailMatches, error: emailLookupError } = await admin
      .from('leads')
      .select('id,message,metadata,email,phone')
      .ilike('email', escapedEmail)
      .limit(2);
    if (emailLookupError) throw emailLookupError;

    const { data: phoneMatches, error: phoneLookupError } = normalizedPhone
      ? await admin
          .from('leads')
          .select('id,message,metadata,email,phone')
          .eq('phone', normalizedPhone)
          .limit(2)
      : { data: [], error: null };
    if (phoneLookupError) throw phoneLookupError;

    const uniqueEmailMatch = (emailMatches ?? []).length === 1 ? emailMatches![0] : null;
    const uniquePhoneMatch = (phoneMatches ?? []).length === 1 ? phoneMatches![0] : null;
    const identifiersConflict = Boolean(
      uniqueEmailMatch && uniquePhoneMatch && uniqueEmailMatch.id !== uniquePhoneMatch.id
    );
    const ambiguousIdentity = identifiersConflict
      || (emailMatches ?? []).length > 1
      || (phoneMatches ?? []).length > 1;
    const existingLead = ambiguousIdentity ? null : (uniqueEmailMatch ?? uniquePhoneMatch);

    if (ambiguousIdentity) {
      console.warn('[free consultation] ambiguous lead identity; preserving request as separate lead');
    }

    let leadId: string;
    let created = false;

    if (existingLead) {
      const existingMetadata =
        existingLead.metadata && typeof existingLead.metadata === 'object' && !Array.isArray(existingLead.metadata)
          ? existingLead.metadata as Record<string, unknown>
          : {};
      const previousInteractions = Array.isArray(existingMetadata.inquiries)
        ? existingMetadata.inquiries.slice(-19)
        : [];
      const previousMessage = typeof existingLead.message === 'string' ? existingLead.message.trim() : '';
      const interactionHeading = `Consulta gratuita recibida ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}`;
      const nextMessage = [
        previousMessage,
        `[${interactionHeading}]\n${parsed.data.question}`,
      ].filter(Boolean).join('\n\n');

      const { error: updateError } = await admin
        .from('leads')
        .update({
          name: parsed.data.name,
          category: 'Consulta gratuita',
          service: parsed.data.service || 'consulta-general',
          message: nextMessage,
          state: 'new',
          updated_at: new Date().toISOString(),
          metadata: {
            ...existingMetadata,
            last_acquisition: interaction,
            inquiries: [...previousInteractions, interaction],
          },
        })
        .eq('id', existingLead.id);
      if (updateError) throw updateError;
      leadId = existingLead.id;
    } else {
      const { data: lead, error } = await admin
        .from('leads')
        .insert({
          name: parsed.data.name,
          email: normalizedEmail,
          phone: ambiguousIdentity ? null : normalizedPhone,
          client_type: 'particular',
          category: 'Consulta gratuita',
          service: parsed.data.service || 'consulta-general',
          country: 'ES',
          urgency: 'media',
          message: parsed.data.question,
          state: 'new',
          lifecycle_stage: 'lead',
          source: attribution.source,
          source_key: sourceKey,
          metadata: {
            ...attribution.metadata,
            ...(ambiguousIdentity ? {
              identity_match_status: 'needs_review',
              submitted_contact: { email: normalizedEmail, phone: normalizedPhone },
            } : {}),
            last_acquisition: interaction,
            inquiries: [interaction],
          },
        })
        .select('id')
        .single();

      if (error || !lead?.id) {
        console.error('[free consultation] lead insert:', error);
        return NextResponse.json({ error: 'No se pudo registrar la consulta.' }, { status: 500 });
      }
      leadId = lead.id;
      created = true;
    }

    const adminEmails = await getAdminNotificationEmails();
    if (adminEmails.length > 0) {
      const adminTpl = freeConsultationReceivedAdmin({
        name: parsed.data.name,
        email: normalizedEmail,
        phone: normalizedPhone,
        service: parsed.data.service || null,
        question: parsed.data.question,
        origin: contentOriginLabel,
        leadId,
      });
      await sendEmail({
        to: adminEmails,
        eventType: 'free_consultation.received.admin',
        ...adminTpl,
        metadata: { lead_id: leadId, content_origin: contentOrigin },
      }).catch((emailError) => {
        console.error('[free consultation] admin email:', emailError);
      });
    }

    await notifyAdmins({
      title: 'Nueva consulta gratuita',
      body: `${parsed.data.name} · ${parsed.data.service || 'Consulta general'} · ${contentOriginLabel}`.slice(0, 240),
      url: `/admin/leads?focus=${leadId}`,
      tag: sourceKey,
    }).catch(() => {});

    return NextResponse.json({ success: true, leadId }, { status: created ? 201 : 200 });
  } catch (error) {
    console.error('[free consultation]', error);
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}
