import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import {
  createCalendarMeetingSA,
  deleteCalendarEventSA,
  listCalendarBusyWindowsSA,
} from '@/lib/integrations/google-calendar';
import { sendEmail } from '@/lib/email/send';
import { citaConfirmed } from '@/lib/email/templates';
import { verifyRecaptchaToken } from '@/lib/utils/recaptcha';
import { checkRateLimit, checkSpam, getClientIp } from '@/lib/utils/spam-guard';
import {
  BOOKING_CLOSE_HOUR,
  BOOKING_OPEN_HOUR,
  BOOKING_SLOT_STEP_MINUTES,
  BOOKING_TIMEZONE,
  formatMadridDate,
  formatMadridTime,
  getBookingService,
  isMadridWeekday,
  madridLocalToDate,
  overlapsBusy,
} from '@/lib/booking/native-booking';

const schema = z.object({
  hp_url: z.string().optional(),
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(6).max(30),
  service: z.string().min(2).max(80),
  start: z.string().datetime({ offset: true }),
  notes: z.string().trim().max(800).optional(),
  recaptcha_token: z.string().optional(),
});

async function authenticatedUser(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  return user ?? null;
}

function isValidServiceSlot(start: Date, durationMinutes: number): boolean {
  if (!Number.isFinite(start.getTime())) return false;
  if (!isMadridWeekday(start)) return false;
  if (start.getTime() < Date.now() + 30 * 60_000) return false;

  const time = formatMadridTime(start);
  const [hour, minute] = time.split(':').map(Number);
  const minuteOfDay = hour * 60 + minute;
  if (minute % BOOKING_SLOT_STEP_MINUTES !== 0) return false;
  if (minuteOfDay < BOOKING_OPEN_HOUR * 60) return false;
  if (minuteOfDay + durationMinutes > BOOKING_CLOSE_HOUR * 60) return false;

  const localDate = formatMadridDate(start);
  const roundTrip = madridLocalToDate(localDate, time);
  return Math.abs(roundTrip.getTime() - start.getTime()) < 60_000;
}

export async function POST(request: NextRequest) {
  let appointmentId: string | null = null;
  let googleEventId: string | null = null;

  try {
    const body = await request.json();

    if (String(body.hp_url ?? '').trim()) {
      return NextResponse.json({ ok: true });
    }

    const ip = getClientIp(request.headers);
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Inténtalo más tarde.' }, { status: 429 });
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }, { status: 400 });
    }

    const input = parsed.data;
    const service = getBookingService(input.service);
    if (!service) {
      return NextResponse.json({ error: 'Tipo de cita no válido.' }, { status: 400 });
    }

    const user = await authenticatedUser(request);
    if (!service.public && !user) {
      return NextResponse.json({ error: 'Inicia sesión para reservar este tipo de cita.' }, { status: 401 });
    }

    const spam = checkSpam({ name: input.name, email: input.email, message: input.notes });
    if (spam.isSpam) return NextResponse.json({ ok: true });

    const recaptcha = await verifyRecaptchaToken({
      token: String(input.recaptcha_token ?? ''),
      action: 'booking_create',
    });
    if (!recaptcha.ok) {
      return NextResponse.json({ error: 'Verificación anti-spam fallida. Inténtalo de nuevo.' }, { status: 400 });
    }

    const start = new Date(input.start);
    if (!isValidServiceSlot(start, service.durationMinutes)) {
      return NextResponse.json({ error: 'El horario seleccionado no es válido.' }, { status: 400 });
    }
    const end = new Date(start.getTime() + service.durationMinutes * 60_000);

    // Google is the external source of truth for calendar occupancy. Check it
    // immediately before acquiring the local booking lock.
    const googleBusy = await listCalendarBusyWindowsSA(
      start.toISOString(),
      end.toISOString()
    );
    const busy = googleBusy.map((window) => ({
      start: new Date(window.start),
      end: new Date(window.end),
    }));
    if (overlapsBusy(start, end, busy)) {
      return NextResponse.json({ error: 'Ese horario acaba de ocuparse. Elige otro.' }, { status: 409 });
    }

    const admin = getSupabaseAdmin();

    // Release stale local locks from interrupted booking attempts. Only the
    // temporary state is eligible for cleanup; confirmed appointments are
    // never touched here.
    const staleCutoff = new Date(Date.now() - 10 * 60_000).toISOString();
    await admin
      .from('appointments')
      .delete()
      .eq('status', 'pending_calendar')
      .lt('created_at', staleCutoff);

    const localDate = formatMadridDate(start);
    const localTime = formatMadridTime(start);

    const { data: appointment, error: insertError } = await admin
      .from('appointments')
      .insert({
        name: input.name,
        email: input.email.toLowerCase(),
        phone: input.phone,
        appointment_type: service.key,
        appointment_date: start.toISOString(),
        appointment_end: end.toISOString(),
        notes: input.notes ?? null,
        status: 'pending_calendar',
        preferred_date: localDate,
        preferred_time: localTime,
        confirmed_date: localDate,
        confirmed_time: localTime,
        service: service.label,
        booking_provider: 'google_native',
        provider_booking_id: null,
        meeting_url: null,
      })
      .select('id')
      .single();

    if (insertError || !appointment?.id) {
      if (insertError?.code === '23P01') {
        return NextResponse.json({ error: 'Ese horario acaba de ocuparse. Elige otro.' }, { status: 409 });
      }
      console.error('[booking] appointment lock insert:', insertError);
      return NextResponse.json({ error: 'No se pudo reservar el horario.' }, { status: 500 });
    }

    appointmentId = appointment.id;

    const meeting = await createCalendarMeetingSA({
      summary: `${service.label} — ${input.name}`,
      description: [
        `Reserva creada desde EXPERT.`,
        `Cliente: ${input.name} (${input.email})`,
        `Teléfono: ${input.phone}`,
        input.notes ? `Notas: ${input.notes}` : '',
        appointmentId ? `EXPERT appointment: ${appointmentId}` : '',
      ].filter(Boolean).join('\n'),
      start: start.toISOString(),
      end: end.toISOString(),
      attendeeEmail: input.email.toLowerCase(),
      timezone: BOOKING_TIMEZONE,
      reminderMinutesBefore: service.durationMinutes >= 60 ? [1440, 60] : [1440, 30],
    });
    googleEventId = meeting.eventId;

    const { error: finalizeError } = await admin
      .from('appointments')
      .update({
        status: 'confirmed',
        google_event_id: meeting.eventId,
        provider_booking_id: meeting.eventId,
        meeting_url: meeting.meetUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', appointmentId);

    if (finalizeError) {
      throw new Error(`Could not finalize appointment: ${finalizeError.message}`);
    }

    const formattedDate = new Intl.DateTimeFormat('es-ES', {
      timeZone: BOOKING_TIMEZONE,
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(start);

    await sendEmail({
      to: input.email,
      eventType: 'cita.confirmed',
      ...citaConfirmed(input.name, service.label, formattedDate, localTime, meeting.meetUrl),
      metadata: {
        appointment_id: appointmentId,
        google_event_id: meeting.eventId,
        booking_provider: 'google_native',
      },
      idempotencyKey: `booking/confirmed/${appointmentId}`,
    }).catch((error) => console.error('[booking] confirmation email:', error));

    return NextResponse.json({
      ok: true,
      appointmentId,
      start: start.toISOString(),
      end: end.toISOString(),
      meetingUrl: meeting.meetUrl,
    });
  } catch (error) {
    console.error('[booking]', error);

    const admin = getSupabaseAdmin();
    if (googleEventId) {
      await deleteCalendarEventSA(googleEventId).catch(() => {});
    }
    if (appointmentId) {
      try {
        await admin.from('appointments').delete().eq('id', appointmentId);
      } catch {
        // Best-effort compensation. The pending row no longer blocks once
        // status/cleanup is reconciled by the operational audit.
      }
    }

    return NextResponse.json({ error: 'No se pudo completar la reserva. El horario ha sido liberado.' }, { status: 500 });
  }
}
