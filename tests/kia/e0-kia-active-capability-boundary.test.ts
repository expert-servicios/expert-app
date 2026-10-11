import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { getSupabaseAdmin } from '@/lib/integrations/supabase';

const mocks = vi.hoisted(() => ({
  status: 'active' as string | null,
  tables: [] as string[],
  coverage: vi.fn(),
  grants: vi.fn(),
}));

vi.mock('@/lib/subscriptions/company-commercial-coverage', () => ({
  resolveCompanyCommercialCoverage: mocks.coverage,
}));

vi.mock('@/lib/ai/kia/kia-authoritative-grants', () => ({
  loadKiaAuthoritativeGrants: mocks.grants,
}));

import { resolveKiaActorCapabilities } from '@/lib/ai/kia/kia-actor-capability-resolver';

function admin() {
  return {
    from(table: string) {
      mocks.tables.push(table);
      const query = {
        select() { return query; },
        eq() { return query; },
        maybeSingle: async () => ({
          data: table === 'profiles'
            ? { role: 'client', status: mocks.status, tenant_id: 'tenant-A' }
            : { company_id: 'company-A', role: 'owner' },
          error: null,
        }),
      };
      return query;
    },
  } as unknown as ReturnType<typeof getSupabaseAdmin>;
}

describe('E0 KIA active capability service-role boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.tables.length = 0;
  });

  it.each(['inactive', 'pending', 'suspended', null])(
    'stops profile status %s before membership, coverage or privileged grants',
    async (status) => {
      mocks.status = status;

      const snapshot = await resolveKiaActorCapabilities({
        admin: admin(),
        userId: 'user-A',
        clientId: 'user-A',
        companyId: 'company-A',
        featureFlags: ['kia_operator_mode'],
      });

      expect(snapshot.active).toBe(false);
      expect(snapshot.companyMember).toBe(false);
      expect(snapshot.coverage).toBeNull();
      expect(snapshot.planCapabilities).toEqual([]);
      expect(snapshot.scopes).toEqual([]);
      expect(mocks.tables).toEqual(['profiles']);
      expect(mocks.coverage).not.toHaveBeenCalled();
      expect(mocks.grants).not.toHaveBeenCalled();
    },
  );
});
