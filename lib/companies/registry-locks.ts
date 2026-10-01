export const REGISTRY_IDENTITY_FIELDS = [
  'razon_social',
  'cif_nif',
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

const SNAPSHOT_KEYS: Record<RegistryIdentityField, string> = {
  razon_social: 'name',
  cif_nif: 'taxId',
  direccion: 'registeredAddress',
  ciudad: 'city',
  provincia: 'province',
  codigo_postal: 'postalCode',
  pais: 'country',
};

export function isOfficialRegistrySource(source: string | null | undefined): boolean {
  return OFFICIAL_REGISTRY_SOURCES.has(String(source ?? '').trim());
}

export function lockedRegistryFields(
  source: string | null | undefined,
  snapshot?: Record<string, unknown> | null,
): RegistryIdentityField[] {
  if (!isOfficialRegistrySource(source)) return [];
  if (!snapshot) return [...REGISTRY_IDENTITY_FIELDS];

  return REGISTRY_IDENTITY_FIELDS.filter((field) => {
    const value = snapshot[SNAPSHOT_KEYS[field]];
    return typeof value === 'string' && value.trim().length > 0;
  });
}

export function blockedRegistryUpdates(
  lockedFields: string[] | null | undefined,
  update: Record<string, unknown>,
): string[] {
  const locked = new Set(lockedFields ?? []);
  return Object.keys(update).filter((field) => locked.has(field));
}
