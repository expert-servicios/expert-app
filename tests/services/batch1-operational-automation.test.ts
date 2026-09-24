import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { articles } from '@/lib/utils/blog';
import { docs } from '@/lib/utils/docs';
import { getCatalogService } from '@/lib/utils/catalog';
import { getServiceLaunchPack } from '@/lib/marketing/catalog-launch-social';
import {
  BATCH1_OPERATIONAL_BLUEPRINTS,
  getServiceOperationalBlueprint,
} from '@/lib/services/service-operational-blueprints';
import { evaluateServiceContentReadiness } from '@/lib/services/service-production-readiness';
import { serviceProductionManifest } from '@/lib/services/service-production-manifest';
import { getKiaToolPolicy } from '@/lib/ai/kia/kia-tool-registry';

const read = (path: string) => readFileSync(path, 'utf8');
const CHANNELS = ['facebook', 'instagram', 'linkedin', 'google'] as const;

describe('batch 1 operational automation', () => {
  it('has one canonical operational blueprint for every batch 1 service', () => {
    expect(BATCH1_OPERATIONAL_BLUEPRINTS).toHaveLength(10);

    for (const blueprint of BATCH1_OPERATIONAL_BLUEPRINTS) {
      const manifest = serviceProductionManifest.find((entry) => entry.slug === blueprint.slug);
      expect(manifest, blueprint.slug).toBeDefined();
      expect(blueprint.requirements.length, blueprint.slug).toBeGreaterThanOrEqual(2);
      expect(blueprint.documents.length, blueprint.slug).toBeGreaterThanOrEqual(2);
      expect(blueprint.steps.length, blueprint.slug).toBeGreaterThanOrEqual(3);
      expect(blueprint.tasks.length, blueprint.slug).toBeGreaterThanOrEqual(2);
      expect(
        blueprint.steps.some((step) => step.humanApprovalRequired)
        || blueprint.tasks.some((task) => task.humanApprovalRequired),
        blueprint.slug,
      ).toBe(true);
    }
  });

  it('generates the editorial floor and social review pack from the same service identity', () => {
    for (const blueprint of BATCH1_OPERATIONAL_BLUEPRINTS) {
      const blogCount = articles.filter((article) => article.relatedServiceSlugs?.includes(blueprint.slug)).length;
      const docCount = docs.filter((doc) => doc.relatedServiceSlugs?.includes(blueprint.slug)).length;
      expect(blogCount, blueprint.slug).toBeGreaterThanOrEqual(3);
      expect(docCount, blueprint.slug).toBeGreaterThanOrEqual(3);

      const pack = getServiceLaunchPack(blueprint.slug);
      expect(pack, blueprint.slug).toBeDefined();
      for (const channel of CHANNELS) {
        const posts = pack?.posts.filter((post) => post.channel === channel) ?? [];
        expect(posts.length, `${blueprint.slug}:${channel}`).toBeGreaterThanOrEqual(3);
        expect(posts.every((post) => post.status !== 'published')).toBe(true);
      }

      const readiness = evaluateServiceContentReadiness(blueprint.slug);
      expect(readiness.issues.some((issue) => issue.code === 'operations_missing'), blueprint.slug).toBe(false);
    }
  });

  it('uses the generic idempotent fulfillment engine after Stripe payment', () => {
    const webhook = read('app/api/stripe/webhook/route.ts');
    const fulfillment = read('lib/payments/service-order-fulfillment.ts');

    expect(webhook).toContain('ensureServiceOrderFulfillment');
    expect(fulfillment).toContain('getServiceOperationalBlueprint');
    expect(fulfillment).toContain(".eq('order_id', input.orderId)");
    expect(fulfillment).toContain(".eq('title', task.title)");
    expect(fulfillment).toContain('human_approval_required');
    expect(fulfillment).toContain('depends_on: task.dependsOn ?? []');
    expect(fulfillment).toContain('blocks_submission: Boolean(task.blocksSubmission)');
    expect(fulfillment).toContain('reference_urls: task.referenceUrls ?? []');
    expect(fulfillment).toContain(".select('id,service_id,checklist_json')");
    expect(fulfillment).toContain('Could not hydrate legacy service case');
    expect(fulfillment).toContain('Could not hydrate service task');
    expect(fulfillment).toContain('service_manual_intake');
    expect(fulfillment).toContain('service-operational-blueprint-v5');
    expect(fulfillment).not.toContain('if (!blueprint) return null');
    expect(webhook).toContain('serviceSlugs: catalogServiceSlugs');
    expect(webhook).toContain('serviceName,');
  });

  it('enforces blueprint task dependencies in the Admin workspace', () => {
    const tasksApi = read('app/api/admin/tasks/route.ts');
    const tasksPage = read('app/(protected)/admin/tareas/page.tsx');

    expect(tasksApi).toContain("select('id,title,description,status,priority,assigned_to,case_id,client_id,lead_id,due_date,source,metadata");
    expect(tasksApi).toContain("metadata?.depends_on");
    expect(tasksApi).toContain("candidate.status === 'completada'");
    expect(tasksApi).toContain("candidateMetadata?.task_key === dependencyKey");
    expect(tasksApi).toContain("'La tarea está bloqueada por pasos anteriores pendientes'");
    expect(tasksApi).toContain('status: 409');
    expect(tasksApi).toContain('due_business_days');
    expect(tasksApi).toContain('addBusinessDays(new Date(), dueBusinessDays)');
    expect(tasksApi).toContain("postCompletionWarning = 'La tarea se completó");
    expect(tasksApi).toContain('warning: postCompletionWarning');

    const fulfillment = read('lib/payments/service-order-fulfillment.ts');
    expect(fulfillment).toContain('if (task.dependsOn?.length) return null');
    expect(fulfillment).toContain('due_business_days: task.dueBusinessDays ?? null');

    expect(tasksPage).toContain('blocked_by?: string[]');
    expect(tasksPage).toContain('Bloqueada hasta completar:');
    expect(tasksPage).toContain('saving === task.id || blocked');
    expect(tasksPage).toContain('if (json.warning) setError(json.warning)');
  });

  it('keeps current Arraigo Sociolaboral rules and retires the old operational logic', () => {
    const service = getCatalogService('arraigo-laboral');
    const viability = read('lib/data/viability-checks.ts');
    const blueprint = getServiceOperationalBlueprint('arraigo-laboral');

    expect(service?.name).toBe('Arraigo Sociolaboral');
    expect(JSON.stringify(service)).toContain('20 horas');
    expect(JSON.stringify(service)).toContain('RD 1155/2024');
    expect(JSON.stringify(service)).not.toContain('art. 123 del RD 557/2011');
    expect(blueprint?.canonicalName).toBe('Arraigo Sociolaboral');
    expect(viability).toContain('arraigo sociolaboral vigente');
    expect(viability).not.toContain('acta_itss');
  });

  it('does not treat Arraigo Familiar as a generic family-of-Spanish route', () => {
    const service = getCatalogService('arraigo-familiar');
    const copy = JSON.stringify(service);

    expect(copy).toContain('RD 1155/2024');
    expect(copy).toContain('UE/EEE/Suiza');
    expect(copy).toContain('autorización específica');
    expect(copy).not.toContain('art. 125 del RD 557/2011');
  });

  it('exposes operational blueprints to KIA as an autonomous read-only tool', () => {
    const policy = getKiaToolPolicy('get_service_operational_blueprint');
    expect(policy?.riskTier).toBe('R0');
    expect(policy?.effect).toBe('read');
    expect(policy?.requiresHumanApproval).toBe(false);

    const executor = read('lib/ai/kia/kia-tool-executor.ts');
    expect(executor).toContain("case 'get_service_operational_blueprint'");
    expect(executor).toContain('escalationRules: blueprint.kia.escalationRules');
  });

  it('integrates service operations into Telegram while keeping client rollout fail-closed', () => {
    const route = read('app/api/webhooks/telegram/route.ts');
    const env = read('.env.example');

    expect(route).toContain("command === '/servicio'");
    expect(route).toContain("command === '/lote1'");
    expect(route).toContain('KIA_TELEGRAM_CLIENTS_ENABLED');
    expect(route).toContain('resolveVerifiedTelegramIdentity');
    expect(env).toContain('KIA_TELEGRAM_CLIENTS_ENABLED=false');
    expect(env).toContain('KIA_TELEGRAM_TOOLS_ENABLED=false');
    expect(env).toContain('TELEGRAM_WEBHOOK_SECRET=');
  });

  it('stages publication only for review and never publishes externally', () => {
    const orchestrator = read('lib/services/service-publication-orchestrator.ts');
    const route = read('app/api/admin/services/publication-review/route.ts');

    expect(orchestrator).toContain("publish_status: 'review'");
    expect(orchestrator).toContain('enabled: false');
    expect(orchestrator).not.toContain("publish_status: 'published'");
    expect(route).toContain("publishAction: 'review_only'");
    expect(route).toContain('externalWrites: false');
  });
});
