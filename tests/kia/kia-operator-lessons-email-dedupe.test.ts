import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatKiaOperatorLessons, isRoiKnowledgeRequest, selectKiaOperatorLessons } from '@/lib/ai/kia/kia-operator-lessons';

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


  it('selects the ROI guides for ROI, VIES and EU VAT questions without leaking case-specific coaching', () => {
    const base = Array.from({ length: 15 }, (_, i) => ({
      lesson_key: `generic_${i}`,
      domain: 'general',
      title: 'General',
      instruction: 'Safe generic instruction',
      priority: 100 - i,
      applies_to_channels: [] as string[],
    }));
    const rows = [
      ...base,
      {
        lesson_key: 'roi_036_kb_submission_guide_20261021',
        domain: 'tax', title: 'Solicitud ROI', instruction: 'Modelo 036', priority: 98,
        applies_to_channels: [] as string[],
      },
      {
        lesson_key: 'roi_aeat_kb_response_guide_20261021',
        domain: 'tax', title: 'Alegaciones ROI', instruction: 'Contestar AEAT', priority: 98,
        applies_to_channels: [] as string[],
      },
      {
        lesson_key: 'roi_aeat_propuesta_alegaciones_evidencia_20261021',
        domain: 'tax', title: 'Historical client case', instruction: 'Do not expose', priority: 100,
        applies_to_channels: [] as string[],
      },
    ];
    expect(isRoiKnowledgeRequest('Solicitar ROI y validar NIF-IVA en VIES')).toBe(true);
    expect(isRoiKnowledgeRequest('Как получить VIES для фирмы?')).toBe(true);
    expect(isRoiKnowledgeRequest('¿Cuánto cuesta una consulta?')).toBe(false);
    expect(isRoiKnowledgeRequest('¿Cómo cambio el domicilio fiscal con el modelo 036?')).toBe(false);
    expect(isRoiKnowledgeRequest('¿Cómo solicitar el ROI con el modelo 036?')).toBe(true);
    const withRoi = selectKiaOperatorLessons(rows, 'dashboard', 'Necesito darme de alta en el ROI', 12);
    expect(withRoi[0].lessonKey).toBe('roi_036_kb_submission_guide_20261021');
    expect(withRoi[1].lessonKey).toBe('roi_aeat_kb_response_guide_20261021');
    expect(withRoi).toHaveLength(12);
    expect(withRoi.some((x) => x.lessonKey.includes('evidencia_20261021'))).toBe(false);
    const normal = selectKiaOperatorLessons(rows, 'dashboard', 'Quiero información sobre IRPF', 12);
    expect(normal.some((x) => x.lessonKey.startsWith('roi_'))).toBe(false);
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
