import { describe, expect, it } from 'vitest';
import { EXPERT_IDENTITY, HOLDED_BRAND_NAME, PROTECTED_BRAND_TERMS } from '@/config/identity';

describe('EXPERT identity governance', () => {
  it('uses the approved public and professional contacts', () => {
    expect(EXPERT_IDENTITY.publicEmail).toBe('info@expertconsulting.es');
    expect(EXPERT_IDENTITY.professionalEmail).toBe('soy@kseniailicheva.com');
    expect(EXPERT_IDENTITY.phoneE164).toBe('+34669045528');
  });

  it('keeps Holded as the immutable proper name', () => {
    expect(HOLDED_BRAND_NAME).toBe('Holded');
    expect(PROTECTED_BRAND_TERMS).toContain('Holded');
  });

  it('exposes both approved Holded credentials', () => {
    expect(EXPERT_IDENTITY.credentials.holdedSolutionPartner).toBe('Holded Solution Partner');
    expect(EXPERT_IDENTITY.credentials.holdedAccreditedAdvisory).toBe('Asesoría Holded acreditada');
  });

  it('uses the approved institutional and Academy wording', () => {
    expect(EXPERT_IDENTITY.credentials.aeatSocialCollaborator).toBe(
      'Colaborador social de la Agencia Tributaria',
    );
    expect(EXPERT_IDENTITY.credentials.academy).toBe(
      'EXPERT Business Academy — formación privada/no reglada',
    );
  });
});
