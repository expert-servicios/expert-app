import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  'supabase/migrations/20261013173037_regulatory_source_fetch_recovery.sql',
  'utf8',
);

describe('Regulatory official source fetch recovery', () => {
  it('preserves working sources and keeps failed 403 references for manual review', () => {
    for (const source of [
      'migraciones_normativa',
      'migraciones_hojas_informativas',
      'migraciones_presentacion_electronica',
      'uge_movilidad_internacional',
    ]) expect(migration).toContain(source);
    expect(migration).toContain("last_error = 'HTTP 403'");
    expect(migration).toContain('last_fingerprint IS NULL');
    expect(migration).toContain("'monitoring_mode', 'manual_reference'");
    expect(migration).toContain("'manual_review_due_on', '2026-11-13'");
    expect(migration).not.toMatch(/DELETE\s+FROM|DROP\s+TABLE|TRUNCATE|cron\.schedule/i);
  });

  it('updates only a confirmed dead Registro Civil link', () => {
    expect(migration).toContain("source_key = 'mjusticia_registro_civil_portal'");
    expect(migration).toContain("last_error = 'HTTP 404'");
    expect(migration).toContain('https://www.mjusticia.gob.es/es/ciudadania/registros');
    expect(migration).toContain("'legal_review_required', true");
  });
});
