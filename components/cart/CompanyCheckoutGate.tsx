'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Building2, Loader2 } from 'lucide-react';
import type { CartLocale } from '@/contexts/CartContext';

type Company = {
  id: string;
  razon_social?: string | null;
  name?: string | null;
  cif_nif?: string | null;
};

const COPY = {
  es: {
    title: 'Selecciona la entidad que contrata',
    intro: 'Este pedido necesita un destinatario fiscal de empresa antes de pasar a Stripe.',
    loading: 'Cargando entidades...',
    empty: 'No tienes ninguna entidad vinculada a tu cuenta.',
    add: 'Añadir entidad',
    continue: 'Continuar con esta entidad',
    error: 'No hemos podido cargar tus entidades.',
  },
  ru: {
    title: 'Выберите организацию-заказчика',
    intro: 'Для этого заказа необходимо выбрать юридическое лицо перед переходом в Stripe.',
    loading: 'Загружаем организации...',
    empty: 'К вашей учётной записи не привязано ни одной организации.',
    add: 'Добавить организацию',
    continue: 'Продолжить с этой организацией',
    error: 'Не удалось загрузить организации.',
  },
} as const;

export function CompanyCheckoutGate({
  locale = 'es',
  loading = false,
  onContinue,
}: {
  locale?: CartLocale;
  loading?: boolean;
  onContinue: (companyId: string) => void;
}) {
  const t = COPY[locale];
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selected, setSelected] = useState('');
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/companies', { cache: 'no-store' });
        const data = await res.json() as { companies?: Company[]; error?: string };
        if (!res.ok) throw new Error(data.error ?? t.error);
        if (cancelled) return;
        const next = data.companies ?? [];
        setCompanies(next);
        if (next.length === 1) setSelected(next[0].id);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : t.error);
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();
    return () => { cancelled = true; };
  }, [t.error]);

  return (
    <div className="space-y-3 rounded-xl border border-[#D4A017]/30 bg-[#F8F6F1] p-4">
      <div className="flex items-start gap-2">
        <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A017]" />
        <div>
          <p className="text-xs font-semibold text-[#0D1B2A]">{t.title}</p>
          <p className="mt-1 text-[11px] leading-5 text-[#23364D]/65">{t.intro}</p>
        </div>
      </div>

      {fetching ? (
        <p className="flex items-center gap-2 text-xs text-[#23364D]/60">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t.loading}
        </p>
      ) : companies.length === 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-amber-800">{error || t.empty}</p>
          <Link href="/dashboard/empresa/nueva" className="inline-flex text-xs font-bold text-[#D4A017] hover:underline">
            {t.add}
          </Link>
        </div>
      ) : (
        <>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full rounded-xl border border-[#d8cbb5] bg-white px-3 py-2.5 text-sm text-[#0D1B2A] outline-none focus:border-[#D4A017]"
            aria-label={t.title}
          >
            <option value="">{t.title}</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.razon_social ?? company.name ?? 'Entidad'}{company.cif_nif ? ` · ${company.cif_nif}` : ''}
              </option>
            ))}
          </select>
          {error && <p className="text-xs font-semibold text-red-700">{error}</p>}
          <button
            type="button"
            disabled={!selected || loading}
            onClick={() => onContinue(selected)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4A017] py-2.5 text-sm font-bold text-[#0D1B2A] transition hover:bg-[#F2C14E] disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {t.continue}
          </button>
        </>
      )}
    </div>
  );
}
