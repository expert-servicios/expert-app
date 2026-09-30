import { NextRequest, NextResponse } from 'next/server';
import { analyzeKiaAttachment, KIA_MAX_ATTACHMENT_BYTES } from '@/lib/ai/kia/kia-attachment';
import { checkKiaMessageRateLimit } from '@/lib/ai/kia/kia-rate-limit';
import { verifyRecaptchaToken } from '@/lib/utils/recaptcha';
import { getClientIp } from '@/lib/utils/spam-guard';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  if (process.env.KIA_PUBLIC_ATTACHMENTS_ENABLED?.toLowerCase() === 'false') {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const rawContentLength = request.headers.get('content-length');
  const contentLength = rawContentLength ? Number(rawContentLength) : Number.NaN;
  if (!Number.isFinite(contentLength) || contentLength <= 0) {
    return NextResponse.json({ error: 'content_length_required' }, { status: 411 });
  }
  if (contentLength > KIA_MAX_ATTACHMENT_BYTES + 1024 * 1024) {
    return NextResponse.json({ error: 'attachment_too_large' }, { status: 413 });
  }

  const ip = getClientIp(request.headers);
  if (!checkKiaMessageRateLimit(`public:attachment:${ip}`)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  const recaptchaToken = form?.get('recaptchaToken');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'missing_attachment' }, { status: 400 });
  }
  if (file.size > KIA_MAX_ATTACHMENT_BYTES) {
    return NextResponse.json({ error: 'attachment_too_large' }, { status: 413 });
  }
  if (typeof recaptchaToken !== 'string') {
    return NextResponse.json({ error: 'verification_required' }, { status: 400 });
  }

  const recaptcha = await verifyRecaptchaToken({
    token: recaptchaToken,
    action: 'kia_public_attachment',
    minScore: 0.4,
  });
  if (!recaptcha.ok) {
    return NextResponse.json({ error: 'verification_failed' }, { status: 403 });
  }

  try {
    const result = await analyzeKiaAttachment(file);
    return NextResponse.json({
      fileName: file.name,
      mimeType: result.mimeType,
      analysis: result.text,
      model: result.model,
      persisted: false,
    }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'attachment_analysis_failed';
    const status = message === 'attachment_type_invalid' || message === 'attachment_size_invalid' ? 400 : 503;
    return NextResponse.json({ error: message }, { status });
  }
}
