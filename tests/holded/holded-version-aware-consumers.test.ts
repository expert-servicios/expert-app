import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('Holded version-aware accounting consumers', () => {
  it('routes quarter summaries through HoldedGateway', () => {
    const quarter = source('lib/holded/quarter-data.ts');
    expect(quarter).toContain('createHoldedGatewayForIntegration');
    expect(quarter).toContain("listHoldedDocuments(gateway, 'sales'");
    expect(quarter).toContain("listHoldedDocuments(gateway, 'purchase'");
    expect(quarter).not.toContain('createHoldedClient(integrationId)');
  });

  it('routes financial reports through HoldedGateway', () => {
    const report = source('lib/reports/report-generator.ts');
    expect(report).toContain('createHoldedGatewayForIntegration(input.integrationId)');
    expect(report).toContain("listHoldedDocuments(gateway, 'sales'");
    expect(report).toContain("listHoldedDocuments(gateway, 'purchase'");
    expect(report).toContain('listHoldedBankAccounts(gateway');
    expect(report).toContain("maxItems: 20, includeDrafts: true");
    expect(report).toContain('buildTopContacts(confirmedSales)');
    expect(report).toContain('buildMonthlyFlow(confirmedSales, confirmedPurchases)');
    expect(report).toContain('toInvoiceSummary(tableSales)');
    expect(report).toContain('toInvoiceSummary(tablePurchases)');
    expect(report).not.toContain('resolveHoldedAuth(input.integrationId)');
  });

  it('routes KIA accounting reads through HoldedGateway', () => {
    const executor = source('lib/ai/kia/kia-tool-executor.ts');
    const accounting = source('lib/ai/kia/kia-accounting-tools.ts');
    expect(executor).toContain('createHoldedGatewayForIntegration(access.access.integrationId)');
    expect(executor).toContain('listHoldedDocuments(');
    expect(executor).toContain('listHoldedDocumentType(');
    expect(executor).toContain('listHoldedContacts(');
    expect(executor).toContain('listHoldedBankAccounts(');
    expect(executor).not.toContain('resolveHoldedAuth(access.access.integrationId)');
    expect(accounting).toContain('createHoldedGatewayForIntegration(access.access.integrationId)');
    expect(accounting).toContain('listHoldedBankMovements(');
    expect(accounting).toContain("'cancelled', 'canceled', 'failed'");
    expect(accounting).not.toContain('buildHoldedHeaders');
    expect(accounting).not.toContain('resolveHoldedAuth');
  });

  it('normalizes v1 and v2 into a shared read model', () => {
    const gateway = source('lib/integrations/holded/holded-gateway.ts');
    expect(gateway).toContain('export interface HoldedReadDocument');
    expect(gateway).toContain('v1DocumentToReadModel');
    expect(gateway).toContain('v2DocumentToReadModel');
    expect(gateway).toContain('includeDrafts?: boolean');
    expect(gateway).toContain("['approved', 'draft']");
    expect(gateway).toContain('if (gateway.v2)');
  });
});


describe('Holded legacy compatibility contracts', () => {
  it('keeps v1 treasury on the supported /treasury endpoint', () => {
    const client = source('lib/integrations/holded/holded-client.ts');
    expect(client).toContain("get<unknown>('/treasury')");
    expect(client).not.toContain("get<unknown>('/treasury/accounts')");
  });

  it('prevents Client 360 from rewriting managed v2 integrations as legacy v1', () => {
    const route = source('app/api/admin/clientes/[id]/holded/route.ts');
    expect(route).toContain("existing.api_version === 'v2'");
    expect(route).toContain("existing.mode === 'advisor_managed'");
    expect(route).toContain("api_version: 'v1'");
    expect(route).toContain('se administra desde Company 360');
  });
});
