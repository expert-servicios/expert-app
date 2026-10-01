'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Clock, Loader2, Video } from 'lucide-react';
import { getRecaptchaToken } from '@/lib/utils/recaptcha-client';

interface Slot {
  start: string;
  end: string;
  date: string;
  time: string;
  label: string;
}

interface AvailabilityResponse {
  service?: {
    key: string;
    label: string;
    durationMinutes: number;
  };
  timezone?: string;
  slots?: Slot[];
  error?: string;
}

interface Props {
  serviceKey: string;
  bookingAuth?: string | null;
  companyId?: string | null;
  manageToken?: string | null;
  origin?: string | null;
}

function groupByDate(slots: Slot[]) {
  const groups = new Map<string, Slot[]>();
  for (const slot of slots) {
    const existing = groups.get(slot.date) ?? [];
    existing.push(slot);
    groups.set(slot.date, existing);
  }
  return Array.from(groups.entries());
}

function redirectToLoginForEntityOnboarding(serviceKey: string, companyId?: string | null) {
  if (serviceKey !== 'onboarding' || !companyId || typeof window === 'undefined') return false;
  const next = `/cita?tipo=onboarding&companyId=${encodeURIComponent(companyId)}`;
  window.location.assign(`/auth/login?next=${encodeURIComponent(next)}`);
  return true;
}

function dateLabel(date: string) {
  const parsed = new Date(`${date}T12:00:00+02:00`);
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(parsed);
}

export function NativeBookingForm({ serviceKey, bookingAuth, companyId, manageToken, origin }: Props) {
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [availabilityError, setAvailabilityError] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [selected, setSelected] = useState<Slot | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '', hp_url: '' });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [meetingUrl, setMeetingUrl] = useState<string | null>(null);
  const [dayPage, setDayPage] = useState(0);
  const [daysPerPage, setDaysPerPage] = useState(1);

  async function loadAvailability() {
    setLoadingSlots(true);
    setAvailabilityError('');
    try {
      const params = new URLSearchParams({ service: serviceKey, days: '14' });
      if (bookingAuth) params.set('auth', bookingAuth);
      if (manageToken) params.set('manage', manageToken);
      const res = await fetch(`/api/booking/availability?${params.toString()}`, {
        cache: 'no-store',
      });
      const data = (await res.json()) as AvailabilityResponse;
      if (res.status === 401 && redirectToLoginForEntityOnboarding(serviceKey, companyId)) return;
      if (!res.ok) throw new Error(data.error ?? 'No se pudo consultar la agenda.');
      setAvailability(data);
      setDayPage(0);
      setSelected((current) =>
        current && data.slots?.some((slot) => slot.start === current.start) ? current : null
      );
    } catch (error) {
      setAvailabilityError(error instanceof Error ? error.message : 'No se pudo consultar la agenda.');
    } finally {
      setLoadingSlots(false);
    }
  }

  useEffect(() => {
    void loadAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceKey]);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)');
    const sync = () => setDaysPerPage(media.matches ? 3 : 1);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  const groups = useMemo(() => groupByDate(availability?.slots ?? []), [availability?.slots]);
  const pageCount = Math.max(1, Math.ceil(groups.length / daysPerPage));
  const safeDayPage = Math.min(dayPage, pageCount - 1);

  useEffect(() => {
    setDayPage((current) => Math.min(current, pageCount - 1));
  }, [pageCount]);

  const visibleGroups = groups.slice(
    safeDayPage * daysPerPage,
    safeDayPage * daysPerPage + daysPerPage
  );

  function updateField(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!selected) {
      setStatus('error');
      setMessage('Selecciona primero un horario.');
      return;
    }

    setStatus('submitting');
    setMessage('');

    try {
      const recaptcha_token = await getRecaptchaToken('booking_create');
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          service: serviceKey,
          start: selected.start,
          recaptcha_token,
          booking_auth: bookingAuth ?? undefined,
          company_id: companyId ?? undefined,
          manage_token: manageToken ?? undefined,
          origin: origin ?? undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401 && redirectToLoginForEntityOnboarding(serviceKey, companyId)) return;
        if (res.status === 409) await loadAvailability();
        throw new Error(data.error ?? 'No se pudo completar la reserva.');
      }

      setMeetingUrl(data.meetingUrl ?? null);
      setStatus('success');
      setMessage(
        data.emailSent === false
          ? 'La cita está confirmada, pero no hemos podido enviar el correo de confirmación. Conserva el enlace de Google Meet que aparece aquí.'
          : 'La cita está confirmada. Te hemos enviado la invitación y la confirmación por email.'
      );
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'No se pudo completar la reserva.');
    }
  }

  if (status === 'success') {
    return (
      <div className="border border-[#D4A017]/25 bg-white p-8 shadow-[0_4px_24px_rgba(13,27,42,0.07)]">
        <CheckCircle2 className="h-12 w-12 text-[#D4A017]" />
        <h2 className="mt-4 font-serif text-2xl font-bold">Cita confirmada</h2>
        <p className="mt-3 text-sm leading-6 text-[#374151]">{message}</p>
        {selected && (
          <div className="mt-5 border border-[#D4A017]/20 bg-[#F8F6F1] p-4 text-sm">
            <p className="font-bold">{availability?.service?.label}</p>
            <p className="mt-1 text-[#52606d]">{selected.label} · hora peninsular española</p>
          </div>
        )}
        {meetingUrl && (
          <a
            href={meetingUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 bg-[#D4A017] px-5 py-3 text-sm font-bold text-[#0D1B2A] sm:w-auto"
          >
            <Video className="h-4 w-4" />
            Abrir Google Meet
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border border-[#D4A017]/25 bg-white p-6 shadow-[0_4px_24px_rgba(13,27,42,0.07)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4A017]">Agenda EXPERT</p>
            <h2 className="mt-1 font-serif text-2xl font-bold">
              {availability?.service?.label ?? 'Reserva tu cita'}
            </h2>
          </div>
          {availability?.service && serviceKey !== 'demo-holded' && (
            <div className="flex items-center gap-2 text-xs font-semibold text-[#52606d]">
              <Clock className="h-4 w-4 text-[#D4A017]" />
              {availability.service.durationMinutes} min
            </div>
          )}
        </div>

        {loadingSlots ? (
          <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-[#52606d]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Consultando disponibilidad...
          </div>
        ) : availabilityError ? (
          <div className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {availabilityError}
          </div>
        ) : groups.length === 0 ? (
          <div className="mt-6 border border-[#D4A017]/20 bg-[#F8F6F1] p-5 text-sm text-[#52606d]">
            No hay huecos disponibles en los próximos 14 días. Puedes volver a comprobarlo más tarde.
          </div>
        ) : (
          <div className="mt-6">
            <div className="grid gap-3 md:grid-cols-3">
              {visibleGroups.map(([date, slots]) => (
                <div key={date} className="border border-[#D4A017]/20 bg-[#F8F6F1] p-4">
                  <div className="flex items-center gap-2 text-sm font-bold capitalize text-[#0D1B2A]">
                    <CalendarDays className="h-4 w-4 text-[#D4A017]" />
                    {dateLabel(date)}
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {slots.map((slot) => {
                      const active = selected?.start === slot.start;
                      return (
                        <button
                          key={slot.start}
                          type="button"
                          onClick={() => setSelected(slot)}
                          className={
                            active
                              ? 'min-h-11 border border-[#D4A017] bg-[#D4A017] px-2 py-2 text-sm font-bold text-[#0D1B2A]'
                              : 'min-h-11 border border-[#D4A017]/30 bg-white px-2 py-2 text-sm font-semibold text-[#23364D] hover:border-[#D4A017]'
                          }
                        >
                          {slot.time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {pageCount > 1 && (
              <div className="mt-4 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setDayPage((current) => Math.max(0, current - 1))}
                  disabled={safeDayPage === 0}
                  className="min-h-11 border border-[#D4A017]/30 px-3 py-2 text-xs font-bold text-[#23364D] disabled:cursor-not-allowed disabled:opacity-40 sm:px-4"
                >
                  Anterior
                </button>
                <span className="text-center text-xs font-semibold text-[#52606d]">
                  {safeDayPage + 1} / {pageCount}
                </span>
                <button
                  type="button"
                  onClick={() => setDayPage((current) => Math.min(pageCount - 1, current + 1))}
                  disabled={safeDayPage >= pageCount - 1}
                  className="min-h-11 border border-[#D4A017]/30 px-3 py-2 text-xs font-bold text-[#23364D] disabled:cursor-not-allowed disabled:opacity-40 sm:px-4"
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <form onSubmit={submit} className="border border-[#D4A017]/25 bg-white p-6 shadow-[0_4px_24px_rgba(13,27,42,0.07)]">
        <input
          type="text"
          name="hp_url"
          value={form.hp_url}
          onChange={updateField}
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
        />

        <h3 className="font-serif text-xl font-bold">Tus datos</h3>
        {selected ? (
          <p className="mt-2 text-sm text-[#52606d]">
            Horario seleccionado: <strong>{selected.label}</strong>
          </p>
        ) : (
          <p className="mt-2 text-sm text-[#52606d]">Selecciona un horario antes de confirmar.</p>
        )}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-bold uppercase tracking-wide">
            Nombre *
            <input
              name="name"
              value={form.name}
              onChange={updateField}
              required
              minLength={2}
              className="mt-2 w-full border border-[#D4A017]/30 px-4 py-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-[#D4A017]"
            />
          </label>
          <label className="text-xs font-bold uppercase tracking-wide">
            Email *
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={updateField}
              required
              className="mt-2 w-full border border-[#D4A017]/30 px-4 py-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-[#D4A017]"
            />
          </label>
          <label className="text-xs font-bold uppercase tracking-wide sm:col-span-2">
            Teléfono *
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={updateField}
              required
              className="mt-2 w-full border border-[#D4A017]/30 px-4 py-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-[#D4A017]"
            />
          </label>
          <label className="text-xs font-bold uppercase tracking-wide sm:col-span-2">
            Comentario opcional
            <textarea
              name="notes"
              value={form.notes}
              onChange={updateField}
              rows={3}
              maxLength={800}
              className="mt-2 w-full resize-none border border-[#D4A017]/30 px-4 py-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-[#D4A017]"
            />
          </label>
        </div>

        {status === 'error' && (
          <p className="mt-4 text-sm font-semibold text-red-600">{message}</p>
        )}

        <button
          type="submit"
          disabled={!selected || status === 'submitting'}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 bg-[#D4A017] px-6 py-3 text-sm font-bold text-[#0D1B2A] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === 'submitting' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Confirmando...
            </>
          ) : (
            <>
              <Video className="h-4 w-4" />
              Confirmar cita por Google Meet
            </>
          )}
        </button>
      </form>
    </div>
  );
}
