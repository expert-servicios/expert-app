import { z } from 'zod';

export const supportEventSchema = z.object({
  event: z.enum(['entered', 'company_switched', 'exited']),
  companyId: z.string().uuid().nullable(),
}).strict();

export type SupportEvent = z.infer<typeof supportEventSchema>;

export const supportAuditActions = [
  'workspace.support.entered',
  'workspace.support.company_switched',
  'workspace.support.exited',
] as const;

export function supportAuditAction(event: SupportEvent['event']) {
  return `workspace.support.${event}` as (typeof supportAuditActions)[number];
}

/**
 * Browser user-agent is self-reported, not a trusted device fingerprint.
 * Do not use this metadata to authorize access or to identify a person.
 */
export function describeClientDevice(userAgent: string | null) {
  const ua = (userAgent ?? '').slice(0, 300);
  const platform = /iphone|ipad|ipod/i.test(ua) ? 'iOS'
    : /android/i.test(ua) ? 'Android'
    : /windows/i.test(ua) ? 'Windows'
    : /macintosh|mac os/i.test(ua) ? 'macOS'
    : /linux/i.test(ua) ? 'Linux' : 'Desconocido';
  const browser = /edg\//i.test(ua) ? 'Edge'
    : /firefox\//i.test(ua) ? 'Firefox'
    : /chrome\//i.test(ua) ? 'Chrome'
    : /safari\//i.test(ua) ? 'Safari' : 'Desconocido';
  return { platform, browser, userAgent: ua };
}
