'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Download, FileText, Loader2, Send, Trash2, Upload } from 'lucide-react';

type Locale = 'es' | 'ru';

type DocumentRow = {
  id: string;
  original_name: string;
  state: string;
  created_at: string;
  uploaded_by_role?: string;
  checklist_item_key?: string | null;
  checklist_item_label?: string | null;
  client_comment?: string | null;
};

type NoteRow = {
  id: string;
  item_key: string;
  item_label: string;
  comment: string | null;
  updated_at: string;
};

const COPY = {
  es: {
    title: 'Documentación del expediente',
    subtitle: 'Revisa cada punto y aporta lo que tengas disponible. No vuelvas a subir documentos que EXPERT ya tenga; si algo está pendiente o no aplica, explícalo en el comentario.',
    optional: 'Aporta si procede',
    comment: 'Comentario o explicación',
    commentPlaceholder: 'Ej.: este documento no aplica, lo tengo pendiente, lo adjunto en otro archivo...',
    saveComment: 'Guardar comentario',
    saved: 'Guardado',
    upload: 'Subir archivo',
    uploading: 'Subiendo...',
    noDocs: 'Sin archivos vinculados a este punto.',
    generalDocs: 'Otros documentos',
    sendReview: 'Enviar documentos a revisión',
    sendingReview: 'Enviando...',
    readyHint: 'Cuando hayas aportado todo lo disponible, avisa al equipo para iniciar la revisión.',
    additionalHint: 'Si has añadido nuevos documentos durante la revisión, avisa al equipo. Esto no reinicia ni retrocede el expediente.',
    sendAdditional: 'Avisar de documentos adicionales',
    sentOk: 'Documentación enviada a revisión.',
    sentAdditionalOk: 'El equipo ha sido avisado de la documentación adicional.',
    deleteConfirm: '¿Eliminar este documento? Esta acción no se puede deshacer.',
    uploadError: 'Error al subir el archivo.',
    saveError: 'No se pudo guardar el comentario.',
    reviewError: 'No se pudo enviar a revisión.',
    downloadError: 'Error al descargar.',
    deleteError: 'Error al eliminar.',
  },
  ru: {
    title: 'Документы по expediente',
    subtitle: 'Проверьте каждый пункт и приложите имеющиеся документы. Не загружайте повторно то, что уже есть у EXPERT; если документ ожидается или не относится к Вашей ситуации, укажите это в комментарии.',
    optional: 'Приложить при наличии',
    comment: 'Комментарий / пояснение',
    commentPlaceholder: 'Например: этот документ не относится к нашей ситуации, документ в процессе, файл приложен в другом пункте...',
    saveComment: 'Сохранить комментарий',
    saved: 'Сохранено',
    upload: 'Загрузить файл',
    uploading: 'Загружаем...',
    noDocs: 'К этому пункту пока нет файлов.',
    generalDocs: 'Другие документы',
    sendReview: 'Отправить документы на проверку',
    sendingReview: 'Отправляем...',
    readyHint: 'Когда приложите всё доступное, сообщите команде, что документы готовы к проверке.',
    additionalHint: 'Если во время проверки Вы добавили новые документы, сообщите об этом команде. Это не перезапускает и не откатывает expediente.',
    sendAdditional: 'Сообщить о дополнительных документах',
    sentOk: 'Документы отправлены на проверку.',
    sentAdditionalOk: 'Команда получила уведомление о дополнительных документах.',
    deleteConfirm: 'Удалить этот документ? Это действие нельзя отменить.',
    uploadError: 'Не удалось загрузить файл.',
    saveError: 'Не удалось сохранить комментарий.',
    reviewError: 'Не удалось отправить на проверку.',
    downloadError: 'Ошибка при скачивании.',
    deleteError: 'Ошибка при удалении.',
  },
} as const;

function itemKey(label: string, index: number) {
  return `${index + 1}-${label}`
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 140) || `item-${index + 1}`;
}

const STATE_LABELS: Record<string, Record<Locale, string>> = {
  pendiente: { es: 'En revisión', ru: 'На проверке' },
  revisado: { es: 'Aprobado', ru: 'Принято' },
  rechazado: { es: 'Rechazado', ru: 'Отклонено' },
};

export function CaseDocumentChecklist({
  caseId,
  checklist,
  documents,
  notes,
  locale = 'es',
  reviewMode = 'initial',
}: {
  caseId: string;
  checklist: string[];
  documents: DocumentRow[];
  notes: NoteRow[];
  locale?: Locale;
  reviewMode?: 'initial' | 'additional' | 'closed';
}) {
  const router = useRouter();
  const t = COPY[locale];
  const [comments, setComments] = useState<Record<string, string>>(() => {
    const fromNotes = Object.fromEntries(notes.map((n) => [n.item_key, n.comment ?? '']));
    for (const doc of documents) {
      if (doc.checklist_item_key && doc.client_comment && fromNotes[doc.checklist_item_key] === undefined) {
        fromNotes[doc.checklist_item_key] = doc.client_comment;
      }
    }
    return fromNotes;
  });
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const items = useMemo(() => checklist.map((label, index) => ({ label, key: itemKey(label, index), index })), [checklist]);
  const assignedKeys = new Set(items.map((i) => i.key));
  const unassignedDocs = documents.filter((doc) => !doc.checklist_item_key || !assignedKeys.has(doc.checklist_item_key));

  async function uploadForItem(key: string, label: string, file: File | undefined) {
    if (!file) return;
    setBusyKey(key);
    setMessage(null);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('checklistItemKey', key);
    formData.append('checklistItemLabel', label);
    formData.append('clientComment', comments[key] ?? '');

    try {
      const res = await fetch(`/api/cases/${caseId}/documents`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t.uploadError);
      router.refresh();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : t.uploadError });
    } finally {
      setBusyKey(null);
      if (inputRefs.current[key]) inputRefs.current[key]!.value = '';
    }
  }

  async function saveComment(key: string, label: string) {
    setSavingKey(key);
    setMessage(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/document-notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemKey: key, itemLabel: label, comment: comments[key] ?? '' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t.saveError);
      setMessage({ type: 'ok', text: t.saved });
      router.refresh();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : t.saveError });
    } finally {
      setSavingKey(null);
    }
  }

  async function downloadDoc(doc: DocumentRow) {
    setDownloadingId(doc.id);
    setMessage(null);
    try {
      const res = await fetch(`/api/documents/${doc.id}/download`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t.downloadError);
      const a = document.createElement('a');
      a.href = data.url;
      a.download = doc.original_name;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.click();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : t.downloadError });
    } finally {
      setDownloadingId(null);
    }
  }

  async function deleteDoc(doc: DocumentRow) {
    if (!confirm(t.deleteConfirm)) return;
    setDeletingId(doc.id);
    setMessage(null);
    try {
      const res = await fetch(`/api/documents/${doc.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t.deleteError);
      router.refresh();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : t.deleteError });
    } finally {
      setDeletingId(null);
    }
  }

  async function submitForReview() {
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/document-review`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t.reviewError);
      setMessage({ type: 'ok', text: reviewMode === 'additional' ? t.sentAdditionalOk : t.sentOk });
      router.refresh();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : t.reviewError });
    } finally {
      setSubmitting(false);
    }
  }

  const renderDocs = (docs: DocumentRow[]) => docs.length === 0 ? (
    <p className="rounded-lg border border-dashed border-[#d8cbb5] px-3 py-3 text-xs text-[#29384a]/70">{t.noDocs}</p>
  ) : (
    <div className="space-y-2">
      {docs.map((doc) => {
        const stateLabel = STATE_LABELS[doc.state]?.[locale] ?? doc.state;
        return (
          <div key={doc.id} className="flex flex-col gap-2 rounded-xl border border-[#d8cbb5] bg-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#07111d]">{doc.original_name}</p>
              <p className="text-[11px] text-[#29384a]/60">
                {new Date(doc.created_at).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'es-ES')} · {stateLabel}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => downloadDoc(doc)} disabled={downloadingId === doc.id} className="inline-flex items-center gap-1 rounded-lg border border-[#d8cbb5] px-2.5 py-1.5 text-xs font-semibold text-[#29384a] hover:border-[#c88b25] disabled:opacity-50">
                {downloadingId === doc.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              </button>
              <button type="button" onClick={() => deleteDoc(doc)} disabled={deletingId === doc.id} className="inline-flex items-center gap-1 rounded-lg border border-red-100 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">
                {deletingId === doc.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <section className="rounded-2xl border border-[#d8cbb5] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-[#07111d]"><FileText className="h-4 w-4 text-[#c88b25]" /> {t.title}</h2>
          <p className="mt-1 text-sm text-[#29384a]">{t.subtitle}</p>
        </div>
        <span className="shrink-0 rounded-full bg-[#f8f4eb] px-3 py-1 text-xs font-semibold text-[#29384a]">{documents.length}</span>
      </div>

      {message && (
        <div className={`mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${message.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.type === 'ok' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        {items.map((item) => {
          const docs = documents.filter((doc) => doc.checklist_item_key === item.key);
          return (
            <div key={item.key} className="rounded-2xl border border-[#f0e8d8] bg-[#f8f4eb] p-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#d7a33a]/15 text-xs font-bold text-[#c88b25]">{item.index + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start gap-2">
                    <p className="flex-1 text-sm font-semibold text-[#07111d]">{item.label}</p>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#29384a]/60">{t.optional}</span>
                  </div>
                  <label className="mt-3 block">
                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#29384a]/60">{t.comment}</span>
                    <textarea
                      value={comments[item.key] ?? ''}
                      onChange={(e) => setComments((prev) => ({ ...prev, [item.key]: e.target.value }))}
                      placeholder={t.commentPlaceholder}
                      className="min-h-20 w-full rounded-xl border border-[#d8cbb5] bg-white px-3 py-2 text-sm text-[#07111d] outline-none focus:border-[#c88b25]"
                    />
                  </label>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={() => saveComment(item.key, item.label)} disabled={savingKey === item.key} className="inline-flex items-center gap-2 rounded-full border border-[#d8cbb5] bg-white px-4 py-2 text-xs font-bold text-[#07111d] hover:border-[#c88b25] disabled:opacity-50">
                      {savingKey === item.key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                      {t.saveComment}
                    </button>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#c88b25] px-4 py-2 text-xs font-bold text-[#061321] hover:bg-[#b57a1e]">
                      {busyKey === item.key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                      {busyKey === item.key ? t.uploading : t.upload}
                      <input
                        ref={(node) => { inputRefs.current[item.key] = node; }}
                        type="file"
                        className="hidden"
                        disabled={busyKey === item.key}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
                        onChange={(e) => uploadForItem(item.key, item.label, e.target.files?.[0])}
                      />
                    </label>
                  </div>
                  <div className="mt-3">{renderDocs(docs)}</div>
                </div>
              </div>
            </div>
          );
        })}

        {unassignedDocs.length > 0 && (
          <div className="rounded-2xl border border-[#f0e8d8] bg-[#f8f4eb] p-4">
            <p className="mb-3 text-sm font-semibold text-[#07111d]">{t.generalDocs}</p>
            {renderDocs(unassignedDocs)}
          </div>
        )}
      </div>

      {reviewMode !== 'closed' && (
        <div className="mt-5 rounded-2xl border border-[#d8cbb5] bg-[#f8f4eb] p-4">
          <p className="mb-3 text-sm text-[#29384a]">{reviewMode === 'additional' ? t.additionalHint : t.readyHint}</p>
          <button type="button" onClick={submitForReview} disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#07111d] px-5 py-3 text-sm font-bold text-white hover:bg-[#142033] disabled:opacity-60 sm:w-auto">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {submitting ? t.sendingReview : reviewMode === 'additional' ? t.sendAdditional : t.sendReview}
          </button>
        </div>
      )}
    </section>
  );
}
