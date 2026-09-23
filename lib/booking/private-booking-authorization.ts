import { jwtVerify, SignJWT } from 'jose';
import { getPublicAppUrl } from '@/lib/utils/app-url';
import type { BookingServiceKey } from '@/lib/booking/native-booking';

export type PrivateBookingAuthorization = {
  service: Extract<BookingServiceKey, 'onboarding' | 'formacion-holded'>;
  email: string;
  clientId: string | null;
  companyId: string | null;
  source: 'stripe' | 'holded_demo' | 'admin';
  sourceRef: string;
};

const BOOKING_AUTH_TTL_SECONDS = 30 * 24 * 60 * 60;

function getBookingAuthorizationSecret(): Uint8Array {
  const secret =
    process.env.OAUTH_STATE_SECRET ??
    process.env.INTERNAL_API_SECRET ??
    process.env.HOLDED_MCP_SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      'OAUTH_STATE_SECRET, INTERNAL_API_SECRET or HOLDED_MCP_SESSION_SECRET (32+ chars) is required for private booking authorization'
    );
  }

  return new TextEncoder().encode(secret);
}

export async function createPrivateBookingAuthorization(
  input: PrivateBookingAuthorization
): Promise<string> {
  return new SignJWT({
    purpose: 'private_booking',
    service: input.service,
    email: input.email.trim().toLowerCase(),
    clientId: input.clientId,
    companyId: input.companyId,
    source: input.source,
    sourceRef: input.sourceRef,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${BOOKING_AUTH_TTL_SECONDS}s`)
    .sign(getBookingAuthorizationSecret());
}

export async function verifyPrivateBookingAuthorization(
  token: string | null | undefined,
  expectedService: PrivateBookingAuthorization['service']
): Promise<PrivateBookingAuthorization | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getBookingAuthorizationSecret());
    if (payload.purpose !== 'private_booking') return null;
    if (payload.service !== expectedService) return null;
    if (typeof payload.email !== 'string' || !payload.email) return null;
    if (typeof payload.source !== 'string' || !['stripe', 'holded_demo', 'admin'].includes(payload.source)) return null;
    if (typeof payload.sourceRef !== 'string' || !payload.sourceRef) return null;

    return {
      service: expectedService,
      email: payload.email.toLowerCase(),
      clientId: typeof payload.clientId === 'string' && payload.clientId ? payload.clientId : null,
      companyId: typeof payload.companyId === 'string' && payload.companyId ? payload.companyId : null,
      source: payload.source as PrivateBookingAuthorization['source'],
      sourceRef: payload.sourceRef,
    };
  } catch {
    return null;
  }
}

export function withPrivateBookingAuthorization(
  bookingUrl: string,
  token: string
): string {
  if (!bookingUrl) return bookingUrl;

  try {
    const base = getPublicAppUrl();
    const url = new URL(bookingUrl, `${base}/`);
    const app = new URL(base);

    // Only EXPERT's native /cita endpoint understands this token. Legacy Cal.com
    // fallback URLs keep their own provider authorization semantics.
    if (url.origin !== app.origin || url.pathname !== '/cita') return bookingUrl;

    url.searchParams.set('auth', token);
    return url.toString();
  } catch {
    return bookingUrl;
  }
}
