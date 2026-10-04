import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('Holded consumer date and status filters', () => {
  it('applies the declared since filter to KIA invoice reads', () => {
    const defs = source('lib/ai/kia/kia-tool-definitions.ts');
    const executor = source('lib/ai/kia/kia-tool-executor.ts');

    expect(defs).toContain('since: calendarDateSchema.optional()');
    expect(executor).toContain("const startDate = typeof args.since === 'string' ? args.since : undefined");
    expect(executor).toContain('{ maxItems: limit, startDate }');
    expect(executor).toContain('currency: d.currency');
    expect(executor).toContain('dueDate: d.dueDate');
  });

  it('excludes both cancelled spellings and failed documents from quarter totals', () => {
    const quarter = source('lib/holded/quarter-data.ts');
    expect(quarter).toContain("['cancelled', 'canceled', 'failed']");
  });
});
