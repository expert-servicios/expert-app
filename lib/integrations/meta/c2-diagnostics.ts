import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import {
  SERVICE_PRODUCTION_STANDARD_VERSION,
  evaluateServiceContentReadiness,
} from '@/lib/services/service-production-readiness';
import { serviceProductionManifest } from '@/lib/services/service-production-manifest';

type CountMap = Record<string, number>;

function countBy(rows: Array<Record<string, unknown>>, key: string): CountMap {
  const counts: CountMap = {};
  for (const row of rows) {
    const value = String(row[key] ?? 'unknown');
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}

export async function getMetaC2Diagnostics() {
  const admin = getSupabaseAdmin();

  const [
    servicesResult,
    contentsResult,
    offersResult,
    bindingsResult,
    channelsResult,
    itemsResult,
    jobsResult,
  ] = await Promise.all([
    admin.from('catalog_services').select('id,slug,status,category_key,service_type'),
    admin.from('service_contents').select('id,service_id,locale,status,landing_path'),
    admin.from('commercial_offers').select('id,service_id,status,billing_mode,price_mode,vat_treatment,amount_cents'),
    admin.from('stripe_price_bindings').select('id,offer_id,environment,status,reconciliation_status'),
    admin.from('service_channel_configs').select('id,service_id,channel,enabled,publish_status'),
    admin.from('meta_catalog_items').select('id,service_id,offer_id,locale,retailer_id,sync_status,last_error_code'),
    admin.from('meta_sync_jobs').select('id,operation,status,attempt_count,error_code,created_at'),
  ]);

  const errors = [
    ['catalog_services', servicesResult.error],
    ['service_contents', contentsResult.error],
    ['commercial_offers', offersResult.error],
    ['stripe_price_bindings', bindingsResult.error],
    ['service_channel_configs', channelsResult.error],
    ['meta_catalog_items', itemsResult.error],
    ['meta_sync_jobs', jobsResult.error],
  ]
    .filter(([, error]) => Boolean(error))
    .map(([source, error]) => ({
      source,
      message: error instanceof Error ? error.message : String((error as { message?: string } | null)?.message ?? 'unknown'),
    }));

  const services = (servicesResult.data ?? []) as Array<Record<string, unknown>>;
  const contents = (contentsResult.data ?? []) as Array<Record<string, unknown>>;
  const offers = (offersResult.data ?? []) as Array<Record<string, unknown>>;
  const bindings = (bindingsResult.data ?? []) as Array<Record<string, unknown>>;
  const channels = (channelsResult.data ?? []) as Array<Record<string, unknown>>;
  const items = (itemsResult.data ?? []) as Array<Record<string, unknown>>;
  const jobs = (jobsResult.data ?? []) as Array<Record<string, unknown>>;

  const manifest = serviceProductionManifest.map((entry) => {
    const readiness = evaluateServiceContentReadiness(entry.slug);
    return {
      ...entry,
      contentGatePassed: readiness.issues.length === 0,
      readinessIssues: readiness.issues,
      blogCount: readiness.blogCount,
      knowledgeCount: readiness.knowledgeCount,
      socialCounts: readiness.socialCounts,
    };
  });

  const metaChannels = channels.filter((row) => row.channel === 'meta');
  const readyMetaChannels = metaChannels.filter(
    (row) => row.enabled === true && ['ready', 'published'].includes(String(row.publish_status)),
  );

  return {
    readOnly: true as const,
    standardVersion: SERVICE_PRODUCTION_STANDARD_VERSION,
    errors,
    c2: {
      services: {
        total: services.length,
        byStatus: countBy(services, 'status'),
      },
      contents: {
        total: contents.length,
        byStatus: countBy(contents, 'status'),
        byLocale: countBy(contents, 'locale'),
      },
      offers: {
        total: offers.length,
        byStatus: countBy(offers, 'status'),
        byPriceMode: countBy(offers, 'price_mode'),
      },
      stripeBindings: {
        total: bindings.length,
        byEnvironment: countBy(bindings, 'environment'),
        byReconciliation: countBy(bindings, 'reconciliation_status'),
      },
      channels: {
        total: channels.length,
        metaTotal: metaChannels.length,
        metaReady: readyMetaChannels.length,
        byPublishStatus: countBy(metaChannels, 'publish_status'),
      },
      metaItems: {
        total: items.length,
        bySyncStatus: countBy(items, 'sync_status'),
      },
      metaJobs: {
        total: jobs.length,
        byStatus: countBy(jobs, 'status'),
      },
    },
    manifest: {
      total: manifest.length,
      productionReady: manifest.filter((entry) => entry.stage === 'production_ready').length,
      channelReady: manifest.filter((entry) => entry.stage === 'channel_ready').length,
      withContentGateIssues: manifest.filter((entry) => !entry.contentGatePassed).length,
      entries: manifest,
    },
  };
}
