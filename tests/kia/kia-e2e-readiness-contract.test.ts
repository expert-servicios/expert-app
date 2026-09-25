import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('KIA end-to-end readiness contract', () => {
  it('keeps one canonical in-app KIA surface', () => {
    const widget = source('components/KiaCopilotWidget.tsx');
    const protectedLayout = source('app/(protected)/layout.tsx');
    expect(protectedLayout).toContain('KiaCopilotWidget');
    expect(widget).toContain("fetch('/api/ai/kia'");
  });

  it('supports knowledge, visuals, contextual services and human escalation as distinct outputs', () => {
    const route = source('app/api/ai/kia/route.ts');
    expect(route).toContain('buildAutomaticKiaKnowledgeResult');
    expect(route).toContain('buildAutomaticKiaVisualResult');
    expect(route).toContain('detectKiaConversationOpportunity');
    expect(route).toContain('findKiaRelevantServices');
    const artifacts = source('lib/ai/kia/kia-copilot-artifacts.ts');
    expect(artifacts).toContain("decision.nextAction === 'book_call' && decision.requiresMeeting");
  });

  it('keeps feedback learning explicit and human approved', () => {
    const feedback = source('lib/ai/kia/kia-feedback-store.ts');
    const fewShot = source('lib/ai/kia/kia-few-shot-provider.ts');
    const adminReview = source('app/api/admin/kia-feedback/route.ts');
    expect(feedback).toContain('approved_for_learning: false');
    expect(fewShot).toContain(".eq('approved_for_learning', true)");
    expect(adminReview).toContain('approved_for_learning: parsed.data.approved');
  });

  it('keeps Telegram verified, private and read-only by policy while allowing rich presentation', () => {
    const telegram = source('app/api/webhooks/telegram/route.ts');
    expect(telegram).toContain("payload?.message?.chat?.type !== 'private'");
    expect(telegram).toContain("runPolicyEnforcedKiaDecision('telegram_verified'");
    expect(telegram).toContain('buildKiaTelegramPresentation');
    expect(telegram).toContain('sendTelegramPhotoConfirmed');
  });

  it('keeps client feedback endpoint scoped to the authenticated dashboard owner', () => {
    const route = source('app/api/ai/kia/feedback/route.ts');
    expect(route).toContain('log.client_id !== user.id');
    expect(route).toContain("log.channel !== 'dashboard'");
    expect(route).toContain('canonicalReply');
  });

  it('has no active dependency on WABA for the readiness flow', () => {
    const qa = source('docs/kia-ai-qa.md');
    expect(qa).toContain('WABA está retirado');
  });
});
