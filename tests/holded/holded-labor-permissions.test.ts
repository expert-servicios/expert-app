import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { detectHoldedLaborPermissions } from '@/lib/integrations/holded/holded-labor-permissions';

describe('Holded labor permission detection', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('detects employee and payroll read capabilities with Bearer auth', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [] }), { status: 200 }));

    const permissions = await detectHoldedLaborPermissions('labor-secret');

    expect(permissions).toEqual({
      laborEmployeesRead: true,
      laborPayrollsRead: true,
      laborEmployeesWrite: false,
      laborPayrollsWrite: false,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    for (const [url, init] of fetchMock.mock.calls as Array<[string, RequestInit]>) {
      expect(url).not.toContain('labor-secret');
      expect(init.method).toBe('GET');
      expect(init.body).toBeUndefined();
      expect(init.headers).toMatchObject({ Authorization: 'Bearer labor-secret' });
    }
  });

  it('fails closed independently when a read capability is denied', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response('forbidden', { status: 403 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [] }), { status: 200 }));

    const permissions = await detectHoldedLaborPermissions('labor-secret');

    expect(permissions.laborEmployeesRead).toBe(false);
    expect(permissions.laborPayrollsRead).toBe(true);
    expect(permissions.laborEmployeesWrite).toBe(false);
    expect(permissions.laborPayrollsWrite).toBe(false);
  });

  it('returns all labor capabilities disabled for an empty key without making requests', async () => {
    const permissions = await detectHoldedLaborPermissions('   ');

    expect(permissions).toEqual({
      laborEmployeesRead: false,
      laborPayrollsRead: false,
      laborEmployeesWrite: false,
      laborPayrollsWrite: false,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
