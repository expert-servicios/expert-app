import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import type { KiaChannel } from './kia-output-schema';

export type KiaOperatorLesson = {
  lessonKey: string;
  domain: string;
  title: string;
  instruction: string;
  priority: number;
};

type KiaOperatorLessonRow = {
  lesson_key: string;
  domain: string;
  title: string;
  instruction: string;
  priority: number;
  applies_to_channels?: string[] | null;
};

// The full ROI guides are available in the database but can be pushed beyond
// the global 12-lesson prompt limit. Load them only for an actual ROI query.
// Do not globally inject private case-derived ROI lessons into anonymous chat.
const ROI_GUIDE_KEYS = [
  'roi_036_kb_submission_guide_20261021',
  'roi_aeat_kb_response_guide_20261021',
] as const;

export function isRoiKnowledgeRequest(text: string): boolean {
  return /\b(?:roi|vies|nif[\s-]?iva|operadores?\s+intracomunitarios?|operaciones?\s+intracomunitarias?|alta\s+intracomunitaria)\b/i.test(text)
    || /(?:виеc|виес|vies|внутрисоюзн|внутрисообщественн|реестр\s+операторов\s+ес|номер\s+ндс\s+ес)/i.test(text);
}

export function selectKiaOperatorLessons(
  rows: KiaOperatorLessonRow[],
  channel: KiaChannel,
  topicText = '',
  limit = 12,
): KiaOperatorLesson[] {
  const allowed = rows.filter((row) => {
    const channels = Array.isArray(row.applies_to_channels) ? row.applies_to_channels : [];
    return channels.length === 0 || channels.includes(channel);
  });
  const generic = allowed.filter((row) => !row.lesson_key.startsWith('roi_'));
  const roiGuides = isRoiKnowledgeRequest(topicText)
    ? ROI_GUIDE_KEYS.flatMap((key) => allowed.filter((row) => row.lesson_key === key))
    : [];
  return [...roiGuides, ...generic]
    .slice(0, Math.max(0, limit))
    .map((row) => ({
      lessonKey: String(row.lesson_key),
      domain: String(row.domain),
      title: String(row.title),
      instruction: String(row.instruction),
      priority: Number(row.priority),
    }));
}

export async function loadKiaOperatorLessons(
  channel: KiaChannel,
  limit = 12,
  topicText = '',
): Promise<KiaOperatorLesson[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('kia_operator_lessons')
    .select('lesson_key,domain,title,instruction,priority,applies_to_channels')
    .eq('active', true)
    .order('priority', { ascending: false })
    .limit(50);
  if (error) throw error;

  return selectKiaOperatorLessons(data ?? [], channel, topicText, limit);
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
