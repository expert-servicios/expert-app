export const DEFAULT_ADMIN_OWNER_EMAIL = 'soy@kseniailicheva.com';

export function getAdminOwnerEmail(): string {
  return process.env.ADMIN_OWNER_EMAIL?.trim().toLowerCase()
    || DEFAULT_ADMIN_OWNER_EMAIL;
}

export function getAdminOwnerRecipients(): string[] {
  const configured = [
    process.env.ADMIN_OWNER_EMAIL,
    process.env.ADMIN_SUMMARY_EMAIL,
  ]
    .filter(Boolean)
    .flatMap((value) => String(value).split(','));

  return Array.from(new Set(
    [DEFAULT_ADMIN_OWNER_EMAIL, ...configured]
      .map((email) => email.trim().replace(/^[^<]*<([^>]+)>$/, '$1').toLowerCase())
      .filter(Boolean),
  ));
}
