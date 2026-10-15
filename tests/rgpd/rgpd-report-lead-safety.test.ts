import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('RGPD report lead safety contract', () => {
  const lead = readFileSync('lib/leads/ensure-inbound-lead.ts', 'utf8');
  const route = readFileSync('app/api/rgpd/report/route.ts', 'utf8');
  const form = readFileSync('components/tools/RgpdReportLeadForm.tsx', 'utf8');

  it('keeps event replay checks restricted to informational reports', () => {
    expect(lead).toContain('if (input.preserveExistingClassification) {');
    expect(lead).toContain('if (input.preserveExistingClassification && previous.some(');
    expect(lead).toContain('...(!input.preserveExistingClassification ? {');
    expect(route).toContain('preserveExistingClassification:true');
  });

  it('uses a per-request identifier for lead and email deduplication', () => {
    expect(route).toContain('requestId:z.uuid()');
    expect(route).toContain('sourceKey:`rgpd-report:${d.requestId}`');
    expect(route).toContain('idempotencyKey:`rgpd/report/${d.requestId}`');
    expect(form).toContain('const stableRequestId=requestId ?? crypto.randomUUID()');
    expect(form).toContain('setRequestId(null)');
  });

  it('keeps report publication gated in the server', () => {
    expect(route).toContain("process.env.RGPD_REPORT_ENABLED !== 'true'");
  });
});
