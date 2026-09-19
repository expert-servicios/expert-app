'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Loader2, Phone, User } from 'lucide-react';
import type { CartLocale } from '@/contexts/CartContext';

interface Props {
  priceIds: string[];
  disbursements?: string[];
  disbursementMandateAccepted?: boolean;
  locale?: CartLocale;
  loginNextPath?: string;
  companyId?: string;
  onCompanyRequired?: () => void;
  onCheckoutUrl: (url: string) => void;
}

type ProfileResponse = { profile?: { full_name: string | null; phone: string | null } };
type CheckoutResponse = { url?: string; error?: string; requiresAuth?: boolean; code?: 'profile_required' | 'company_required' };

const inputCls = 'w-full rounded-xl border border-[#D4A017]/20 bg-[#F8F6F1] px-3 py-2.5 text-sm text-[#0D1B2A] outline-none transition focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/20';

const COPY = {
  es: {
    mandateRequired: 'Debes aceptar expresamente el mandato de suplido antes de continuar.',
    saveError: 'No hemos podido guardar tus datos.',
    checkoutError: 'No hemos podido iniciar el pago.',
    retryError: 'No hemos podido guardar tus datos. Inténtalo de nuevo.',
    intro: 'Antes de pagar, confirma tu nombre y teléfono',
    fullName: 'Nombre completo',
    fullNamePlaceholder: 'Tu nombre completo',
    phone: 'Teléfono',
    disbursement: 'Este pedido incluye una tasa obligatoria como suplido. El mandato debe haberse aceptado expresamente antes de crear el checkout.',
    saving: 'Guardando...',
    submit: 'Guardar y pagar',
  },
  ru: {
    mandateRequired: 'Перед продолжением необходимо прямо подтвердить поручение на оплату государственной пошлины как suplido.',
    saveError: 'Не удалось сохранить ваши данные.',
    checkoutError: 'Не удалось перейти к оплате.',
    retryError: 'Не удалось сохранить ваши данные. Попробуйте ещё раз.',
    intro: 'Перед оплатой подтвердите имя и телефон',
    fullName: 'Имя и фамилия',
    fullNamePlaceholder: 'Ваше имя и фамилия',
    phone: 'Телефон',
    disbursement: 'Заказ включает обязательную государственную пошлину как suplido. Поручение на её оплату должно быть подтверждено до перехода в Stripe.',
    saving: 'Сохраняем...',
    submit: 'Сохранить и оплатить',
  },
} as const;

export function QuickProfileGate({
  priceIds,
  disbursements = [],
  disbursementMandateAccepted = false,
  locale = 'es',
  loginNextPath = '/carrito',
  companyId,
  onCompanyRequired,
  onCheckoutUrl,
}: Props) {
  const t = COPY[locale];
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/profile');
        if (!res.ok) return;
        const data = await res.json() as ProfileResponse;
        if (!cancelled) {
          setFullName(data.profile?.full_name ?? '');
          setPhone(data.profile?.phone ?? '');
        }
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const hasDisbursements = disbursements.length > 0;
  const canSave = useMemo(
    () => Boolean(fullName.trim() && phone.trim() && (!hasDisbursements || disbursementMandateAccepted)),
    [fullName, phone, hasDisbursements, disbursementMandateAccepted],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) {
      if (hasDisbursements && !disbursementMandateAccepted) {
        setError(t.mandateRequired);
      }
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const saveRes = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName.trim(), phone: phone.trim() }),
      });
      const saveData = await saveRes.json() as { error?: string };
      if (!saveRes.ok) throw new Error(locale === 'ru' ? t.saveError : (saveData.error ?? t.saveError));

      const checkoutRes = await fetch('/api/services/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceIds,
          locale,
          ...(companyId ? { companyId } : {}),
          ...(hasDisbursements
            ? { disbursements, disbursementMandateAccepted }
            : {}),
        }),
      });
      const checkoutData = await checkoutRes.json() as CheckoutResponse;
      if (checkoutRes.status === 401 || checkoutData.requiresAuth) {
        window.location.href = `/auth/login?next=${encodeURIComponent(loginNextPath)}&lang=${locale}`;
        return;
      }
      if (checkoutRes.status === 409 && checkoutData.code === 'company_required' && onCompanyRequired) {
        onCompanyRequired();
        return;
      }
      if (checkoutData.url) {
        onCheckoutUrl(checkoutData.url);
        return;
      }
      setError(locale === 'ru' ? t.checkoutError : (checkoutData.error ?? t.checkoutError));
    } catch (err) {
      setError(locale === 'ru' ? t.retryError : (err instanceof Error ? err.message : t.retryError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-[#D4A017]/30 bg-[#F8F6F1] p-4">
      <p className="text-xs font-semibold text-[#0D1B2A]">{t.intro}</p>
      <label className="block">
        <span className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#23364D]/60">
          <User className="h-3.5 w-3.5 text-[#D4A017]" /> {t.fullName}
        </span>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} required disabled={loadingProfile} className={inputCls} placeholder={t.fullNamePlaceholder} />
      </label>
      <label className="block">
        <span className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#23364D]/60">
          <Phone className="h-3.5 w-3.5 text-[#D4A017]" /> {t.phone}
        </span>
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required disabled={loadingProfile} className={inputCls} placeholder="+34 6XX XXX XXX" />
      </label>
      {hasDisbursements && (
        <p className="rounded-lg border border-[#D4A017]/25 bg-white px-3 py-2 text-[11px] leading-5 text-[#23364D]/70">
          {t.disbursement}
        </p>
      )}
      {error && <p role="alert" aria-live="assertive" className="text-xs font-semibold text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={saving || loadingProfile || !canSave}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4A017] py-2.5 text-sm font-bold text-[#0D1B2A] transition hover:bg-[#F2C14E] disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
        {saving ? t.saving : t.submit}
        {!saving && <ArrowRight className="h-4 w-4" />}
      </button>
    </form>
  );
}
