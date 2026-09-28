import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('newsletter audience segmentation and delivery idempotency', () => {
  const dashboard = source('components/admin/CampanasDashboard.tsx');
  const preview = source('app/api/admin/campaigns/segment-preview/route.ts');
  const campaignRoute = source('app/api/admin/campaigns/[id]/route.ts');
  const segments = source('lib/campaigns/segments.ts');
  const sender = source('app/api/admin/campaigns/[id]/send/route.ts');
  const migration = source('supabase/migrations/20260928145629_newsletter_segments_and_telegram.sql');
  const repairMigration = source('supabase/migrations/20260928190000_campaign_recipient_key_repair.sql');

  it('lets admin select and preview a newsletter audience profile', () => {
    expect(dashboard).toContain('Perfil de newsletter');
    expect(dashboard).toContain('AUDIENCE_SEGMENT_LABELS');
    expect(dashboard).toContain('audience_segment: segment === \'newsletter\'');
    expect(preview).toContain("searchParams.get('audience_segment')");
    expect(preview).toContain("segment === 'newsletter' ? audienceSegment : null");
    expect(campaignRoute).toContain('audience_segment: nextAudienceSegment');
    expect(campaignRoute).toContain('recipient_count: recipients.length');
  });

  it('deduplicates canonical recipients before dispatch', () => {
    expect(segments).toContain('function dedupeRecipients');
    expect(segments).toContain("key: `email:${email}`");
    expect(segments).toContain('return dedupeRecipients(recipients)');
    expect(segments).toContain('return dedupeRecipients((data ?? []).map');
  });

  it('deduplicates historical sends before creating the unique index', () => {
    const dedupePosition = migration.indexOf('with ranked_campaign_sends as');
    const indexPosition = migration.indexOf('create unique index if not exists campaign_sends_campaign_recipient_key_uidx');
    expect(dedupePosition).toBeGreaterThan(-1);
    expect(indexPosition).toBeGreaterThan(dedupePosition);
    expect(migration).toContain("partition by campaign_id, recipient_key");
    expect(migration).toContain("case when status = 'sent' then 0 else 1 end");
    expect(migration).toContain("'email:' || lower(trim(recipient_email))");
    expect(repairMigration).toContain('drop index if exists public.campaign_sends_campaign_recipient_key_uidx');
    expect(repairMigration).toContain("'email:' || lower(trim(recipient_email))");
    expect(repairMigration).toContain('with ranked_campaign_sends as');
    expect(repairMigration).toContain('create unique index if not exists campaign_sends_campaign_recipient_key_uidx');
  });

  it('reuses a campaign-send row when a failed recipient is retried', () => {
    expect(sender).toContain(".upsert({");
    expect(sender).toContain("{ onConflict: 'campaign_id,recipient_key' }");
  });
});
