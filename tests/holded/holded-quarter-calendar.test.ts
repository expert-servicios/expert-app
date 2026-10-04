import { describe, expect, it } from 'vitest';
import { currentQuarter } from '@/lib/holded/quarter-data';

describe('Holded quarter calendar semantics', () => {
  it('uses Europe/Madrid for the current quarter around UTC boundaries', () => {
    expect(currentQuarter(new Date('2026-09-30T21:59:59Z'))).toEqual({ year: 2026, quarter: 3 });
    expect(currentQuarter(new Date('2026-09-30T22:00:00Z'))).toEqual({ year: 2026, quarter: 4 });
  });
});
