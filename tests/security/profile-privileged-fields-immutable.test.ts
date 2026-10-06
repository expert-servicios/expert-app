import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  'supabase/migrations/20261006110510_profiles_privileged_fields_immutable.sql',
  'utf8',
);

describe('profile privileged fields', () => {
  it('blocks ordinary users from self-promoting through editable profiles', () => {
    expect(migration).toContain('auth.uid() = old.id');
    expect(migration).toContain('not (public.is_admin() or public.is_admin_email())');
    expect(migration).toContain('new.role is distinct from old.role');
    expect(migration).toContain("errcode = '42501'");
  });

  it('protects other authorization and entitlement fields', () => {
    for (const field of ['status', 'tenant_id', 'has_monthly_plan', 'plan', 'stripe_customer_id']) {
      expect(migration).toContain(`new.${field} is distinct from old.${field}`);
    }
  });
});
