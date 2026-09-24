import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('canonical KIA copilot surface', () => {
  it('keeps only the canonical protected-layout copilot mounted', () => {
    const protectedLayout = readFileSync(resolve(process.cwd(), 'app/(protected)/layout.tsx'), 'utf8');
    const dashboardLayout = readFileSync(resolve(process.cwd(), 'app/(protected)/dashboard/layout.tsx'), 'utf8');

    expect(protectedLayout).toContain('KiaCopilotWidget');
    expect(dashboardLayout).not.toContain('KiaCopilotPanel');
  });

  it('does not keep the retired dashboard copilot component or endpoint', () => {
    expect(existsSync(resolve(process.cwd(), 'components/dashboard/KiaCopilotPanel.tsx'))).toBe(false);
    expect(existsSync(resolve(process.cwd(), 'app/api/kia/copilot/route.ts'))).toBe(false);
  });
});
