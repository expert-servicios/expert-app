import { describe, expect, it, vi } from 'vitest';
import { canAccessFinancialReport } from '@/lib/reports/report-access';
import type { getSupabaseAdmin } from '@/lib/integrations/supabase';

function db(profile: { role: string; status: string } | null, error: unknown = null) {
  const maybeSingle = vi.fn(async () => ({ data: profile, error }));
  const query = { select: vi.fn(), eq: vi.fn(), maybeSingle };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  const from = vi.fn(() => query);
  return {
    admin: { from } as unknown as ReturnType<typeof getSupabaseAdmin>,
    from, maybeSingle,
  };
}

describe('E0 financial report active profile boundary', () => {
  it.each(['inactive', 'suspended', 'pending'])('rejects own report for %s client', async (status) => {
    const { admin, from } = db({ role: 'client', status });
    expect(await canAccessFinancialReport(admin, 'client-A', 'client-A')).toBe(false);
    expect(from).toHaveBeenCalledWith('profiles');
  });

  it('denies missing profile and database errors even for the owner', async () => {
    expect(await canAccessFinancialReport(db(null).admin, 'client-A', 'client-A')).toBe(false);
    expect(await canAccessFinancialReport(db({ role: 'client', status: 'active' }, { message: 'unavailable' }).admin, 'client-A', 'client-A')).toBe(false);
  });

  it('allows the active owner, but not another active client', async () => {
    const client = db({ role: 'client', status: 'active' });
    expect(await canAccessFinancialReport(client.admin, 'client-A', 'client-A')).toBe(true);
    expect(await canAccessFinancialReport(client.admin, 'client-B', 'client-A')).toBe(false);
  });

  it('allows only active internal staff to inspect another client report', async () => {
    expect(await canAccessFinancialReport(db({ role: 'admin', status: 'active' }).admin, 'admin-A', 'client-A')).toBe(true);
    expect(await canAccessFinancialReport(db({ role: 'owner', status: 'active' }).admin, 'owner-A', 'client-A')).toBe(true);
    expect(await canAccessFinancialReport(db({ role: 'tenant_admin', status: 'active' }).admin, 'tenant-A', 'client-A')).toBe(false);
    expect(await canAccessFinancialReport(db({ role: 'admin', status: 'suspended' }).admin, 'admin-A', 'client-A')).toBe(false);
  });
});
