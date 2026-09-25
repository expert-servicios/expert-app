import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { KIA_CORE_EVAL_CASES } from '@/lib/ai/kia/evals/kia-eval-cases';
import { getNationalityMinorAutonomyPolicy } from '@/lib/services/nationality-minor-autonomy';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const slug = 'nacionalidad-espanola-menor-nacido-en-espana';

describe('KIA nationality live-case regressions', () => {
  it('covers the real client questions that caused manual intervention', () => {
    for (const id of [
      'nationality-active-case-what-is-next',
      'nationality-do-not-request-existing-docs',
      'nationality-signature-routine-correction',
      'nationality-final-file-gate',
    ]) {
      expect(KIA_CORE_EVAL_CASES.find((item) => item.id === id)).toBeDefined();
    }
  });

  it('requires evidence reads for duplicate-document and signature questions', () => {
    const duplicate = KIA_CORE_EVAL_CASES.find((item) => item.id === 'nationality-do-not-request-existing-docs')!;
    const signature = KIA_CORE_EVAL_CASES.find((item) => item.id === 'nationality-signature-routine-correction')!;
    expect(duplicate.expectation.requiredTools).toContain('get_case_documents');
    expect(signature.expectation.requiredTools).toContain('get_service_operational_blueprint');
    expect(signature.expectation.expectedManualReview).toBe(false);
  });

  it('treats the current autonomy policy as authoritative over legacy task metadata', () => {
    const policy = getNationalityMinorAutonomyPolicy(slug)!;
    expect(policy.autonomousTaskKeys).toContain('pre_submission_validation');
    expect(policy.autonomousTaskKeys).toContain('pay_790_026_fee');
    expect(policy.humanGateTaskKeys).toEqual(['submit_and_archive_receipt']);
  });

  it('keeps the prompt explicit that routine corrections do not create an Admin escalation', () => {
    const prompt = source('lib/ai/kia/prompts/kia-client-flow.ts');
    expect(prompt).toContain('correccion rutinaria');
    expect(prompt).toContain('continua sin escalar a Admin');
  });
});
