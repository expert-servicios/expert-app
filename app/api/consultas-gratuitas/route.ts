import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { notifyAdmins } from '@/lib/integrations/push';
import { verifyRecaptchaToken } from '@/lib/utils/recaptcha';
import { checkSpam, checkRateLimit, getClientIp } from '@/lib/utils/spam-guard';
import { buildLeadAttributionFields } from '@/lib/marketing/server-attribution';

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
    const { data: lead, error } = await admin
      .from('leads')
      .insert({
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        phone: parsed.data.phone?.trim() || null,
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
          acquisition: {
            ...(typeof attribution.metadata?.acquisition === 'object' && attribution.metadata.acquisition
              ? attribution.metadata.acquisition
              : {}),
            intent: 'free_question',
            origin: parsed.data.origin || null,
            service: parsed.data.service || null,
          },
        },
      })
      .select('id')
      .single();

    if (error || !lead?.id) {
      console.error('[free consultation] lead insert:', error);
      return NextResponse.json({ error: 'No se pudo registrar la consulta.' }, { status: 500 });
    }

    await notifyAdmins({
      title: 'Nueva consulta gratuita',
      body: `${parsed.data.name} · ${parsed.data.service || 'Consulta general'} · ${parsed.data.question.slice(0, 140)}`.slice(0, 240),
      url: `/admin/leads/${lead.id}`,
      tag: `free-consultation-${lead.id}`,
    }).catch(() => {});

    return NextResponse.json({ success: true, leadId: lead.id }, { status: 201 });
  } catch (error) {
    console.error('[free consultation]', error);
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}
