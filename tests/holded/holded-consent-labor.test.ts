import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const modal = readFileSync('components/integrations/HoldedConsentModal.tsx', 'utf8');
const connectRoute = readFileSync('app/api/integrations/holded/connect/route.ts', 'utf8');

describe('Holded labor consent surface', () => {
  it('offers explicit opt-in controls for both labor read capabilities', () => {
    expect(modal).toContain("key        : 'laborEmployeesRead'");
    expect(modal).toContain("key        : 'laborPayrollsRead'");
    expect(modal).toContain('Requiere autorización expresa.');
  });

  it('keeps labor reads opt-in in the connection contract', () => {
    expect(connectRoute).toContain('laborEmployeesRead: z.boolean().optional().default(false)');
    expect(connectRoute).toContain('laborPayrollsRead: z.boolean().optional().default(false)');
    expect(connectRoute).toContain('laborEmployeesWrite: z.literal(false)');
    expect(connectRoute).toContain('laborPayrollsWrite: z.literal(false)');
  });
});
