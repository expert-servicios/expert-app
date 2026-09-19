import type { SupabaseClient } from '@supabase/supabase-js';
import { BATCH1_OPERATIONAL_BLUEPRINTS } from '@/lib/services/service-operational-blueprints';
import {
  evaluateServiceContentReadiness,
  SERVICE_PRODUCTION_STANDARD_VERSION,
} from '@/lib/services/service-production-readiness';
import { serviceProductionManifest } from '@/lib/services/service-production-manifest';

type SupabaseAdmin = SupabaseClient;
type ReviewChannel = 'web' | 'meta' | 'google' | 'whatsapp' | 'email';

const REVIEW_CHANNELS: ReviewChannel[] = ['web', 'meta', 'google', 'whatsapp', 'email'];

export type PublicationReviewResult = {
  slug: string;
  prepared: boolean;
  stage: string | null;
  issues: Array<{ code: string; message: string }>;
  channels: ReviewChannel[];
  note?: string;
};

export async function prepareServicePublicationReview(
  admin: SupabaseAdmin,
  slug: string,
): Promise<PublicationReviewResult> {
  const manifest = serviceProductionManifest.find((entry) => entry.slug === slug);
  const readiness = evaluateServiceContentReadiness(slug);

  if (!manifest) {
    return {
      slug,
      prepared: false,
      stage: null,
      issues: [{ code: 'manifest_missing', message: 'El servicio no está registrado en el manifest de producción.' }],
      channels: [],
    };
  }

  if (readiness.issues.length > 0) {
    return {
      slug,
      prepared: false,
      stage: manifest.stage,
      issues: readiness.issues,
      channels: [],
    };
  }

  const { data: service, error: serviceError } = await admin
    .from('catalog_services')
    .select('id,slug,status')
    .eq('slug', slug)
    .maybeSingle();

  if (serviceError) {
    throw new Error(`Could not load canonical service ${slug}: ${serviceError.message}`);
  }

  if (!service) {
    return {
      slug,
      prepared: false,
      stage: manifest.stage,
      issues: [{ code: 'c2_service_missing', message: 'El servicio no existe todavía en catalog_services C2.' }],
      channels: [],
    };
  }

  const rows = REVIEW_CHANNELS.map((channel) => ({
    service_id: service.id,
    channel,
    enabled: false,
    publish_status: 'review',
    editorial_overrides: {
      prepared_by: 'batch1_publication_orchestrator',
      standard_version: SERVICE_PRODUCTION_STANDARD_VERSION,
      service_stage: manifest.stage,
    },
  }));

  const { error: upsertError } = await admin
    .from('service_channel_configs')
    .upsert(rows, { onConflict: 'service_id,channel' });

  if (upsertError) {
    throw new Error(`Could not prepare publication review for ${slug}: ${upsertError.message}`);
  }

  return {
    slug,
    prepared: true,
    stage: manifest.stage,
    issues: [],
    channels: REVIEW_CHANNELS,
    note: 'Los canales quedan en review y disabled. No se publica ni se ejecuta ninguna acción externa.',
  };
}

export async function prepareBatch1PublicationReview(admin: SupabaseAdmin) {
  const slugs = BATCH1_OPERATIONAL_BLUEPRINTS.map((item) => item.slug);
  const results: PublicationReviewResult[] = [];

  for (const slug of slugs) {
    results.push(await prepareServicePublicationReview(admin, slug));
  }

  return {
    prepared: results.filter((item) => item.prepared).length,
    blocked: results.filter((item) => !item.prepared).length,
    results,
  };
}

export function getBatch1PublicationReadiness() {
  return BATCH1_OPERATIONAL_BLUEPRINTS.map((blueprint) => {
    const manifest = serviceProductionManifest.find((entry) => entry.slug === blueprint.slug);
    const readiness = evaluateServiceContentReadiness(blueprint.slug);
    return {
      slug: blueprint.slug,
      name: blueprint.canonicalName,
      stage: manifest?.stage ?? null,
      contentGatePassed: readiness.issues.length === 0,
      issues: readiness.issues,
      blogCount: readiness.blogCount,
      knowledgeCount: readiness.knowledgeCount,
      socialCounts: readiness.socialCounts,
      requirements: blueprint.requirements.length,
      documents: blueprint.documents.length,
      tasks: blueprint.tasks.length,
    };
  });
}
