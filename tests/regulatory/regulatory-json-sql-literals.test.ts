import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');

describe('regulatory migration JSON SQL literals', () => {
  it('contains no unescaped single quotes inside embedded jsonb literals', () => {
    const files = fs.readdirSync(migrationsDir)
      .filter((name) => name.endsWith('.sql') && name.includes('regulatory'))
      .sort();

    const failures: string[] = [];

    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      const literals = [...sql.matchAll(/'\{[\s\S]*?\}'::jsonb/g)];

      literals.forEach((match, index) => {
        const inner = match[0].slice(1, -8).replace(/''/g, '');
        if (inner.includes("'")) {
          failures.push(`${file} jsonb_literal_${index + 1}`);
        }
      });
    }

    expect(failures, `Unescaped single quote inside SQL jsonb literal: ${failures.join(', ')}`).toEqual([]);
  });
});
