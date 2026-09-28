'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { getRecaptchaToken } from '@/lib/utils/recaptcha-client';

export function FreeConsultationForm({ origin, service }: { origin?: string | null; service?: string | null }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [question, setQuestion] = useState('');
  const [hp, setHp] = useState('');
  const [state, setState] = useState<'idle'|'loading'|'done'>('idle');
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setState('loading');
    setError('');
    try {
      const recaptcha_token = await getRecaptchaToken('free_consultation');
      const response = await fetch('/api/consultas-gratuitas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, question, service, origin, hp_url: hp, recaptcha_token }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? 'No se pudo enviar la consulta.');
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
        <h2 className="mt-3 font-serif text-2xl font-bold text-[#0D1B2A]">Consulta recibida</h2>
        <p className="mt-2 text-sm leading-6 text-[#23364D]">
          KIA y el equipo de EXPERT revisarán tu pregunta. Si prefieres explicarla en directo, también puedes reservar una reunión informativa gratuita de 15 minutos.
        </p>
        <Link href="/cita?tipo=consulta-inicial" className="mt-4 inline-flex bg-[#D4A017] px-5 py-2.5 text-sm font-bold text-[#0D1B2A]">
          Reservar 15 minutos
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
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
        <label className="text-sm font-semibold text-[#23364D] sm:col-span-2">
          Teléfono <span className="font-normal text-[#6B7280]">(opcional)</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full border border-[#D4A017]/30 bg-white px-4 py-3 font-normal" />
        </label>
      </div>
      <label className="block text-sm font-semibold text-[#23364D]">
        ¿Qué quieres consultar?
        <textarea
          required
          rows={6}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Cuéntanos el caso con tus palabras. No hace falta adjuntar documentación todavía."
          className="mt-1 w-full border border-[#D4A017]/30 bg-white px-4 py-3 font-normal"
        />
      </label>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button disabled={state === 'loading'} className="min-h-12 bg-[#D4A017] px-7 py-3 text-sm font-bold text-[#0D1B2A] disabled:opacity-60">
        {state === 'loading' ? 'Enviando…' : 'Enviar consulta gratuita'}
      </button>
    </form>
  );
}
