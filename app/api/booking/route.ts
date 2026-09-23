import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import {
  createCalendarMeetingSA,
  deleteCalendarEventSA,
  listCalendarBusyWindowsSA,
} from '@/lib/integrations/google-calendar';
import { sendEmail } from '@/lib/email/send';
import { caseOpened, citaConfirmed } from '@/lib/email/templates';
import { onboardingPreparationEmail } from '@/lib/email/onboarding-templates';
import { ensureOnboardingTask, findOpenOnboardingCase } from '@/lib/admin/onboarding-followup';
import { getAdminNotificationEmails } from '@/lib/admin/admin-notification-recipients';
import { getAuthorizedBookingEmails, resolveAuthenticatedBookingIdentity, type BookingIdentity } from '@/lib/admin/onboarding-booking-identity';
import { verifyRecaptchaToken } from '@/lib/utils/recaptcha';
import { checkRateLimit, checkSpam, getClientIp } from '@/lib/utils/spam-guard';
import {
  BOOKING_CLOSE_HOUR,
  BOOKING_MAX_DAYS,
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
  const now = Date.now();
  if (start.getTime() < now + 30 * 60_000) return false;
  if (start.getTime() > now + BOOKING_MAX_DAYS * 24 * 60 * 60_000) return false;

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

async function runNativeAdministrativeWorkflow(input: {
  admin: ReturnType<typeof getSupabaseAdmin>;
  identity: BookingIdentity;
  serviceKey: 'onboarding' | 'formacion-holded';
  appointmentId: string;
  name: string;
  email: string;
  start: Date;
  localDate: string;
  localTime: string;
  meetingUrl: string;
}) {
  const { admin, identity } = input;
  const serviceLabel = input.serviceKey === 'onboarding' ? 'Sesión de onboarding' : 'Formación Holded';
  let caseId: string | null = null;
  let createdCase = false;

  if (input.serviceKey === 'onboarding') {
    const existing = await findOpenOnboardingCase(identity.clientId, identity.companyId);
    if (existing) caseId = existing.id;
  }

  if (!caseId) {
    let existingQuery = admin
      .from('cases')
      .select('id')
      .eq('client_id', identity.clientId)
      .eq('service', serviceLabel)
      .neq('state', 'finalizado');
    existingQuery = identity.companyId
      ? existingQuery.eq('company_id', identity.companyId)
      : existingQuery.is('company_id', null);
    const { data: existingCase, error: existingError } = await existingQuery
      .order('opened_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existingError) throw existingError;
    caseId = existingCase?.id ?? null;
  }

  if (!caseId) {
    const { data: newCase, error } = await admin
      .from('cases')
      .insert({
        client_id: identity.clientId,
        company_id: identity.companyId,
        category: input.serviceKey === 'onboarding' ? 'onboarding' : 'formacion',
        service: serviceLabel,
        state: 'en_proceso',
        status: 'nuevo',
        next_action: input.serviceKey === 'onboarding'
          ? 'Verificar Holded y finalizar el alta'
          : null,
        admin_note: `Expediente creado automáticamente desde reserva nativa EXPERT (${input.appointmentId})`,
        opened_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    if (error || !newCase) throw error ?? new Error('Could not create booking case');
    caseId = newCase.id;
    createdCase = true;
  } else if (input.serviceKey === 'onboarding') {
    await admin
      .from('cases')
      .update({
        next_action: `Onboarding reservado para ${input.start.toISOString()}. Verificar Holded y finalizar el alta.`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', caseId);
  }

  if (input.serviceKey === 'onboarding') {
    let subscriptionQuery = admin
      .from('subscriptions')
      .select('id,company_id')
      .eq('client_id', identity.clientId)
      .in('status', ['active', 'trialing'])
      .is('post_purchase_onboarding_at', null);
    subscriptionQuery = identity.companyId
      ? subscriptionQuery.eq('company_id', identity.companyId)
      : subscriptionQuery.is('company_id', null);
    const { data: activeSubscription, error: subscriptionError } = await subscriptionQuery
      .limit(1)
      .maybeSingle();
    if (subscriptionError) throw subscriptionError;
    if (activeSubscription) {
      await ensureOnboardingTask({
        clientId: identity.clientId,
        companyId: activeSubscription.company_id,
        caseId,
        dueDate: input.localDate,
        priority: 'alta',
        description: `Onboarding reservado para ${input.localDate} ${input.localTime}. Verificar conexión Holded y finalizar el alta después de la sesión.`,
      });
    }

    const preparation = onboardingPreparationEmail({
      name: input.name,
      meetingDate: new Intl.DateTimeFormat('es-ES', {
        timeZone: BOOKING_TIMEZONE,
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(input.start),
      meetingTime: input.localTime,
      meetingUrl: input.meetingUrl,
    });
    await sendEmail({
      to: bookingEmail,
      eventType: 'onboarding.preparation',
      ...preparation,
      metadata: {
        appointment_id: input.appointmentId,
        booking_provider: 'google_native',
        onboarding_phase: 'pre_meeting',
      },
      idempotencyKey: `native/onboarding-preparation/${input.appointmentId}`,
    });
  }

  if (createdCase && caseId) {
    await sendEmail({
      to: input.email,
      eventType: 'case.opened',
      ...caseOpened(input.name, serviceLabel, null, ''),
      metadata: {
        case_id: caseId,
        company_id: identity.companyId,
        source: 'native_booking',
        appointment_id: input.appointmentId,
      },
      idempotencyKey: `native/case-opened/${input.appointmentId}`,
    });
  }

  const adminEmails = await getAdminNotificationEmails();
  if (adminEmails.length) {
    await sendEmail({
      to: adminEmails,
      eventType: 'onboarding.booking.admin',
      subject: `Reserva ${serviceLabel} — ${input.name}`,
      html: `<p>Nueva reserva administrativa registrada en EXPERT.</p><p><strong>Cliente:</strong> ${input.name} (${input.email})</p><p><strong>Servicio:</strong> ${serviceLabel}</p><p><strong>Inicio:</strong> ${input.start.toISOString()}</p><p><strong>Reunión:</strong> ${input.meetingUrl}</p>`,
      metadata: {
        appointment_id: input.appointmentId,
        company_id: identity.companyId,
        booking_provider: 'google_native',
      },
      idempotencyKey: `native/admin-booking/${input.appointmentId}`,
    });
  }
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

    const admin = getSupabaseAdmin();
    let bookingEmail = input.email.toLowerCase();
    let privateIdentity: BookingIdentity | null = null;
    if (!service.public && user) {
      if (!user.email) {
        return NextResponse.json({ error: 'La cuenta autenticada no tiene un email válido.' }, { status: 400 });
      }
      privateIdentity = await resolveAuthenticatedBookingIdentity(admin, user.id);
      const authorizedEmails = await getAuthorizedBookingEmails(
        admin,
        user.id,
        privateIdentity.companyId,
        user.email
      );
      const requestedEmail = input.email.toLowerCase();
      bookingEmail = authorizedEmails.includes(requestedEmail)
        ? requestedEmail
        : user.email.toLowerCase();
    }

    const spam = checkSpam({ name: input.name, email: bookingEmail, message: input.notes });
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
        email: bookingEmail,
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
        `Cliente: ${input.name} (${bookingEmail})`,
        `Teléfono: ${input.phone}`,
        input.notes ? `Notas: ${input.notes}` : '',
        appointmentId ? `EXPERT appointment: ${appointmentId}` : '',
      ].filter(Boolean).join('\n'),
      start: start.toISOString(),
      end: end.toISOString(),
      attendeeEmail: bookingEmail,
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

    if (
      privateIdentity &&
      (service.key === 'onboarding' || service.key === 'formacion-holded') &&
      meeting.meetUrl
    ) {
      await runNativeAdministrativeWorkflow({
        admin,
        identity: privateIdentity,
        serviceKey: service.key,
        appointmentId,
        name: input.name,
        email: bookingEmail,
        start,
        localDate,
        localTime,
        meetingUrl: meeting.meetUrl,
      }).catch((workflowError) => {
        console.error('[booking] administrative workflow:', workflowError);
      });
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
    let remoteCleanupSucceeded = true;
    if (googleEventId) {
      try {
        await deleteCalendarEventSA(googleEventId);
      } catch (cleanupError) {
        remoteCleanupSucceeded = false;
        console.error('[booking] calendar compensation failed:', cleanupError);
      }
    }
    if (appointmentId) {
      try {
        if (remoteCleanupSucceeded) {
          await admin.from('appointments').delete().eq('id', appointmentId);
        } else {
          await admin
            .from('appointments')
            .update({
              status: 'cancelled',
              admin_notes: 'Google Calendar cleanup failed after booking error. Reconcile remote event before deleting this row.',
              updated_at: new Date().toISOString(),
            })
            .eq('id', appointmentId);
        }
      } catch (cleanupError) {
        console.error('[booking] local compensation failed:', cleanupError);
      }
    }

    return NextResponse.json({ error: 'No se pudo completar la reserva. El horario ha sido liberado.' }, { status: 500 });
  }
}
