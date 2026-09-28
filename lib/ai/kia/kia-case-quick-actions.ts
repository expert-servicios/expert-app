import { caseStatusLabel, isCaseStatus } from '@/lib/cases/case-status';
import type { KiaContext } from './kia-context-builder';
import type { KiaCopilotArtifact } from './kia-copilot-artifacts';
import type { KiaToolResult } from './kia-tool-definitions';
import { detectKiaMessageLocale } from './kia-locale';

export type KiaCaseQuickAction =
  | 'next_step'
  | 'documents'
  | 'status'
  | 'open_case'
  | 'human_review';


export function buildKiaCaseQuickActionSuggestions(
  action: KiaCaseQuickAction,
  locale: 'es' | 'ru',
): string[] {
  const ru = locale === 'ru';
  const byAction: Record<KiaCaseQuickAction, string[]> = {
    next_step: ru
      ? ['Открыть дело', 'Посмотреть документ', 'Проверка специалистом']
      : ['Abrir expediente', 'Ver documento', 'Revisión humana'],
    documents: ru
      ? ['Открыть дело', 'Что делать дальше?', 'Проверка специалистом']
      : ['Abrir expediente', '¿Qué hago ahora?', 'Revisión humana'],
    status: ru
      ? ['Что делать дальше?', 'Какие документы нужны?', 'Открыть дело']
      : ['¿Qué hago ahora?', '¿Qué documentos faltan?', 'Abrir expediente'],
    open_case: ru
      ? ['Что делать дальше?', 'Какие документы нужны?', 'Проверка специалистом']
      : ['¿Qué hago ahora?', '¿Qué documentos faltan?', 'Revisión humana'],
    human_review: ru
      ? ['Открыть дело', 'Что делать дальше?', 'Какие документы нужны?']
      : ['Abrir expediente', '¿Qué hago ahora?', '¿Qué documentos faltan?'],
  };
  return byAction[action];
}

type CaseItem = KiaContext['cases'][number];

function normalize(value: string): string {
  const lower = value.trim().toLocaleLowerCase();
  return (/[\u0400-\u04ff]/u.test(lower) ? lower : lower.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
    .replace(/[¿?¡!.,;:()"'«»]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function detectKiaCaseQuickAction(message: string): KiaCaseQuickAction | null {
  const text = normalize(message);

  if (
    /^(ver|abrir) expediente(?: completo)?$/.test(text)
    || /^(открыть|показать) (дело|досье)( полностью)?$/u.test(text)
  ) return 'open_case';

  if (
    /^(revision humana|revisar con (una )?persona|hablar con ksenia|pedir revision humana|consulta humana)$/.test(text)
    || /^(проверка специалистом|проверить с человеком|поговорить с ксенией|попросить проверку специалиста|консультация с человеком)$/u.test(text)
  ) return 'human_review';

  if (
    /^(que documentos faltan|que documentos necesito|documentos faltan|documentos pendientes|ver documento|abrir documento)$/.test(text)
    || /^(какие документы нужны|посмотреть документ|открыть документ|каких документов не хватает)$/u.test(text)
  ) return 'documents';

  if (
    /^(siguiente paso|que hago ahora|que tengo que hacer ahora|que hacer ahora|ver siguiente paso)$/.test(text)
    || /^(что делать дальше|что сейчас нужно сделать|следующий шаг|что мне делать|что делать сейчас)$/u.test(text)
  ) return 'next_step';

  if (
    /^(comprobar estado|explica el estado|estado del expediente|ver estado|status)$/.test(text)
    || /^(проверить статус|объясни статус|статус дела|текущий статус)$/u.test(text)
  ) return 'status';

  return null;
}

function localizedStatus(caseItem: CaseItem, locale: 'es' | 'ru'): string {
  return isCaseStatus(caseItem.status)
    ? caseStatusLabel(caseItem.status, locale)
    : caseItem.status.replaceAll('_', ' ');
}

function caseLink(caseItem: CaseItem, locale: 'es' | 'ru', staffPreview: boolean): KiaCopilotArtifact {
  return {
    type: 'link',
    title: locale === 'ru' ? 'Полное дело' : 'Expediente completo',
    url: staffPreview ? `/admin/expedientes/${caseItem.id}` : `/dashboard/expedientes/${caseItem.id}`,
    cta: locale === 'ru' ? 'Открыть дело' : 'Abrir expediente',
    tone: 'info',
  };
}

function humanReviewLink(locale: 'es' | 'ru'): KiaCopilotArtifact {
  return {
    type: 'link',
    title: locale === 'ru' ? 'Проверка специалистом EXPERT' : 'Revisión humana por EXPERT',
    url: '/cita?tipo=consulta-inicial',
    cta: locale === 'ru' ? 'Записаться бесплатно · 15 мин' : 'Reservar gratis · 15 min',
    tone: 'info',
  };
}

function documentLink(
  caseItem: CaseItem,
  locale: 'es' | 'ru',
  staffPreview: boolean,
): KiaCopilotArtifact {
  const caseDocumentsUrl = staffPreview
    ? `/admin/expedientes/${caseItem.id}#documentos`
    : `/dashboard/expedientes/${caseItem.id}#documentos`;
  return {
    type: 'link',
    title: locale === 'ru' ? 'Документы дела' : 'Documentos del expediente',
    url: caseDocumentsUrl,
    cta: locale === 'ru' ? 'Открыть документы дела' : 'Ver documentos del expediente',
    tone: 'info',
  };
}

export function buildKiaCaseQuickActionPresentation(input: {
  action: KiaCaseQuickAction;
  locale: 'es' | 'ru';
  caseItem: CaseItem;
  documentToolResult?: KiaToolResult | null;
  staffPreview?: boolean;
}): { reply: string; artifacts: KiaCopilotArtifact[] } | null {
  const { action, locale, caseItem } = input;
  const ru = locale === 'ru';
  const staffPreview = Boolean(input.staffPreview);
  // A failed or disabled lookup cannot be described as an empty checklist.
  if (action === 'documents' && (!input.documentToolResult?.ok
    || input.documentToolResult.result?.checklist_available !== true
    || !Array.isArray(input.documentToolResult.result?.missing_requirements))) return null;
  const artifacts: KiaCopilotArtifact[] = [];

  let reply: string;
  if (action === 'next_step') {
    const nextAction = caseItem.nextAction && (ru
      ? detectKiaMessageLocale(caseItem.nextAction) === 'ru'
      : detectKiaMessageLocale(caseItem.nextAction) !== 'ru')
      ? caseItem.nextAction : null;
    reply = nextAction
      ? (ru ? `Следующий шаг: ${nextAction}` : `El siguiente paso es: ${nextAction}`)
      : caseItem.nextAction && ru
        ? 'Следующий шаг указан в деле. Откройте его или запросите пояснение у специалиста на русском языке.'
      : (ru
        ? 'Следующий шаг ещё не зарегистрирован. Откройте дело или запросите проверку специалистом.'
        : 'El siguiente paso todavía no está registrado. Puedes abrir el expediente o pedir una revisión humana.');
    artifacts.push(caseLink(caseItem, locale, staffPreview));
  } else if (action === 'documents') {
    const missing = input.documentToolResult!.result!.missing_requirements as string[];
    reply = missing.length
      ? (ru ? `В деле пока нет действующего файла, связанного с пунктами чек-листа: ${missing.join('; ')}. Если документ уже у EXPERT или пункт не относится к Вам, укажите это в деле.`
        : `No hay archivo vigente vinculado a estos puntos del checklist: ${missing.join('; ')}. Si EXPERT ya tiene el documento o no procede, indícalo en el expediente.`)
      : (ru ? 'По текущему чек-листу нет пунктов без документа. Команда проверит уже загруженные файлы.'
        : 'No hay puntos sin documento en el checklist actual. El equipo revisará los archivos ya aportados.');
    artifacts.push(documentLink(caseItem, locale, staffPreview));
    artifacts.push(caseLink(caseItem, locale, staffPreview));
  } else if (action === 'status') {
    reply = ru
      ? `Сейчас по делу: ${localizedStatus(caseItem, locale)}.`
      : `Ahora mismo el expediente está así: ${localizedStatus(caseItem, locale)}.`;
    artifacts.push(caseLink(caseItem, locale, staffPreview));
  } else if (action === 'open_case') {
    reply = ru
      ? 'Открываю полное дело: статус, документы, сообщения и история находятся по ссылке ниже.'
      : 'Aquí tienes el expediente completo con estado, documentos, mensajes e historial.';
    artifacts.push(caseLink(caseItem, locale, staffPreview));
  } else {
    reply = ru
      ? 'Если хотите, специалист EXPERT может лично проверить дело. Это бесплатная информационная встреча на 15 минут.'
      : 'Si quieres, una persona del equipo EXPERT puede revisar el caso contigo. La reunión informativa de 15 minutos es gratuita.';
    artifacts.push(humanReviewLink(locale));
    artifacts.push(caseLink(caseItem, locale, staffPreview));
  }

  if (action !== 'human_review') {
    artifacts.push(humanReviewLink(locale));
  }

  return { reply, artifacts: artifacts.slice(0, 3) };
}
