import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('Holded advisor-managed v2 connection', () => {
  const route = source('app/api/admin/empresas/[id]/holded/route.ts');
  const panel = source('app/(protected)/admin/empresas/[id]/integraciones/CompanyHoldedAdminPanel.tsx');

  it('accepts explicit connection ownership and API version', () => {
    expect(route).toContain("apiVersion: z.enum(['v1', 'v2']).default('v1')");
    expect(route).toContain("mode: z.enum(['client_account', 'advisor_managed']).default('client_account')");
    expect(route).toContain('api_version: parsed.data.apiVersion');
    expect(route).toContain('mode: parsed.data.mode');
  });

  it('validates v2 tokens with read-only Bearer probes', () => {
    expect(route).toContain("if (apiVersion === 'v2')");
    expect(route).toContain('createHoldedV2ClientFromRawKey(rawApiKey)');
    expect(route).toContain('await client.getUsage()');
    expect(route).toContain("['salesInvoices', () => client.listInvoices({ limit: 1 })]");
    expect(route).toContain("['purchaseInvoices', () => client.listPurchases({ limit: 1 })]");
    expect(route).toContain("['bankAccounts', () => client.listTreasuryAccounts({ limit: 1 })]");
  });

  it('keeps the token encrypted in the canonical secret table', () => {
    expect(route).toContain('encryptSecret(parsed.data.apiKey)');
    expect(route).toContain("from('client_integration_secrets')");
    expect(route).not.toContain('HOLDED_DGM_API_TOKEN');
  });

  it('lets Admin distinguish managed-advisory and collaborative tenants', () => {
    expect(panel).toContain('Gestionada por EXPERT Asesoría');
    expect(panel).toContain('Cuenta propia del cliente');
    expect(panel).toContain("setConnectionMode('advisor_managed')");
    expect(panel).toContain("setApiVersion('v2')");
    expect(panel).toContain("apiVersion: connectionMode === 'advisor_managed' ? 'v2' : apiVersion");
  });

  it('shows the stored mode and API version after connection', () => {
    expect(panel).toContain("integration.mode === 'advisor_managed'");
    expect(panel).toContain("API {integration.api_version ?? 'v1'}");
  });
});
