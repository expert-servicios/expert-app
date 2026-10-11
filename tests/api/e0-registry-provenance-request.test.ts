import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Exercise the actual route handlers with an isolated, synthetic Supabase adapter.
// Assertions are against inserted records, not source-code strings or live customer data.
const state = vi.hoisted(() => ({
  getUser: vi.fn(),
  adminFrom: vi.fn(),
  inserts: [] as Array<{ table: string; row: Record<string, unknown> }>,
  updates: [] as Array<{ table: string; row: Record<string, unknown>; filters: Array<[string, unknown]> }>,
  ownedRows: [] as Array<{ company_id: string }>,
  companyMatches: [] as Array<{ id: string; razon_social: string; cif_nif: string }>,
  existingCompany: null as { id: string; razon_social: string } | null,
}));

vi.mock('@/lib/integrations/supabase', () => ({
  createServerSupabaseClient: () => ({ auth: { getUser: state.getUser } }),
  getSupabaseAdmin: () => ({ from: state.adminFrom }),
}));

vi.mock('@/lib/integrations/company-data-resolver', () => ({
  validateSpanishTaxIdFormat: (input: string) => ({
    valid: true, normalized: input.replace(/[^A-Z0-9]/gi, '').toUpperCase(), type: 'cif',
  }),
}));

import { POST as createCompany } from '@/app/api/companies/route';
import { POST as associateCompany } from '@/app/api/company/associate/route';

const COMPANY_ID = '22222222-2222-4222-8222-222222222222';
const SUGGESTION_ID = '33333333-3333-4333-8333-333333333333';
const ACTOR_ID = '11111111-1111-4111-8111-111111111111';

function makeQuery(table: string) {
  let inserted: Record<string, unknown> | undefined;
  let mutated = false;
  const filters: Array<[string, unknown]> = [];
  const result = () => ({
    data: !mutated && table === 'profile_companies' ? state.ownedRows
      : !mutated && table === 'companies' ? state.companyMatches
      : null,
    error: null,
  });
  const query = {
    select(_columns?: string) { return this; },
    eq(column: string, value: unknown) { filters.push([column, value]); return this; },
    in(_column: string, _values: unknown[]) { return this; },
    limit(_n: number) { return this; },
    insert(row: Record<string, unknown>) {
      inserted = row;
      mutated = true;
      state.inserts.push({ table, row });
      return this;
    },
    update(row: Record<string, unknown>) {
      mutated = true;
      state.updates.push({ table, row, filters });
      return this;
    },
    delete() { mutated = true; return this; },
    async single() {
      if (table === 'companies' && inserted) {
        return { data: { id: COMPANY_ID, ...inserted }, error: null };
      }
      if (table === 'companies') return { data: state.existingCompany, error: null };
      return { data: null, error: null };
    },
    then<T = unknown>(
      resolve?: ((value: ReturnType<typeof result>) => T | PromiseLike<T>) | null,
      reject?: ((reason: unknown) => unknown) | null,
    ) {
      return Promise.resolve(result()).then(resolve, reject);
    },
  };
  return query;
}

const request = (path: string, body: unknown) => new NextRequest(`http://localhost${path}`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

const manuallyEntered = {
  razon_social: 'MANUAL DEMO SL', cif_nif: 'B12345678', forma_juridica: 'sl',
  direccion: 'Calle del Cliente 7', ciudad: 'Alicante', pais: 'ES',
};

const suggested = (source = 'registradores_opendata') => ({
  userConfirmed: true,
  suggestionId: SUGGESTION_ID,
  normalizedPayload: {
    name: 'SUGERIDA DEMO SL', taxId: 'B12345678',
    registeredAddress: 'Calle Sugerida 1', city: 'Alicante',
    source, confidence: 'high',
  },
  overrides: {
    razon_social: 'CONFIRMADA DEMO SL', direccion: 'Calle Confirmada 2',
  },
});

const companyInsert = () => {
  const found = state.inserts.find((entry) => entry.table === 'companies');
  expect(found).toBeDefined();
  return found!.row;
};

function expectUnverified(row: Record<string, unknown>) {
  expect(row.registry_source).toBeNull();
  expect(row.registry_source_url).toBeNull();
  expect(row.registry_verified_at).toBeNull();
  expect(row.registry_locked_fields).toEqual([]);
  expect(row.registry_snapshot).toEqual({});
}

beforeEach(() => {
  vi.clearAllMocks();
  state.inserts.length = 0;
  state.updates.length = 0;
  state.ownedRows = [];
  state.companyMatches = [];
  state.existingCompany = null;
  state.getUser.mockResolvedValue({
    data: { user: { id: ACTOR_ID } }, error: null,
  });
  state.adminFrom.mockImplementation(makeQuery);
});

describe('E0-M3-05 — HTTP contract for registry provenance', () => {
  it('rejects an unauthenticated company creation without writes', async () => {
    state.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const response = await createCompany(request('/api/companies', manuallyEntered));
    expect(response.status).toBe(401);
    expect(state.inserts).toHaveLength(0);
  });

  it('treats a forged browser official claim and snapshot as unverified on company POST', async () => {
    const response = await createCompany(request('/api/companies', {
      ...manuallyEntered,
      _registryOfficial: true,
      _registrySource: 'registradores_opendata',
      _registrySourceUrl: 'https://example.org/forged-registry',
      _registryRetrievedAt: '2026-10-10T10:00:00.000Z',
      _registrySnapshot: {
        name: 'SPOOFED OFFICIAL SL', taxId: 'B98765432',
        registeredAddress: 'Otra calle 99', city: 'Otro municipio',
      },
      _appliedSuggestionId: SUGGESTION_ID,
    }));
    expect(response.status).toBe(201);
    const row = companyInsert();
    expect(row.razon_social).toBe(manuallyEntered.razon_social);
    expect(row.cif_nif).toBe(manuallyEntered.cif_nif);
    expect(row.direccion).toBe(manuallyEntered.direccion);
    expectUnverified(row);
    expect(state.updates.find((x) => x.table === 'company_data_suggestions')?.filters)
      .toContainEqual(['profile_id', ACTOR_ID]);
  });

  it('allows a legitimate manual company creation without inventing registry verification', async () => {
    const response = await createCompany(request('/api/companies', manuallyEntered));
    expect(response.status).toBe(201);
    expectUnverified(companyInsert());
    expect(state.inserts.some((x) => x.table === 'profile_companies')).toBe(true);
  });

  it('rejects associate without explicit user confirmation before any write', async () => {
    const response = await associateCompany(request('/api/company/associate', {
      ...suggested(), userConfirmed: false,
    }));
    expect(response.status).toBe(400);
    expect(state.inserts).toHaveLength(0);
  });

  it.each(['registradores_opendata', 'boe_borme', 'unverified_user_label'])(
    'never promotes user-provided source %s to registry authority',
    async (source) => {
      const response = await associateCompany(request('/api/company/associate', suggested(source)));
      expect(response.status).toBe(200);
      const row = companyInsert();
      expect(row.razon_social).toBe('CONFIRMADA DEMO SL');
      expect(row.direccion).toBe('Calle Confirmada 2');
      expectUnverified(row);
      expect(state.updates.find((x) => x.table === 'company_data_suggestions')?.filters)
        .toContainEqual(['profile_id', ACTOR_ID]);
    },
  );

  it('reuses a genuinely owned company on duplicate CIF without claiming verification', async () => {
    state.ownedRows = [{ company_id: COMPANY_ID }];
    state.existingCompany = { id: COMPANY_ID, razon_social: 'EXISTENTE DEMO SL' };
    const response = await associateCompany(request('/api/company/associate', suggested()));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true, companyId: COMPANY_ID, created: false });
    expect(state.inserts.some((entry) => entry.table === 'companies')).toBe(false);
  });
});
