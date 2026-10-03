import { randomUUID } from 'crypto';

export const CLIENT_DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;
export const TENANT_DOCUMENT_MAX_BYTES = 20 * 1024 * 1024;

type AllowedUploadType = {
  extensions: readonly string[];
  mimes: readonly string[];
  contentType: string;
};

const ALLOWED_CLIENT_DOCUMENT_TYPES: readonly AllowedUploadType[] = [
  { extensions: ['pdf'], mimes: ['application/pdf'], contentType: 'application/pdf' },
  { extensions: ['jpg', 'jpeg'], mimes: ['image/jpeg'], contentType: 'image/jpeg' },
  { extensions: ['png'], mimes: ['image/png'], contentType: 'image/png' },
  { extensions: ['webp'], mimes: ['image/webp'], contentType: 'image/webp' },
  { extensions: ['heic'], mimes: ['image/heic', 'image/heif'], contentType: 'image/heic' },
  { extensions: ['doc'], mimes: ['application/msword'], contentType: 'application/msword' },
  {
    extensions: ['docx'],
    mimes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },
  { extensions: ['xls'], mimes: ['application/vnd.ms-excel'], contentType: 'application/vnd.ms-excel' },
  {
    extensions: ['xlsx'],
    mimes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
  { extensions: ['csv'], mimes: ['text/csv', 'application/csv'], contentType: 'text/csv' },
];

export type UploadValidationResult =
  | { ok: true; safeName: string; contentType: string }
  | { ok: false; status: 400; error: string };

function getExtension(fileName: string): string {
  const cleanName = fileName.split(/[\\/]/).pop() ?? '';
  const ext = cleanName.split('.').pop()?.toLowerCase() ?? '';
  return /^[a-z0-9]{1,12}$/.test(ext) ? ext : '';
}

function sanitizeFileName(fileName: string, extension: string): string {
  const cleanName = (fileName.split(/[\\/]/).pop() ?? 'document').trim() || 'document';
  const sanitized = cleanName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^\.+/, '')
    .slice(0, 120);

  if (!sanitized) return `document.${extension}`;
  return sanitized.includes('.') ? sanitized : `${sanitized}.${extension}`;
}

export function validateClientDocumentMetadata(
  fileName: string,
  mimeType: string,
  size: number,
  maxBytes = CLIENT_DOCUMENT_MAX_BYTES
): UploadValidationResult {
  if (!Number.isFinite(size) || size <= 0) {
    return { ok: false, status: 400, error: 'Archivo requerido' };
  }

  if (size > maxBytes) {
    const maxMb = Math.max(1, Math.ceil(maxBytes / (1024 * 1024)));
    return { ok: false, status: 400, error: `El archivo no puede superar ${maxMb} MB` };
  }

  const extension = getExtension(fileName);
  const allowedType = ALLOWED_CLIENT_DOCUMENT_TYPES.find((entry) =>
    entry.extensions.includes(extension)
  );

  if (!allowedType) {
    return {
      ok: false,
      status: 400,
      error: 'Tipo de archivo no permitido. Sube PDF, imagen, Word, Excel o CSV.',
    };
  }

  const mime = mimeType.split(';')[0].trim().toLowerCase();
  if (mime && !allowedType.mimes.includes(mime)) {
    return {
      ok: false,
      status: 400,
      error: 'El tipo MIME del archivo no coincide con su extension.',
    };
  }

  return {
    ok: true,
    safeName: sanitizeFileName(fileName, extension),
    contentType: allowedType.contentType,
  };
}

export function validateClientDocumentFile(
  file: File,
  maxBytes = CLIENT_DOCUMENT_MAX_BYTES
): UploadValidationResult {
  return validateClientDocumentMetadata(file.name, file.type, file.size, maxBytes);
}

export function buildClientDocumentStoragePath(caseId: string, safeName: string): string {
  const folder = caseId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const extension = getExtension(safeName) || 'bin';
  const fileName = sanitizeFileName(safeName, extension);
  return `${folder}/${Date.now()}-${randomUUID()}-${fileName}`;
}


export const META_CATALOG_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_META_CATALOG_IMAGE_TYPES: readonly AllowedUploadType[] = [
  { extensions: ['jpg', 'jpeg'], mimes: ['image/jpeg'], contentType: 'image/jpeg' },
  { extensions: ['png'], mimes: ['image/png'], contentType: 'image/png' },
  { extensions: ['webp'], mimes: ['image/webp'], contentType: 'image/webp' },
];

export type MetaCatalogImageValidationResult =
  | { ok: true; safeName: string; contentType: string; extension: string }
  | { ok: false; status: 400; error: string };

export function validateMetaCatalogImageMetadata(
  fileName: string,
  mimeType: string,
  size: number,
): MetaCatalogImageValidationResult {
  if (!Number.isFinite(size) || size <= 0) {
    return { ok: false, status: 400, error: 'Imagen requerida' };
  }

  if (size > META_CATALOG_IMAGE_MAX_BYTES) {
    return { ok: false, status: 400, error: 'La imagen no puede superar 5 MB' };
  }

  const extension = getExtension(fileName);
  const allowedType = ALLOWED_META_CATALOG_IMAGE_TYPES.find((entry) =>
    entry.extensions.includes(extension)
  );

  if (!allowedType) {
    return { ok: false, status: 400, error: 'Formato no permitido. Usa JPG, PNG o WEBP.' };
  }

  const mime = mimeType.split(';')[0].trim().toLowerCase();
  if (!allowedType.mimes.includes(mime)) {
    return { ok: false, status: 400, error: 'El tipo MIME no coincide con la extensión.' };
  }

  return {
    ok: true,
    safeName: sanitizeFileName(fileName, extension),
    contentType: allowedType.contentType,
    extension,
  };
}

export function validateMetaCatalogImageSignature(bytes: Uint8Array, contentType: string): boolean {
  if (contentType === 'image/jpeg') {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (contentType === 'image/png') {
    return bytes.length >= 8
      && bytes[0] === 0x89
      && bytes[1] === 0x50
      && bytes[2] === 0x4e
      && bytes[3] === 0x47
      && bytes[4] === 0x0d
      && bytes[5] === 0x0a
      && bytes[6] === 0x1a
      && bytes[7] === 0x0a;
  }
  if (contentType === 'image/webp') {
    if (bytes.length < 12) return false;
    const ascii = String.fromCharCode(...bytes.slice(0, 12));
    return ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WEBP';
  }
  return false;
}

export function buildMetaCatalogImageStoragePath(
  retailerId: string,
  locale: string,
  safeName: string,
): string {
  const safeRetailer = retailerId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
  const safeLocale = locale.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 12);
  const extension = getExtension(safeName) || 'bin';
  const fileName = sanitizeFileName(safeName, extension);
  return `meta-catalog/${safeRetailer}/${safeLocale}/${Date.now()}-${randomUUID()}-${fileName}`;
}
