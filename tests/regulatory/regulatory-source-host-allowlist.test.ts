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
  it('allows every regulatory source HTTPS host referenced by regulatory migrations', () => {
    const monitor = read(monitorPath);
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter((name) => name.endsWith('.sql') && name.includes('regulatory'))
      .sort();

    expect(migrationFiles.length).toBeGreaterThanOrEqual(9);

    const urls = migrationFiles.flatMap((name) => {
      const sql = read(path.join(migrationsDir, name));
      const sourceStatements = [
        ...sql.matchAll(/insert\s+into\s+public\.regulatory_sources\b[\s\S]*?;/gi),
      ].map((match) => match[0]);

      return sourceStatements.flatMap((statement) =>
        [...statement.matchAll(/https:\/\/[^'"\s)]+/g)].map((match) => match[0]),
      );
    });

    const hosts = [...new Set(urls.map((value) => new URL(value).hostname))].sort();
    const missing = hosts.filter((host) => !monitor.includes(`'${host}'`));

    expect(missing, `Missing regulatory ALLOWED_HOSTS entries: ${missing.join(', ')}`).toEqual([]);
  });
});
