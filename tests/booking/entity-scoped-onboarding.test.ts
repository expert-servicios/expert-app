import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

describe('entity-scoped onboarding appointments', () => {
  const migration = source('supabase/migrations/20260924083358_entity_scoped_appointments.sql');
  const booking = source('app/api/booking/route.ts');
  const page = source('app/(public)/cita/page.tsx');
  const form = source('components/booking/NativeBookingForm.tsx');
  const identity = source('lib/admin/onboarding-booking-identity.ts');

  it('adds nullable client/company identity without historical backfill', () => {
    expect(migration).toContain('add column if not exists client_id uuid null');
    expect(migration).toContain('add column if not exists company_id uuid null');
    expect(migration).not.toContain('update public.appointments');
    expect(migration).toContain('appointments_client_company_date_idx');
  });

  it('accepts explicit entity selection only for authenticated onboarding', () => {
    expect(booking).toContain('company_id: z.string().uuid().optional()');
    expect(booking).toContain(".from('profile_companies')");
    expect(booking).toContain(".eq('profile_id', user.id)");
    expect(booking).toContain(".eq('company_id', input.company_id)");
    expect(booking).toContain("error: 'La entidad seleccionada no pertenece a tu cuenta EXPERT.'");
  });

  it('persists canonical booking identity on new appointments', () => {
    expect(booking).toContain('client_id: privateIdentity?.clientId ?? null');
    expect(booking).toContain('company_id: privateIdentity?.companyId ?? null');
    expect(booking).toContain('client_id: privateIdentity?.clientId ?? null');
  });

  it('preserves entity selection through login and submission', () => {
    expect(page).toContain('companyId?: string');
    expect(page).toContain('companyId={companyId}');
    expect(form).toContain('companyId?: string | null');
    expect(form).toContain('company_id: companyId ?? undefined');
    expect(form).toContain('redirectToLoginForEntityOnboarding');
  });

  it('prefers scoped appointment rows and only falls back to unattributed legacy rows', () => {
    expect(identity).toContain(".eq('client_id', clientId)");
    expect(identity).toContain(".eq('company_id', companyId)");
    expect(identity).toContain(".is('client_id', null)");
    expect(identity).toContain(".is('company_id', null)");
    expect(identity).toContain('never rewritten or attributed automatically');
  });

  it('revalidates signed invitation membership before using its company', () => {
    expect(booking).toContain('signedAuthorization.clientId');
    expect(booking).toContain("La invitación de onboarding ya no corresponde a una entidad vinculada al cliente.");
  });
});