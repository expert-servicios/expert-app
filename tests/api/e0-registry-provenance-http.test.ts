import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  actorPresent: true,
  writes: [] as Array<{ table: string; operation: string; payload: Record<string, unknown> }>,
  calls: [] as string[],
}));

vi.mock('@/lib/integrations/supabase', () => ({
  createServerSupabaseClient: () => ({
    auth: { getUser: async () => ({ data: { user: mocks.actorPresent ? { id: 'e0-actor' } : null }, error: null }) },
  }),
  getSupabaseAdmin: () => ({
    from: (table: string) => {
      mocks.calls.push(table);
      let operation = 'read';
      let payload: Record<string, unknown> = {};
      const chain = {
        select: () => chain,
        eq: () => chain,
        in: () => chain,
        order: () => chain,
        limit: () => chain,
        insert: (input: Record<string, unknown>) => {
          operation = 'insert';
          payload = input;
          mocks.writes.push({ table, operation, payload: input });
          return chain;
        },
        update: (input: Record<string, unknown>) => {
          operation = 'update';
          payload = input;
          mocks.writes.push({ table, operation, payload: input });
          return chain;
        },
        delete: () => { operation = 'delete'; return chain; },
        single: async () => {
          if (operation === 'insert' && table === 'companies') {
            return { data: { ...payload, id: '11111111-1111-4111-8111-111111111111' }, error: null };
          }
          return { data: null, error: null };
        },
        then: (ok: (value: { data: unknown[]; error: null }) => unknown, fail?: (error: unknown) => unknown) =>
          Promise.resolve({
            data: operation === 'read' && table === 'profile_companies' ? [] : [],
            error: null,
          }).then(ok, fail),
      };
      return chain;
    },
  }),
}));

vi.mock('@/lib/integrations/company-data-resolver', () => ({
  validateSpanishTaxIdFormat: () => ({ valid: true, type: 'cif', normalized: 'B12345678' }),
}));

import { POST as createCompany } from '@/app/api/companies/route';
import { POST as associateCompany } from '@/app/api/company/associate/route';

function request(path: string, input: unknown) {
  return new NextRequest(`http://localhost${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
}

function insertedCompany(): Record<string, unknown> {
  const record = mocks.writes.find((entry) => entry.table === 'companies' && entry.operation === 'insert');
  if (!record) throw new Error('Expected a company insertion in mock');
  return record.payload;
}

describe('E0-M3-05 behavioral request tests: registry provenance is server-only', () => {
  beforeEach(() => {
    mocks.writes.length = 0;
    mocks.calls.length = 0;
    mocks.actorPresent = true;
  });

  it('does not accept browser claimed official verification, snapshot overrides, or locks on company POST', async () => {
    const response = await createCompany(request('/api/companies', {
      razon_social: 'REAL TEST ENTITY SL',
      forma_juridica: 'sl',
      cif_nif: 'B12345678',
      _registryOfficial: true,
      _registrySource: 'registradores_opendata',
      _registrySourceUrl: 'https://example.invalid/claimed-official',
      _registryRetrievedAt: '2026-10-10T00:00:00.000Z',
      _registrySnapshot: {
        name: 'FALSE OFFICIAL NAME',
        taxId: 'B99999999',
        registeredAddress: 'FALSE LOCKED ADDRESS',
      },
    }));
    expect(response.status).toBe(201);
    const row = insertedCompany();
    expect(row).toMatchObject({
      razon_social: 'REAL TEST ENTITY SL',
      cif_nif: 'B12345678',
      registry_source: null,
      registry_source_url: null,
      registry_verified_at: null,
      registry_locked_fields: [],
      registry_snapshot: {},
    });
    expect(row.razon_social).not.toBe('FALSE OFFICIAL NAME');
    expect(row.cif_nif).not.toBe('B99999999');
  });

  it('keeps high-confidence public suggestions editable, not registry-verified, on associate POST', async () => {
    const response = await associateCompany(request('/api/company/associate', {
      userConfirmed: true,
      suggestionId: '22222222-2222-4222-8222-222222222222',
      normalizedPayload: {
        name: 'SUGGESTED TEST ENTITY SL',
        taxId: 'B12345678',
        registeredAddress: 'Suggestion street',
        city: 'Madrid',
        country: 'ES',
        source: 'registradores_opendata',
        sourceUrl: 'https://example.invalid/suggested',
        confidence: 'high',
      },
      overrides: { razon_social: 'USER CONFIRMED ENTITY SL', direccion: 'User corrected street' },
    }));
    expect(response.status).toBe(200);
    expect(insertedCompany()).toMatchObject({
      razon_social: 'USER CONFIRMED ENTITY SL',
      direccion: 'User corrected street',
      registry_source: null,
      registry_source_url: null,
      registry_verified_at: null,
      registry_locked_fields: [],
      registry_snapshot: {},
    });
  });

  it('rejects missing human confirmation before any company write', async () => {
    const response = await associateCompany(request('/api/company/associate', {
      userConfirmed: false,
      normalizedPayload: { name: 'FAKE SL', source: 'boe_borme', confidence: 'high' },
    }));
    expect(response.status).toBe(400);
    expect(mocks.writes).toHaveLength(0);
  });

  it('rejects unauthenticated create and associate requests before writes', async () => {
    mocks.actorPresent = false;
    const a = await createCompany(request('/api/companies', {
      razon_social: 'ANON SL', forma_juridica: 'sl', _registryOfficial: true,
    }));
    const b = await associateCompany(request('/api/company/associate', {
      userConfirmed: true,
      normalizedPayload: { name: 'ANON SL', source: 'boe_borme', confidence: 'high' },
    }));
    expect(a.status).toBe(401);
    expect(b.status).toBe(401);
    expect(mocks.writes).toHaveLength(0);
  });
});
