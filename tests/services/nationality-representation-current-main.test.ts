import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getImmigrationRepresentationPolicy } from '@/lib/services/immigration-representation-policy';
import { getServiceOperationalBlueprint } from '@/lib/services/service-operational-blueprints';

const source = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('nationality representation on current main', () => {
  it('keeps nationality under the Ministry of Justice voluntary mandate model', () => {
    const policy = getImmigrationRepresentationPolicy('nacionalidad-espanola-menor-nacido-en-espana');
    expect(policy?.authority).toBe('ministerio_justicia');
    expect(policy?.mode).toBe('justice_voluntary_mandate');
    expect(policy?.blockSubmissionUntilValidated).toBe(true);
    expect(policy?.clientDigitalCredentialRequired).toBe(false);
  });

  it('keeps representation and signatures as blocking steps in the current blueprint', () => {
    const blueprint = getServiceOperationalBlueprint('nacionalidad-espanola-menor-nacido-en-espana');
    expect(blueprint?.steps.some(step => step.key === 'representation_mandate')).toBe(true);
    expect(blueprint?.steps.some(step => step.key === 'signatures')).toBe(true);
    expect(blueprint?.tasks.some(task => task.key === 'prepare_representation_mandate' && task.blocksSubmission)).toBe(true);
    expect(blueprint?.tasks.some(task => task.key === 'obtain_application_signatures' && task.blocksSubmission)).toBe(true);
  });

  it('shows the legal workflow from canonical case metadata in Admin', () => {
    const page = source('app/(protected)/admin/expedientes/[id]/page.tsx');
    const route = source('app/api/admin/cases/[id]/route.ts');
    expect(page).toContain('CaseWorkflowPanel');
    expect(page).toContain('serviceId={c.service_id}');
    expect(page).toContain('checklistJson={c.checklist_json}');
    expect(route).toContain('service_id');
    expect(route).toContain('checklist_json');
  });

  it('ships a remote-signing mandate template and the operational legal note', () => {
    const mandate = source('public/legal/docusign/mandato-representacion-voluntaria-nacionalidad-menor.html');
    const note = source('docs/nacionalidad/nacionalidad-menor-presentacion-y-firmas.md');
    expect(mandate).toContain('[[RU_PARENT1_NAME]]');
    expect(mandate).toContain('[[RU_PARENT2_NAME]]');
    expect(note).toContain('mandato');
    expect(note).toContain('modelo normalizado');
    expect(note).toContain('24 horas laborables');
  });
});
