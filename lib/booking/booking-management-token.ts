import { jwtVerify, SignJWT } from 'jose';
import { getPublicAppUrl } from '@/lib/utils/app-url';
import type { BookingServiceKey } from '@/lib/booking/native-booking';

export type BookingManagementAuthorization = {
  appointmentId: string;
  email: string;
  service: BookingServiceKey;
};

const TTL_SECONDS = 90 * 24 * 60 * 60;

function secret(): Uint8Array {
  const value =
    process.env.OAUTH_STATE_SECRET ??
    process.env.INTERNAL_API_SECRET ??
    process.env.HOLDED_MCP_SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error('A 32+ char application secret is required for booking management links');
  }
  return new TextEncoder().encode(value);
}

export async function createBookingManagementToken(
  input: BookingManagementAuthorization
): Promise<string> {
  return new SignJWT({
    purpose: 'booking_manage',
    appointmentId: input.appointmentId,
    email: input.email.trim().toLowerCase(),
    service: input.service,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${TTL_SECONDS}s`)
    .sign(secret());
}

export async function verifyBookingManagementToken(
  token: string | null | undefined,
  expectedService?: BookingServiceKey,
): Promise<BookingManagementAuthorization | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.purpose !== 'booking_manage') return null;
    if (typeof payload.appointmentId !== 'string' || !payload.appointmentId) return null;
    if (typeof payload.email !== 'string' || !payload.email) return null;
    if (typeof payload.service !== 'string' || !payload.service) return null;
    if (expectedService && payload.service !== expectedService) return null;
    return {
      appointmentId: payload.appointmentId,
      email: payload.email.toLowerCase(),
      service: payload.service as BookingServiceKey,
    };
  } catch {
    return null;
  }
}

export function bookingManagementUrls(token: string, service: BookingServiceKey) {
  const appUrl = getPublicAppUrl().replace(/\/$/, '');
  return {
    cancelUrl: `${appUrl}/cita/gestionar?token=${encodeURIComponent(token)}`,
    rescheduleUrl: `${appUrl}/cita?tipo=${encodeURIComponent(service)}&manage=${encodeURIComponent(token)}`,
  };
}
