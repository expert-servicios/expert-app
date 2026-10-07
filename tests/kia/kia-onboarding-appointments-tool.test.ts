import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (relativePath: string) => fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');

describe('KIA onboarding appointments tool', () => {
  it('accepts only appointment kind and limit', () => {
    const defs = source('lib/ai/kia/kia-tool-definitions.ts');
    const start = defs.indexOf('get_user_onboarding_appointments: z.object({');
    const end = defs.indexOf('}).strict(),', start);
    const block = defs.slice(start, end);
    expect(block).toContain("kind: z.enum(['all', 'onboarding', 'formacion-holded'])");
    expect(block).not.toContain('clientId');
    expect(block).not.toContain('companyId');
  });

  it('derives client/company scope exclusively from KiaContext', () => {
    const executor = source('lib/ai/kia/kia-tool-executor.ts');
    const start = executor.indexOf("case 'get_user_onboarding_appointments'");
    const end = executor.indexOf("case 'get_booking_availability'", start);
    const block = executor.slice(start, end);
    expect(block).toContain('const clientId = context.contact?.clientId');
    expect(block).toContain('const companyId = context.company?.id ?? null');
    expect(block).toContain(".eq('client_id', clientId)");
    expect(block).toContain(".eq('company_id', companyId)");
    expect(block).toContain(".in('appointment_type', types)");
    expect(block).not.toContain('args.clientId');
    expect(block).not.toContain('args.companyId');
  });

  it('is a read-only R0 calendar tool', () => {
    const executor = source('lib/ai/kia/kia-tool-executor.ts');
    const registry = source('lib/ai/kia/kia-tool-registry.ts');
    const start = executor.indexOf("case 'get_user_onboarding_appointments'");
    const end = executor.indexOf("case 'get_booking_availability'", start);
    const block = executor.slice(start, end);
    expect(block).toContain(".from('appointments')");
    expect(block).not.toContain('.insert(');
    expect(block).not.toContain('.update(');
    expect(block).not.toContain('.delete(');
    expect(registry).toContain("get_user_onboarding_appointments:     policy('R0', 'read',  'calendar')");
  });
});
