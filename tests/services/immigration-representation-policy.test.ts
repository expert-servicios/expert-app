import { describe, expect, it } from 'vitest';
import { getImmigrationRepresentationPolicy } from '@/lib/services/immigration-representation-policy';
import { getServiceOperationalBlueprint } from '@/lib/services/service-operational-blueprints';
import { getCatalogService } from '@/lib/utils/catalog';

describe('immigration representation policy', () => {
  it('keeps nationality under the Ministry of Justice voluntary mandate model', () => {
    for (const slug of ['nacionalidad-espanola', 'nacionalidad-espanola-menor-nacido-en-espana']) {
      const policy = getImmigrationRepresentationPolicy(slug);
      expect(policy?.authority).toBe('ministerio_justicia');
      expect(policy?.mode).toBe('justice_voluntary_mandate');
      expect(policy?.blockSubmissionUntilValidated).toBe(true);
    }
  });

  it('requires formal Extranjeria representation for renewals and family reunification', () => {
    for (const slug of ['renovacion-residencia', 'reagrupacion-familiar']) {
      const policy = getImmigrationRepresentationPolicy(slug);
      expect(policy?.authority).toBe('extranjeria');
      expect(policy?.mode).toBe('extranjeria_formal_power');
      expect(policy?.evidence.join(' ')).toMatch(/notarial|apud acta/i);

      const blueprint = getServiceOperationalBlueprint(slug);
      expect(blueprint?.documents.some((doc) => doc.key === 'representation_power')).toBe(true);
      expect(blueprint?.tasks.some((task) => task.key === 'verify_representation' && task.humanApprovalRequired)).toBe(true);
    }
  });

  it('keeps initial permits and arraigos route-dependent instead of promising blanket representation', () => {
    for (const slug of ['permiso-residencia-inicial', 'arraigo-social', 'arraigo-familiar', 'arraigo-laboral']) {
      const policy = getImmigrationRepresentationPolicy(slug);
      expect(policy?.mode).toBe('route_dependent');
      expect(policy?.canExpertPresent).toBe('conditional');
    }

    const initial = getCatalogService('permiso-residencia-inicial');
    expect(JSON.stringify(initial)).toContain('sujeto legitimado');
    expect(JSON.stringify(initial)).toContain('No de forma automática');

    const social = getCatalogService('arraigo-social');
    expect(JSON.stringify(social)).toContain('No lo damos por supuesto');
  });

  it('does not use a private DocuSign mandate as the generic Extranjeria rule', () => {
    for (const slug of ['renovacion-residencia', 'reagrupacion-familiar', 'permiso-residencia-inicial']) {
      const copy = JSON.stringify(getCatalogService(slug));
      expect(copy).not.toContain('mandato DocuSign');
    }
  });
});
