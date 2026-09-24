import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { runKiaProviderRequest } from './kia-provider-router';

export const REVIEW_MODERATION_POLICY_VERSION = '2026-09-19.v1';

const AUTO_WITHHOLD_CATEGORIES = new Set([
  'offensive_abusive',
  'personal_data',
  'confidential_case_data',
  'spam_promotion',
]);

const moderationSchema = z.object({
  decision: z.enum(['publish', 'hold_for_review', 'comment_not_publishable']),
  category: z.enum([
    'none',
    'offensive_abusive',
    'personal_data',
    'confidential_case_data',
    'spam_promotion',
    'irrelevant',
    'serious_illegal_allegation',
    'other_risk',
  ]),
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1).max(400),
});

export type KiaReviewModerationDecision = z.infer<typeof moderationSchema>;

const MODERATION_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    decision: { type: 'string', enum: ['publish', 'hold_for_review', 'comment_not_publishable'] },
    category: {
      type: 'string',
      enum: [
        'none',
        'offensive_abusive',
        'personal_data',
        'confidential_case_data',
        'spam_promotion',
        'irrelevant',
        'serious_illegal_allegation',
        'other_risk',
      ],
    },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
    reason: { type: 'string', minLength: 1, maxLength: 400 },
  },
  required: ['decision', 'category', 'confidence', 'reason'],
} as const;

const SYSTEM_PROMPT = [
  'Eres el moderador de comentarios de reseñas verificadas de clientes de EXPERT.',
  'Tu única tarea es decidir si el TEXTO del comentario puede mostrarse públicamente.',
  'Nunca recibes ni debes inferir la puntuación en estrellas, la identidad del cliente, el importe pagado o datos del expediente.',
  'La opinión negativa, crítica, decepcionada o desfavorable es SIEMPRE publicable si no infringe una regla objetiva.',
  'No protejas la reputación de EXPERT. No favorezcas comentarios positivos.',
  'No reescribas, suavices ni mejores el comentario.',
  '',
  'PUBLICAR: críticas, quejas, desacuerdo con precio, demora, atención, resultado o expectativas, incluso si son duras.',
  'COMMENT_NOT_PUBLISHABLE: insultos o acoso inequívocos; datos personales o de contacto; información confidencial/sensible del expediente; spam o publicidad.',
  'HOLD_FOR_REVIEW: acusaciones graves de delitos o fraude, contexto ambiguo, posible difamación, contenido irrelevante dudoso o cualquier caso donde no estés seguro.',
  'Una mera afirmación negativa sobre la calidad del servicio NO es difamación por sí sola.',
  'Si dudas entre ocultar y revisar, elige hold_for_review.',
  'Devuelve solo el objeto JSON del schema.',
].join('\n');

export async function classifyReviewCommentWithKia(
  comment: string,
): Promise<{ decision: KiaReviewModerationDecision; model: string }> {
  const trimmed = comment.trim();

  if (!trimmed) {
    return {
      decision: {
        decision: 'publish',
        category: 'none',
        confidence: 1,
        reason: 'No hay comentario de texto que moderar.',
      },
      model: 'deterministic:no-comment',
    };
  }

  const result = await runKiaProviderRequest({
    taskType: 'review_moderation',
    systemPrompt: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: trimmed }],
    responseSchema: MODERATION_JSON_SCHEMA,
    effort: 'high',
    maxTokens: 350,
    temperature: 0,
  });

  if (result.error || !result.parsedJson) {
    return {
      decision: {
        decision: 'hold_for_review',
        category: 'other_risk',
        confidence: 0,
        reason: 'La moderación automática no pudo completarse de forma fiable.',
      },
      model: result.model || 'unknown',
    };
  }

  const parsed = moderationSchema.safeParse(result.parsedJson);
  if (!parsed.success) {
    return {
      decision: {
        decision: 'hold_for_review',
        category: 'other_risk',
        confidence: 0,
        reason: 'La respuesta de moderación no cumplió el contrato estructurado.',
      },
      model: result.model || 'unknown',
    };
  }

  return { decision: parsed.data, model: result.model };
}

export async function moderateReviewByKia(reviewId: string): Promise<void> {
  const admin = getSupabaseAdmin();

  const { data: review, error } = await admin
    .from('reviews')
    .select('id,comment,allow_publish,status')
    .eq('id', reviewId)
    .maybeSingle();

  if (error || !review || review.status !== 'pending') return;

  const { decision, model } = await classifyReviewCommentWithKia(review.comment ?? '');

  let moderationStatus: 'approved' | 'hold_for_review' | 'comment_not_publishable';
  let status: 'approved' | 'pending';
  let published = false;
  let commentPublishable = true;

  if (decision.decision === 'publish' && decision.confidence >= 0.85) {
    moderationStatus = 'approved';
    status = 'approved';
    published = review.allow_publish === true;
  } else if (
    decision.decision === 'comment_not_publishable' &&
    decision.confidence >= 0.95 &&
    AUTO_WITHHOLD_CATEGORIES.has(decision.category)
  ) {
    moderationStatus = 'comment_not_publishable';
    status = 'approved';
    published = review.allow_publish === true;
    commentPublishable = false;
  } else {
    moderationStatus = 'hold_for_review';
    status = 'pending';
    published = false;
  }

  const moderatedAt = new Date().toISOString();

  const { error: updateError } = await admin
    .from('reviews')
    .update({
      status,
      published,
      comment_publishable: commentPublishable,
      moderation_status: moderationStatus,
      moderation_reason: decision.reason,
      moderated_by: 'kia',
      moderation_policy_version: REVIEW_MODERATION_POLICY_VERSION,
      moderation_model: model,
      moderated_at: moderatedAt,
    })
    .eq('id', reviewId)
    .eq('status', 'pending');

  if (updateError) {
    console.error('[KIA review moderation] update failed', updateError);
    return;
  }

  await admin.from('audit_logs').insert({
    action: 'review.moderated_by_kia',
    entity: 'reviews',
    entity_id: reviewId,
    metadata: {
      moderation_status: moderationStatus,
      category: decision.category,
      confidence: decision.confidence,
      policy_version: REVIEW_MODERATION_POLICY_VERSION,
      model,
      comment_publishable: commentPublishable,
      rating_visible: published,
    },
  }).then(() => {});
}
