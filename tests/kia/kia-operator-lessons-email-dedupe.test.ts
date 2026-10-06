import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatKiaOperatorLessons } from '@/lib/ai/kia/kia-operator-lessons';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('KIA operator lessons and email duplicate guard', () => {
  const engine = source('lib/ai/kia/kia-decision-engine.ts');
  const emailAgent = source('app/api/cron/kia-email-agent/route.ts');
  const migration = source('supabase/migrations/20261005070044_kia_operator_lessons.sql');

  it('injects validated operator lessons into KIA decisions', () => {
    expect(engine).toContain('loadKiaOperatorLessons');
    expect(engine).toContain('operatorLessonsBlock');
    const block = formatKiaOperatorLessons([{
      lessonKey: 'test',
      domain: 'general',
      title: 'Test',
      instruction: 'No repetir una pregunta ya respondida.',
      priority: 100,
    }]);
    expect(block).toContain('<operator_lessons');
    expect(block).toContain('No repetir una pregunta ya respondida.');
  });

  it('checks the live Gmail thread immediately before sending', () => {
    expect(emailAgent).toContain('hasLiveOutboundReplyAfterInbound');
    expect(emailAgent).toContain('live_thread_already_answered');
    expect(emailAgent).toContain('live_gmail_pre_send_check');
    expect(emailAgent.indexOf('hasLiveOutboundReplyAfterInbound('))
      .toBeLessThan(emailAgent.lastIndexOf('sendOperationalGmailReply(admin'));
  });

  it('seeds the core lessons learned from operator coaching', () => {
    expect(migration).toContain('email_pre_send_live_duplicate_check');
    expect(migration).toContain('consultation_first_data_minimization');
    expect(migration).toContain('reuse_facts_already_provided');
    expect(migration).toContain('legal_strategy_not_neutral_menu');
    expect(migration).toContain('official_sources_and_precedence');
  });
});
