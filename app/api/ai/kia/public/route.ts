import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { runKiaDecision } from '@/lib/ai/kia/kia-decision-engine';
import { checkKiaMessageRateLimit } from '@/lib/ai/kia/kia-rate-limit';
import { safeErrorMessage } from '@/lib/ai/kia/kia-redaction';
import { verifyRecaptchaToken } from '@/lib/utils/recaptcha';
import { checkSpam, getClientIp } from '@/lib/utils/spam-guard';
import { buildKiaCopilotArtifacts } from '@/lib/ai/kia/kia-copilot-artifacts';

const historyItemSchema = z.object({
  role: z.enum(['user', 'assistant']),
  text: z.string().min(1).max(1200),
}).strict();

const requestSchema = z.object({
  message: z.string().min(1).max(2000),
  currentPage: z.string().max(240).optional(),
  history: z.array(historyItemSchema).max(6).default([]),
  recaptchaToken: z.string().max(4096),
}).strict();

export async function POST(request: NextRequest) {
  if (process.env.KIA_PUBLIC_CHAT_ENABLED?.toLowerCase() === 'false') {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const ip = getClientIp(request.headers);
  if (!checkKiaMessageRateLimit(`public:${ip}`)) {
    return NextResponse.json({
      error: 'rate_limited',
      reply: 'Has enviado varios mensajes seguidos. Espera un momento y vuelve a intentarlo.',
    }, { status: 429 });
  }

  const spam = checkSpam({ message: parsed.data.message });
  if (spam.isSpam) {
    return NextResponse.json({
      error: 'request_rejected',
      reply: 'No he podido procesar ese mensaje. Reformúlalo sin enlaces repetidos ni contenido automatizado.',
    }, { status: 400 });
  }

  const recaptcha = await verifyRecaptchaToken({
    token: parsed.data.recaptchaToken,
    action: 'kia_public_chat',
    minScore: 0.4,
  });
  if (!recaptcha.ok) {
    return NextResponse.json({
      error: 'verification_failed',
      reply: 'No he podido verificar esta solicitud. Recarga la página y vuelve a intentarlo.',
    }, { status: 403 });
  }

  const now = Date.now();
  const syntheticRecentMessages = parsed.data.history.map((item, index) => ({
    role: item.role,
    text: item.text,
    createdAt: new Date(now - (parsed.data.history.length - index) * 1000).toISOString(),
  }));

  try {
    const result = await runKiaDecision({
      taskType: 'chat_reply',
      channel: 'dashboard',
      message: parsed.data.message,
      allowTools: true,
      forceToolExecution: true,
      allowedToolNames: [
        'search_knowledge_resources',
        'get_official_sources',
        'find_relevant_services',
      ],
      toolAuthorization: {
        maxRiskTier: 'R0',
        allowedEffects: ['read'],
        autonomousOnly: true,
      },
      includeOfficialSourceContext: true,
      contextInput: {
        channel: 'dashboard',
        latestMessage: parsed.data.message,
        currentPage: parsed.data.currentPage,
        currentTask: 'public_web_chat',
        syntheticRecentMessages,
      },
    });

    const artifacts = buildKiaCopilotArtifacts(result.toolResults, result.decision)
      .filter((artifact) => artifact.type === 'link');

    console.info('[KIA public chat] provider result', {
      provider: result.providerResult?.provider ?? 'fallback',
      model: result.providerResult?.model ?? null,
      usedFallback: result.usedFallback,
      intent: result.decision.intent,
      nextAction: result.decision.nextAction,
    });

    return NextResponse.json({
      reply: result.userMessage,
      quickReplies: result.decision.quickReplies?.map((item) => item.title).filter(Boolean) ?? [],
      intent: result.decision.intent,
      nextAction: result.decision.nextAction,
      requiresMeeting: result.decision.requiresMeeting,
      serviceSlug: typeof result.decision.dataToSave?.serviceSlug === 'string'
        ? result.decision.dataToSave.serviceSlug
        : null,
      artifacts,
      usedFallback: result.usedFallback,
    });
  } catch (error) {
    console.error('[KIA public chat] failed', safeErrorMessage(error));
    return NextResponse.json({
      error: 'kia_unavailable',
      reply: 'Ahora mismo no puedo responder. Puedes abrir KIA en Telegram o volver a intentarlo en unos minutos.',
    }, { status: 503 });
  }
}
