import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { getMetaMarketingConfigStatus } from '@/lib/integrations/meta/config';

const read = (path: string) => readFileSync(path, 'utf8');
const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

describe('Meta Marketing Hub C2 foundation', () => {
  it('fails closed when Meta Marketing is disabled or incomplete', () => {
    delete process.env.META_MARKETING_CATALOG_ID;
    delete process.env.META_MARKETING_SYSTEM_USER_ACCESS_TOKEN;
    process.env.META_MARKETING_ENABLED = 'false';

    const status = getMetaMarketingConfigStatus();
    expect(status.enabled).toBe(false);
    expect(status.configured).toBe(false);
    expect(status.missing).toContain('META_MARKETING_CATALOG_ID');
  });

  it('never exposes secret values in configuration diagnostics', () => {
    process.env.META_MARKETING_APP_SECRET = 'secret-value';
    process.env.META_MARKETING_SYSTEM_USER_ACCESS_TOKEN = 'token-value';

    const status = getMetaMarketingConfigStatus();
    expect(JSON.stringify(status)).not.toContain('secret-value');
    expect(JSON.stringify(status)).not.toContain('token-value');
  });

  it('reads C2 tables instead of rebuilding a shadow commercial catalog', () => {
    const diagnostics = read('lib/integrations/meta/c2-diagnostics.ts');

    for (const table of [
      'catalog_services',
      'service_contents',
      'commercial_offers',
      'stripe_price_bindings',
      'service_channel_configs',
      'meta_catalog_items',
      'meta_sync_jobs',
    ]) {
      expect(diagnostics).toContain(`.from('${table}')`);
    }

    expect(diagnostics).toContain('serviceProductionManifest');
    expect(diagnostics).toContain('evaluateServiceContentReadiness');
    expect(diagnostics).not.toContain('ADMIN_CATALOG');
  });

  it('keeps the diagnostics API read-only except for the explicit connection test', () => {
    const route = read('app/api/admin/meta/diagnostics/route.ts');
    expect(route).toContain('getMetaC2Diagnostics');
    expect(route).toContain('testMetaMarketingConnection');
    expect(route).not.toContain('.insert(');
    expect(route).not.toContain('.update(');
    expect(route).not.toContain('.delete(');
  });

  it('exposes Marketing Hub from the protected admin sidebar', () => {
    const sidebar = read('components/admin/AdminSidebar.tsx');
    expect(sidebar).toContain('/admin/marketing-hub');
  });
});
