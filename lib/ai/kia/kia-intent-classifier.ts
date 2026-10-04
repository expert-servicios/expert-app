import { KIA_TASK_TYPES, KIA_INTENTS, type KiaTaskType, type KiaChannel } from './kia-output-schema';
import { runKiaProviderRequest } from './kia-provider-router';
import { safeErrorMessage } from './kia-redaction';

export interface KiaIntentClassification {
  suggestedTaskType: KiaTaskType;
  detectedIntent: (typeof KIA_INTENTS)[number];
  ambiguityScore: number;
  needsClarify: boolean;
  clarifyQuestion: string;
  clarifyOptions: Array<{ id: string; title: string }>;
  detectedLanguage: 'es' | 'ru';
  confidence: number;
}

const CLASSIFIER_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'suggestedTaskType',
    'detectedIntent',
    'ambiguityScore',
    'needsClarify',
    'clarifyQuestion',
    'clarifyOptions',
    'detectedLanguage',
    'confidence',
  ],
  properties: {
    suggestedTaskType: { enum: [...KIA_TASK_TYPES] },
    detectedIntent: { enum: [...KIA_INTENTS] },
    ambiguityScore: { type: 'number', minimum: 0, maximum: 1 },
    needsClarify: { type: 'boolean' },
    clarifyQuestion: { type: 'string' },
    clarifyOptions: {
      type: 'array',
      maxItems: 3,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'title'],
        properties: {
          id: { type: 'string' },
          title: { type: 'string', maxLength: 20 },
        },
      },
    },
    detectedLanguage: { enum: ['es', 'ru'] },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
  },
} as const;

function buildClassifierSystemPrompt(): string {
  return [
    'Eres un clasificador ultra-rapido de intencion para Kia, asistente de EXPERT Asesoria (gestoría fiscal, laboral y juridica en España).',
    '',
    'Tu unica tarea: dado el mensaje del usuario y los ultimos mensajes, devolver un JSON de clasificacion.',
    '',
    '<task_type_guide>',
    '- chat_reply: saludo, estado expediente, pregunta general, respuesta conversacional o diagnóstico laboral/nómina',
    '- viability_reasoning: servicios con filtro juridico (arraigo, nacionalidad, NIE, residencia, Beckham, patrimonio, modelo 720)',
    '- readiness_reasoning: servicios que requieren Holded (contabilidad, plan mensual, migracion Holded)',
    '- checkout_decision: usuario quiere contratar, pagar o preguntar precio',
    '- next_best_action: cliente pide accion operativa sobre su expediente',
    '- company_status_summary: resumen contable, IVA, IRPF, estado fiscal empresa',
    '- document_classification: usuario envia o menciona un documento especifico',
    '</task_type_guide>',
    '',
    '<intent_guide>',
    '- assistant_operations: solicitud operativa de correo/calendario/seguimiento/tarea, confirmación de algo ya realizado, petición de enviar/recordar/revisar algo sin especialidad fiscal-contable-laboral dominante',
    '- book_call: pedir, proponer, confirmar, cambiar o cancelar una reunión/cita',
    '- payroll_diagnostics: revisar o comparar nómina, contrato laboral, jornada, pagas extra, bases de cotización, IRPF de nómina, coste empresa o salary-records de un empleado',
    '- anomaly_review: anomalías contables generales; no usar para discrepancias de nómina si payroll_diagnostics encaja',
    '</intent_guide>',
    '',
    '<ambiguity_guide>',
    '- ambiguityScore 0.0-0.3: mensaje claro, needsClarify=false',
    '- ambiguityScore 0.4-0.6: parcialmente ambiguo, needsClarify=false si puedes inferir',
    '- ambiguityScore 0.7-1.0: genuinamente ambiguo, needsClarify=true',
    '- needsClarify=true SOLO si no puedes determinar la tarea ni el servicio con confianza',
    '- saludos, presentaciones y "hola" son ambiguityScore=0.3, needsClarify=false',
    '</ambiguity_guide>',
    '',
    '<clarify_guide>',
    '- si needsClarify=true: clarifyQuestion debe ser UNA sola pregunta breve',
    '- clarifyOptions: 2-3 opciones <= 20 chars, ultima siempre { id: "btn_other", title: "Otro" } (ES) o "Другое" (RU)',
    '- si needsClarify=false: clarifyQuestion="" y clarifyOptions=[]',
    '</clarify_guide>',
    '',
    '<strict_json_schema>',
    JSON.stringify(CLASSIFIER_SCHEMA),
    '</strict_json_schema>',
    'Devuelve UNICAMENTE el JSON. Sin markdown ni texto adicional.',
  ].join('\n');
}

function buildClassifierUserPrompt(
  message: string,
  recentMessages: Array<{ role: string; text: string }>,
  contactStatus: 'lead' | 'client' | 'unknown',
  channel: KiaChannel,
): string {
  const context = recentMessages.slice(-3).map((m) => `[${m.role}]: ${m.text.slice(0, 200)}`).join('\n');
  return [
    `<contact_status>${contactStatus}</contact_status>`,
    `<channel>${channel}</channel>`,
    context ? `<recent_messages>\n${context}\n</recent_messages>` : '',
    `<current_message>${message}</current_message>`,
    'Clasifica la intencion del current_message.',
  ].filter(Boolean).join('\n');
}

function parseClassification(raw: string): KiaIntentClassification | null {
  try {
    const trimmed = raw.trim();
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    const parsed = JSON.parse(trimmed.slice(start, end + 1)) as Record<string, unknown>;

    if (!KIA_TASK_TYPES.includes(parsed.suggestedTaskType as KiaTaskType)) return null;
    if (!KIA_INTENTS.includes(parsed.detectedIntent as (typeof KIA_INTENTS)[number])) return null;
    if (typeof parsed.ambiguityScore !== 'number' || !Number.isFinite(parsed.ambiguityScore)
      || parsed.ambiguityScore < 0 || parsed.ambiguityScore > 1) return null;
    if (typeof parsed.needsClarify !== 'boolean') return null;
    if (typeof parsed.clarifyQuestion !== 'string') return null;
    if (!Array.isArray(parsed.clarifyOptions)) return null;
    if (parsed.detectedLanguage !== 'es' && parsed.detectedLanguage !== 'ru') return null;
    if (typeof parsed.confidence !== 'number' || !Number.isFinite(parsed.confidence)
      || parsed.confidence < 0 || parsed.confidence > 1) return null;

    const clarifyOptions = (parsed.clarifyOptions as unknown[]).map((option) => {
      if (!option || typeof option !== 'object' || Array.isArray(option)) return null;
      const item = option as Record<string, unknown>;
      if (typeof item.id !== 'string' || typeof item.title !== 'string') return null;
      if (!item.id.trim() || !item.title.trim() || item.title.length > 20) return null;
      return { id: item.id, title: item.title };
    });
    if (clarifyOptions.some((option) => option === null) || clarifyOptions.length > 3) return null;
    if (parsed.needsClarify) {
      if (!parsed.clarifyQuestion.trim() || clarifyOptions.length < 2) return null;
    } else if (parsed.clarifyQuestion !== '' || clarifyOptions.length !== 0) {
      return null;
    }

    return {
      suggestedTaskType: parsed.suggestedTaskType as KiaTaskType,
      detectedIntent: parsed.detectedIntent as (typeof KIA_INTENTS)[number],
      ambiguityScore: parsed.ambiguityScore,
      needsClarify: parsed.needsClarify,
      clarifyQuestion: parsed.clarifyQuestion,
      clarifyOptions: clarifyOptions as Array<{ id: string; title: string }>,
      detectedLanguage: parsed.detectedLanguage,
      confidence: parsed.confidence,
    };
  } catch {
    return null;
  }
}

export async function classifyKiaIntent(params: {
  message: string;
  recentMessages: Array<{ role: string; text: string }>;
  contactStatus: 'lead' | 'client' | 'unknown';
  channel: KiaChannel;
}): Promise<KiaIntentClassification | null> {
  const systemPrompt = buildClassifierSystemPrompt();
  const userPrompt = buildClassifierUserPrompt(
    params.message,
    params.recentMessages,
    params.contactStatus,
    params.channel,
  );

  try {
    const result = await runKiaProviderRequest({
      taskType: 'chat_reply',
      systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      responseSchema: CLASSIFIER_SCHEMA,
      effort: 'low',
      maxTokens: 300,
      temperature: 0,
    });
    if (result.error) {
      console.warn('[KiaIntentClassifier] provider pool failed', { error: result.error });
      return null;
    }
    if (result.parsedJson) {
      const parsed = parseClassification(JSON.stringify(result.parsedJson));
      if (parsed) return parsed;
    }
    return parseClassification(result.rawText ?? '');
  } catch (err) {
    console.warn('[KiaIntentClassifier] provider pool failed', { error: safeErrorMessage(err) });
    return null;
  }
}
