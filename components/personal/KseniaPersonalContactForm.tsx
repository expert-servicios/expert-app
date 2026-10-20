'use client';

import { useState, type FormEvent } from 'react';
import { CheckCircle2, Send } from 'lucide-react';
import { getRecaptchaToken } from '@/lib/utils/recaptcha-client';

type Context = 'general' | 'mentorias';

export function KseniaPersonalContactForm({ context = 'general' }: { context?: Context }) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'sent'>('idle');
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [organization, setOrganization] = useState('');
  const [intent, setIntent] = useState(context === 'mentorias' ? 'mentoria_privada' : 'colaboracion');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [hpUrl, setHpUrl] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!consent || status === 'submitting') return;
    setStatus('submitting');
    setError('');
    try {
      const recaptcha_token = await getRecaptchaToken('free_consultation');
      const response = await fetch('/api/consultas-gratuitas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hp_url: hpUrl, name, email, phone, organization, intent, question: message,
          service: context === 'mentorias' ? 'mentorias' : 'contacto-personal',
          origin: context === 'mentorias' ? 'landing:kseniailicheva-mentorias' : 'landing:kseniailicheva-contacto',
          recaptcha_token,
        }),
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(result.error || 'No se ha podido enviar el formulario.');
      setStatus('sent');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Error de conexión. Prueba de nuevo o utiliza el correo.');
      setStatus('idle');
    }
  }

  if (status === 'sent') return (
    <div role="status" className="border border-[#B6D1B8] bg-[#F0F8EE] p-6 text-[#244A36]">
      <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
      <h3 className="mt-3 font-serif text-2xl">Mensaje recibido</h3>
      <p className="mt-2 text-sm leading-7">Gracias por contactar. La propuesta ha quedado registrada y la revisaré para responderte.</p>
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-4" aria-label="Formulario de contacto personal">
      <input className="absolute -left-[9999px]" name="hp_url" autoComplete="off" value={hpUrl} onChange={event => setHpUrl(event.target.value)} tabIndex={-1} aria-hidden="true" />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-[#293E43]">Nombre *
          <input type="text" required minLength={2} maxLength={100} autoComplete="name" value={name} onChange={event => setName(event.target.value)} className="mt-2 min-h-12 w-full border border-[#CBB68F] bg-white px-3 py-3 font-normal outline-offset-2 focus:outline-[#A57931]" />
        </label>
        <label className="block text-sm font-semibold text-[#293E43]">Correo electrónico *
          <input type="email" required maxLength={200} autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} className="mt-2 min-h-12 w-full border border-[#CBB68F] bg-white px-3 py-3 font-normal outline-offset-2 focus:outline-[#A57931]" />
        </label>
        <label className="block text-sm font-semibold text-[#293E43]">Teléfono (opcional)
          <input type="tel" maxLength={30} autoComplete="tel" value={phone} onChange={event => setPhone(event.target.value)} className="mt-2 min-h-12 w-full border border-[#CBB68F] bg-white px-3 py-3 font-normal outline-offset-2 focus:outline-[#A57931]" />
        </label>
        <label className="block text-sm font-semibold text-[#293E43]">Proyecto u organización (opcional)
          <input type="text" maxLength={160} value={organization} onChange={event => setOrganization(event.target.value)} className="mt-2 min-h-12 w-full border border-[#CBB68F] bg-white px-3 py-3 font-normal outline-offset-2 focus:outline-[#A57931]" />
        </label>
      </div>
      <label className="block text-sm font-semibold text-[#293E43]">Motivo de contacto
        <select value={intent} onChange={event => setIntent(event.target.value)} className="mt-2 min-h-12 w-full border border-[#CBB68F] bg-white px-3 py-3 font-normal outline-offset-2 focus:outline-[#A57931]">
          <option value="colaboracion">Colaboración profesional</option>
          <option value="mentoria_privada">Mentoría o emprendimiento</option>
          <option value="formacion">Formación</option>
          <option value="alianza">Alianza o propuesta institucional</option>
          <option value="otro">Otro asunto</option>
        </select>
      </label>
      <label className="block text-sm font-semibold text-[#293E43]">Mensaje *
        <textarea required minLength={10} maxLength={3000} rows={5} value={message} onChange={event => setMessage(event.target.value)} placeholder="Cuéntame en qué consiste tu propuesta..." className="mt-2 w-full resize-y border border-[#CBB68F] bg-white px-3 py-3 font-normal outline-offset-2 focus:outline-[#A57931]" />
      </label>
      <label className="flex items-start gap-3 text-xs leading-6 text-[#536167]">
        <input type="checkbox" required checked={consent} onChange={event => setConsent(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[#182A32]" />
        <span>He leído la <a href="https://expertconsulting.es/privacidad" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">política de privacidad</a> y acepto el tratamiento de mis datos para responder a esta consulta.</span>
      </label>
      {error && <p role="alert" className="text-sm font-medium text-[#A12828]">{error} También puedes escribir a <a href="mailto:soy@kseniailicheva.com" className="underline">soy@kseniailicheva.com</a>.</p>}
      <button type="submit" disabled={status === 'submitting' || !consent} className="inline-flex min-h-12 w-full items-center justify-center gap-2 bg-[#182A32] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#30454B] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
        <Send className="h-4 w-4" aria-hidden="true" /> {status === 'submitting' ? 'Enviando…' : 'Enviar mensaje'}
      </button>
      <p className="text-xs leading-5 text-[#536167]">Recibiré el mensaje en el sistema de gestión de <a href="https://expertconsulting.es" target="_blank" rel="noopener noreferrer" className="font-semibold underline decoration-[#A57931] underline-offset-4">EXPERT</a> para darle seguimiento. No se utiliza para suscribirte a comunicaciones comerciales.</p>
    </form>
  );
}
