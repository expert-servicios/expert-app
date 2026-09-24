import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('lib/reports/report-generator.ts', 'utf8');

describe('report generator accounting anomaly scope', () => {
  it('queries accounting anomalies by company_id', () => {
    expect(source).toContain(".from('accounting_anomalies')");
    expect(source).toContain(".eq('company_id', input.companyId)");
    expect(source).not.toContain(".eq('client_id', input.clientId)");
  });

  it('does not query company-scoped anomalies without a companyId', () => {
    expect(source).toContain('const anomalyRows = input.companyId');
    expect(source).toContain(': [];');
  });

  it('normalizes database severity values to report severity values', () => {
    expect(source).toContain("case 'critical':");
    expect(source).toContain("case 'alta':");
    expect(source).toContain("case 'media':");
    expect(source).toContain("case 'baja':");
    expect(source).toContain("return 'warning';");
    expect(source).toContain("return 'info';");
    expect(source).toContain('severity: normalizeAnomalySeverity(r.severity)');
  });
});
