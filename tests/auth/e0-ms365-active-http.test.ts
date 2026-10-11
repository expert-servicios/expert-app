import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => {
  const state = {
    user: { id: 'staff-A' } as { id: string } | null,
    actor: { userId: 'staff-A', role: 'admin', tenantId: null } as {
      userId: string;
      role: 'admin' | 'owner';
      tenantId: string | null;
    } | null,
  };

  return {
    state,
    requireActor: vi.fn(),
    createState: vi.fn(),
    buildUrl: vi.fn(),
    setCookie: vi.fn(),
  };
});

vi.mock('@/lib/integrations/supabase', () => ({
  createServerSupabaseClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: mocks.state.user }, error: null }),
    },
  }),
}));

vi.mock('@/lib/auth/active-actor', () => ({
  requireActiveActor: async (request: unknown, roles: readonly string[]) => {
    mocks.requireActor(request, roles);
    return mocks.state.actor;
  },
}));

vi.mock('@/lib/integrations/microsoft365', () => ({
  getMs365AuthUrl: (state: string) => {
    mocks.buildUrl(state);
    return `https://login.microsoftonline.test/authorize?state=${state}`;
  },
}));

vi.mock('@/lib/auth/oauth-state', () => ({
  createOAuthState: async (params: unknown) => {
    mocks.createState(params);
    return { state: 'state-A', cookieValue: 'cookie-A' };
  },
  setOAuthStateCookie: (response: unknown, cookieValue: string) => {
    mocks.setCookie(response, cookieValue);
  },
}));

import { GET } from '@/app/api/auth/ms365/route';

const request = () => new NextRequest('https://example.test/api/auth/ms365');

describe('E0-M3-06 MS365 OAuth requires currently active privileged actor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.state.user = { id: 'staff-A' };
    mocks.state.actor = { userId: 'staff-A', role: 'admin', tenantId: null };
  });

  it('keeps unauthenticated requests on the login boundary without creating OAuth state', async () => {
    mocks.state.user = null;

    const response = await GET(request());

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://example.test/auth/login');
    expect(mocks.requireActor).not.toHaveBeenCalled();
    expect(mocks.createState).not.toHaveBeenCalled();
    expect(mocks.buildUrl).not.toHaveBeenCalled();
    expect(mocks.setCookie).not.toHaveBeenCalled();
  });

  it('redirects revoked or unapproved staff before creating OAuth state', async () => {
    mocks.state.actor = null;

    const response = await GET(request());

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://example.test/dashboard');
    expect(mocks.requireActor).toHaveBeenCalledWith(
      expect.any(NextRequest),
      ['admin', 'owner'],
    );
    expect(mocks.createState).not.toHaveBeenCalled();
    expect(mocks.buildUrl).not.toHaveBeenCalled();
    expect(mocks.setCookie).not.toHaveBeenCalled();
  });

  it('fails closed when the active actor does not match the authenticated session', async () => {
    mocks.state.actor = { userId: 'staff-B', role: 'admin', tenantId: null };

    const response = await GET(request());

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://example.test/dashboard');
    expect(mocks.createState).not.toHaveBeenCalled();
    expect(mocks.buildUrl).not.toHaveBeenCalled();
    expect(mocks.setCookie).not.toHaveBeenCalled();
  });

  it.each(['admin', 'owner'] as const)(
    'creates state and redirects an active %s to the Microsoft consent boundary',
    async (role) => {
      mocks.state.actor = { userId: 'staff-A', role, tenantId: null };

      const response = await GET(request());

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe(
        'https://login.microsoftonline.test/authorize?state=state-A',
      );
      expect(mocks.requireActor).toHaveBeenCalledWith(
        expect.any(NextRequest),
        ['admin', 'owner'],
      );
      expect(mocks.createState).toHaveBeenCalledWith({
        provider: 'ms365',
        userId: 'staff-A',
        requiresAdmin: true,
      });
      expect(mocks.buildUrl).toHaveBeenCalledWith('state-A');
      expect(mocks.setCookie).toHaveBeenCalledWith(
        expect.anything(),
        'cookie-A',
      );
    },
  );
});
