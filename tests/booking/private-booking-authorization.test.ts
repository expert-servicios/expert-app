import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createPrivateBookingAuthorization,
  verifyPrivateBookingAuthorization,
  withPrivateBookingAuthorization,
} from '@/lib/booking/private-booking-authorization';

describe('private booking authorization', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('binds a signed invitation to service, email and company', async () => {
    vi.stubEnv('OAUTH_STATE_SECRET', '0123456789abcdef0123456789abcdef');

    const token = await createPrivateBookingAuthorization({
      service: 'onboarding',
      email: 'CLIENTE@EXAMPLE.COM',
      clientId: '11111111-1111-1111-1111-111111111111',
      companyId: '22222222-2222-2222-2222-222222222222',
      source: 'stripe',
      sourceRef: 'cs_test_123',
    });

    const verified = await verifyPrivateBookingAuthorization(token, 'onboarding');
    expect(verified).toMatchObject({
      service: 'onboarding',
      email: 'cliente@example.com',
      clientId: '11111111-1111-1111-1111-111111111111',
      companyId: '22222222-2222-2222-2222-222222222222',
      source: 'stripe',
      sourceRef: 'cs_test_123',
    });
  });

  it('rejects using a training invitation for onboarding', async () => {
    vi.stubEnv('OAUTH_STATE_SECRET', '0123456789abcdef0123456789abcdef');

    const token = await createPrivateBookingAuthorization({
      service: 'formacion-holded',
      email: 'cliente@example.com',
      clientId: null,
      companyId: null,
      source: 'holded_demo',
      sourceRef: '33333333-3333-3333-3333-333333333333',
    });

    expect(await verifyPrivateBookingAuthorization(token, 'onboarding')).toBeNull();
  });

  it('only appends the token to EXPERT native booking URLs', async () => {
    vi.stubEnv('OAUTH_STATE_SECRET', '0123456789abcdef0123456789abcdef');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://expertconsulting.es');

    const token = await createPrivateBookingAuthorization({
      service: 'formacion-holded',
      email: 'cliente@example.com',
      clientId: null,
      companyId: null,
      source: 'holded_demo',
      sourceRef: '44444444-4444-4444-4444-444444444444',
    });

    const native = withPrivateBookingAuthorization('/cita?tipo=formacion-holded', token);
    expect(native).toContain('https://expertconsulting.es/cita?');
    expect(native).toContain('auth=');

    const legacy = 'https://cal.com/expert/formacion';
    expect(withPrivateBookingAuthorization(legacy, token)).toBe(legacy);
  });
});
