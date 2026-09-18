export type LegacyServiceAliasBinding = {
  alias: string;
  canonicalServiceId: string;
  reason: string;
};

export type LegacyChildOfferBinding = {
  sourceId: string;
  canonicalServiceId: string;
  offerCode: string;
  reason: string;
};

export const LEGACY_SERVICE_ALIASES: LegacyServiceAliasBinding[] = [
  {
    alias: 'holded-starter',
    canonicalServiceId: 'holded-pack-starter',
    reason: 'El catálogo conversacional usa holded-starter y el catálogo público usa holded-pack-starter.',
  },
  {
    alias: 'nacionalidad-menor-nacido-espana',
    canonicalServiceId: 'nacionalidad-espanola-menor-nacido-en-espana',
    reason: 'Admin usa un id abreviado y la identidad pública usa el slug largo.',
  },
  {
    alias: 'matriculacion-vehiculo',
    canonicalServiceId: 'matriculacion',
    reason: 'Admin usa matriculacion-vehiculo y la identidad pública usa matriculacion.',
  },
];

export const LEGACY_CHILD_OFFER_BINDINGS: LegacyChildOfferBinding[] = [
  {
    sourceId: 'formacion-holded-2h',
    canonicalServiceId: 'formacion-holded',
    offerCode: 'holded-2h',
    reason: 'Variante comercial de 2 horas del servicio Formación en Holded.',
  },
  {
    sourceId: 'formacion-holded-4h',
    canonicalServiceId: 'formacion-holded',
    offerCode: 'holded-4h',
    reason: 'Variante comercial de 4 horas del servicio Formación en Holded.',
  },
];

export function resolveCanonicalServiceId(sourceId: string): string {
  return LEGACY_SERVICE_ALIASES.find((binding) => binding.alias === sourceId)?.canonicalServiceId ?? sourceId;
}

export function getAliasesForCanonicalService(serviceId: string): LegacyServiceAliasBinding[] {
  return LEGACY_SERVICE_ALIASES.filter((binding) => binding.canonicalServiceId === serviceId);
}

export function getChildOffersForCanonicalService(serviceId: string): LegacyChildOfferBinding[] {
  return LEGACY_CHILD_OFFER_BINDINGS.filter((binding) => binding.canonicalServiceId === serviceId);
}
