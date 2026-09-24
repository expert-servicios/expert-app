import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const route = readFileSync(
  resolve(process.cwd(), 'app/api/quotes/route.ts'),
  'utf8',
);

describe('public quote request lifecycle', () => {
  it('creates an unpriced public request as draft without premature expiry', () => {
    expect(route).toContain("client_type: 'particular'");
    expect(route).toContain("status: 'draft'");
    expect(route).toContain('expires_at: null');
    expect(route).toContain("url: '/admin/presupuestos'");
    expect(route).not.toContain("client_type: 'persona_fisica'");
  });
});
