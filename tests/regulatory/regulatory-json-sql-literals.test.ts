import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');

const auditedVersions = new Set([
  '20260920111500',
  '20260920123000',
  '20260920133000',
  '20260920150000',
  '20260920163000',
  '20260920180000',
  '20260920201500',
  '20260920213000',
  '20260920230000',
]);

describe('regulatory migration JSON SQL literals', () => {
  it('contains no unescaped single quotes inside embedded jsonb literals in audited v1.3-v1.5 migrations', () => {
    const files = fs.readdirSync(migrationsDir)
      .filter((name) => name.endsWith('.sql') && auditedVersions.has(name.slice(0, 14)))
      .sort();

    expect(files).toHaveLength(auditedVersions.size);

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
