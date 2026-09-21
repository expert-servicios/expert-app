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
 * Never deletes or retires a row: a service removed from the public catalog
 * is left as-is here for a human to decide, it is not auto-retired.
 *
 * Usage:
 *   npx tsx scripts/backfill-meta-catalog-c2.ts            # dry run (default)
 *   npx tsx scripts/backfill-meta-catalog-c2.ts --apply     # writes to Supabase
 */
import { services, type CategorySlug, type Service } from '../lib/utils/catalog';
import { parseServicePrice } from '../lib/marketing/meta-catalog-pricing';
import { getSupabaseAdmin } from '../lib/integrations/supabase';

const APPLY = process.argv.includes('--apply');
const LOCALE = 'es';

function serviceType(categoria: CategorySlug): 'service' | 'training' {
  return categoria === 'formacion' ? 'training' : 'service';
}

function landingPath(service: Service): string {
  return `/servicios/${service.categoria}/${service.slug}`;
}

async function main() {
  // Only requires Supabase credentials when actually writing; a dry run
  // just parses and prints, so it works without any env configured.
  const admin = APPLY ? getSupabaseAdmin() : null;

  console.log(`${APPLY ? 'APLICANDO' : 'DRY RUN'} backfill de ${services.length} servicios hacia catalog_services/service_contents/commercial_offers\n`);

  let priceWarnings = 0;

  for (const service of services) {
    const parsedPrice = parseServicePrice(service.price);
    if (parsedPrice.warnings.length > 0) {
      priceWarnings++;
      console.log(`  ⚠ ${service.slug}: ${parsedPrice.warnings.join(', ')}`);
    }

    if (!APPLY || !admin) continue;

    const { data: catalogService, error: serviceError } = await admin
      .from('catalog_services')
      .upsert(
        {
          slug: service.slug,
          category_key: service.categoria,
          service_type: serviceType(service.categoria),
          status: 'active',
        },
        { onConflict: 'slug' },
      )
      .select('id')
      .single();

    if (serviceError || !catalogService) {
      throw new Error(`catalog_services upsert failed for ${service.slug}: ${serviceError?.message}`);
    }

    const { error: contentError } = await admin.from('service_contents').upsert(
      {
        service_id: catalogService.id,
        locale: LOCALE,
        name: service.name,
        short_description: service.shortDescription,
        description: service.description,
        meta_title: service.metaTitle ?? null,
        meta_description: service.metaDescription ?? null,
        landing_path: landingPath(service),
        image_url: null, // no per-service image exists yet in the public catalog
        status: 'active',
      },
      { onConflict: 'service_id,locale' },
    );

    if (contentError) {
      throw new Error(`service_contents upsert failed for ${service.slug}: ${contentError.message}`);
    }

    const { error: offerError } = await admin.from('commercial_offers').upsert(
      {
        service_id: catalogService.id,
        code: 'default',
        billing_mode: 'one_time',
        price_mode: parsedPrice.priceMode,
        currency: 'EUR',
        amount_cents: parsedPrice.amountCents,
        vat_treatment: parsedPrice.vatTreatment,
        status: 'active',
      },
      { onConflict: 'service_id,code' },
    );

    if (offerError) {
      throw new Error(`commercial_offers upsert failed for ${service.slug}: ${offerError.message}`);
    }
  }

  console.log(`\n${services.length} servicios procesados. ${priceWarnings} con precio que requiere revisión manual (formato no reconocido o "Consultar").`);
  console.log('Nota: ningún servicio tiene image_url todavía — hace falta una imagen por servicio antes de exportar a Meta.');
  if (!APPLY) {
    console.log('\nEsto fue un dry run. Ejecuta con --apply para escribir en Supabase.');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
