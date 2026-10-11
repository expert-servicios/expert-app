import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const DECISION_ID = '11111111-1111-4111-8111-111111111111';

const mocks = vi.hoisted(() => {
  const state = {
    user: { id: 'client-A' } as { id: string } | null,
    actor: { userId: 'client-A', role: 'client', tenantId: 'tenant-A' } as {
      userId: string; role: string; tenantId: string | null;
    } | null,
    log: {
      id: '11111111-1111-4111-8111-111111111111',
      client_id: 'client-A',
      channel: 'dashboard',
      output_json: { userMessage: 'Respuesta canónica de KIA' },
    } as {
      id: string;
      client_id: string;
      channel: string;
      output_json: Record<string, unknown>;
    } | null,
    lookupError: null as { message: string } | null,
    tables: [] as string[],
    filters: [] as Array<[string, unknown]>,
  };

  return {
    state,
    getAdmin: vi.fn(),
    requireActor: vi.fn(),
    storeFeedback: vi.fn(),
  };
});

vi.mock('@/lib/auth/active-actor', () => ({
  requireActiveActor: async () => {
    mocks.requireActor();
    return mocks.state.actor;
  },
}));

vi.mock('@/lib/ai/kia/kia-feedback-store', () => ({
  storeKiaFeedback: (input: Record<string, unknown>) => {
    mocks.storeFeedback(input);
    return Promise.resolve();
  },
}));

vi.mock('@/lib/integrations/supabase', () => ({
  createServerSupabaseClient: () => ({
    auth: { getUser: async () => ({ data: { user: mocks.state.user }, error: null }) },
  }),
  getSupabaseAdmin: () => {
    mocks.getAdmin();
    return {
      from(table: string) {
        mocks.state.tables.push(table);
        const query = {
          select() { return query; },
          eq(column: string, value: unknown) {
            mocks.state.filters.push([column, value]);
            return query;
          },
          maybeSingle: async () => ({
            data: mocks.state.log,
            error: mocks.state.lookupError,
          }),
        };
        return query;
      },
    };
  },
}));

import { POST } from '@/app/api/ai/kia/feedback/route';

const request = () => new NextRequest('https://example.test/api/ai/kia/feedback', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    decisionLogId: DECISION_ID,
    rating: 'positive',
    userMessage: 'Pregunta fiscal',
  }),
});

describe('E0 KIA feedback exact-active and object authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.state.user = { id: 'client-A' };
    mocks.state.actor = { userId: 'client-A', role: 'client', tenantId: 'tenant-A' };
    mocks.state.log = {
      id: DECISION_ID,
      client_id: 'client-A',
      channel: 'dashboard',
      output_json: { userMessage: 'Respuesta canónica de KIA' },
    };
    mocks.state.lookupError = null;
    mocks.state.tables.length = 0;
    mocks.state.filters.length = 0;
  });

  it('rejects a revoked session before the route privileged read', async () => {
    mocks.state.actor = null;

    const response = await POST(request());

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'feedback_forbidden' });
    expect(mocks.getAdmin).not.toHaveBeenCalled();
    expect(mocks.storeFeedback).not.toHaveBeenCalled();
  });

  it('rejects a mismatched actor before the route privileged read', async () => {
    mocks.state.actor = { userId: 'client-B', role: 'client', tenantId: 'tenant-A' };

    const response = await POST(request());

    expect(response.status).toBe(403);
    expect(mocks.getAdmin).not.toHaveBeenCalled();
  });

  it('keeps unauthenticated feedback at 401 without privileged access', async () => {
    mocks.state.user = null;

    const response = await POST(request());

    expect(response.status).toBe(401);
    expect(mocks.requireActor).not.toHaveBeenCalled();
    expect(mocks.getAdmin).not.toHaveBeenCalled();
  });

  it('rejects a decision log owned by another client', async () => {
    if (mocks.state.log) mocks.state.log.client_id = 'client-B';

    const response = await POST(request());

    expect(response.status).toBe(403);
    expect(mocks.state.tables).toEqual(['kia_decision_logs']);
    expect(mocks.storeFeedback).not.toHaveBeenCalled();
  });

  it('rejects a decision log from a non-dashboard channel', async () => {
    if (mocks.state.log) mocks.state.log.channel = 'telegram_verified';

    const response = await POST(request());

    expect(response.status).toBe(403);
    expect(mocks.storeFeedback).not.toHaveBeenCalled();
  });

  it('stores active dashboard feedback with canonical reply and session identity', async () => {
    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(mocks.state.tables).toEqual(['kia_decision_logs']);
    expect(mocks.state.filters).toEqual([['id', DECISION_ID]]);
    expect(mocks.storeFeedback).toHaveBeenCalledWith({
      rating: 'positive',
      decisionLogId: DECISION_ID,
      clientId: 'client-A',
      channel: 'dashboard',
      userMessage: 'Pregunta fiscal',
      kiaReply: 'Respuesta canónica de KIA',
      feedbackContext: { source: 'kia_copilot_widget' },
    });
  });
});
