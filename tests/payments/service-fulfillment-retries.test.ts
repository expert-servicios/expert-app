import { describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ensureServiceOrderFulfillment } from '@/lib/payments/service-order-fulfillment';

function database(failFirstLink = false) {
  const state = { caseId: null as string | null, linked: null as string | null, tasks: [] as Record<string, unknown>[], failed: false };
  const admin = { from(table: string) {
    let operation = 'select';
    let value: Record<string, unknown> = {};
    const filters: Array<(row: Record<string, unknown>) => boolean> = [];
    const field = (row: Record<string, unknown>, key: string) => {
      const [column, property] = key.split('->>');
      return property ? (row[column] as Record<string, unknown> | null)?.[property] ?? null : row[column];
    };
    const query = {
      select() { return query; },
      eq(key: string, expected: unknown) { filters.push(row => field(row, key) === expected); return query; },
      is(key: string, expected: unknown) { filters.push(row => field(row, key) === expected); return query; },
      in(key: string, expected: unknown[]) { filters.push(row => expected.includes(row[key])); return query; },
      limit() { return query; },
      insert(data: Record<string, unknown>) { operation = 'insert'; value = data; return query; },
      update(data: Record<string, unknown>) { operation = 'update'; value = data; return query; },
      single() { return query; },
      maybeSingle() { return query; },
      then(resolve: (result: unknown) => unknown) {
        let data: unknown = null;
        let error: unknown = null;
        if (table === 'cases') {
          if (operation === 'insert') state.caseId = 'case-1';
          data = state.caseId ? { id: state.caseId } : null;
        } else if (table === 'orders') {
          if (failFirstLink && !state.failed) { state.failed = true; error = { message: 'temporary link failure' }; }
          else state.linked = value.case_id as string;
        } else if (table === 'internal_tasks') {
          if (operation === 'insert') state.tasks.push({ id: `task-${state.tasks.length}`, ...value });
          else data = state.tasks.find(row => filters.every(matches => matches(row))) ?? null;
        }
        return Promise.resolve({ data, error }).then(resolve);
      },
    };
    return query;
  } } as unknown as SupabaseClient;
  return { admin, state };
}

const input = { orderId: 'order-1', serviceSlug: 'manual-test-service', clientId: 'client-1', companyId: null };

describe('service fulfillment retries', () => {
  it('keeps same-title tasks separate across services and preserves renamed completed tasks', async () => {
    const { admin, state } = database();
    const cart = { ...input, serviceSlug: 'certificado-digital-persona-fisica', serviceSlugs: ['pack-certificados-digitales'] };
    await ensureServiceOrderFulfillment(admin, cart);
    expect(state.tasks).toHaveLength(7);
    expect(state.tasks.filter(task => task.title === 'Emitir certificado digital persona física')).toHaveLength(2);
    state.tasks[0].title = 'Revisado por el gestor';
    state.tasks[0].status = 'completada';
    await ensureServiceOrderFulfillment(admin, cart);
    expect(state.tasks).toHaveLength(7);
    expect(state.tasks[0].title).toBe('Revisado por el gestor');
  });

  it('preserves a legacy task without identity when its title is unambiguous', async () => {
    const { admin, state } = database();
    await ensureServiceOrderFulfillment(admin, input);
    state.tasks[0].metadata = null;
    state.tasks[0].status = 'completada';
    await ensureServiceOrderFulfillment(admin, input);
    expect(state.tasks).toHaveLength(1);
  });

  it('links a pre-existing case and creates its missing intake task', async () => {
    const { admin, state } = database();
    state.caseId = 'legacy-case';
    await expect(ensureServiceOrderFulfillment(admin, input)).resolves.toBe('legacy-case');
    expect(state.linked).toBe('legacy-case');
    expect(state.tasks).toHaveLength(1);
    await ensureServiceOrderFulfillment(admin, input);
    expect(state.tasks).toHaveLength(1);
  });

  it('repairs the order link after a case was created but linking failed', async () => {
    const { admin, state } = database(true);
    await expect(ensureServiceOrderFulfillment(admin, input)).rejects.toThrow('temporary link failure');
    expect(state.caseId).toBe('case-1');
    await ensureServiceOrderFulfillment(admin, input);
    expect(state.linked).toBe('case-1');
    expect(state.tasks).toHaveLength(1);
  });

  it.each(['completada', 'cancelada'])('does not recreate a %s task on payment replay', async status => {
    const { admin, state } = database();
    await ensureServiceOrderFulfillment(admin, input);
    state.tasks[0].status = status;
    await ensureServiceOrderFulfillment(admin, input);
    expect(state.tasks).toHaveLength(1);
    expect(state.tasks[0].status).toBe(status);
  });
});
