import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const monitorPath = path.join(root, 'lib', 'regulatory', 'regulatory-monitor.ts');
const migrationsDir = path.join(root, 'supabase', 'migrations');

function read(file: string) {
  return fs.readFileSync(file, 'utf8');
}

describe('regulatory source host allowlist', () => {
  it('allows every HTTPS host referenced by regulatory v1.3-v1.5 migrations', () => {
    const monitor = read(monitorPath);
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter((name) =>
        /^20260920(111500|123000|133000|150000|163000|180000|201500|213000|230000)_.*\.sql$/.test(name),
      )
      .sort();

    expect(migrationFiles).toHaveLength(9);

    const urls = migrationFiles.flatMap((name) => {
      const sql = read(path.join(migrationsDir, name));
      return [...sql.matchAll(/https:\/\/[^'"\s)]+/g)].map((match) => match[0]);
    });

    const hosts = [...new Set(urls.map((value) => new URL(value).hostname))].sort();
    const missing = hosts.filter((host) => !monitor.includes(`'${host}'`));

    expect(missing, `Missing regulatory ALLOWED_HOSTS entries: ${missing.join(', ')}`).toEqual([]);
  });
});
