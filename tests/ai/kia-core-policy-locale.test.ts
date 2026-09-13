import { describe, expect, it } from 'vitest';
import { KIA_CORE_POLICY_PROMPT } from '@/lib/ai/kia/prompts/kia-core-policy';

describe('Kia locale and jurisdiction policy', () => {
  it('keeps Holded as an immutable proper name', () => {
    expect(KIA_CORE_POLICY_PROMPT).toContain('"Holded" es un nombre propio');
    expect(KIA_CORE_POLICY_PROMPT).toContain('sin transliterarlo');
  });

  it('separates language from nationality, residence and jurisdiction', () => {
    expect(KIA_CORE_POLICY_PROMPT).toContain('no implica nacionalidad, residencia fiscal ni jurisdiccion');
    expect(KIA_CORE_POLICY_PROMPT).toContain('No aplicar ni sugerir derecho ruso, ucraniano');
  });

  it('preserves approved EXPERT credentials only', () => {
    expect(KIA_CORE_POLICY_PROMPT).toContain('Holded Solution Partner');
    expect(KIA_CORE_POLICY_PROMPT).toContain('Asesoria Holded acreditada');
    expect(KIA_CORE_POLICY_PROMPT).toContain('Colaborador social de la Agencia Tributaria');
  });
});
