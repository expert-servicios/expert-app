'use client';

import { useMemo, useRef, useState } from 'react';
import { CheckCircle2, Plus, Save, Trash2 } from 'lucide-react';

type Holder = {
  fullName: string;
  residenceCountry: string;
  foreignTaxId: string;
  ownershipPercent: string;
};

type RentalPeriod = {
  startDate: string;
  endDate: string;
  grossIncome: string;
  platform: string;
};

type Property = {
  address: string;
  cadastralReference: string;
  acquisitionDate: string;
  use: 'available' | 'rented' | 'sold';
  rentalPeriods: RentalPeriod[];
  holders: Holder[];
};

type SavedPayload = {
  version: 4;
  taxYears: string[];
  properties: Property[];
};

type LegacyPayload = {
  taxYear?: string;
  taxYears?: string[];
  residenceCountry?: string;
  taxIdForeign?: string;
  properties?: Array<{
    address?: string;
    cadastralReference?: string;
    acquisitionDate?: string;
    ownershipPercent?: string;
    use?: 'available' | 'rented' | 'sold';
    rentalPeriods?: RentalPeriod[];
    holders?: Holder[];
  }>;
};

function emptyHolder(): Holder {
  return {
    fullName: '',
    residenceCountry: '',
    foreignTaxId: '',
    ownershipPercent: '100',
  };
}

function emptyRentalPeriod(): RentalPeriod {
  return {
    startDate: '',
    endDate: '',
    grossIncome: '',
    platform: '',
  };
}

function emptyProperty(): Property {
  return {
    address: '',
    cadastralReference: '',
    acquisitionDate: '',
    use: 'available',
    rentalPeriods: [],
    holders: [emptyHolder()],
  };
}

function normalizeHolder(value: Partial<Holder> | null | undefined): Holder {
  return {
    fullName: typeof value?.fullName === 'string' ? value.fullName : '',
    residenceCountry: typeof value?.residenceCountry === 'string' ? value.residenceCountry : '',
    foreignTaxId: typeof value?.foreignTaxId === 'string' ? value.foreignTaxId : '',
    ownershipPercent: typeof value?.ownershipPercent === 'string' && value.ownershipPercent
      ? value.ownershipPercent
      : '100',
  };
}

function normalizeRentalPeriod(value: Partial<RentalPeriod> | null | undefined): RentalPeriod {
  return {
    startDate: typeof value?.startDate === 'string' ? value.startDate : '',
    endDate: typeof value?.endDate === 'string' ? value.endDate : '',
    grossIncome: typeof value?.grossIncome === 'string' ? value.grossIncome : '',
    platform: typeof value?.platform === 'string' ? value.platform : '',
  };
}

function normalizePayload(raw: string | null | undefined): SavedPayload {
  const fallback: SavedPayload = {
    version: 4,
    taxYears: [String(new Date().getFullYear() - 1)],
    properties: [emptyProperty()],
  };
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as LegacyPayload & Partial<SavedPayload>;
    const legacyResidenceCountry =
      typeof parsed.residenceCountry === 'string' ? parsed.residenceCountry : '';
    const legacyTaxId = typeof parsed.taxIdForeign === 'string' ? parsed.taxIdForeign : '';

    const properties = Array.isArray(parsed.properties) && parsed.properties.length
      ? parsed.properties.map((property) => {
          const holders = Array.isArray(property?.holders) && property.holders.length
            ? property.holders.map((holder) => normalizeHolder(holder))
            : [{
                fullName: '',
                residenceCountry: legacyResidenceCountry,
                foreignTaxId: legacyTaxId,
                ownershipPercent:
                  typeof property?.ownershipPercent === 'string' && property.ownershipPercent
                    ? property.ownershipPercent
                    : '100',
              }];

          return {
            address: typeof property?.address === 'string' ? property.address : '',
            cadastralReference:
              typeof property?.cadastralReference === 'string' ? property.cadastralReference : '',
            acquisitionDate:
              typeof property?.acquisitionDate === 'string' ? property.acquisitionDate : '',
            use: property?.use === 'rented' || property?.use === 'sold' ? property.use : 'available',
            rentalPeriods: Array.isArray(property?.rentalPeriods)
              ? property.rentalPeriods.map((period) => normalizeRentalPeriod(period))
              : [],
            holders,
          } satisfies Property;
        })
      : [emptyProperty()];

    const taxYears = Array.isArray(parsed.taxYears)
      ? parsed.taxYears.filter((year): year is string => typeof year === 'string' && year.trim().length > 0)
      : typeof parsed.taxYear === 'string' && parsed.taxYear.trim()
        ? [parsed.taxYear.trim()]
        : fallback.taxYears;

    return {
      version: 4,
      taxYears: taxYears.length > 0 ? taxYears : fallback.taxYears,
      properties,
    };
  } catch {
    return fallback;
  }
}

export function IrnrCaseQuestionnaire({
  caseId,
  initialComment,
}: {
  caseId: string;
  initialComment?: string | null;
}) {
  const initial = useMemo(() => normalizePayload(initialComment), [initialComment]);

  const [taxYears, setTaxYears] = useState<string[]>(initial.taxYears);
  const [properties, setProperties] = useState<Property[]>(initial.properties);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const revisionRef = useRef(0);

  function markDirty() {
    revisionRef.current += 1;
    setSaved(false);
  }

  function updateProperty(index: number, patch: Partial<Omit<Property, 'holders'>>) {
    setProperties((current) =>
      current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item)
    );
    markDirty();
  }

  function updateHolder(propertyIndex: number, holderIndex: number, patch: Partial<Holder>) {
    setProperties((current) =>
      current.map((property, itemIndex) => {
        if (itemIndex !== propertyIndex) return property;
        return {
          ...property,
          holders: property.holders.map((holder, currentHolderIndex) =>
            currentHolderIndex === holderIndex ? { ...holder, ...patch } : holder
          ),
        };
      })
    );
    markDirty();
  }

  function updateRentalPeriod(propertyIndex: number, periodIndex: number, patch: Partial<RentalPeriod>) {
    setProperties((current) =>
      current.map((property, itemIndex) => {
        if (itemIndex !== propertyIndex) return property;
        return {
          ...property,
          rentalPeriods: property.rentalPeriods.map((period, currentPeriodIndex) =>
            currentPeriodIndex === periodIndex ? { ...period, ...patch } : period
          ),
        };
      })
    );
    markDirty();
  }

  function addRentalPeriod(propertyIndex: number) {
    setProperties((current) =>
      current.map((property, itemIndex) =>
        itemIndex === propertyIndex
          ? { ...property, rentalPeriods: [...property.rentalPeriods, emptyRentalPeriod()] }
          : property
      )
    );
    markDirty();
  }

  function removeRentalPeriod(propertyIndex: number, periodIndex: number) {
    setProperties((current) =>
      current.map((property, itemIndex) =>
        itemIndex === propertyIndex
          ? { ...property, rentalPeriods: property.rentalPeriods.filter((_, index) => index !== periodIndex) }
          : property
      )
    );
    markDirty();
  }

  function addHolder(propertyIndex: number) {
    setProperties((current) =>
      current.map((property, itemIndex) =>
        itemIndex === propertyIndex
          ? { ...property, holders: [...property.holders, emptyHolder()] }
          : property
      )
    );
    markDirty();
  }

  function removeHolder(propertyIndex: number, holderIndex: number) {
    setProperties((current) =>
      current.map((property, itemIndex) => {
        if (itemIndex !== propertyIndex || property.holders.length <= 1) return property;
        return {
          ...property,
          holders: property.holders.filter((_, currentHolderIndex) => currentHolderIndex !== holderIndex),
        };
      })
    );
    markDirty();
  }

  async function save() {
    setSaving(true);
    setError('');
    const payload: SavedPayload = { version: 4, taxYears, properties };
    const revisionAtStart = revisionRef.current;

    try {
      const res = await fetch(`/api/cases/${caseId}/document-notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemKey: 'irnr-intake',
          itemLabel: 'Cuestionario IRNR — inmuebles y titulares',
          comment: JSON.stringify(payload),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? 'No se pudo guardar.');
      if (revisionRef.current === revisionAtStart) setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  }

  const declarativeUnits = properties.reduce(
    (total, property) => total + Math.max(1, property.holders.length),
    0,
  );

  return (
    <section className="rounded-2xl border border-[#d8cbb5] bg-white p-6 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c88b25]">Datos fiscales del servicio</p>
      <h2 className="mt-2 font-serif text-xl font-bold text-[#07111d]">Cuestionario IRNR de inmuebles</h2>
      <p className="mt-2 text-sm leading-6 text-[#29384a]">
        Añade cada inmueble y sus titulares no residentes. Cada combinación inmueble × titular se revisa como una unidad declarativa independiente.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm font-semibold">Ejercicios a declarar</p>
          <div className="mt-1 space-y-2">
            {taxYears.map((year, yearIndex) => (
              <div key={yearIndex} className="flex gap-2">
                <input
                  inputMode="numeric"
                  maxLength={4}
                  value={year}
                  onChange={(event) => {
                    const value = event.target.value.replace(/\D/g, '').slice(0, 4);
                    setTaxYears((current) => current.map((item, index) => index === yearIndex ? value : item));
                    markDirty();
                  }}
                  aria-label={`Ejercicio ${yearIndex + 1}`}
                  className="min-w-0 flex-1 rounded-lg border border-[#d8cbb5] px-3 py-2 font-normal"
                />
                {taxYears.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setTaxYears((current) => current.filter((_, index) => index !== yearIndex));
                      markDirty();
                    }}
                    className="rounded-lg border border-red-200 px-3 text-red-600"
                    aria-label={`Eliminar ejercicio ${yearIndex + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setTaxYears((current) => [...current, '']);
              markDirty();
            }}
            className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#c88b25]"
          >
            <Plus className="h-3.5 w-3.5" /> Añadir ejercicio
          </button>
        </div>
        <div className="rounded-lg bg-[#f8f4eb] p-3">
          <p className="text-[11px] font-bold uppercase text-[#8a6111]">Unidades declarativas</p>
          <p className="mt-1 text-lg font-bold text-[#07111d]">{declarativeUnits}</p>
          <p className="mt-1 text-xs text-[#52606d]">Inmueble × titular no residente</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {properties.map((property, propertyIndex) => (
          <div key={propertyIndex} className="rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold">Inmueble {propertyIndex + 1}</p>
              {properties.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setProperties((current) => current.filter((_, index) => index !== propertyIndex));
                    markDirty();
                  }}
                  className="text-red-600"
                  aria-label={`Eliminar inmueble ${propertyIndex + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold">Dirección
                <input
                  maxLength={300}
                  value={property.address}
                  onChange={(event) => updateProperty(propertyIndex, { address: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-[#d8cbb5] bg-white px-3 py-2 font-normal"
                />
              </label>
              <label className="text-xs font-semibold">Referencia catastral
                <input
                  maxLength={40}
                  value={property.cadastralReference}
                  onChange={(event) => updateProperty(propertyIndex, { cadastralReference: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-[#d8cbb5] bg-white px-3 py-2 font-normal"
                />
              </label>
              <label className="text-xs font-semibold">Fecha de adquisición
                <input
                  type="date"
                  value={property.acquisitionDate}
                  onChange={(event) => updateProperty(propertyIndex, { acquisitionDate: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-[#d8cbb5] bg-white px-3 py-2 font-normal"
                />
              </label>
              <label className="text-xs font-semibold">Uso durante el ejercicio
                <select
                  value={property.use}
                  onChange={(event) => updateProperty(propertyIndex, { use: event.target.value as Property['use'] })}
                  className="mt-1 w-full rounded-lg border border-[#d8cbb5] bg-white px-3 py-2 font-normal"
                >
                  <option value="available">A disposición / no alquilado</option>
                  <option value="rented">Alquilado total o parcialmente</option>
                  <option value="sold">Vendido durante el ejercicio</option>
                </select>
              </label>
            </div>

            {property.use === 'rented' && (
              <div className="mt-4 border-t border-[#d8cbb5] pt-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-[#8a6111]">Periodos de alquiler e ingresos</p>
                    <p className="mt-1 text-xs leading-5 text-[#52606d]">
                      Indica los periodos e importes brutos cobrados. Si gestionas las reservas en Booking.com, Airbnb u otra plataforma,
                      también puedes subir después su extracto o informe en la documentación del expediente.
                    </p>
                  </div>
                  <a href="#documentos" className="shrink-0 text-xs font-bold text-[#c88b25] hover:underline">
                    Subir archivo
                  </a>
                </div>

                {property.rentalPeriods.length === 0 ? (
                  <p className="mt-3 rounded-lg border border-dashed border-[#d8cbb5] bg-white p-3 text-xs text-[#52606d]">
                    Aún no hay periodos añadidos. Puedes registrarlos aquí o aportar un desglose de la plataforma.
                  </p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {property.rentalPeriods.map((period, periodIndex) => (
                      <div key={periodIndex} className="rounded-lg border border-[#e4d8c6] bg-white p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-[#07111d]">Periodo {periodIndex + 1}</p>
                          <button
                            type="button"
                            onClick={() => removeRentalPeriod(propertyIndex, periodIndex)}
                            className="text-red-600"
                            aria-label={`Eliminar periodo de alquiler ${periodIndex + 1}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <label className="text-xs font-semibold">Fecha de inicio
                            <input
                              type="date"
                              value={period.startDate}
                              onChange={(event) => updateRentalPeriod(propertyIndex, periodIndex, { startDate: event.target.value })}
                              className="mt-1 w-full rounded-lg border border-[#d8cbb5] px-3 py-2 font-normal"
                            />
                          </label>
                          <label className="text-xs font-semibold">Fecha de fin
                            <input
                              type="date"
                              value={period.endDate}
                              onChange={(event) => updateRentalPeriod(propertyIndex, periodIndex, { endDate: event.target.value })}
                              className="mt-1 w-full rounded-lg border border-[#d8cbb5] px-3 py-2 font-normal"
                            />
                          </label>
                          <label className="text-xs font-semibold">Importe bruto cobrado
                            <input
                              inputMode="decimal"
                              maxLength={20}
                              value={period.grossIncome}
                              onChange={(event) => updateRentalPeriod(propertyIndex, periodIndex, { grossIncome: event.target.value })}
                              placeholder="0,00"
                              className="mt-1 w-full rounded-lg border border-[#d8cbb5] px-3 py-2 font-normal"
                            />
                          </label>
                          <label className="text-xs font-semibold">Canal o plataforma
                            <input
                              maxLength={120}
                              value={period.platform}
                              onChange={(event) => updateRentalPeriod(propertyIndex, periodIndex, { platform: event.target.value })}
                              placeholder="Booking.com, Airbnb, alquiler directo…"
                              className="mt-1 w-full rounded-lg border border-[#d8cbb5] px-3 py-2 font-normal"
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => addRentalPeriod(propertyIndex)}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#c88b25]"
                >
                  <Plus className="h-3.5 w-3.5" /> Añadir periodo de alquiler
                </button>
              </div>
            )}

            <div className="mt-4 border-t border-[#d8cbb5] pt-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-[#8a6111]">Titulares no residentes</p>
                  <p className="mt-1 text-xs text-[#52606d]">País fiscal, N.º fiscal y porcentaje se guardan por cada titular.</p>
                </div>
                <button
                  type="button"
                  onClick={() => addHolder(propertyIndex)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#c88b25]"
                >
                  <Plus className="h-3.5 w-3.5" /> Añadir titular
                </button>
              </div>

              <div className="mt-3 space-y-3">
                {property.holders.map((holder, holderIndex) => (
                  <div key={holderIndex} className="rounded-lg border border-[#e4d8c6] bg-white p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-[#07111d]">Titular {holderIndex + 1}</p>
                      {property.holders.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeHolder(propertyIndex, holderIndex)}
                          className="text-red-600"
                          aria-label={`Eliminar titular ${holderIndex + 1} del inmueble ${propertyIndex + 1}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <label className="text-xs font-semibold">Nombre completo
                        <input
                          maxLength={160}
                          value={holder.fullName}
                          onChange={(event) => updateHolder(propertyIndex, holderIndex, { fullName: event.target.value })}
                          className="mt-1 w-full rounded-lg border border-[#d8cbb5] px-3 py-2 font-normal"
                        />
                      </label>
                      <label className="text-xs font-semibold">País de residencia fiscal
                        <input
                          maxLength={100}
                          value={holder.residenceCountry}
                          onChange={(event) => updateHolder(propertyIndex, holderIndex, { residenceCountry: event.target.value })}
                          className="mt-1 w-full rounded-lg border border-[#d8cbb5] px-3 py-2 font-normal"
                        />
                      </label>
                      <label className="text-xs font-semibold">N.º fiscal extranjero
                        <input
                          maxLength={80}
                          value={holder.foreignTaxId}
                          onChange={(event) => updateHolder(propertyIndex, holderIndex, { foreignTaxId: event.target.value })}
                          className="mt-1 w-full rounded-lg border border-[#d8cbb5] px-3 py-2 font-normal"
                        />
                      </label>
                      <label className="text-xs font-semibold">Porcentaje de titularidad
                        <input
                          inputMode="decimal"
                          maxLength={10}
                          value={holder.ownershipPercent}
                          onChange={(event) => updateHolder(propertyIndex, holderIndex, { ownershipPercent: event.target.value })}
                          className="mt-1 w-full rounded-lg border border-[#d8cbb5] px-3 py-2 font-normal"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => { setProperties((current) => [...current, emptyProperty()]); markDirty(); }}
        className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#c88b25]"
      >
        <Plus className="h-4 w-4" /> Añadir inmueble
      </button>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#c88b25] px-5 py-2.5 text-sm font-bold text-[#061321] disabled:opacity-60"
        >
          <Save className="h-4 w-4" /> {saving ? 'Guardando…' : 'Guardar cuestionario'}
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-green-700">
            <CheckCircle2 className="h-4 w-4" /> Guardado
          </span>
        )}
        {error && <span className="text-sm font-semibold text-red-600">{error}</span>}
      </div>
    </section>
  );
}
