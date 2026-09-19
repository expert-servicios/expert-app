'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { ArrowRight, CheckCircle2, Loader2, Phone, User } from 'lucide-react';

interface Profile {
  full_name: string | null;
  phone: string | null;
  profile_completed: boolean | null;
  client_type?: 'particular' | 'autonomo' | 'empresa' | null;
}

interface ServiceInfo {
  name: string;
  priceId: string;
  displayPrice: string;
  slug: string;
  category: string;
}

type BillingPolicy = 'profile_only' | 'company_only' | 'flexible';

interface BillingCompany {
  id: string;
  name: string;
  taxId: string | null;
  legalForm: string | null;
}

interface Props {
  profile: Profile | null;
  service: ServiceInfo;
  billingPolicy: BillingPolicy;
  companies: BillingCompany[];
}

type CheckoutResponse = {
  url?: string;
  error?: string;
  requiresAuth?: boolean;
  code?: 'profile_required' | 'company_required' | 'billing_required';
};

function text(v: string | null | undefined) {
  return v ?? '';
}

export function ProfileCompletionWizard({ profile, service, billingPolicy, companies }: Props) {
  const [fullName, setFullName] = useState(text(profile?.full_name));
  const [phone, setPhone] = useState(text(profile?.phone));

  const initialReady = Boolean(profile?.profile_completed);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(initialReady);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  const [checking, setChecking] = useState(false);
  const [checkErr, setCheckErr] = useState<string | null>(null);

  const profileCanBeBilled = billingPolicy !== 'company_only' && profile?.client_type !== 'empresa';
  const initialBillingTarget = billingPolicy === 'profile_only'
    ? 'profile'
    : !profileCanBeBilled && companies.length === 1
      ? companies[0].id
      : billingPolicy === 'flexible' && profileCanBeBilled
        ? 'profile'
        : '';
  const [billingTarget, setBillingTarget] = useState(initialBillingTarget);
  const needsBillingChoice = billingPolicy !== 'profile_only';
  const billingReadyToContinue = !needsBillingChoice || Boolean(billingTarget);

  const canSave = useMemo(() => Boolean(fullName.trim() && phone.trim()), [fullName, phone]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setSaveErr(null);
    setCheckErr(null);

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          phone: phone.trim(),
        }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'No hemos podido guardar tus datos.');
      setSaved(true);
    } catch (err) {
      setSaveErr(err instanceof Error ? err.message : 'No hemos podido guardar tus datos. Intentalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const handleCheckout = async () => {
    setChecking(true);
    setCheckErr(null);
    try {
      const res = await fetch('/api/services/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: service.priceId,
          ...(billingTarget && billingTarget !== 'profile' ? { companyId: billingTarget } : {}),
        }),
      });
      const data = await res.json() as CheckoutResponse;
      if (res.status === 401 || data.requiresAuth) {
        window.location.href = `/auth/login?next=/contratar?service=${service.slug}`;
        return;
      }
      if (res.status === 409 && data.code === 'profile_required') {
        setSaved(false);
        setCheckErr(data.error ?? 'Completa tus datos antes de pagar.');
        return;
      }
      if (res.status === 409 && data.code === 'company_required') {
        setCheckErr(data.error ?? 'Selecciona la entidad que contratará el servicio.');
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setCheckErr(data.error ?? 'No hemos podido iniciar el pago.');
    } catch {
      setCheckErr('No hemos podido iniciar el pago.');
    } finally {
      setChecking(false);
    }
  };

  const inputCls = 'w-full rounded-xl border border-[#D4A017]/20 bg-[#F8F6F1] px-4 py-3 text-sm text-[#0D1B2A] outline-none transition focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/20';

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="rounded-2xl border border-[#D4A017]/30 bg-[#F8F6F1] p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-[#D4A017]">Servicio seleccionado</p>
        <p className="mt-1 text-lg font-semibold text-[#0D1B2A]">{service.name}</p>
        <p className="text-sm font-bold text-[#D4A017]">{service.displayPrice}</p>
      </div>

      {!saved ? (
        <form onSubmit={handleSaveProfile} className="rounded-2xl border border-[#D4A017]/20 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <p className="font-semibold text-[#0D1B2A]">Antes de pagar, confirma tus datos</p>
            <p className="mt-1 text-sm text-[#23364D]/60">Necesitamos tu nombre y telefono para poder contactarte sobre el servicio.</p>
          </div>

          <div className="space-y-4">
            <LabeledField icon={<User className="h-4 w-4" />} label="Nombre completo">
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} required className={inputCls} placeholder="Tu nombre completo" />
            </LabeledField>

            <LabeledField icon={<Phone className="h-4 w-4" />} label="Telefono">
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required className={inputCls} placeholder="+34 6XX XXX XXX" />
            </LabeledField>
          </div>

          {saveErr && <p className="mt-4 text-xs font-semibold text-red-700">{saveErr}</p>}
          {checkErr && <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700">{checkErr}</p>}

          <button type="submit" disabled={saving || !canSave} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0D1B2A] py-3 text-sm font-bold text-white transition hover:bg-[#23364D] disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {saving ? 'Guardando...' : 'Guardar y continuar'}
          </button>
        </form>
      ) : (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
          <p className="text-sm font-semibold text-green-800">Datos confirmados</p>
        </div>
      )}

      {saved && needsBillingChoice && (
        <div className="rounded-2xl border border-[#D4A017]/20 bg-white p-6 shadow-sm">
          <p className="font-semibold text-[#0D1B2A]">¿A nombre de quién se contrata?</p>
          <p className="mt-1 text-sm text-[#23364D]/60">
            Elige el destinatario fiscal antes de pasar a Stripe.
          </p>

          <div className="mt-4 space-y-2">
            {profileCanBeBilled && (
              <button
                type="button"
                onClick={() => { setBillingTarget('profile'); setCheckErr(null); }}
                className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                  billingTarget === 'profile'
                    ? 'border-[#D4A017] bg-[#D4A017]/10 font-semibold text-[#0D1B2A]'
                    : 'border-[#d8cbb5] text-[#29384a] hover:border-[#D4A017]'
                }`}
              >
                {profile?.client_type === 'autonomo' ? 'A mi nombre · empresario individual / autónomo' : 'A mi nombre · persona física'}
              </button>
            )}

            {companies.map((company) => (
              <button
                key={company.id}
                type="button"
                onClick={() => { setBillingTarget(company.id); setCheckErr(null); }}
                className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                  billingTarget === company.id
                    ? 'border-[#D4A017] bg-[#D4A017]/10 font-semibold text-[#0D1B2A]'
                    : 'border-[#d8cbb5] text-[#29384a] hover:border-[#D4A017]'
                }`}
              >
                <span className="block">{company.name}</span>
                {company.taxId && <span className="mt-0.5 block text-xs font-normal text-[#29384a]/60">NIF/CIF: {company.taxId}</span>}
              </button>
            ))}
          </div>

          {!profileCanBeBilled && companies.length === 0 && (
            <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
              Este servicio requiere una entidad fiscal vinculada. Añádela desde tu panel antes de continuar.
            </p>
          )}
        </div>
      )}

      {saved && (
        <div className="space-y-3">
          {checkErr && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700">{checkErr}</p>}
          <button type="button" onClick={handleCheckout} disabled={checking || !billingReadyToContinue} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4A017] py-4 text-base font-bold text-[#0D1B2A] shadow-lg shadow-[#D4A017]/20 transition hover:bg-[#F2C14E] disabled:opacity-60">
            {checking ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
            {checking ? 'Redirigiendo a Stripe...' : `Pagar - ${service.displayPrice}`}
          </button>
          <p className="text-center text-xs text-[#23364D]/50">Pago seguro con Stripe. La pasarela pedirá solo los datos fiscales que correspondan al destinatario de la factura.</p>
        </div>
      )}
    </div>
  );
}

function LabeledField({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[#23364D]/60">
        <span className="text-[#D4A017]">{icon}</span>
        {label}
      </span>
      {children}
    </label>
  );
}
