import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchRegulatorySource, type RegulatorySourceRow } from '@/lib/regulatory/regulatory-monitor';
import { createRegulatoryProposalPullRequest } from '@/lib/regulatory/regulatory-github';
import { getKiaToolPolicy } from '@/lib/ai/kia/kia-tool-registry';
import { KIA_TASK_TYPES } from '@/lib/ai/kia/kia-output-schema';

const read = (path: string) => readFileSync(path, 'utf8');
const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

function source(overrides: Partial<RegulatorySourceRow> = {}): RegulatorySourceRow {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    source_key: 'test_official',
    authority: 'BOE',
    title: 'Fuente oficial de prueba',
    url: 'https://www.boe.es/',
    fetch_url: 'https://www.boe.es/test',
    fetch_strategy: 'html',
    check_frequency: 'daily',
    last_fingerprint: null,
    ...overrides,
  };
}

describe('KIA Regulatory Registry', () => {
  it('registers regulatory_review as a high-reasoning KIA task', () => {
    expect(KIA_TASK_TYPES).toContain('regulatory_review');

    const router = read('lib/ai/kia/kia-provider-router.ts');
    expect(router).toContain('"regulatory_review"');
  });

  it('exposes canonical regulatory values as an autonomous R0 read tool', () => {
    const policy = getKiaToolPolicy('get_regulatory_value');
    expect(policy?.riskTier).toBe('R0');
    expect(policy?.effect).toBe('read');
    expect(policy?.capability).toBe('regulatory');
    expect(policy?.requiresHumanApproval).toBe(false);
  });

  it('normalizes and fingerprints an allowed official source', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(
      '<html><style>.x{}</style><script>bad()</script><body><h1>Norma oficial</h1><p>Valor 123</p></body></html>',
      {
        status: 200,
        headers: { 'content-type': 'text/html' },
      },
    )));

    const result = await fetchRegulatorySource(source());
    expect(result.excerpt).toContain('Norma oficial');
    expect(result.excerpt).toContain('Valor 123');
    expect(result.excerpt).not.toContain('bad()');
    expect(result.fingerprint).toMatch(/^[a-f0-9]{64}$/);
  });

  it('fingerprints the full normalized payload while keeping the stored excerpt bounded', async () => {
    const prefix = 'A'.repeat(25_000);
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(`${prefix}X`, { status: 200, headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(`${prefix}Y`, { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);

    const jsonSource = source({ fetch_strategy: 'json' });
    const first = await fetchRegulatorySource(jsonSource);
    const second = await fetchRegulatorySource(jsonSource);

    expect(first.excerpt.length).toBeLessThanOrEqual(24_000);
    expect(first.excerpt).toContain('[BEGIN]');
    expect(first.excerpt).toContain('[MIDDLE]');
    expect(first.excerpt).toContain('[END]');
    expect(first.excerpt).not.toBe(second.excerpt);
    expect(first.fingerprint).not.toBe(second.fingerprint);
  });

  it('ignores volatile RSS build metadata when fingerprinting', async () => {
    const bodies = [
      '<rss><channel><lastBuildDate>Sat, 19 Sep 2026 10:00:00 GMT</lastBuildDate><item><title>Cambio real</title><link>https://www.boe.es/x</link></item></channel></rss>',
      '<rss><channel><lastBuildDate>Sat, 19 Sep 2026 11:00:00 GMT</lastBuildDate><item><title>Cambio real</title><link>https://www.boe.es/x</link></item></channel></rss>',
    ];
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(bodies[0], { status: 200, headers: { 'content-type': 'application/xml' } }))
      .mockResolvedValueOnce(new Response(bodies[1], { status: 200, headers: { 'content-type': 'application/xml' } }));
    vi.stubGlobal('fetch', fetchMock);

    const rssSource = source({ fetch_strategy: 'rss' });
    const first = await fetchRegulatorySource(rssSource);
    const second = await fetchRegulatorySource(rssSource);
    expect(first.fingerprint).toBe(second.fingerprint);
  });

  it('treats a BOE 404 as a valid non-publication day without a fingerprint', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', {
      status: 404,
      headers: { 'content-type': 'application/json' },
    })));

    const result = await fetchRegulatorySource(source({
      fetch_strategy: 'boe_daily',
      fetch_url: 'https://www.boe.es/datosabiertos/api/boe/sumario/{date}',
    }));

    expect(result.noPublication).toBe(true);
    expect(result.fingerprint).toBeNull();
    expect(result.excerpt).toBe('');
  });

  it('rejects non-official hosts before fetching', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    await expect(fetchRegulatorySource(source({
      fetch_url: 'https://example.com/not-official',
    }))).rejects.toThrow('host not allowed');

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('keeps GitHub proposal PR creation fail-closed without a dedicated token', async () => {
    delete process.env.REGULATORY_GITHUB_TOKEN;
    await expect(createRegulatoryProposalPullRequest({
      changeId: 'change-1',
      sourceTitle: 'BOE',
      sourceUrl: 'https://www.boe.es/',
      severity: 'high',
      changeType: 'operational_update',
      summary: 'Cambio de prueba',
      effectiveDate: null,
      knownDependencies: [],
      dependencyHints: [],
      proposedFiles: [],
      valueUpdates: [],
    })).resolves.toBeNull();
  });

  it('never updates canonical values directly from the AI classification worker', () => {
    const worker = read('lib/regulatory/regulatory-review.ts');
    expect(worker).toContain('value_updates: parsed.valueUpdates');
    expect(worker).not.toContain(".from('regulatory_values').insert");
    expect(worker).not.toContain(".from('regulatory_values').update");
  });

  it('uses first fetch only as baseline and creates changes only after a previous fingerprint exists', () => {
    const monitor = read('lib/regulatory/regulatory-monitor.ts');
    expect(monitor).toContain('const hasBaseline = Boolean(source.last_fingerprint)');
    expect(monitor).toContain('const isChanged = hasBaseline && source.last_fingerprint !== fetched.fingerprint');
    expect(monitor).toContain("onConflict: 'current_snapshot_id'");
    expect(monitor).toContain('Source state update failed');
    expect(monitor).toContain('if (fetched.noPublication)');
    expect(monitor).toContain('last_success_at: checkedAt');
  });

  it('protects all regulatory cron routes with CRON_SECRET', () => {
    for (const path of [
      'app/api/cron/regulatory-pulse/route.ts',
      'app/api/cron/regulatory-worker/route.ts',
      'app/api/cron/regulatory-monthly-audit/route.ts',
    ]) {
      expect(read(path), path).toContain('verifyCronRequest');
      expect(read(path), path).toContain('export const POST = GET;');
    }
  });

  it('schedules daily pulse, hourly worker and monthly audit through pg_cron', () => {
    const migration = read('supabase/migrations/20260919193500_kia_regulatory_cron.sql');
    expect(migration).toContain("'regulatory-pulse-daily'");
    expect(migration).toContain("'17 5 * * *'");
    expect(migration).toContain("'regulatory-worker-hourly'");
    expect(migration).toContain("'37 * * * *'");
    expect(migration).toContain("'regulatory-monthly-audit'");
    expect(migration).toContain("'41 5 3 * *'");
    expect(migration).toContain("where name = 'cron_secret'");
    const registryMigration = read('supabase/migrations/20260919191500_kia_regulatory_registry.sql');
    expect(registryMigration).toContain('regulatory_changes_current_snapshot_unique');
  });

  it('monitors direct official feeds instead of only RSS directory pages', () => {
    const migration = read('supabase/migrations/20260919191500_kia_regulatory_registry.sql');
    expect(migration).toContain('https://sede.agenciatributaria.gob.es/Sede/todas-noticias.xml');
    expect(migration).toContain('aeat_analysis_rss');
    expect(migration).toContain('seg_social_legislation');
    expect(migration).toContain('seg_social_red_bulletins');
    expect(migration).toContain('seg_social_red_alerts');
    expect(migration).toContain('https://servicios.ine.es/wstempus/js/ES/TABLAS_OPERACION/IPC?det=2');
  });

  it('blocks publication only when a critical change is explicitly linked to the service dependency', () => {
    const orchestrator = read('lib/services/service-publication-orchestrator.ts');
    expect(orchestrator).toContain("regulatory_change_dependencies");
    expect(orchestrator).toContain("code: 'regulatory_block'");
    expect(orchestrator).toContain("change?.severity === 'critical'");
    expect(orchestrator).toContain("['detected', 'classified', 'needs_review', 'proposal_ready']");
  });

  it('hardens v1.1 with change-specific impact, specific sources and longer pg_net timeout', () => {
    const migration = read('supabase/migrations/20260920073500_kia_regulatory_hardening_v11.sql');
    expect(migration).toContain('regulatory_change_dependencies');
    expect(migration).toContain('migraciones_arraigo_social');
    expect(migration).toContain('migraciones_renovacion_hub');
    expect(migration).toContain('justicia_nacionalidad_residencia');
    expect(migration).toContain('boe_trust_services_law');
    expect(migration).toContain('boe_rd_1155_2024');
    expect(migration).toContain('timeout_milliseconds := 30000');
    expect(migration).toContain('apply_regulatory_value_reviewed');
  });

  it('treats latest published periodic values separately from legal validity', () => {
    const values = read('lib/regulatory/regulatory-values.ts');
    const migration = read('supabase/migrations/20260920073500_kia_regulatory_hardening_v11.sql');
    expect(values).toContain("availability_mode === 'latest_published'");
    expect(migration).toContain('"availability_mode":"latest_published"');
  });

  it('runs a real monthly health audit and supports explicit Telegram scopes', () => {
    const monthly = read('app/api/cron/regulatory-monthly-audit/route.ts');
    const audit = read('lib/regulatory/regulatory-audit.ts');
    const telegram = read('app/api/webhooks/telegram/route.ts');
    expect(monthly).toContain('runRegulatoryHealthAudit');
    expect(audit).toContain('source_missing_baseline');
    expect(audit).toContain('source_stale');
    expect(audit).toContain('value_overlap');
    expect(audit).toContain('dependency_orphan_value');
    expect(audit).toContain('run_stuck');
    expect(telegram).toContain("['source', 'authority', 'topic', 'service']");
    expect(telegram).toContain('serviceKey:');
  });

  it('requires a human resolution note and keeps value periods non-overlapping', () => {
    const values = read('lib/regulatory/regulatory-values.ts');
    const admin = read('app/(protected)/admin/regulatory/page.tsx');
    expect(values).toContain('La resolución requiere una nota');
    expect(values).toContain("admin.rpc('apply_regulatory_value_reviewed'");
    expect(admin).toContain("window.prompt('Indica brevemente qué se ha revisado");
  });

  it('keeps blocked Migraciones pages as manual references and falls back to BOE monitoring', () => {
    const migration = read('supabase/migrations/20260920080000_regulatory_migraciones_waf_fallback.sql');
    expect(migration).toContain("'monitoring_mode', 'manual_reference'");
    expect(migration).toContain("'automatic_fallback_source', 'boe_rd_1155_2024'");
    expect(migration).toContain("'arraigo-social'");
    expect(migration).toContain("'reagrupacion-familiar'");
    expect(migration).toContain("'renovacion-residencia'");
    expect(migration).toContain("'impact_requires_classification', true");
  });

  it('keeps registry tables server-side only with explicit browser deny policies', () => {
    const migration = read('supabase/migrations/20260919191500_kia_regulatory_registry.sql');
    expect(migration).toContain('alter table public.regulatory_sources enable row level security');
    expect(migration).toContain('regulatory_sources_deny_browser');
    expect(migration).toContain('regulatory_changes_deny_browser');
    expect(migration).toContain('regulatory_values_deny_browser');
    expect(migration).toContain('to service_role');
  });

  it('adds admin-only /legal commands to the verified Telegram channel', () => {
    const telegram = read('app/api/webhooks/telegram/route.ts');
    expect(telegram).toContain("if (command === '/legal' && adminChat)");
    expect(telegram).toContain("action === 'cambios'");
    expect(telegram).toContain("action === 'valor'");
    expect(telegram).toContain("action === 'revisar'");
    expect(telegram).toContain('after(async () => {');
  });

  it('separates value approval from full regulatory resolution', () => {
    const values = read('lib/regulatory/regulatory-values.ts');
    const adminRoute = read('app/api/admin/regulatory/route.ts');

    expect(values).toContain('values_applied_at');
    expect(values).toContain('resolveReviewedRegulatoryChange');
    expect(values).toContain('resolved: false');
    expect(adminRoute).toContain("action?: 'pulse' | 'worker' | 'apply_values' | 'resolve_change'");
    expect(adminRoute).toContain('resolveReviewedRegulatoryChange');
  });

  it('exposes a protected admin Regulatory Pulse panel', () => {
    const adminRoute = read('app/api/admin/regulatory/route.ts');
    expect(adminRoute).toContain("profile?.role !== 'admin' && profile?.role !== 'owner'");
    expect(adminRoute).toContain("status: 403");
    expect(read('app/(protected)/admin/regulatory/page.tsx')).toContain('KIA Regulatory Pulse');
    expect(read('components/admin/AdminSidebar.tsx')).toContain('/admin/regulatory');
  });

  it('documents the no-auto-merge and no-auto-publish contract', () => {
    const docs = read('docs/kia-regulatory-registry.md');
    expect(docs).toContain('Nunca se hace merge automático');
    expect(docs).toContain('Nunca se modifica producción desde el cron');
    expect(docs).toContain('fingerprint');
  });
});
