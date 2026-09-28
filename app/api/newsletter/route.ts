import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { checkRateLimit, checkSpam, getClientIp } from '@/lib/utils/spam-guard';
import { verifyRecaptchaToken } from '@/lib/utils/recaptcha';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SEGMENTS = new Set(['particular_residente','particular_no_residente','autonomo','empresa']);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email ?? '').toLowerCase().trim();
    const name = String(body.name ?? '').trim() || null;
    const source = String(body.source ?? 'website').trim();
    const audienceSegment = String(body.audience_segment ?? '').trim();
    const hp = String(body.hp_url ?? '');

    // Honeypot: bots fill this, humans don't
    if (hp) return NextResponse.json({ ok: true });

    // Rate limit: max 5 requests per IP per hour
    const clientIp = getClientIp(request.headers);
    if (!checkRateLimit(`newsletter:${clientIp}`)) {
      return NextResponse.json({ ok: true }); // silent — don't reveal limit to bots
    }

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Email inválido.' }, { status: 400 });
    }

    if (!SEGMENTS.has(audienceSegment)) {
      return NextResponse.json({ error: 'Selecciona el tipo de novedades que quieres recibir.' }, { status: 400 });
    }

    const recaptcha = await verifyRecaptchaToken({
      token: String(body.recaptcha_token ?? ''),
      action: 'newsletter',
    });
    if (!recaptcha.ok) {
      return NextResponse.json({ error: 'Verificación anti-spam fallida. Inténtalo de nuevo.' }, { status: 400 });
    }

    // Block disposable/temp email domains
    const spam = checkSpam({ email });
    if (spam.isSpam) {
      return NextResponse.json({ ok: true }); // silent — don't reveal detection
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('newsletter_subscribers').upsert(
      { email, name, source, channel: 'email', audience_segment: audienceSegment, unsubscribed_at: null, updated_at: new Date().toISOString() },
      { onConflict: 'email' }
    );

    if (error) {
      console.error('[newsletter]', error);
      return NextResponse.json({ error: 'No se pudo registrar el email.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[newsletter]', error);
    return NextResponse.json({ error: 'Error del servidor.' }, { status: 500 });
  }
}
