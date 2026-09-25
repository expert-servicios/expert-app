import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('KIA multichannel feedback learning guard', () => {
  it('returns a decision log id from the decision logger and engine', () => {
    expect(source('lib/ai/kia/kia-decision-log.ts')).toContain("select('id').single()");
    expect(source('lib/ai/kia/kia-decision-engine.ts')).toContain('decisionLogId');
    expect(source('app/api/ai/kia/route.ts')).toContain('decisionLogId: result.decisionLogId ?? null');
  });

  it('keeps client feedback out of few-shot learning until approved', () => {
    const fewShot = source('lib/ai/kia/kia-few-shot-provider.ts');
    expect(fewShot).toContain(".eq('approved_for_learning', true)");
    expect(source('lib/ai/kia/kia-feedback-store.ts')).toContain('approved_for_learning: false');
  });

  it('generalizes the feedback schema beyond retired WABA', () => {
    const migration = source('supabase/migrations/20260925121500_kia_feedback_multichannel_learning_guard.sql');
    expect(migration).toContain('alter column phone drop not null');
    expect(migration).toContain('approved_for_learning boolean not null default false');
    expect(migration).toContain('feedback_context jsonb');
  });

  it('exposes authenticated dashboard feedback without trusting client reply text', () => {
    const route = source('app/api/ai/kia/feedback/route.ts');
    expect(route).toContain("log.client_id !== user.id");
    expect(route).toContain("log.channel !== 'dashboard'");
    expect(route).toContain('canonicalReply');
    expect(route).not.toContain('kiaReply: z.string');
  });

  it('renders thumbs feedback only for real logged assistant replies', () => {
    const widget = source('components/KiaCopilotWidget.tsx');
    expect(widget).toContain('ThumbsUp');
    expect(widget).toContain('ThumbsDown');
    expect(widget).toContain('msg.decisionLogId');
    expect(widget).toContain("rate(msg.id, 'positive')");
  });
});
