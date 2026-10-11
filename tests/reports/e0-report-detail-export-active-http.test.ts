import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => {
  const state = {
    user: { id: 'client-A' } as { id: string } | null,
    actor: { userId: 'client-A', role: 'client', tenantId: 'tenant-A' } as {
      userId: string; role: string; tenantId: string | null;
    } | null,
    tables: [] as string[],
  };
  return { state, getAdmin: vi.fn() };
});

vi.mock('@/lib/auth/active-actor', () => ({
  requireActiveActor: async () => mocks.state.actor,
}));

vi.mock('@/lib/reports/report-access', () => ({
  canAccessFinancialReport: async () => true,
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
          eq() { return query; },
          update() { return query; },
          maybeSingle: async () => ({
            data: {
              id: 'report-A',
              client_id: 'client-A',
              viewed_at: null,
              title: 'Informe',
              data: {},
            },
            error: null,
          }),
          then(
            resolve: (value: { data: null; error: null }) => unknown,
            reject?: (reason: unknown) => unknown,
          ) {
            return Promise.resolve({ data: null, error: null }).then(resolve, reject);
          },
        };
        return query;
      },
    };
  },
}));

vi.mock('@react-pdf/renderer', () => ({
  renderToBuffer: vi.fn(),
  Document: 'Document',
  Page: 'Page',
  Text: 'Text',
  View: 'View',
  StyleSheet: { create: (input: unknown) => input },
}));

vi.mock('docx', () => ({
  Document: class {},
  Packer: { toBuffer: vi.fn() },
  Paragraph: class {},
  TextRun: class {},
  Table: class {},
  TableRow: class {},
  TableCell: class {},
  HeadingLevel: { HEADING_1: 'h1', HEADING_2: 'h2', TITLE: 'title' },
  AlignmentType: { LEFT: 'left', CENTER: 'center' },
  ShadingType: { SOLID: 'solid' },
}));

vi.mock('jszip', () => ({
  default: class {
    file() { return this; }
    generateAsync() { return Promise.resolve(Buffer.from([])); }
  },
}));

import { GET as getDetail } from '@/app/api/reports/[id]/route';
import { GET as getPdf } from '@/app/api/reports/[id]/pdf/route';
import { GET as getWord } from '@/app/api/reports/[id]/word/route';
import { GET as getExcel } from '@/app/api/reports/[id]/excel/route';

const req = () => new NextRequest('https://example.test/api/reports/report-A');
const ctx = { params: Promise.resolve({ id: 'report-A' }) };
const handlers = [
  ['detail', getDetail],
  ['pdf', getPdf],
  ['word', getWord],
  ['excel', getExcel],
] as const;

describe('E0 financial report detail/export pre-read revocation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.state.user = { id: 'client-A' };
    mocks.state.actor = { userId: 'client-A', role: 'client', tenantId: 'tenant-A' };
    mocks.state.tables.length = 0;
  });

  it.each(handlers)('rejects revoked sessions before privileged report reads: %s', async (_name, handler) => {
    mocks.state.actor = null;
    const response = await handler(req(), ctx);
    expect(response.status).toBe(403);
    expect(mocks.getAdmin).not.toHaveBeenCalled();
    expect(mocks.state.tables).toEqual([]);
  });

  it.each(handlers)('rejects a mismatched authenticated actor before report reads: %s', async (_name, handler) => {
    mocks.state.actor = { userId: 'client-B', role: 'client', tenantId: 'tenant-A' };
    const response = await handler(req(), ctx);
    expect(response.status).toBe(403);
    expect(mocks.getAdmin).not.toHaveBeenCalled();
  });

  it('preserves legitimate detail access and only then records viewed_at', async () => {
    const response = await getDetail(req(), ctx);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      report: { id: 'report-A', client_id: 'client-A' },
    });
    expect(mocks.state.tables).toEqual(['kia_financial_reports', 'kia_financial_reports']);
  });
});
