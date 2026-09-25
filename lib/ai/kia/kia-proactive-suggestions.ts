import type { KiaDecision } from './kia-output-schema';

export function buildKiaProactiveSuggestions(input: {
  locale: 'es' | 'ru';
  intent: KiaDecision['intent'];
  nextAction: KiaDecision['nextAction'];
  hasCase: boolean;
  hasCompany: boolean;
  pendingDocuments: number;
  existingQuickReplies?: string[];
}): string[] {
  const ru = input.locale === 'ru';
  let candidates: string[];

  if (input.intent === 'case_status' || input.hasCase) {
    candidates = ru
      ? ['Что делать дальше?', 'Какие документы нужны?', 'Объясни статус']
      : ['¿Qué hago ahora?', '¿Qué documentos faltan?', 'Explícame el estado'];
  } else if (input.intent === 'send_documents' || input.pendingDocuments > 0) {
    candidates = ru
      ? ['Что ещё нужно?', 'Как загрузить документ?', 'Проверь мои документы']
      : ['¿Qué más falta?', '¿Cómo subo un documento?', 'Revisa mis documentos'];
  } else if (input.intent === 'connect_holded' || input.intent === 'accounting_summary') {
    candidates = ru
      ? ['Проверь подключение', 'Что можно проверить?', 'Проведи по шагам']
      : ['Revisa la conexión', '¿Qué puedes comprobar?', 'Guíame paso a paso'];
  } else if (input.intent === 'checkout') {
    candidates = ru
      ? ['Что входит?', 'Что понадобится?', 'Проведи перед оплатой']
      : ['¿Qué incluye?', '¿Qué necesito?', 'Guíame antes de pagar'];
  } else if (input.intent === 'book_call') {
    candidates = ru
      ? ['Что подготовить?', 'Проверь документы', 'Объясни следующий шаг']
      : ['¿Qué preparo?', 'Revisa documentos', 'Explícame el siguiente paso'];
  } else if (input.hasCompany) {
    candidates = ru
      ? ['Что ещё проверить?', 'Покажи мои задачи', 'Проведи по шагам']
      : ['¿Qué más revisamos?', 'Enséñame mis tareas', 'Guíame paso a paso'];
  } else {
    candidates = ru
      ? ['Что ты можешь проверить?', 'Покажи мои варианты', 'Проведи по шагам']
      : ['¿Qué puedes revisar?', 'Enséñame mis opciones', 'Guíame paso a paso'];
  }

  const existing = new Set((input.existingQuickReplies ?? []).map((item) => item.trim().toLocaleLowerCase(input.locale === 'ru' ? 'ru' : 'es')));
  return candidates
    .filter((item) => !existing.has(item.trim().toLocaleLowerCase(input.locale === 'ru' ? 'ru' : 'es')))
    .slice(0, 3);
}
