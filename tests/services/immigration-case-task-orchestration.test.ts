import { describe, expect, it } from 'vitest';
import { getServiceOperationalBlueprint } from '@/lib/services/service-operational-blueprints';

const immigrationBlueprintSlugs = [
  'nacionalidad-espanola-menor-nacido-en-espana',
  'nacionalidad-espanola',
  'renovacion-residencia',
  'reagrupacion-familiar',
  'arraigo-social',
  'arraigo-familiar',
  'arraigo-laboral',
];

describe('immigration case workflow orchestration', () => {
  it('uses task dependencies and calendar sync across operational immigration/nationality blueprints', () => {
    for (const slug of immigrationBlueprintSlugs) {
      const blueprint = getServiceOperationalBlueprint(slug);
      expect(blueprint).toBeDefined();

      const tasks = blueprint?.tasks ?? [];
      expect(tasks.length).toBeGreaterThan(0);
      expect(tasks.some((task) => task.syncCalendar)).toBe(true);

      const submit = tasks.find((task) => task.key === 'submit');
      expect(submit?.humanApprovalRequired).toBe(true);
      expect(submit?.syncCalendar).toBe(true);
      expect(submit?.dependsOn?.length).toBeGreaterThan(0);
    }
  });

  it('chains mandate, residence check, official application, signatures, fee, filing and receipt for minor nationality', () => {
    const blueprint = getServiceOperationalBlueprint('nacionalidad-espanola-menor-nacido-en-espana');
    const tasks = blueprint?.tasks ?? [];
    const byKey = new Map(tasks.map((task) => [task.key, task]));

    expect(byKey.get('verify_signed_mandate')?.dependsOn).toEqual(['prepare_representation_mandate']);
    expect(byKey.get('verify_legal_residence_start')?.dependsOn).toEqual(['verify_signed_mandate']);
    expect(byKey.get('prepare_official_application')?.dependsOn).toEqual(['verify_legal_residence_start']);
    expect(byKey.get('obtain_parent_signatures')?.dependsOn).toEqual(['prepare_official_application']);
    expect(byKey.get('verify_official_application')?.dependsOn).toEqual(['obtain_parent_signatures']);
    expect(byKey.get('apply_recognized_signature')?.dependsOn).toEqual(['verify_official_application']);
    expect(byKey.get('fee')?.dependsOn).toEqual(['apply_recognized_signature']);
    expect(byKey.get('final_review')?.dependsOn).toEqual(['fee']);
    expect(byKey.get('submit')?.dependsOn).toEqual(['final_review']);
    expect(byKey.get('receipt')?.dependsOn).toEqual(['submit']);
    expect(byKey.get('follow_up')?.dependsOn).toEqual(['receipt']);
  });

  it('keeps internal post-signature execution tasks on the current business date', () => {
    const blueprint = getServiceOperationalBlueprint('nacionalidad-espanola-menor-nacido-en-espana');
    const tasks = blueprint?.tasks ?? [];

    for (const key of [
      'verify_signed_mandate',
      'prepare_official_application',
      'verify_official_application',
      'apply_recognized_signature',
      'fee',
      'final_review',
      'submit',
      'receipt',
    ]) {
      expect(tasks.find((task) => task.key === key)?.dueBusinessDays).toBe(0);
    }

    expect(tasks.find((task) => task.key === 'verify_legal_residence_start')?.dueBusinessDays).toBe(1);
    expect(tasks.find((task) => task.key === 'obtain_parent_signatures')?.dueBusinessDays).toBe(1);
  });

  it('adds 1/3/5 business-day reminders to client signature/representation tasks', () => {
    const blueprints = immigrationBlueprintSlugs
      .map((slug) => getServiceOperationalBlueprint(slug))
      .filter(Boolean);

    const clientActionTasks = blueprints.flatMap((blueprint) =>
      (blueprint?.tasks ?? []).filter((task) => task.clientActionRequired),
    );

    expect(clientActionTasks.length).toBeGreaterThan(0);
    for (const task of clientActionTasks) {
      expect(task.clientReminderBusinessDays).toEqual([1, 3, 5]);
      expect(task.internalEscalationBusinessDay).toBe(5);
    }
  });
});
