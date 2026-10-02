'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { getRecaptchaToken } from '@/lib/utils/recaptcha-client';

const interestOptions = [
  ['mentoria_privada', 'Mentoría / consulta privada'],
  ['colaboracion', 'Colaboración profesional'],
  ['inversion', 'Inversión / financiación'],
  ['alianza', 'Alianza o propuesta institucional'],
  ['otro', 'Otra propuesta'],
] as const;

export function MentoringContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [organization, setOrganization] = useState('');
  const [interest, setInterest] = useState<(typeof interestOptions)[number][0]>('mentoria_privada');
  const [message, setMessage] = useState('');
  const [hp, setHp] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState('loading');
    setError('');
    try {
      const recaptcha_token = await getRecaptchaToken('free_consultation');
      const response = await fetch('/api/consultas-gratuitas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          service: 'mentorias',
          origin: 'landing:mentorias',
          intent: interest,
          organization,
          question: message,
          hp_url: hp,
          recaptcha_token,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? 'No se pudo enviar la propuesta.');
        setState('idle');
        return;
      }
      setState('done');
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.');
      setState('idle');
    }
  }

  if (state === 'done') {
    return (
      <div className="border border-emerald-200 bg-emerald-50 p-6">
        <CheckCircle2 className="h-6 w-6 text-emerald-700" />
        <h3 className="mt-3 font-serif text-2xl font-bold text-[#0D1B2A]">Propuesta recibida</h3>
        <p className="mt-2 text-sm leading-6 text-[#23364D]">
          La revisaré antes de responder. Si lo que necesitas es una primera conversación, puedes reservar directamente una reunión informativa de 15 minutos.
        </p>
        <Link
          href="/cita?tipo=consulta-inicial&origen=landing%3Amentorias"
          className="mt-4 inline-flex bg-[#D4A017] px-5 py-2.5 text-sm font-bold text-[#0D1B2A]"
        >
          Reservar 15 minutos
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <input className="absolute -left-[9999px]" value={hp} onChange={(e) => setHp(e.target.value)} tabIndex={-1} aria-hidden="true" />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-[#23364D]">
          Nombre
          <input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full border border-[#D4A017]/30 bg-white px-4 py-3 font-normal" />
        </label>
        <label className="text-sm font-semibold text-[#23364D]">
          Email
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full border border-[#D4A017]/30 bg-white px-4 py-3 font-normal" />
        </label>
        <label className="text-sm font-semibold text-[#23364D]">
          Proyecto / organización <span className="font-normal text-[#6B7280]">(opcional)</span>
          <input value={organization} onChange={(e) => setOrganization(e.target.value)} className="mt-1 w-full border border-[#D4A017]/30 bg-white px-4 py-3 font-normal" />
        </label>
        <label className="text-sm font-semibold text-[#23364D]">
          Teléfono <span className="font-normal text-[#6B7280]">(opcional)</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full border border-[#D4A017]/30 bg-white px-4 py-3 font-normal" />
        </label>
      </div>
      <label className="block text-sm font-semibold text-[#23364D]">
        Motivo de contacto
        <select value={interest} onChange={(e) => setInterest(e.target.value as typeof interest)} className="mt-1 w-full border border-[#D4A017]/30 bg-white px-4 py-3 font-normal">
          {interestOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label className="block text-sm font-semibold text-[#23364D]">
        Cuéntame la propuesta
        <textarea
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Qué propones, qué necesitas y en qué fase está el proyecto."
          className="mt-1 w-full border border-[#D4A017]/30 bg-white px-4 py-3 font-normal"
        />
      </label>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button disabled={state === 'loading'} className="min-h-12 bg-[#0D1B2A] px-7 py-3 text-sm font-bold text-white disabled:opacity-60">
        {state === 'loading' ? 'Enviando…' : 'Enviar propuesta'}
      </button>
    </form>
  );
}
