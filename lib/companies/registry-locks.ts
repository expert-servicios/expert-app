export const REGISTRY_IDENTITY_FIELDS = [
  'razon_social',
  'cif_nif',
  'forma_juridica',
  'direccion',
  'ciudad',
  'provincia',
  'codigo_postal',
  'pais',
] as const;

export type RegistryIdentityField = typeof REGISTRY_IDENTITY_FIELDS[number];

export const OFFICIAL_REGISTRY_SOURCES = new Set([
  'registradores_opendata',
  'boe_borme',
]);

export function isOfficialRegistrySource(source: string | null | undefined): boolean {
  return OFFICIAL_REGISTRY_SOURCES.has(String(source ?? '').trim());
}

export function lockedRegistryFields(source: string | null | undefined): RegistryIdentityField[] {
  return isOfficialRegistrySource(source) ? [...REGISTRY_IDENTITY_FIELDS] : [];
}

export function blockedRegistryUpdates(
  lockedFields: string[] | null | undefined,
  update: Record<string, unknown>,
): string[] {
  const locked = new Set(lockedFields ?? []);
  return Object.keys(update).filter((field) => locked.has(field));
}
