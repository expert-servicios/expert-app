import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { checkKiaMessageRateLimit } from '@/lib/ai/kia/kia-rate-limit';
import { verifyRecaptchaToken } from '@/lib/utils/recaptcha';
import { getClientIp } from '@/lib/utils/spam-guard';
import { PUBLIC_KIA_SESSION_COOKIE, publicKiaCookieOptions } from '@/lib/ai/kia/kia-public-session';
import {
  publicWebPersistenceEnabled,
  ensurePublicWebSession,
  readPublicWebHistory,
} from '@/lib/ai/kia/kia-public-web-persistence';

export const dynamic = 'force-dynamic';

const initSchema = z.object({ recaptchaToken: z.string().min(1).max(4096) }).strict();

function blocked() {
  return noStore(NextResponse.json({ error: 'not_found' }, { status: 404 }));
}

function noStore(response: NextResponse) {
  response.headers.set('Cache-Control', 'no-store, private');
  return response;
}

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  const fetchSite = request.headers.get('sec-fetch-site');
  // This POST is browser-initiated and must carry a verified Origin.
  return Boolean(origin && origin === request.nextUrl.origin
    && (!fetchSite || fetchSite === 'same-origin'));
}

/**
 * Browsers sending Fetch Metadata must originate from the same origin.
 * Old clients without Fetch Metadata must supply a matching Origin.
 * This also rejects cross-site top-level GET navigations which may carry
 * SameSite=Lax cookies.
 */
function sameOriginRead(request: NextRequest) {
  const site = request.headers.get('sec-fetch-site');
  const origin = request.headers.get('origin');
  if (site) return site === 'same-origin' && (!origin || origin === request.nextUrl.origin);
  return origin === request.nextUrl.origin;
}

/** Read an existing verified session only. GET must never mint a cookie. */
export async function GET(request: NextRequest) {
  if (!publicWebPersistenceEnabled()) return blocked();
  if (!sameOriginRead(request)) return noStore(NextResponse.json({ error: 'invalid_origin' }, { status: 403 }));
  if (!checkKiaMessageRateLimit(`web-history:${getClientIp(request.headers)}`)) {
    return noStore(NextResponse.json({ error: 'rate_limited' }, { status: 429 }));
  }
  const token = request.cookies.get(PUBLIC_KIA_SESSION_COOKIE)?.value;
  if (!token) return noStore(NextResponse.json({ messages: [] }));
  try {
    const messages = await readPublicWebHistory(getSupabaseAdmin(), token);
    return noStore(NextResponse.json({ messages }));
  } catch {
    return noStore(NextResponse.json({ error: 'history_unavailable' }, { status: 503 }));
  }
}

/** Session bootstrap: cookie is opaque, HttpOnly, and never identifies a client. */
export async function POST(request: NextRequest) {
  if (!publicWebPersistenceEnabled()) return blocked();
  if (!sameOrigin(request)) return noStore(NextResponse.json({ error: 'invalid_origin' }, { status: 403 }));
  if (!checkKiaMessageRateLimit(`web-session:${getClientIp(request.headers)}`)) {
    return noStore(NextResponse.json({ error: 'rate_limited' }, { status: 429 }));
  }
  let payload: unknown;
  try { payload = await request.json(); }
  catch { return noStore(NextResponse.json({ error: 'invalid_json' }, { status: 400 })); }
  const input = initSchema.safeParse(payload);
  if (!input.success) return noStore(NextResponse.json({ error: 'invalid_request' }, { status: 400 }));
  const captcha = await verifyRecaptchaToken({
    token: input.data.recaptchaToken, action: 'kia_public_chat', minScore: 0.4,
  });
  // A development-mode CAPTCHA bypass or missing/wrong action must never mint a session.
  if (!captcha.ok || captcha.skipped || captcha.action !== 'kia_public_chat') {
    return noStore(NextResponse.json({ error: 'verification_failed' }, { status: 403 }));
  }
  try {
    const session = await ensurePublicWebSession(
      getSupabaseAdmin(), request.cookies.get(PUBLIC_KIA_SESSION_COOKIE)?.value,
    );
    const response = noStore(NextResponse.json({ ready: true }));
    if (session.setCookie) response.cookies.set(
      PUBLIC_KIA_SESSION_COOKIE, session.setCookie,
      publicKiaCookieOptions(session.cookieMaxAge),
    );
    return response;
  } catch {
    return noStore(NextResponse.json({ error: 'session_unavailable' }, { status: 503 }));
  }
}
