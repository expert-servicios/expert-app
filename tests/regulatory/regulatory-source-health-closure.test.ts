import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

describe('regulatory source health closure', () => {
  it('uses official fallbacks and explicit supporting-source dependencies', () => {
    const migration = read('supabase/migrations/20260921151000_regulatory_source_health_closure.sql');
    const monitor = read('lib/regulatory/regulatory-monitor.ts');

    expect(migration).toContain("'atv_valencia_reference_value'");
    expect(migration).toContain('https://sede.gva.es/es/detall-tramit?id_proc=16&version=red');
    expect(migration).toContain("'atv_valencia_model_600'");
    expect(migration).toContain('https://sede.gva.es/es/detall-tramit?id_proc=17&version=red');
    expect(migration).toContain("'atv_mortgage_cancellation_600'");
    expect(migration).toContain('https://paeelectronico.es/es-es/CreaEmpresaPorTiMismo/Paginas/Home.aspx');
    expect(migration).toContain('canonical_url_preserved');
    expect(migration).toContain('supporting_source');
    expect(migration).toContain('inherited_from_ruleset');
    expect(migration).toContain('on conflict (source_id, dependency_type, dependency_key)');
    expect(monitor).toContain("'paeelectronico.es'");
  });

  it('covers every source reported without an explicit dependency by the first production audit', () => {
    const migration = read('supabase/migrations/20260921151000_regulatory_source_health_closure.sql');
    const expectedSources = [
      'atv_valencia_model_600',
      'boe_excise_tax_law_38_1992',
      'aeat_model_131',
      'aeat_model_349',
      'aeat_model_390',
      'boe_aml_beneficial_owner_304_2014',
      'dgt_vehicle_import_non_eu',
      'aeat_vehicle_import_customs',
      'dgt_foreign_licence_exchange_2026',
      'dgt_vehicle_document_duplicate_2026',
      'boe_lau_article_36',
      'transportes_recreation_navigation_permit',
      'transportes_rate_025',
      'transportes_recreation_registry_data',
    ];

    for (const sourceKey of expectedSources) {
      expect(migration).toContain(`('${sourceKey}',`);
    }
  });
});
