import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('KIA voice and durable client registry', () => {
  const audio = source('lib/ai/kia/kia-audio.ts');
  const transcribe = source('app/api/ai/kia/voice/transcribe/route.ts');
  const speech = source('app/api/ai/kia/voice/speech/route.ts');
  const widget = source('components/KiaCopilotWidget.tsx');
  const telegram = source('lib/integrations/telegram.ts');
  const telegramRoute = source('app/api/webhooks/telegram/route.ts');
  const ledger = source('lib/ai/kia/kia-client-ledger.ts');
  const conversationStore = source('lib/ai/kia/kia-conversation-store.ts');
  const context = source('lib/ai/kia/kia-context-builder.ts');
  const prompt = source('lib/ai/kia/kia-system-prompt.ts');
  const cron = source('app/api/cron/kia-client-ledger/route.ts');
  const migration = source('supabase/migrations/20260929160818_kia_client_registry_ledger.sql');
  const deny = source('supabase/migrations/20260929162529_kia_client_registry_explicit_deny.sql');
  const hardening = source('supabase/migrations/20260930113000_kia_client_registry_hardening.sql');
  const companyMigration = source('supabase/migrations/20261005080633_kia_client_registry_company_subjects.sql');
  const companyLedger = source('lib/ai/kia/kia-company-ledger.ts');

  it('keeps audio credentials server-side and enforces auth/size/type gates', () => {
    expect(audio).toContain('process.env.OPENAI_API_KEY');
    expect(audio).toContain('KIA_MAX_AUDIO_BYTES');
    expect(audio).toContain('ALLOWED_AUDIO_TYPES');
    expect(transcribe).toContain('supabase.auth.getUser()');
    expect(transcribe).toContain("status: 413");
    expect(speech).toContain('supabase.auth.getUser()');
    expect(audio).toContain("throw new Error('openai_tts_not_configured')");
    expect(widget).not.toContain('OPENAI_API_KEY');
  });

  it('uses voice notes as text preview before normal KIA send', () => {
    expect(widget).toContain('navigator.mediaDevices.getUserMedia');
    expect(widget).toContain('new MediaRecorder');
    expect(widget).toContain("fetch('/api/ai/kia/voice/transcribe'");
    expect(widget).toContain('setInput(data.transcript.trim())');
    expect(widget).toContain("fetch('/api/ai/kia/voice/speech'");
    expect(widget).not.toContain("send(data.transcript");
  });

  it('accepts verified Telegram voice notes without exposing bot tokens', () => {
    expect(telegram).toContain("kind: 'voice'");
    expect(telegram).toContain('downloadTelegramMedia');
    expect(telegramRoute).toContain('KIA_TELEGRAM_VOICE_ENABLED');
    expect(telegramRoute).toContain('transcribeKiaAudio');
    expect(telegramRoute).toContain('effectiveText');
    expect(widget).not.toContain('TELEGRAM_BOT_TOKEN');
    expect(telegramRoute).toContain("reason: 'unsupported_media'");
  });

  it('creates a service-role-only append-only-style registry surface', () => {
    expect(migration).toContain('create table if not exists public.client_registry_subjects');
    expect(migration).toContain('create table if not exists public.client_registry_events');
    expect(migration).toContain('create table if not exists public.client_registry_snapshots');
    expect(migration).toContain('source_key text not null unique');
    expect(migration).toContain('revoke all on table public.client_registry_events from anon, authenticated');
    expect(deny).toContain('using (false)');
    expect(deny).toContain('with check (false)');
    expect(hardening).toContain('revoke all on table public.client_registry_events from service_role');
    expect(hardening).toContain('grant select, insert on table public.client_registry_events to service_role');
    expect(hardening).toContain('client_registry_reconcile_state');
    expect(companyMigration).toContain('client_registry_subjects_company_uidx');
    expect(companyMigration).toContain('company_cursor');
  });

  it('preserves lead-to-client continuity and fails closed on exact identity conflict', () => {
    expect(ledger).toContain("throw new Error('client_registry_identity_conflict')");
    expect(ledger).toContain("if (clientId && !subject.client_id) patch.client_id = clientId");
    expect(ledger).toContain("if (clientId && subject.lifecycle_stage !== 'client') patch.lifecycle_stage = 'client'");
    expect(ledger).toContain("error.code === '23505'");
  });

  it('does not reconcile source tables on every KIA reply', () => {
    expect(context).toContain('loadClientRegistryContext');
    expect(context).not.toContain('reconcileClientRegistry(admin');
    expect(cron).toContain('reconcileClientRegistry');
    expect(cron).toContain("verifyCronRequest(request.headers, 'cron/kia-client-ledger')");
    expect(cron).toContain('client_registry_reconcile_state');
    expect(cron).toContain("order('id', { ascending: true })");
    expect(cron).toContain('KIA_CLIENT_LEDGER_CONCURRENCY');
    expect(cron).toContain('reconcileCompanyRegistry');
    expect(cron).toContain('company_cursor');
  });

  it('records verified source references instead of copying full artifacts', () => {
    expect(ledger).toContain("eventType: 'document.received'");
    expect(ledger).toContain("eventType: 'email.inbound'");
    expect(ledger).toContain("eventType: 'email.outbound'");
    expect(ledger).toContain("eventType: 'invoice.issued'");
    expect(ledger).toContain("eventType: 'appointment.booked'");
    expect(conversationStore).toContain("eventType: input.channel === 'telegram' ? 'telegram.inbound' : 'chat.user'");
    expect(conversationStore).toContain("eventType: input.channel === 'telegram' ? 'telegram.outbound' : 'chat.kia'");
    expect(ledger).toContain('summary?.slice(0, 1200)');
    expect(ledger).toContain(".eq('from_email', email)");
    expect(ledger).toContain(".eq('recipient_email', email)");
    expect(ledger).not.toContain(".ilike('from_email', email)");
    expect(ledger).toContain("ignoreDuplicates: true");
    expect(ledger).toContain('pendingEvents: RegistryEventInput[]');
    expect(ledger).toContain("metadata.staff_preview === true");
    expect(ledger).toContain('companyId: scope.companyId');
    expect(companyLedger).toContain("from('internal_tasks')");
    expect(companyLedger).toContain("from('client_integrations')");
    expect(companyLedger).toContain("from('admin_email_item_state')");
  });

  it('tells KIA to use the registry for continuity and live tools for exact state', () => {
    expect(prompt).toContain('HOJA REGISTRAL');
    expect(prompt).toContain('fuente viva');
    expect(prompt).toContain('tool canónica correspondiente');
  });
});
