import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { KiaWorkResults } from '@/components/admin/KiaWorkResults';
import { fetchWithCookies } from '@/lib/utils/server-fetch';
vi.mock('@/lib/utils/server-fetch', () => ({ fetchWithCookies: vi.fn() }));
const row = { id: 'result', title: 'Documento', received_at: '2026-09-24T10:00:00Z', requires_review: false, reason: null };
async function render(result: Record<string, unknown>) {
  vi.mocked(fetchWithCookies).mockResolvedValue({ results: [{ ...row, error_code: null, ...result }], tasks: [], connections: [], evidence: { documents: [], emails: [], administrative_actions: [] } });
  return renderToStaticMarkup(await KiaWorkResults({ caseId: 'case' }));
}
describe('Professional Work activity view', () => {
  it('does not present receipt acceptance as completion', async () => {
    const html = await render({ state: 'pending', outcome: null });
    expect(html).toContain('comprobación pendiente');
    expect(html).not.toContain('Completada');
  });
  it('shows completion only for a successfully applied outcome', async () => {
    expect(await render({ state: 'applied', outcome: 'succeeded' })).toContain('Completada');
    expect(await render({ state: 'applied', outcome: 'blocked' })).not.toContain('Completada');
  });
  it('shows review instructions and escapes untrusted reason text', async () => {
    const html = await render({ state: 'review', requires_review: true, reason: '<script>bad()</script>' });
    expect(html).toContain('Necesita revisión');
    expect(html).not.toContain('<script>');
  });
  it('distinguishes unavailable data from an empty activity list', async () => {
    vi.mocked(fetchWithCookies).mockResolvedValue(null);
    expect(renderToStaticMarkup(await KiaWorkResults({ caseId: 'case' }))).toContain('No se ha podido comprobar');
  });
});
