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
    const { data: lead, error } = await admin.from('leads').insert({
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone || null,
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
        consultation: {
          origin: data.origin || null,
          service: data.service || null,
          intent: 'free_question',
        },
      },
    }).select('id').single();

    if (error || !lead?.id) {
      console.error('[consultation] lead insert:', error);
      return NextResponse.json({ error: 'No se pudo registrar la consulta.' }, { status: 500 });
    }

    await notifyAdmins({
      title: 'Nueva consulta gratuita',
      body: `${data.name} · ${data.service || 'Servicio por identificar'} · ${data.message.slice(0, 140)}`.slice(0, 240),
      url: '/admin/leads',
      tag: `consultation-${lead.id}`,
    }).catch(() => {});

    return NextResponse.json({ success: true, leadId: lead.id }, { status: 201 });
  } catch (error) {
    console.error('[consultation]', error);
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}
