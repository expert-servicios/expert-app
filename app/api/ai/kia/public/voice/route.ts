import { NextRequest, NextResponse } from 'next/server';
import { checkKiaMessageRateLimit } from '@/lib/ai/kia/kia-rate-limit';
import { KIA_MAX_AUDIO_BYTES, transcribeKiaAudio } from '@/lib/ai/kia/kia-audio';
import { verifyRecaptchaToken } from '@/lib/utils/recaptcha';
import { getClientIp } from '@/lib/utils/spam-guard';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  if (process.env.KIA_PUBLIC_VOICE_ENABLED?.toLowerCase() === 'false') {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const rawContentLength = request.headers.get('content-length');
  const contentLength = rawContentLength ? Number(rawContentLength) : Number.NaN;
  if (!Number.isFinite(contentLength) || contentLength <= 0) {
    return NextResponse.json({ error: 'content_length_required' }, { status: 411 });
  }
  if (contentLength > KIA_MAX_AUDIO_BYTES + 1024 * 1024) {
    return NextResponse.json({ error: 'audio_too_large' }, { status: 413 });
  }

  const ip = getClientIp(request.headers);
  if (!checkKiaMessageRateLimit(`public:voice:${ip}`)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  const form = await request.formData().catch(() => null);
  const audio = form?.get('audio');
  const recaptchaToken = form?.get('recaptchaToken');

  if (!(audio instanceof File)) {
    return NextResponse.json({ error: 'missing_audio' }, { status: 400 });
  }
  if (audio.size > KIA_MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: 'audio_too_large' }, { status: 413 });
  }
  if (typeof recaptchaToken !== 'string') {
    return NextResponse.json({ error: 'verification_required' }, { status: 400 });
  }

  const recaptcha = await verifyRecaptchaToken({
    token: recaptchaToken,
    action: 'kia_public_voice',
    minScore: 0.4,
  });
  if (!recaptcha.ok) {
    return NextResponse.json({ error: 'verification_failed' }, { status: 403 });
  }

  try {
    const result = await transcribeKiaAudio(audio);
    return NextResponse.json({
      transcript: result.text,
      model: result.model,
    }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'transcription_failed';
    const status = message === 'audio_type_invalid' || message === 'audio_size_invalid' ? 400 : 503;
    return NextResponse.json({ error: message }, { status });
  }
}
