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
    expect(report).not.toContain('resolveHoldedAuth(input.integrationId)');
  });

  it('routes KIA accounting reads through HoldedGateway', () => {
    const executor = source('lib/ai/kia/kia-tool-executor.ts');
    expect(executor).toContain('createHoldedGatewayForIntegration(access.access.integrationId)');
    expect(executor).toContain('listHoldedDocuments(');
    expect(executor).toContain('listHoldedDocumentType(');
    expect(executor).toContain('listHoldedContacts(');
    expect(executor).toContain('listHoldedBankAccounts(');
    expect(executor).not.toContain('resolveHoldedAuth(access.access.integrationId)');
  });

  it('normalizes v1 and v2 into a shared read model', () => {
    const gateway = source('lib/integrations/holded/holded-gateway.ts');
    expect(gateway).toContain('export interface HoldedReadDocument');
    expect(gateway).toContain('v1DocumentToReadModel');
    expect(gateway).toContain('v2DocumentToReadModel');
    expect(gateway).toContain('if (gateway.v2)');
  });
});
