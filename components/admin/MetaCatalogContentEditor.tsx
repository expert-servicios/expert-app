'use client';

import NextImage from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  ImageIcon,
  Loader2,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

type Locale = 'es' | 'ru';
type ContentStatus = 'draft' | 'active' | 'paused' | 'retired';

type ApiContentRow = {
  locale: Locale;
  name: string;
  short_description: string | null;
  description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  landing_path: string;
  image_url: string | null;
  status: ContentStatus;
  updated_at: string;
};

type FormState = {
  locale: Locale;
  name: string;
  shortDescription: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  landingPath: string;
  imageUrl: string;
  status: ContentStatus;
};

type Payload = {
  service: {
    id: string;
    slug: string;
    category_key: string;
    status: string;
  };
  contents: ApiContentRow[];
};

type UploadedImageResponse = {
  ok?: boolean;
  error?: string;
  publicUrl?: string;
  storagePath?: string;
  contentType?: string;
  size?: number;
};

type ImageInspection = {
  width: number;
  height: number;
  warning: string | null;
};

function fromRow(row: ApiContentRow): FormState {
  return {
    locale: row.locale,
    name: row.name,
    shortDescription: row.short_description ?? '',
    description: row.description ?? '',
    metaTitle: row.meta_title ?? '',
    metaDescription: row.meta_description ?? '',
    landingPath: row.landing_path,
    imageUrl: row.image_url ?? '',
    status: row.status,
  };
}

function emptyRu(es?: ApiContentRow): FormState {
  return {
    locale: 'ru',
    name: '',
    shortDescription: '',
    description: '',
    metaTitle: '',
    metaDescription: '',
    landingPath: es?.landing_path ?? '/servicios',
    imageUrl: es?.image_url ?? '',
    status: 'draft',
  };
}

async function inspectImageFile(file: File): Promise<ImageInspection> {
  const bitmap = await createImageBitmap(file);
  const width = bitmap.width;
  const height = bitmap.height;
  bitmap.close();

  if (width < 500 || height < 500) {
    throw new Error('La imagen debe tener al menos 500 × 500 px.');
  }

  const ratio = width / height;
  const warning = ratio < 0.8 || ratio > 1.25
    ? 'La imagen es válida, pero para Meta recomendamos una creatividad más cercana a formato cuadrado.'
    : null;

  return { width, height, warning };
}

export function MetaCatalogContentEditor({
  retailerId,
  onClose,
  onSaved,
}: {
  retailerId: string | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [payload, setPayload] = useState<Payload | null>(null);
  const [locale, setLocale] = useState<Locale>('es');
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [draggingImage, setDraggingImage] = useState(false);
  const [imageInspection, setImageInspection] = useState<ImageInspection | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!retailerId) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/meta/catalog/${encodeURIComponent(retailerId)}/content`, {
        cache: 'no-store',
      });
      const data = await response.json() as Payload & { error?: string };
      if (!response.ok) throw new Error(data.error ?? 'No se pudo cargar el contenido');
      setPayload(data);
      const es = data.contents.find((item) => item.locale === 'es');
      const initial = locale === 'ru'
        ? data.contents.find((item) => item.locale === 'ru')
        : es;
      setForm(initial ? fromRow(initial) : locale === 'ru' ? emptyRu(es) : null);
      setImageInspection(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cargar el contenido');
    } finally {
      setLoading(false);
    }
  }, [locale, retailerId]);

  useEffect(() => {
    if (!retailerId) {
      setPayload(null);
      setForm(null);
      return;
    }
    void load();
  }, [load, retailerId]);

  const switchLocale = (nextLocale: Locale) => {
    setLocale(nextLocale);
    if (!payload) return;
    const existing = payload.contents.find((item) => item.locale === nextLocale);
    const es = payload.contents.find((item) => item.locale === 'es');
    setForm(existing ? fromRow(existing) : nextLocale === 'ru' ? emptyRu(es) : null);
    setImageInspection(null);
    setMessage(null);
    setError(null);
  };

  const completeness = useMemo(() => {
    if (!form) return 0;
    const required = [form.name, form.shortDescription, form.description, form.landingPath, form.imageUrl];
    return Math.round((required.filter((value) => value.trim().length > 0).length / required.length) * 100);
  }, [form]);

  const esImageUrl = payload?.contents.find((item) => item.locale === 'es')?.image_url ?? '';
  const sharesEsImage = locale === 'ru' && Boolean(form?.imageUrl && esImageUrl && form.imageUrl === esImageUrl);

  const uploadImage = async (file: File) => {
    if (!retailerId || !form) return;
    setUploadingImage(true);
    setError(null);
    setMessage(null);
    try {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        throw new Error('Usa una imagen JPG, PNG o WEBP.');
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('La imagen no puede superar 5 MB.');
      }

      const inspection = await inspectImageFile(file);
      setImageInspection(inspection);

      const body = new FormData();
      body.set('file', file);
      body.set('locale', form.locale);

      const response = await fetch(
        `/api/admin/meta/catalog/${encodeURIComponent(retailerId)}/image`,
        { method: 'POST', body },
      );
      const data = await response.json() as UploadedImageResponse;
      if (!response.ok || !data.publicUrl) {
        throw new Error(data.error ?? 'No se pudo subir la imagen');
      }

      setForm({ ...form, imageUrl: data.publicUrl });
      setMessage('Imagen subida. Pulsa Guardar para asociarla a esta ficha.');
    } catch (cause) {
      setImageInspection(null);
      setError(cause instanceof Error ? cause.message : 'No se pudo subir la imagen');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const save = async () => {
    if (!retailerId || !form) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch(`/api/admin/meta/catalog/${encodeURIComponent(retailerId)}/content`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale: form.locale,
          name: form.name,
          shortDescription: form.shortDescription.trim() || null,
          description: form.description.trim() || null,
          metaTitle: form.metaTitle.trim() || null,
          metaDescription: form.metaDescription.trim() || null,
          landingPath: form.landingPath,
          imageUrl: form.imageUrl.trim() || null,
          status: form.status,
        }),
      });

      const data = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok) throw new Error(data.error ?? 'No se pudo guardar');

      setMessage('Contenido e imagen guardados');
      await onSaved();
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  if (!retailerId) return null;

  return (
    <div className="fixed inset-0 z-[90] flex justify-end bg-black/30" role="presentation" onClick={onClose}>
      <aside
        className="flex h-full w-full max-w-2xl flex-col bg-[#f7f3eb] shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Editar contenido del catálogo"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between border-b border-[#ddd3c2] bg-white px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#c88b25]">Contenido del servicio</p>
            <h2 className="mt-1 truncate font-serif text-xl font-bold text-[#07111d]">{payload?.service.slug ?? retailerId}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-[#69717d] hover:bg-[#f7f3eb]" aria-label="Cerrar editor">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="border-b border-[#ddd3c2] bg-white px-5 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex rounded-lg bg-[#f7f3eb] p-1">
              {(['es', 'ru'] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => switchLocale(item)}
                  className={`rounded-md px-4 py-2 text-xs font-bold uppercase ${locale === item ? 'bg-[#07111d] text-white' : 'text-[#69717d]'}`}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase text-[#7b8490]">Completitud</p>
              <p className={`text-sm font-bold ${completeness === 100 ? 'text-green-700' : 'text-[#07111d]'}`}>{completeness}%</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex h-40 items-center justify-center text-sm text-[#69717d]">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando…
            </div>
          ) : error && !form ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
          ) : form ? (
            <div className="space-y-4">
              {locale === 'ru' && !payload?.contents.some((item) => item.locale === 'ru') ? (
                <div className="rounded-xl border border-[#ead9b7] bg-[#fff9eb] p-3 text-xs text-[#7a5313]">
                  Nuevo borrador RU. Landing e imagen se heredan inicialmente de ES; revisa los textos antes de activar.
                </div>
              ) : null}

              <div>
                <label className="text-xs font-bold text-[#374151]">Nombre</label>
                <input
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-[#d8cbb5] bg-white px-3 py-2 text-sm outline-none focus:border-[#c88b25]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#374151]">Descripción corta</label>
                <textarea
                  value={form.shortDescription}
                  onChange={(event) => setForm({ ...form, shortDescription: event.target.value })}
                  rows={3}
                  className="mt-1 w-full resize-y rounded-lg border border-[#d8cbb5] bg-white px-3 py-2 text-sm outline-none focus:border-[#c88b25]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#374151]">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  rows={7}
                  className="mt-1 w-full resize-y rounded-lg border border-[#d8cbb5] bg-white px-3 py-2 text-sm outline-none focus:border-[#c88b25]"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-[#374151]">Meta title</label>
                  <input
                    value={form.metaTitle}
                    onChange={(event) => setForm({ ...form, metaTitle: event.target.value })}
                    className="mt-1 w-full rounded-lg border border-[#d8cbb5] bg-white px-3 py-2 text-sm outline-none focus:border-[#c88b25]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#374151]">Estado</label>
                  <select
                    value={form.status}
                    onChange={(event) => setForm({ ...form, status: event.target.value as ContentStatus })}
                    className="mt-1 w-full rounded-lg border border-[#d8cbb5] bg-white px-3 py-2 text-sm"
                  >
                    <option value="draft">Borrador</option>
                    <option value="active">Activo</option>
                    <option value="paused">Pausado</option>
                    <option value="retired">Retirado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#374151]">Meta description</label>
                <textarea
                  value={form.metaDescription}
                  onChange={(event) => setForm({ ...form, metaDescription: event.target.value })}
                  rows={2}
                  className="mt-1 w-full resize-y rounded-lg border border-[#d8cbb5] bg-white px-3 py-2 text-sm outline-none focus:border-[#c88b25]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#374151]">Landing path</label>
                <input
                  value={form.landingPath}
                  onChange={(event) => setForm({ ...form, landingPath: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-[#d8cbb5] bg-white px-3 py-2 font-mono text-xs outline-none focus:border-[#c88b25]"
                />
              </div>

              <section>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#374151]">Imagen de catálogo</label>
                    <p className="mt-0.5 text-[10px] text-[#7b8490]">JPG, PNG o WEBP · máximo 5 MB · mínimo 500 × 500 px.</p>
                  </div>
                  {sharesEsImage ? (
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">Compartida con ES</span>
                  ) : null}
                </div>

                <div
                  className={`mt-2 rounded-xl border-2 border-dashed p-3 transition ${draggingImage ? 'border-[#c88b25] bg-[#fff9eb]' : 'border-[#d8cbb5] bg-white'}`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDraggingImage(true);
                  }}
                  onDragLeave={() => setDraggingImage(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDraggingImage(false);
                    const file = event.dataTransfer.files?.[0];
                    if (file) void uploadImage(file);
                  }}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative flex h-32 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#eee6d8] bg-[#f7f3eb] sm:w-32">
                      {form.imageUrl ? (
                        <NextImage
                          src={form.imageUrl}
                          alt={form.name || 'Vista previa'}
                          fill
                          sizes="128px"
                          className="object-contain"
                        />
                      ) : (
                        <ImageIcon className="h-7 w-7 text-[#a7adb5]" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) void uploadImage(file);
                        }}
                      />

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingImage}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#07111d] px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
                        >
                          {uploadingImage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                          {form.imageUrl ? 'Sustituir imagen' : 'Subir imagen'}
                        </button>

                        {locale === 'ru' && esImageUrl && form.imageUrl !== esImageUrl ? (
                          <button
                            type="button"
                            onClick={() => {
                              setForm({ ...form, imageUrl: esImageUrl });
                              setImageInspection(null);
                              setMessage('Imagen ES seleccionada para RU. Pulsa Guardar.');
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8cbb5] bg-white px-3 py-2 text-xs font-bold text-[#374151]"
                          >
                            <Copy className="h-3.5 w-3.5" /> Usar imagen ES
                          </button>
                        ) : null}

                        {form.imageUrl ? (
                          <button
                            type="button"
                            onClick={() => {
                              setForm({ ...form, imageUrl: '' });
                              setImageInspection(null);
                              setMessage('Imagen retirada de la ficha. Pulsa Guardar para confirmar.');
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Quitar
                          </button>
                        ) : null}
                      </div>

                      <p className="mt-2 text-[10px] text-[#7b8490]">
                        También puedes arrastrar una imagen aquí. Para creatividades con texto, usa una imagen específica por idioma.
                      </p>

                      {imageInspection ? (
                        <div className="mt-2 rounded-lg bg-[#f7f3eb] p-2 text-[10px] text-[#5b6470]">
                          {imageInspection.width} × {imageInspection.height} px
                          {imageInspection.warning ? (
                            <p className="mt-1 font-semibold text-amber-800">{imageInspection.warning}</p>
                          ) : (
                            <p className="mt-1 font-semibold text-green-700">Formato visual adecuado para catálogo.</p>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                <details className="mt-2">
                  <summary className="cursor-pointer text-[10px] font-semibold text-[#69717d]">URL avanzada</summary>
                  <input
                    value={form.imageUrl}
                    onChange={(event) => {
                      setForm({ ...form, imageUrl: event.target.value });
                      setImageInspection(null);
                    }}
                    placeholder="https://…"
                    className="mt-2 w-full rounded-lg border border-[#d8cbb5] bg-white px-3 py-2 font-mono text-xs outline-none focus:border-[#c88b25]"
                  />
                </details>
              </section>

              {message ? (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-xs font-semibold text-green-800">
                  <CheckCircle2 className="h-4 w-4" /> {message}
                </div>
              ) : null}
              {error ? (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-800">
                  <AlertTriangle className="h-4 w-4" /> {error}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-[#ddd3c2] bg-white px-5 py-4">
          <p className="text-[10px] text-[#7b8490]">Los cambios se guardan en service_contents, fuente canónica.</p>
          <button
            type="button"
            onClick={() => void save()}
            disabled={!form || saving || uploadingImage || !form.name.trim() || !form.landingPath.startsWith('/')}
            className="inline-flex items-center gap-2 rounded-lg bg-[#c88b25] px-4 py-2 text-xs font-bold text-[#07111d] disabled:opacity-40"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar
          </button>
        </footer>
      </aside>
    </div>
  );
}
