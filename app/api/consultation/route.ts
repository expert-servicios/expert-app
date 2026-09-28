import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { verifyRecaptchaToken } from '@/lib/utils/recaptcha';
import { checkRateLimit, checkSpam, getClientIp } from '@/lib/utils/spam-guard';
import { notifyAdmins } from '@/lib/integrations/push';
import { buildLeadAttributionFields } from '@/lib/marketing/server-attribution';

const schema = z.object({
  hp_url: z.string().optional(),
  name: z.string().trim().min(2).max(100),
  email: z.string().email().max(200),
  phone: z.string().trim().max(30).optional(),
  message: z.string().trim().min(10).max(4000),
  service: z.string().trim().max(120).optional(),
  origin: z.string().trim().max(240).optional(),
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

    const data = parsed.data;
    const spam = checkSpam({ name: data.name, email: data.email, message: data.message });
    if (spam.isSpam) return NextResponse.json({ success: true });

    const recaptcha = await verifyRecaptchaToken({
      token: String(data.recaptcha_token ?? ''),
      action: 'free_consultation',
    });
    if (!recaptcha.ok) {
      return NextResponse.json({ error: 'Verificación anti-spam fallida.' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const attribution = buildLeadAttributionFields(request);
    const normalizedEmail = data.email.toLowerCase();
    const normalizedPhone = data.phone?.trim() || null;
    const interaction = {
      at: new Date().toISOString(),
      intent: 'free_question',
      origin: data.origin || null,
      service: data.service || null,
      contact: { email: normalizedEmail, phone: normalizedPhone },
    };

    const { data: byEmail, error: emailLookupError } = await admin
      .from('leads')
      .select('id,message,metadata')
      .eq('email', normalizedEmail)
      .limit(1)
      .maybeSingle();
    if (emailLookupError) throw emailLookupError;

    let existingLead = byEmail;
    if (!existingLead && normalizedPhone) {
      const { data: byPhone, error: phoneLookupError } = await admin
        .from('leads')
        .select('id,message,metadata')
        .eq('phone', normalizedPhone)
        .limit(1)
        .maybeSingle();
      if (phoneLookupError) throw phoneLookupError;
      existingLead = byPhone;
    }

    let leadId: string;
    if (existingLead) {
      const existingMetadata =
        existingLead.metadata && typeof existingLead.metadata === 'object' && !Array.isArray(existingLead.metadata)
          ? existingLead.metadata as Record<string, unknown>
          : {};
      const previousInteractions = Array.isArray(existingMetadata.inquiries)
        ? existingMetadata.inquiries.slice(-19)
        : [];
      const previousMessage = typeof existingLead.message === 'string' ? existingLead.message.trim() : '';
      const nextMessage = [
        previousMessage,
        `[Consulta gratuita ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}]\n${data.message}`,
      ].filter(Boolean).join('\n\n');

      const { error: updateError } = await admin.from('leads').update({
        name: data.name,
        email: normalizedEmail,
        phone: normalizedPhone,
        category: 'Consulta gratuita',
        service: data.service || null,
        message: nextMessage,
        state: 'new',
        updated_at: new Date().toISOString(),
        metadata: {
          ...existingMetadata,
          consultation: interaction,
          last_acquisition: interaction,
          inquiries: [...previousInteractions, interaction],
        },
      }).eq('id', existingLead.id);
      if (updateError) throw updateError;
      leadId = existingLead.id;
    } else {
      const { data: lead, error } = await admin.from('leads').insert({
        name: data.name,
        email: normalizedEmail,
        phone: normalizedPhone,
        client_type: 'particular',
        category: 'Consulta gratuita',
        service: data.service || null,
        country: 'ES',
        urgency: 'media',
        message: data.message,
        state: 'new',
        source: attribution.source,
        source_key: `consultation:${crypto.randomUUID()}`,
        metadata: {
          ...attribution.metadata,
          consultation: interaction,
          last_acquisition: interaction,
          inquiries: [interaction],
        },
      }).select('id').single();

      if (error || !lead?.id) {
        console.error('[consultation] lead insert:', error);
        return NextResponse.json({ error: 'No se pudo registrar la consulta.' }, { status: 500 });
      }
      leadId = lead.id;
    }

    await notifyAdmins({
      title: 'Nueva consulta gratuita',
      body: `${data.name} · ${data.service || 'Servicio por identificar'} · ${data.message.slice(0, 140)}`.slice(0, 240),
      url: '/admin/leads',
      tag: `consultation-${leadId}`,
    }).catch(() => {});

    return NextResponse.json({ success: true, leadId }, { status: existingLead ? 200 : 201 });
  } catch (error) {
    console.error('[consultation]', error);
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}
