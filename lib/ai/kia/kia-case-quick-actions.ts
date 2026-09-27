import { caseStatusLabel, isCaseStatus } from '@/lib/cases/case-status';
import type { KiaContext } from './kia-context-builder';
import type { KiaCopilotArtifact } from './kia-copilot-artifacts';
import type { KiaToolResult } from './kia-tool-definitions';

export type KiaCaseQuickAction =
  | 'next_step'
  | 'documents'
  | 'status'
  | 'open_case'
  | 'human_review';

type CaseItem = KiaContext['cases'][number];

type CaseDocument = {
  id?: string;
  original_name?: string | null;
  title?: string | null;
  state?: string | null;
  checklist_item_label?: string | null;
  download_url?: string | null;
  case_url?: string | null;
};

function normalize(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[¿?¡!.,;:()"'«»]/g, ' ')
    .replace(/\s+/g, ' ');
}

export function detectKiaCaseQuickAction(message: string): KiaCaseQuickAction | null {
  const text = normalize(message);

  if (
    /^(ver|abrir) expediente(?: completo)?$/.test(text)
    || /^(открыть|показать) (дело|досье)( полностью)?$/u.test(text)
  ) return 'open_case';

  if (
    /(revision humana|revisar con (una )?persona|hablar con ksenia|pedir revision humana|consulta humana)/.test(text)
    || /(проверка специалистом|проверить с человеком|поговорить с ксенией|попросить проверку специалиста|консультация с человеком)/u.test(text)
  ) return 'human_review';

  if (
    /(documento pendiente|documentos faltan|documentos necesito|que documentos|ver documento|abrir documento|documentos pendientes)/.test(text)
    || /(какие документы|нужны документы|документ.*нуж|посмотреть документ|открыть документ|недоста.*документ)/u.test(text)
  ) return 'documents';

  if (
    /(siguiente paso|que hago ahora|que tengo que hacer ahora|que hacer ahora|ver siguiente paso)/.test(text)
    || /(что делать дальше|что сейчас нужно сделать|следующ.*шаг|что мне делать|что делать сейчас)/u.test(text)
  ) return 'next_step';

  if (
    /(comprobar estado|explica.*estado|estado del expediente|ver estado|status)/.test(text)
    || /(проверить статус|объясни статус|статус дела|статус expediente|текущ.*статус)/u.test(text)
  ) return 'status';

  return null;
}

function documentsFromToolResult(toolResult: KiaToolResult | null | undefined): CaseDocument[] {
  if (!toolResult?.ok || !Array.isArray(toolResult.result?.documents)) return [];
  return toolResult.result.documents as CaseDocument[];
}

function relevantDocument(documents: CaseDocument[]): CaseDocument | null {
  const active = documents.filter((doc) => doc.state !== 'rechazado');
  if (!active.length) return null;

  const explicitAction = active.find((doc) => {
    const haystack = [
      doc.title,
      doc.original_name,
      doc.checklist_item_label,
    ].filter(Boolean).join(' ').toLocaleLowerCase();
    return /(firma|firmar|signature|sign|подпис|страниц|page|pagina|correg|исправ)/iu.test(haystack)
      && doc.state === 'pendiente';
  });

  return explicitAction
    ?? active.find((doc) => doc.state === 'pendiente')
    ?? active[0]
    ?? null;
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
  document: CaseDocument | null,
  locale: 'es' | 'ru',
  staffPreview: boolean,
): KiaCopilotArtifact {
  const caseDocumentsUrl = staffPreview
    ? `/admin/expedientes/${caseItem.id}`
    : `/dashboard/expedientes/${caseItem.id}#documentos`;
  const title = document?.title
    ?? document?.checklist_item_label
    ?? document?.original_name
    ?? (locale === 'ru' ? 'Документы по текущему шагу' : 'Documentos del paso actual');

  return {
    type: 'link',
    title,
    url: document?.download_url || document?.case_url || caseDocumentsUrl,
    cta: document?.download_url
      ? (locale === 'ru' ? 'Открыть документ' : 'Abrir documento')
      : (locale === 'ru' ? 'Открыть документы дела' : 'Ver documentos del expediente'),
    tone: 'info',
  };
}

export function buildKiaCaseQuickActionPresentation(input: {
  action: KiaCaseQuickAction;
  locale: 'es' | 'ru';
  caseItem: CaseItem;
  documentToolResult?: KiaToolResult | null;
  staffPreview?: boolean;
}): { reply: string; artifacts: KiaCopilotArtifact[] } {
  const { action, locale, caseItem } = input;
  const ru = locale === 'ru';
  const staffPreview = Boolean(input.staffPreview);
  const documents = documentsFromToolResult(input.documentToolResult);
  const document = relevantDocument(documents);
  const artifacts: KiaCopilotArtifact[] = [];

  let reply: string;
  if (action === 'next_step') {
    reply = caseItem.nextAction
      ? (ru ? `Следующий шаг: ${caseItem.nextAction}` : `El siguiente paso es: ${caseItem.nextAction}`)
      : (ru
        ? 'Следующий шаг ещё не зарегистрирован. Откройте дело или запросите проверку специалистом.'
        : 'El siguiente paso todavía no está registrado. Puedes abrir el expediente o pedir una revisión humana.');
    if (document) artifacts.push(documentLink(caseItem, document, locale, staffPreview));
    artifacts.push(caseLink(caseItem, locale, staffPreview));
  } else if (action === 'documents') {
    if (document) {
      const name = document.title ?? document.checklist_item_label ?? document.original_name ?? '';
      reply = ru
        ? `Для текущего шага я нашла документ: ${name}. Ниже можно открыть его или перейти к документам дела.`
        : `Para el paso actual he localizado este documento: ${name}. Debajo puedes abrirlo o ir a los documentos del expediente.`;
    } else {
      reply = ru
        ? 'Я не вижу отдельного файла для текущего шага. Откройте раздел документов дела: там находится актуальная документация.'
        : 'No veo un archivo individual para el paso actual. Abre la sección de documentos del expediente para ver la documentación vigente.';
    }
    artifacts.push(documentLink(caseItem, document, locale, staffPreview));
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
