import { describe, expect, it } from 'vitest';
import { getServiceOperationalBlueprint } from '@/lib/services/service-operational-blueprints';

const immigrationSlugs = [
  'nacionalidad-espanola-menor-nacido-en-espana',
  'nacionalidad-espanola',
  'renovacion-residencia',
  'reagrupacion-familiar',
  'permiso-residencia-inicial',
  'arraigo-social',
  'arraigo-familiar',
  'arraigo-laboral',
];

describe('immigration case workflow orchestration', () => {
  it('uses task dependencies and calendar sync across immigration/nationality blueprints', () => {
    for (const slug of immigrationSlugs) {
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

  it('chains fee, final review, filing and receipt after representation for minor nationality', () => {
    const blueprint = getServiceOperationalBlueprint('nacionalidad-espanola-menor-nacido-en-espana');
    const tasks = blueprint?.tasks ?? [];

    const byKey = new Map(tasks.map((task) => [task.key, task]));
    expect(byKey.get('verify_signed_mandate')?.dependsOn).toEqual(['prepare_representation_mandate']);
    expect(byKey.get('prepare_application')?.dependsOn).toEqual(['verify_signed_mandate']);
    expect(byKey.get('fee')?.dependsOn).toEqual(['prepare_application']);
    expect(byKey.get('final_review')?.dependsOn).toEqual(['fee']);
    expect(byKey.get('submit')?.dependsOn).toEqual(['final_review']);
    expect(byKey.get('receipt')?.dependsOn).toEqual(['submit']);
    expect(byKey.get('follow_up')?.dependsOn).toEqual(['receipt']);
  });

  it('keeps same-day post-signature tasks on the current business date', () => {
    const blueprint = getServiceOperationalBlueprint('nacionalidad-espanola-menor-nacido-en-espana');
    const tasks = blueprint?.tasks ?? [];
    for (const key of ['verify_signed_mandate', 'prepare_application', 'fee', 'final_review', 'submit', 'receipt']) {
      expect(tasks.find((task) => task.key === key)?.dueBusinessDays).toBe(0);
    }
  });
});
