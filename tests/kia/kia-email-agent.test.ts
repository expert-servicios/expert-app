import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('KIA guarded email agent', () => {
  const route = source('app/api/cron/kia-email-agent/route.ts');
  const helper = source('lib/integrations/operational-gmail.ts');
  const gmail = source('lib/integrations/gmail.ts');
  const vercel = source('vercel.json');

  it('is fail-closed and requires explicit auto-send', () => {
    expect(route).toContain('KIA_EMAIL_AGENT_ENABLED');
    expect(route).toContain('KIA_EMAIL_AUTO_SEND_ENABLED');
    expect(route).toContain('health_not_green');
    expect(route).toContain("data.status !== 'passed'");
    expect(route).toContain('failed_checks');
  });

  it('only auto-replies to likely humans', () => {
    expect(route).toContain('isLikelyHuman');
    expect(route).toContain('listUnsubscribe');
    expect(route).toContain('autoSubmitted');
    expect(route).toContain('CATEGORY_PROMOTIONS');
    expect(route).toContain('no-?reply');
  });

  it('analyses every unread inbox thread but sends only high-confidence safe replies', () => {
    expect(route).toContain(".eq('unread', true)");
    expect(route).toContain('result.decision.confidence >= minConfidence');
    expect(route).toContain('!result.decision.requiresManualReview');
    expect(route).toContain('!result.usedFallback');
    expect(route).toContain('!identity.ambiguousCase');
    expect(route).toContain('!hasAttachments');
  });

  it('uses only read-only KIA tools for autonomous email analysis', () => {
    expect(route).toContain("allowedEffects: ['read']");
    expect(route).toContain("maxRiskTier: 'R1'");
    expect(route).toContain('get_case_status');
    expect(route).toContain('search_knowledge_resources');
    expect(route).toContain('get_official_sources');
  });

  it('keeps operational inspection unread until a human or policy changes it', () => {
    expect(helper).toContain('getGmailThreadSA(threadId, false)');
    expect(helper).toContain('getGmailThread(tokens, threadId, false)');
    expect(gmail).toContain('markRead = true');
  });

  it('threads replies and schedules after inbox sync', () => {
    expect(helper).toContain('sendGmailReplySA');
    expect(route).toContain('sendOperationalGmailReply');
    expect(vercel).toContain('/api/cron/kia-email-agent');
    expect(vercel).toContain('2-59/10 * * * *');
  });
});
