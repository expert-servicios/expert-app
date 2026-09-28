'use client';

import { useState } from 'react';
import { ArrowRight, Check, Send } from 'lucide-react';
import { getRecaptchaToken } from '@/lib/utils/recaptcha-client';

type AudienceSegment = 'particular_residente' | 'particular_no_residente' | 'autonomo' | 'empresa';

const SEGMENTS: Array<{ value: AudienceSegment; label: string }> = [
  { value: 'particular_residente', label: 'Particular residente fiscal' },
  { value: 'particular_no_residente', label: 'Particular no residente' },
  { value: 'autonomo', label: 'Autónomo' },
  { value: 'empresa', label: 'Empresa' },
];

interface Props {
  source?: string;
  variant?: 'dark' | 'light';
  layout?: 'horizontal' | 'vertical';
}

export function NewsletterForm({ source = 'website', variant = 'dark', layout = 'horizontal' }: Props) {
  const [email, setEmail] = useState('');
  const [segment, setSegment] = useState<AudienceSegment>('particular_residente');
  const [hp, setHp] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const isDark = variant === 'dark';
  const isHorizontal = layout === 'horizontal';
  const telegramHref = `https://t.me/kia_expert_bot?start=news_${segment}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const recaptcha_token = await getRecaptchaToken('newsletter');
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source,
          audience_segment: segment,
          hp_url: hp,
          recaptcha_token,
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Error al suscribirse.');
        setStatus('error');
      } else {
        setStatus('ok');
        setEmail('');
      }
    } catch {
      setErrorMsg('Error de conexión. Inténtalo de nuevo.');
      setStatus('error');
    }
  };

  const muted = isDark ? 'text-[#9CA3AF]' : 'text-[#52606D]';
  const field = isDark
    ? 'border-[#D4A017]/30 bg-[#23364D]/40 text-[#F8F6F1] placeholder:text-[#9CA3AF]'
    : 'border-[#D4A017]/30 bg-white text-[#0D1B2A] placeholder:text-[#9CA3AF]';

  return (
    <div className="space-y-3">
      <div>
        <label className={`mb-1.5 block text-xs font-bold uppercase tracking-widest ${muted}`}>
          Qué novedades quieres recibir
        </label>
        <select
          value={segment}
          onChange={(event) => {
            setSegment(event.target.value as AudienceSegment);
            if (status === 'ok') setStatus('idle');
          }}
          className={`min-h-11 w-full border px-3 text-sm outline-none transition focus:border-[#D4A017] ${field}`}
        >
          {SEGMENTS.map((item) => (
            <option key={item.value} value={item.value} className="text-[#0D1B2A]">
              {item.label}
            </option>
          ))}
        </select>
        <p className={`mt-1.5 text-xs leading-5 ${muted}`}>
          Solo alertas, cambios y guías útiles para tu perfil. Sin boletines genéricos.
        </p>
      </div>

      {status === 'ok' ? (
        <div className={`flex items-center gap-3 border px-4 py-3 ${isDark ? 'border-[#D4A017]/40 bg-[#D4A017]/10 text-[#F8F6F1]' : 'border-[#D4A017]/40 bg-[#D4A017]/10 text-[#0D1B2A]'}`}>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-[#D4A017]">
            <Check className="h-4 w-4 text-[#0D1B2A]" />
          </span>
          <div>
            <p className="text-sm font-bold">Suscripción por correo registrada</p>
            <p className={`text-xs ${muted}`}>KIA filtrará las novedades para este perfil.</p>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className={isHorizontal ? 'flex flex-col gap-3 sm:flex-row sm:items-end' : 'flex flex-col gap-3'}
        >
          <input
            type="text"
            name="hp_url"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={hp}
            onChange={(e) => setHp(e.target.value)}
            className="absolute -left-[9999px] h-px w-px overflow-hidden"
          />

          <div className={isHorizontal ? 'flex-1' : ''}>
            <label className={`mb-1.5 block text-xs font-bold uppercase tracking-widest ${muted}`}>
              Correo electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className={`min-h-11 w-full border px-4 text-sm outline-none transition focus:border-[#D4A017] ${field}`}
            />
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#D4A017] px-5 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E] disabled:opacity-60 sm:shrink-0"
          >
            {status === 'loading' ? 'Enviando…' : 'Recibir por email'}
            {status !== 'loading' && <ArrowRight className="h-4 w-4" />}
          </button>

          {status === 'error' && (
            <p className="text-xs text-red-400 sm:col-span-2">{errorMsg}</p>
          )}
        </form>
      )}

      <a
        href={telegramHref}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex min-h-11 w-full items-center justify-center gap-2 border px-4 py-2.5 text-sm font-bold transition ${
          isDark
            ? 'border-[#D4A017]/40 text-[#F8F6F1] hover:border-[#D4A017] hover:text-[#D4A017]'
            : 'border-[#0D1B2A]/20 text-[#0D1B2A] hover:border-[#D4A017] hover:text-[#D4A017]'
        }`}
      >
        <Send className="h-4 w-4" />
        Recibir por Telegram
      </a>

      <p className={`text-[11px] leading-4 ${muted}`}>
        Puedes cambiar de perfil volviendo a suscribirte. En Telegram, el enlace abre KIA y guarda únicamente el canal y el perfil de novedades elegido.
      </p>
    </div>
  );
}
