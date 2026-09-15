import { createHash } from 'crypto';

const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_RE = /(?<!\d)(?:\+?\d[\s().-]?){8,16}(?!\d)/g;
const IBAN_RE = /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/gi;
const API_KEY_RE = /\b(?:sk|rk|pk|whsec|xoxb|AIza|key|token)[A-Za-z0-9_\-]{16,}\b/g;
const PEM_RE = /-----BEGIN [^-\r\n]*(?:PRIVATE KEY|CERTIFICATE)-----[\s\S]*?-----END [^-\r\n]*(?:PRIVATE KEY|CERTIFICATE)-----/gi;
const PKCS12_FILENAME_RE = /\b[^\s]+\.(?:p12|pfx)\b/gi;
const OTP_RE = /\b(?:otp|pin|clave|cl@ve|sms|verification code|codigo de verificacion|código de verificación)\s*[:=-]?\s*\d{4,10}\b/gi;

const SENSITIVE_KEY_PARTS = [
  'api_key',
  'apikey',
  'secret',
  'token',
  'password',
  'passwd',
  'pin',
  'otp',
  'private_key',
  'privatekey',
  'certificate_password',
  'cert_password',
  'session_cookie',
  'cookie',
  'authorization',
  'clave_code',
  'sms_code',
];

export function redactSensitiveText(input: string | null | undefined): string {
  if (!input) return '';
  return input
    .replace(PEM_RE, '[certificate-secret]')
    .replace(PKCS12_FILENAME_RE, '[certificate-file]')
    .replace(OTP_RE, '[auth-code]')
    .replace(EMAIL_RE, '[email]')
    .replace(PHONE_RE, '[phone]')
    .replace(IBAN_RE, '[iban]')
    .replace(API_KEY_RE, '[secret]');
}

export function redactJson<T>(value: T): T {
  if (typeof value === 'string') return redactSensitiveText(value) as T;
  if (Array.isArray(value)) return value.map((item) => redactJson(item)) as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      const lower = key.toLowerCase();
      if (SENSITIVE_KEY_PARTS.some((part) => lower.includes(part))) {
        out[key] = '[secret]';
      } else {
        out[key] = redactJson(val);
      }
    }
    return out as T;
  }
  return value;
}

export function stableHash(input: unknown): string {
  const redacted = redactJson(input);
  const serialized = JSON.stringify(redacted);
  return createHash('sha256').update(serialized).digest('hex');
}

export function safeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return redactSensitiveText(message).slice(0, 500);
}
