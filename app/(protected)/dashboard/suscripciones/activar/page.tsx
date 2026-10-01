'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, CreditCard, Loader2, LockKeyhole, Search } from 'lucide-react';
import CompanyDataLookup, {
  type SuggestionFormFill,
  type SuggestionSourceMeta,
} from '@/components/dashboard/company/CompanyDataLookup';

type InvitationContext = {
  quote: {
    id: string;
    title: string;
    description: string;
    amountEur: number;
    status: string;
    expiresAt: string | null;
    companyId: string | null;
  };
  plan: {
    slug: string;
    name: string;
    amountEur: number;
    priceId: string;
    planPath: string;
  };
  invitation: {
    recipientName: string;
    entityType: 'empresa' | 'autonomo';
    email: string;
  };
  profile: {
    fullName: string;
    phone: string;
  };
  companies: Array<{
    id: string;
    razon_social: string | null;
    cif_nif: string | null;
    forma_juridica: string | null;
    direccion: string | null;
    ciudad: string | null;
    codigo_postal: string | null;
    pais: string | null;
  }>;
};

type CompanyForm = {
  razon_social: string;
  nombre_comercial: string;
  cif_nif: string;
  forma_juridica: 'autonomo' | 'sl' | 'sa' | 'slne' | 'cb' | 'cooperativa' | 'fundacion' | 'otra';
  direccion: string;
  ciudad: string;
  provincia: string;
  codigo_postal: string;
  pais: string;
  telefono: string;
  email: string;
  web: string;
};

const EMPTY_COMPANY: CompanyForm = {
  razon_social: '',
  nombre_comercial: '',
  cif_nif: '',
  forma_juridica: 'sl',
  direccion: '',
  ciudad: '',
  provincia: '',
  codigo_postal: '',
  pais: 'ES',
  telefono: '',
  email: '',
  web: '',
};

function SubscriptionActivationContent() {
  const searchParams = useSearchParams();
  const quoteId = searchParams.get('quote') ?? '';

  const [context, setContext] = useState<InvitationContext | null>(null);
  const [profile, setProfile] = useState({ fullName: '', phone: '' });
  const [company, setCompany] = useState<CompanyForm>(EMPTY_COMPANY);
  const [sourceMeta, setSourceMeta] = useState<SuggestionSourceMeta | undefined>();
  const [suggestionId, setSuggestionId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!quoteId) {
      setError('Falta el identificador de la propuesta.');
      setLoading(false);
      return;
    }

    fetch(`/api/subscriptions/invitation?quote=${encodeURIComponent(quoteId)}`)
      .then(async (response) => {
        const data = await response.json() as InvitationContext & { error?: string };
        if (!response.ok) throw new Error(data.error ?? 'No se pudo cargar la propuesta.');

        setContext(data);
        setProfile({
          fullName: data.profile.fullName || data.invitation.recipientName || '',
          phone: data.profile.phone || '',
        });

        const assignedCompany = data.quote.companyId
          ? data.companies.find((item) => item.id === data.quote.companyId)
          : null;

        if (assignedCompany) {
          setCompany({
            razon_social: assignedCompany.razon_social ?? '',
            nombre_comercial: '',
            cif_nif: assignedCompany.cif_nif ?? '',
            forma_juridica: (assignedCompany.forma_juridica as CompanyForm['forma_juridica']) ?? (data.invitation.entityType === 'autonomo' ? 'autonomo' : 'sl'),
            direccion: assignedCompany.direccion ?? '',
            ciudad: assignedCompany.ciudad ?? '',
            provincia: '',
            codigo_postal: assignedCompany.codigo_postal ?? '',
            pais: assignedCompany.pais ?? 'ES',
            telefono: data.profile.phone ?? '',
            email: data.invitation.email,
            web: '',
          });
        } else {
          setCompany((current) => ({
            ...current,
            razon_social: data.invitation.recipientName,
            forma_juridica: data.invitation.entityType === 'autonomo' ? 'autonomo' : 'sl',
            telefono: data.profile.phone ?? '',
            email: data.invitation.email,
          }));
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar la propuesta.'))
      .finally(() => setLoading(false));
  }, [quoteId]);

  const locked = useMemo(() => {
    if (!sourceMeta?.officialRegistry) return new Set<string>();
    const snapshot = sourceMeta.snapshot;
    const fields = new Set<string>();
    if (snapshot.name) fields.add('razon_social');
    if (snapshot.taxId) fields.add('cif_nif');
    if (snapshot.registeredAddress) fields.add('direccion');
    if (snapshot.city) fields.add('ciudad');
    if (snapshot.province) fields.add('provincia');
    if (snapshot.postalCode) fields.add('codigo_postal');
    if (snapshot.country) fields.add('pais');
    return fields;
  }, [sourceMeta]);

  function applySuggestion(data: SuggestionFormFill, nextSuggestionId?: string, meta?: SuggestionSourceMeta) {
    setCompany((current) => ({
      ...current,
      razon_social: data.razon_social ?? current.razon_social,
      cif_nif: data.cif_nif ?? current.cif_nif,
      direccion: data.direccion ?? current.direccion,
      ciudad: data.ciudad ?? current.ciudad,
      provincia: data.provincia ?? current.provincia,
      codigo_postal: data.codigo_postal ?? current.codigo_postal,
      pais: data.pais ?? current.pais,
    }));
    setSuggestionId(nextSuggestionId);
    setSourceMeta(meta);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!context || submitting) return;

    setSubmitting(true);
    setError('');
    try {
      if (!profile.fullName.trim() || !profile.phone.trim()) {
        throw new Error('Completa nombre y teléfono antes de continuar.');
      }
      if (
        !company.razon_social.trim()
        || !company.cif_nif.trim()
        || !company.direccion.trim()
        || !company.ciudad.trim()
        || !company.codigo_postal.trim()
      ) {
        throw new Error('Completa los datos fiscales obligatorios del titular.');
      }

      const profileResponse = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          full_name: profile.fullName.trim(),
          phone: profile.phone.trim(),
        }),
      });
      const profileData = await profileResponse.json().catch(() => ({})) as { error?: string };
      if (!profileResponse.ok) throw new Error(profileData.error ?? 'No se pudo guardar el perfil.');

      let companyId = context.quote.companyId;
      if (!companyId) {
        const createResponse = await fetch('/api/companies', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            ...company,
            razon_social: company.razon_social.trim(),
            cif_nif: company.cif_nif.trim().toUpperCase(),
            direccion: company.direccion.trim(),
            ciudad: company.ciudad.trim(),
            provincia: company.provincia.trim() || null,
            codigo_postal: company.codigo_postal.trim(),
            pais: company.pais.trim().toUpperCase() || 'ES',
            telefono: profile.phone.trim(),
            email: context.invitation.email,
            nombre_comercial: company.nombre_comercial.trim() || null,
            web: company.web.trim() || null,
            ...(suggestionId ? { _appliedSuggestionId: suggestionId } : {}),
            ...(sourceMeta ? {
              _registrySource: sourceMeta.source,
              _registrySourceUrl: sourceMeta.sourceUrl,
              _registryRetrievedAt: sourceMeta.retrievedAt,
              _registryOfficial: sourceMeta.officialRegistry,
              _registrySnapshot: sourceMeta.snapshot,
            } : {}),
          }),
        });
        const created = await createResponse.json().catch(() => ({})) as { company?: { id: string }; error?: string };
        if (!createResponse.ok || !created.company?.id) {
          throw new Error(created.error ?? 'No se pudo crear la entidad fiscal.');
        }
        companyId = created.company.id;
      }

      const checkoutResponse = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          priceId: context.plan.priceId,
          companyId,
          quoteId: context.quote.id,
        }),
      });
      const checkout = await checkoutResponse.json().catch(() => ({})) as { url?: string; error?: string };
      if (!checkoutResponse.ok || !checkout.url) {
        throw new Error(checkout.error ?? 'No se pudo preparar el pago.');
      }

      window.location.href = checkout.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo continuar con el alta.');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-3xl items-center justify-center px-6">
        <Loader2 className="h-6 w-6 animate-spin text-[#D4A017]" />
      </div>
    );
  }

  if (!context) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error || 'No se pudo cargar esta propuesta.'}
        </div>
      </div>
    );
  }

  const isCompany = context.invitation.entityType === 'empresa';
  const assignedCompany = Boolean(context.quote.companyId);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="rounded-3xl border border-[#d8cbb5] bg-white p-6 shadow-sm md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#D4A017]">Formalización de suscripción</p>
        <h1 className="mt-2 font-serif text-3xl font-bold text-[#07111d]">{context.plan.name}</h1>
        <p className="mt-2 text-sm leading-6 text-[#52606d]">
          Un titular fiscal, un contrato y una factura. Antes del pago confirmaremos únicamente los datos necesarios para identificar al contratante.
        </p>

        <div className="mt-6 grid gap-3 rounded-2xl bg-[#f8f4eb] p-5 sm:grid-cols-3">
          <Summary label="Cuota" value={`${context.plan.amountEur} € + IVA / mes`} />
          <Summary label="Titular" value={context.invitation.entityType === 'autonomo' ? 'Autónomo' : 'Empresa'} />
          <Summary label="Email" value={context.invitation.email} />
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-xs">
          <Link href={context.plan.planPath} className="font-semibold text-[#c88b25] hover:underline">
            Ver qué incluye y qué no incluye
          </Link>
          <Link href="/cita?tipo=demo-holded" className="font-semibold text-[#c88b25] hover:underline">
            Reservar demo Holded gratuita de 60 min
          </Link>
        </div>

        <form onSubmit={submit} className="mt-8 space-y-8">
          <section>
            <h2 className="font-serif text-xl font-bold text-[#07111d]">1. Responsable de la cuenta</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Nombre y apellidos *" value={profile.fullName} onChange={(value) => setProfile((current) => ({ ...current, fullName: value }))} />
              <Field label="Teléfono *" value={profile.phone} onChange={(value) => setProfile((current) => ({ ...current, phone: value }))} />
            </div>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-[#07111d]">2. Datos fiscales del titular</h2>
            <p className="mt-2 text-xs leading-5 text-[#52606d]">
              El cuestionario Company 360 completo podrá terminarse después. Estos datos son los mínimos para contrato, factura y suscripción.
            </p>

            {isCompany && !assignedCompany && (
              <div className="mt-4 rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#07111d]">
                  <Search className="h-4 w-4 text-[#D4A017]" />
                  Buscar empresa en fuentes oficiales
                </div>
                <CompanyDataLookup onFill={applySuggestion} />
              </div>
            )}

            {sourceMeta?.officialRegistry && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs leading-5 text-blue-900">
                <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />
                <p>Los datos recuperados de la fuente registral oficial se guardarán como solo lectura. Los cambios societarios deben tramitarse formalmente.</p>
              </div>
            )}

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label={isCompany ? 'Razón social *' : 'Nombre fiscal *'} value={company.razon_social} disabled={locked.has('razon_social') || assignedCompany} onChange={(value) => setCompany((current) => ({ ...current, razon_social: value }))} />
              <Field label="NIF / CIF *" value={company.cif_nif} disabled={locked.has('cif_nif') || assignedCompany} onChange={(value) => setCompany((current) => ({ ...current, cif_nif: value }))} />

              {isCompany ? (
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-[#29384a]">Forma jurídica *</span>
                  <select
                    value={company.forma_juridica}
                    disabled={assignedCompany}
                    onChange={(event) => setCompany((current) => ({ ...current, forma_juridica: event.target.value as CompanyForm['forma_juridica'] }))}
                    className="min-h-11 w-full rounded-lg border border-[#d8cbb5] bg-[#f8f4eb] px-3 text-sm text-[#07111d] outline-none disabled:bg-slate-100"
                  >
                    <option value="sl">Sociedad Limitada (SL)</option>
                    <option value="sa">Sociedad Anónima (SA)</option>
                    <option value="slne">SLNE</option>
                    <option value="cb">Comunidad de Bienes</option>
                    <option value="cooperativa">Cooperativa</option>
                    <option value="fundacion">Fundación</option>
                    <option value="otra">Otra</option>
                  </select>
                </label>
              ) : (
                <Field label="Forma jurídica" value="Autónomo / empresario individual" disabled onChange={() => {}} />
              )}

              <Field label="Dirección fiscal *" value={company.direccion} disabled={locked.has('direccion') || assignedCompany} onChange={(value) => setCompany((current) => ({ ...current, direccion: value }))} />
              <Field label="Ciudad *" value={company.ciudad} disabled={locked.has('ciudad') || assignedCompany} onChange={(value) => setCompany((current) => ({ ...current, ciudad: value }))} />
              <Field label="Provincia" value={company.provincia} disabled={locked.has('provincia') || assignedCompany} onChange={(value) => setCompany((current) => ({ ...current, provincia: value }))} />
              <Field label="Código postal *" value={company.codigo_postal} disabled={locked.has('codigo_postal') || assignedCompany} onChange={(value) => setCompany((current) => ({ ...current, codigo_postal: value }))} />
            </div>
          </section>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#D4A017] px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#07111d] transition hover:bg-[#F2C14E] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Preparando contratación…</> : <><CreditCard className="h-4 w-4" /> Revisar y continuar al pago</>}
          </button>

          <div className="flex items-start gap-2 text-xs leading-5 text-[#52606d]">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A017]" />
            <p>Después del pago recibirás la confirmación, el contrato aceptado y el enlace para reservar la reunión de onboarding incluida.</p>
          </div>
        </form>
      </div>
    </main>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#8a7760]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#07111d]">{value}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-[#29384a]">{label}</span>
      <input
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-lg border border-[#d8cbb5] bg-[#f8f4eb] px-3 text-sm text-[#07111d] outline-none transition focus:border-[#d7a33a] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
      />
    </label>
  );
}


export default function SubscriptionActivationPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto flex min-h-[50vh] max-w-3xl items-center justify-center px-6">
        <Loader2 className="h-6 w-6 animate-spin text-[#D4A017]" />
      </div>
    }>
      <SubscriptionActivationContent />
    </Suspense>
  );
}
