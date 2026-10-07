import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/send';
import { contactAutoReply, contactMessage } from '@/lib/email/templates';
import { verifyRecaptchaToken } from '@/lib/utils/recaptcha';
import { checkRateLimit, checkSpam, getClientIp } from '@/lib/utils/spam-guard';
import { notifyAdmins } from '@/lib/integrations/push';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { ensureInboundLead } from '@/lib/leads/ensure-inbound-lead';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.hp_url) return NextResponse.json({ ok: true });

    const ip = getClientIp(request.headers);
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Inténtalo más tarde.' }, { status: 429 });
    }

    const nombre = String(body.nombre ?? '').trim();
    const email = String(body.email ?? '').trim();
    const telefono = String(body.telefono ?? '').trim();
    const asunto = String(body.asunto ?? '').trim();
    const mensaje = String(body.mensaje ?? '').trim();
    const recaptchaToken = String(body.recaptcha_token ?? '');

    if (!nombre || !email || !mensaje) {
      return NextResponse.json({ error: 'Faltan campos obligatorios.' }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Email inválido.' }, { status: 400 });
    }

    const spam = checkSpam({ name: nombre, email, message: mensaje, subject: asunto });
    if (spam.isSpam) {
      return NextResponse.json({ ok: true });
    }

    const recaptcha = await verifyRecaptchaToken({ token: recaptchaToken, action: 'contact' });
    if (!recaptcha.ok) {
      return NextResponse.json({ error: 'Verificación anti-spam fallida. Inténtalo de nuevo.' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const normalizedEmail = email.toLowerCase();
    const lead = await ensureInboundLead({
      admin,
      name: nombre,
      email: normalizedEmail,
      phone: telefono || null,
      source: 'website',
      sourceKey: `contact:${crypto.randomUUID()}`,
      category: 'Contacto web',
      service: asunto || 'consulta-general',
      message: mensaje,
      channel: 'web_form',
      origin: 'form:contacto',
      metadata: { subject: asunto || null },
    });

    const adminEmail = process.env.ADMIN_EMAILS ?? 'info@expertconsulting.es';

    await Promise.all([
      sendEmail({
        to: adminEmail,
        eventType: 'contact.received',
        ...contactMessage(nombre, email, asunto, mensaje, telefono || undefined),
        metadata: { lead_id: lead.leadId, source: 'form:contacto' }
      }),
      sendEmail({
        to: email,
        eventType: 'contact.autoreply',
        ...contactAutoReply(nombre, asunto),
        metadata: { lead_id: lead.leadId, source: 'form:contacto' }
      })
    ]);

    notifyAdmins({
      title: `✉️ Contacto: ${nombre}`,
      body: asunto ? `${asunto} — ${mensaje.slice(0, 60)}` : mensaje.slice(0, 80),
      url: `/admin/leads?focus=${lead.leadId}`,
      tag: `contact-${email}`,
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[api/contact]', error);
    return NextResponse.json({ error: 'Error al enviar el mensaje. Inténtalo de nuevo.' }, { status: 500 });
  }
}
