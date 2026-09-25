import { describe, expect, it } from 'vitest';
import { getNationalityMinorAutonomyPolicy } from '@/lib/services/nationality-minor-autonomy';
import { getImmigrationRepresentationPolicy } from '@/lib/services/immigration-representation-policy';
import { getServiceOperationalBlueprint } from '@/lib/services/service-operational-blueprints';

const slug = 'nacionalidad-espanola-menor-nacido-en-espana';

describe('KIA autonomous pre-filing for minor nationality', () => {
  it('uses Ksenia as the default voluntary representative without requiring client certificate', () => {
    const autonomy = getNationalityMinorAutonomyPolicy(slug);
    const representation = getImmigrationRepresentationPolicy(slug);
    expect(autonomy?.defaultVoluntaryRepresentative).toBe('Ksenia ILICHEVA');
    expect(representation?.mode).toBe('justice_voluntary_mandate');
    expect(representation?.clientDigitalCredentialRequired).toBe(false);
  });

  it('keeps routine preparation autonomous and final filing human-gated', () => {
    const autonomy = getNationalityMinorAutonomyPolicy(slug)!;
    expect(autonomy.targetState).toBe('listo_para_presentar');
    expect(autonomy.autonomousTaskKeys).toContain('pre_submission_validation');
    expect(autonomy.autonomousTaskKeys).toContain('pay_790_026_fee');
    expect(autonomy.humanGateTaskKeys).toEqual(['submit_and_archive_receipt']);

    const blueprint = getServiceOperationalBlueprint(slug)!;
    expect(blueprint.tasks.find(task => task.key === 'confirm_registry_surname_order')?.humanApprovalRequired).not.toBe(true);
    expect(blueprint.tasks.find(task => task.key === 'pre_submission_validation')?.humanApprovalRequired).not.toBe(true);
    expect(blueprint.tasks.find(task => task.key === 'submit_and_archive_receipt')?.humanApprovalRequired).toBe(true);
  });

  it('maps parent and voluntary-representative signatures correctly', () => {
    const rule = getNationalityMinorAutonomyPolicy(slug)!.signatureRules.under14;
    expect(rule.interestedSigns).toBe(false);
    expect(rule.legalRepresentativeBlock).toContain('Representante legal');
    expect(rule.voluntaryRepresentativeBlock).toContain('Representante voluntario');
    expect(rule.rule).toContain('ambos firman como representantes legales');
  });

  it('loops with the client without admin for ordinary corrections', () => {
    const communication = getNationalityMinorAutonomyPolicy(slug)!.clientCommunication;
    expect(communication.sameThread).toBe(true);
    expect(communication.doNotRequestExistingDocuments).toBe(true);
    expect(communication.correctionLoopWithoutAdmin).toBe(true);
    expect(communication.links.signatureGuideRu).toContain('/ru/docs/');
  });

  it('escalates exceptions instead of silently guessing', () => {
    const policy = getNationalityMinorAutonomyPolicy(slug)!;
    expect(policy.escalationRules.join(' ')).toMatch(/patria potestad|progenitores/i);
    expect(policy.escalationRules.join(' ')).toMatch(/pago duplicado/i);
    expect(policy.readyToFileCriteria.join(' ')).toContain('Paquete final');
  });
});
