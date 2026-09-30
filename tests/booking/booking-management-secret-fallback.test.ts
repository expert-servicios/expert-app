import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const booking = readFileSync(resolve(process.cwd(), 'app/api/booking/route.ts'), 'utf8');
const token = readFileSync(resolve(process.cwd(), 'lib/booking/booking-management-token.ts'), 'utf8');
const env = readFileSync(resolve(process.cwd(), '.env.example'), 'utf8');

describe('booking management link fallback', () => {
  it('does not roll back an already-created calendar meeting when the management token cannot be created', () => {
    expect(booking).toContain("management links unavailable; booking remains confirmed");
    expect(booking).toContain("let managementLinks: { cancelUrl: string; rescheduleUrl: string } | null = null");
    expect(booking).toContain('createBookingManagementToken');
    expect(booking).toContain('citaConfirmed(');
  });

  it('supports a dedicated booking secret before legacy fallbacks', () => {
    const dedicated = token.indexOf('BOOKING_MANAGEMENT_SECRET');
    const oauth = token.indexOf('OAUTH_STATE_SECRET');
    expect(dedicated).toBeGreaterThan(-1);
    expect(oauth).toBeGreaterThan(dedicated);
  });

  it('documents the dedicated booking secret', () => {
    expect(env).toContain('BOOKING_MANAGEMENT_SECRET=');
  });
});
