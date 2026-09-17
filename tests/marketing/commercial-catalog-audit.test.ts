import { describe, expect, it } from 'vitest';
import {
  auditCommercialCatalogInventory,
  COMMERCIAL_ALIAS_CANDIDATES,
} from '@/lib/services/commercial-catalog-audit';

describe('commercial catalog C0 inventory audit', () => {
  it('builds a read-only cross-source inventory', () => {
    const audit = auditCommercialCatalogInventory();

    expect(audit.readOnly).toBe(true);
    expect(audit.generatedFrom).toContain('lib/utils/catalog.ts');
    expect(audit.generatedFrom).toContain('lib/utils/admin-catalog.ts');
    expect(audit.generatedFrom).toContain('lib/data/services-catalog.ts');
    expect(audit.generatedFrom).toContain('lib/services/service-registry.ts');
    expect(audit.totals.uniqueIds).toBeGreaterThan(0);
    expect(audit.rows.length).toBe(audit.totals.uniqueIds);
  });

  it('surfaces real pricing and identity drift instead of reconciling it silently', () => {
    const audit = auditCommercialCatalogInventory();
    const irpf = audit.rows.find((row) => row.id === 'irpf');

    expect(irpf).toBeDefined();
    expect(irpf?.issues).toContain('price_mismatch');
    expect(audit.totals.rowsWithIssues).toBeGreaterThan(0);
  });

  it('records candidate aliases without rewriting source ids', () => {
    expect(COMMERCIAL_ALIAS_CANDIDATES).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ alias: 'holded-starter', canonical: 'holded-pack-starter', status: 'candidate' }),
        expect.objectContaining({ alias: 'nacionalidad-menor-nacido-espana', canonical: 'nacionalidad-espanola-menor-nacido-en-espana', status: 'candidate' }),
        expect.objectContaining({ alias: 'matriculacion-vehiculo', canonical: 'matriculacion', status: 'candidate' }),
      ])
    );
  });

  it('keeps concrete training offers separate from service identity', () => {
    const audit = auditCommercialCatalogInventory();
    const offer = audit.rows.find((row) => row.id === 'formacion-holded-2h');
    const service = audit.rows.find((row) => row.id === 'formacion-holded');

    expect(offer).toBeDefined();
    expect(service).toBeDefined();
    expect(COMMERCIAL_ALIAS_CANDIDATES.some((candidate) => candidate.alias === 'formacion-holded-2h')).toBe(false);
  });
});
