import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import type { KiaChannel } from './kia-output-schema';

export type KiaOperatorLesson = {
  lessonKey: string;
  domain: string;
  title: string;
  instruction: string;
  priority: number;
};

export async function loadKiaOperatorLessons(channel: KiaChannel, limit = 12): Promise<KiaOperatorLesson[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('kia_operator_lessons')
    .select('lesson_key,domain,title,instruction,priority,applies_to_channels')
    .eq('active', true)
    .order('priority', { ascending: false })
    .limit(50);
  if (error) throw error;

  return (data ?? [])
    .filter((row) => {
      const channels = Array.isArray(row.applies_to_channels) ? row.applies_to_channels : [];
      return channels.length === 0 || channels.includes(channel);
    })
    .slice(0, limit)
    .map((row) => ({
      lessonKey: String(row.lesson_key),
      domain: String(row.domain),
      title: String(row.title),
      instruction: String(row.instruction),
      priority: Number(row.priority),
    }));
}

export function formatKiaOperatorLessons(lessons: KiaOperatorLesson[]): string {
  if (!lessons.length) return '';
  return [
    '<operator_lessons priority="high">',
    'Estas reglas provienen de correcciones operativas validadas por EXPERT. Aplícalas cuando sean relevantes; no inventes excepciones.',
    ...lessons.map((lesson) => `- [${lesson.lessonKey}] ${lesson.instruction}`),
    '</operator_lessons>',
  ].join('\n');
}
