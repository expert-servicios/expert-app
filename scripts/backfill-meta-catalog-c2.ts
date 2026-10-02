#!/usr/bin/env tsx
/**
 * Backfills the canonical C2 commercial catalog (catalog_services,
 * service_contents, commercial_offers) from the live public catalog in
 * lib/utils/catalog.ts. The C2 tables were created "structure only" with no
 * backfill (migration 20260918175830) — this script closes that gap so the
 * Meta catalog export has real data to read.
 *
 * Idempotent: upserts on the same natural keys the schema already enforces
 * (catalog_services.slug, service_contents (service_id, locale),
 * commercial_offers (service_id, code)). Safe to re-run.
 *
 * Never deletes a row: a service removed from the public catalog is left
 * as-is here for a human to decide. Subscription-only services and services
 * with no fixed/floor price are archived (status "paused") rather than
 * excluded silently — see SUBSCRIPTION_ONLY_SLUGS below.
 *
 * Usage:
 *   npx tsx scripts/backfill-meta-catalog-c2.ts            # dry run (default)
 *   npx tsx scripts/backfill-meta-catalog-c2.ts --apply     # writes to Supabase
 */
import { services, type CategorySlug, type Service } from '../lib/utils/catalog';
import { parseServicePrice } from '../lib/marketing/meta-catalog-pricing';
import { SUBSCRIPTION_ONLY_SLUGS, CATEGORY_OVERRIDES, isArchivedService } from '../lib/marketing/meta-catalog-archive';
import { getSupabaseAdmin } from '../lib/integrations/supabase';

const APPLY = process.argv.includes('--apply');
const LOCALE = 'es';

function serviceType(categoria: CategorySlug): 'service' | 'training' {
  return categoria === 'formacion' ? 'training' : 'service';
}

function landingPath(service: Service): string {
  return `/servicios/${service.categoria}/${service.slug}`;
}

// Canonical dynamic image generated from the current service content.
function serviceImageUrl(slug: string): string {
  return `/api/services/og?slug=${encodeURIComponent(slug)}&variant=square&lang=es`;
}

type Admin = NonNullable<ReturnType<typeof getSupabaseAdmin>>;

type CatalogEntryInput = {
  slug: string;
  categoryKey: string;
  entryType: 'service' | 'training';
  status: 'active' | 'paused';
  name: string;
  shortDescription: string | null;
  description: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  landingPath: string;
  imageUrl: string | null;
  billingMode: 'one_time' | 'recurring';
  priceMode: 'fixed' | 'from' | 'quote';
  amountCents: number | null;
  vatTreatment: string;
};

async function upsertCatalogEntry(admin: Admin, input: CatalogEntryInput) {
  const { data: catalogService, error: serviceError } = await admin
    .from('catalog_services')
    .upsert(
      {
        slug: input.slug,
        category_key: input.categoryKey,
        service_type: input.entryType,
        status: input.status,
      },
      { onConflict: 'slug' },
    )
    .select('id')
    .single();

  if (serviceError || !catalogService) {
    throw new Error(`catalog_services upsert failed for ${input.slug}: ${serviceError?.message}`);
  }

  const { error: contentError } = await admin.from('service_contents').upsert(
    {
      service_id: catalogService.id,
      locale: LOCALE,
      name: input.name,
      short_description: input.shortDescription,
      description: input.description,
      meta_title: input.metaTitle,
      meta_description: input.metaDescription,
      landing_path: input.landingPath,
      image_url: input.imageUrl,
      status: 'active',
    },
    { onConflict: 'service_id,locale' },
  );

  if (contentError) {
    throw new Error(`service_contents upsert failed for ${input.slug}: ${contentError.message}`);
  }

  const { error: offerError } = await admin.from('commercial_offers').upsert(
    {
      service_id: catalogService.id,
      code: 'default',
      billing_mode: input.billingMode,
      price_mode: input.priceMode,
      currency: 'EUR',
      amount_cents: input.amountCents,
      vat_treatment: input.vatTreatment,
      status: 'active',
    },
    { onConflict: 'service_id,code' },
  );

  if (offerError) {
    throw new Error(`commercial_offers upsert failed for ${input.slug}: ${offerError.message}`);
  }
}

async function main() {
  // Only requires Supabase credentials when actually writing; a dry run
  // just parses and prints, so it works without any env configured.
  const admin = APPLY ? getSupabaseAdmin() : null;

  console.log(`${APPLY ? 'APLICANDO' : 'DRY RUN'} backfill de ${services.length} servicios hacia catalog_services/service_contents/commercial_offers\n`);

  let priceWarnings = 0;
  let paused = 0;

  for (const service of services) {
    const parsedPrice = parseServicePrice(service.price);
    if (parsedPrice.warnings.length > 0) {
      priceWarnings++;
      console.log(`  ⚠ ${service.slug}: ${parsedPrice.warnings.join(', ')}`);
    }

    const isPaused = isArchivedService(service);
    if (isPaused) {
      paused++;
      console.log(`  ⏸ ${service.slug}: archivado del catálogo de Meta (${SUBSCRIPTION_ONLY_SLUGS.has(service.slug) ? 'solo por suscripción' : 'sin precio fijo'})`);
    }

    // Archived/quote services stay outside Meta. Active services use the
    // dynamic OG endpoint so image content follows the canonical service.
    const imageUrl = isPaused ? null : serviceImageUrl(service.slug);

    if (!APPLY || !admin) continue;

    await upsertCatalogEntry(admin, {
      slug: service.slug,
      // Meta-facing grouping only — the real site keeps service.categoria,
      // so landingPath below is never built from this override.
      categoryKey: CATEGORY_OVERRIDES[service.slug] ?? service.categoria,
      entryType: serviceType(CATEGORY_OVERRIDES[service.slug] ?? service.categoria),
      status: isPaused ? 'paused' : 'active',
      name: service.name,
      shortDescription: service.shortDescription,
      description: service.description,
      metaTitle: service.metaTitle ?? null,
      metaDescription: service.metaDescription ?? null,
      landingPath: landingPath(service),
      imageUrl,
      billingMode: 'one_time',
      priceMode: parsedPrice.priceMode,
      amountCents: parsedPrice.amountCents,
      vatTreatment: parsedPrice.vatTreatment,
    });
  }

  console.log(`\n${services.length} servicios procesados. ${priceWarnings} con precio que requiere revisión manual (formato no reconocido o "Consultar"). ${paused} archivados (pausados) del catálogo de Meta.`);
  if (!APPLY) {
    console.log('\nEsto fue un dry run. Ejecuta con --apply para escribir en Supabase.');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
