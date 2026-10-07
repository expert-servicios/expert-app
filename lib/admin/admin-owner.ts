export const DEFAULT_ADMIN_OWNER_EMAIL = 'soy@kseniailicheva.com';

export function getAdminOwnerEmail(): string {
  return process.env.ADMIN_OWNER_EMAIL?.trim()
    || process.env.ADMIN_SUMMARY_EMAIL?.split(',')[0]?.trim()
    || DEFAULT_ADMIN_OWNER_EMAIL;
}

export function getAdminOwnerRecipients(): string[] {
  const raw = process.env.ADMIN_SUMMARY_EMAIL?.trim()
    || process.env.ADMIN_OWNER_EMAIL?.trim()
    || DEFAULT_ADMIN_OWNER_EMAIL;

  return Array.from(new Set(
    raw
      .split(',')
      .map((email) => email.trim().replace(/^[^<]*<([^>]+)>$/, '$1').toLowerCase())
      .filter(Boolean),
  ));
}
