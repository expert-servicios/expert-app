import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  status: 'active' as string | null,
  role: 'admin',
  signedIn: true,
  tables: [] as string[],
}));

vi.mock('@/lib/integrations/supabase', () => ({
  createServerSupabaseClient: () => ({
    auth: {
      getUser: async () => ({
        data: { user: mocks.signedIn ? { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' } : null },
        error: null,
      }),
    },
  }),
  getSupabaseAdmin: () => ({
    from(table: string) {
      mocks.tables.push(table);
      return {
        select() { return this; },
        eq() { return this; },
        maybeSingle: async () => ({
          data: { status: mocks.status, role: mocks.role, tenant_id: null },
          error: null,
        }),
      };
    },
  }),
}));

import { POST as controlPost } from '@/app/api/admin/inbox/control/route';
import { POST as emailControlPost } from '@/app/api/admin/inbox/email-control/route';
import { POST as replyPost } from '@/app/api/admin/inbox/reply/route';
import { POST as reassignPost } from '@/app/api/admin/inbox/reassign/route';

const routePaths = [
  'app/api/admin/inbox/control/route.ts',
  'app/api/admin/inbox/email-control/route.ts',
  'app/api/admin/inbox/reply/route.ts',
  'app/api/admin/inbox/reassign/route.ts',
];

const handlers = [
  { label: 'conversation control', path: '/api/admin/inbox/control', action: controlPost },
  { label: 'email control', path: '/api/admin/inbox/email-control', action: emailControlPost },
  { label: 'Telegram manual reply', path: '/api/admin/inbox/reply', action: replyPost },
  { label: 'context reassignment', path: '/api/admin/inbox/reassign', action: reassignPost },
] as const;

const request = (path: string) => new NextRequest(`https://expertconsulting.es${path}`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', origin: 'https://expertconsulting.es' },
  body: '{}',
});

describe('E0-M3-06: Operations 360 mutations require an active staff actor', () => {
  beforeEach(() => {
    mocks.tables.length = 0;
    mocks.status = 'active';
    mocks.role = 'admin';
    mocks.signedIn = true;
  });

  it.each(['inactive', 'pending', 'suspended', null])(
    'rejects status %s before any protected read, send or write',
    async (status) => {
      mocks.status = status;
      for (const test of handlers) {
        mocks.tables.length = 0;
        const response = await test.action(request(test.path));
        expect(response.status, test.label).toBe(403);
        expect(mocks.tables, test.label).toEqual(['profiles']);
      }
    },
  );

  it('rejects a client role on every mutation', async () => {
    mocks.role = 'client';
    for (const test of handlers) {
      mocks.tables.length = 0;
      const response = await test.action(request(test.path));
      expect(response.status, test.label).toBe(403);
      expect(mocks.tables, test.label).toEqual(['profiles']);
    }
  });

  it('rejects unauthenticated callers without service-role access', async () => {
    mocks.signedIn = false;
    for (const test of handlers) {
      mocks.tables.length = 0;
      const response = await test.action(request(test.path));
      expect(response.status, test.label).toBe(403);
      expect(mocks.tables, test.label).toEqual([]);
    }
  });

  it.each(routePaths)('%s reuses the shared active actor gate', (path) => {
    const source = readFileSync(path, 'utf8');
    expect(source).toContain("import { requireActiveActor } from '@/lib/auth/active-actor'");
    expect(source).toContain("requireActiveActor(request, ['admin', 'owner'])");
    expect(source).not.toContain("profile.status === 'inactive'");
  });
});
