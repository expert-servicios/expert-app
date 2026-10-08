import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import {
  BookingCalendarCreationError,
  BookingCalendarDeletionError,
  createBookingCalendarMeeting,
  deleteBookingCalendarEvent,
  getConfiguredBookingCalendarProvider,
  listBookingCalendarBusyWindows,
} from '@/lib/booking/calendar-provider';
import {
  BOOKING_CLOSE_HOUR,
  BOOKING_MAX_DAYS,
  BOOKING_OPEN_HOUR,
  BOOKING_SLOT_STEP_MINUTES,
  BOOKING_TIMEZONE,
  buildBookingSlots,
  formatMadridDate,
  formatMadridTime,
  getBookingService,
  isMadridWeekday,
  madridLocalToDate,
  overlapsBusy,
  type BookingServiceKey,
  type BusyRange,
} from '@/lib/booking/native-booking';
import { ensureBookingAdminTask, cancelBookingAdminTask } from '@/lib/booking/booking-admin-task';
import { createBookingManagementToken, bookingManagementUrls } from '@/lib/booking/booking-management-token';
import { buildBookingIcs } from '@/lib/booking/calendar-invite';
import { sendBookingEmail } from '@/lib/booking/booking-email';
import { citaConfirmed } from '@/lib/email/templates';
import { refreshAdminDailyAgenda } from '@/lib/admin/admin-daily-agenda';

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

const KIA_PUBLIC_BOOKING_SERVICES = new Set<BookingServiceKey>([
  'consulta-inicial',
  'demo-holded',
  'academy-admision',
]);

function assertPublicService(serviceKey: string) {
  const service = getBookingService(serviceKey);
  if (!service || !service.public || !KIA_PUBLIC_BOOKING_SERVICES.has(service.key)) {
    throw new Error('kia_booking_service_not_allowed');
  }
  return service;
}

function validExactSlot(start: Date, durationMinutes: number) {
  if (!Number.isFinite(start.getTime())) return false;
  if (!isMadridWeekday(start)) return false;
  const now = Date.now();
  if (start.getTime() < now + 30 * 60_000) return false;
  if (start.getTime() > now + BOOKING_MAX_DAYS * 24 * 60 * 60_000) return false;

  const localDate = formatMadridDate(start);
  const localTime = formatMadridTime(start);
  const [hour, minute] = localTime.split(':').map(Number);
  const minuteOfDay = hour * 60 + minute;
  if (minute % BOOKING_SLOT_STEP_MINUTES !== 0) return false;
  if (minuteOfDay < BOOKING_OPEN_HOUR * 60) return false;
  if (minuteOfDay + durationMinutes > BOOKING_CLOSE_HOUR * 60) return false;

  const roundTrip = madridLocalToDate(localDate, localTime);
  if (Math.abs(roundTrip.getTime() - start.getTime()) >= 60_000) return false;

  const serviceEnd = new Date(start.getTime() + durationMinutes * 60_000);
  return formatMadridDate(serviceEnd) === localDate;
}

function latestUserText(contextMessages: Array<{ role: string; text: string }>) {
  return [...contextMessages].reverse().find((message) => message.role === 'user')?.text ?? '';
}

function hasExplicitSlotConfirmation(message: string, start: Date) {
  const normalized = message
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const localDate = formatMadridDate(start);
  const localTime = formatMadridTime(start);
  const [year, month, day] = localDate.split('-');
  const [hour, minute] = localTime.split(':');

  const negative = /(?:^|[\s,.;:!?])(no\s+(?:quiero|queremos|reserves?|reservar|confirmo|confirmamos|me\s+va\s+bien|nos\s+va\s+bien)|mejor\s+no|cancel(?:a|ar|emos|en)|anul(?:a|ar|emos|en)|no\s+puedo|no\s+podemos)(?:$|[\s,.;:!?])/i.test(normalized);
  if (negative) return false;

  const affirmative = /(?:^|[\s,.;:!?])(confirmo|confirmamos|confirmado|si|vale|perfecto|de acuerdo|adelante|reserva(?:r)?|me va bien|nos va bien)(?:$|[\s,.;:!?])/i.test(normalized);

  const explicitDates = Array.from(
    normalized.matchAll(/(?:^|\D)(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?(?=\D|$)/g),
  ).map((match) => ({
    day: Number(match[1]),
    month: Number(match[2]),
    year: match[3] ? Number(match[3].length === 2 ? `20${match[3]}` : match[3]) : null,
  }));
  const exactDateMention = explicitDates.some((value) =>
    value.day === Number(day)
    && value.month === Number(month)
    && (value.year === null || value.year === Number(year)),
  );
  const conflictingDate = explicitDates.some((value) =>
    value.day === Number(day)
    && value.month === Number(month)
    && value.year !== null
    && value.year !== Number(year),
  );

  const explicitTimes = Array.from(
    normalized.matchAll(/(?:^|\D)(\d{1,2}):(\d{2})\s*(?:h)?(?=\D|$)/g),
  ).map((match) => `${String(Number(match[1])).padStart(2, '0')}:${match[2]}`);
  const exactTimeMention = explicitTimes.includes(localTime);
  const conflictingTime = explicitTimes.some((value) => value !== localTime);

  return affirmative && exactDateMention && !conflictingDate && exactTimeMention && !conflictingTime;
}

async function currentBusy(admin: AdminClient, start: Date, end: Date): Promise<BusyRange[]> {
  const calendarBusy = await listBookingCalendarBusyWindows(
    start.toISOString(),
    end.toISOString(),
    getConfiguredBookingCalendarProvider(),
  );
  const { data, error } = await admin
    .from('appointments')
    .select('appointment_date,appointment_end,status,created_at')
    .in('status', ['pending_calendar', 'confirmed'])
    .not('appointment_end', 'is', null)
    .lt('appointment_date', end.toISOString())
    .gt('appointment_end', start.toISOString());
  if (error) throw error;

  const pendingCutoff = Date.now() - 10 * 60_000;
  const dbBusy = (data ?? [])
    .filter((row) => row.status !== 'pending_calendar' || new Date(row.created_at as string).getTime() >= pendingCutoff)
    .filter((row) => Boolean(row.appointment_date && row.appointment_end))
    .map((row) => ({
      start: new Date(row.appointment_date as string),
      end: new Date(row.appointment_end as string),
    }));

  return [
    ...calendarBusy.map((window) => ({ start: new Date(window.start), end: new Date(window.end) })),
    ...dbBusy,
  ].filter((window) => Number.isFinite(window.start.getTime()) && Number.isFinite(window.end.getTime()));
}

export async function getKiaBookingAvailability(input: {
  serviceKey: string;
  days: number;
}) {
  const service = assertPublicService(input.serviceKey);
  const admin = getSupabaseAdmin();
  const days = Math.max(1, Math.min(Math.trunc(input.days), 14));
  const now = new Date();
  const rangeEnd = new Date(now.getTime() + (days + 1) * 24 * 60 * 60_000);
  const busy = await currentBusy(admin, now, rangeEnd);
  const slots = buildBookingSlots({
    from: now,
    days,
    durationMinutes: service.durationMinutes,
    busy,
    now,
  }).slice(0, 12);

  return {
    service: service.key,
    serviceLabel: service.label,
    timezone: BOOKING_TIMEZONE,
    slots: slots.map((slot) => ({
      start: slot.start,
      end: slot.end,
      label: slot.label,
      confirmationInstruction: `Para reservar, confirma por escrito la fecha ${slot.date} y la hora ${slot.time}.`,
    })),
  };
}

export async function createKiaConfirmedBooking(input: {
  serviceKey: string;
  startIso: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone?: string | null;
  notes?: string | null;
  clientId?: string | null;
  companyId?: string | null;
  leadId?: string | null;
  confirmationMessage: string;
  contextMessages: Array<{ role: string; text: string }>;
}) {
  const service = assertPublicService(input.serviceKey);
  const start = new Date(input.startIso);
  if (!validExactSlot(start, service.durationMinutes)) {
    throw new Error('kia_booking_invalid_slot');
  }
  const confirmationMessage = input.confirmationMessage || latestUserText(input.contextMessages);
  if (!hasExplicitSlotConfirmation(confirmationMessage, start)) {
    throw new Error('kia_booking_explicit_confirmation_required');
  }

  const admin = getSupabaseAdmin();
  const end = new Date(start.getTime() + service.durationMinutes * 60_000);
  const busy = await currentBusy(admin, start, end);
  if (overlapsBusy(start, end, busy)) throw new Error('kia_booking_slot_no_longer_available');

  const staleCutoff = new Date(Date.now() - 10 * 60_000).toISOString();
  await admin.from('appointments').delete().eq('status', 'pending_calendar').lt('created_at', staleCutoff);

  const localDate = formatMadridDate(start);
  const localTime = formatMadridTime(start);
  const provider = getConfiguredBookingCalendarProvider();
  let appointmentId: string | null = null;
  let providerEventId: string | null = null;

  try {
    const { data: appointment, error: insertError } = await admin
      .from('appointments')
      .insert({
        name: input.attendeeName,
        email: input.attendeeEmail.toLowerCase(),
        phone: input.attendeePhone?.trim() || 'No facilitado',
        appointment_type: service.key,
        appointment_date: start.toISOString(),
        appointment_end: end.toISOString(),
        notes: input.notes ?? 'Reserva creada por KIA tras confirmación explícita del cliente.',
        status: 'pending_calendar',
        preferred_date: localDate,
        preferred_time: localTime,
        confirmed_date: localDate,
        confirmed_time: localTime,
        service: service.label,
        client_id: input.clientId ?? null,
        company_id: input.companyId ?? null,
        booking_provider: provider === 'ms365' ? 'ms365_native' : 'google_native',
      })
      .select('id')
      .single();
    if (insertError || !appointment?.id) {
      if (insertError?.code === '23P01') throw new Error('kia_booking_slot_no_longer_available');
      throw insertError ?? new Error('kia_booking_insert_failed');
    }
    const confirmedAppointmentId = appointment.id;
    appointmentId = confirmedAppointmentId;

    const meeting = await createBookingCalendarMeeting({
      summary: `${service.label} — ${input.attendeeName}`,
      description: [
        'Reserva creada por KIA desde EXPERT.',
        `Cliente: ${input.attendeeName} (${input.attendeeEmail})`,
        `EXPERT appointment: ${confirmedAppointmentId}`,
      ].filter(Boolean).join('\n'),
      start: start.toISOString(),
      end: end.toISOString(),
      attendeeEmail: input.attendeeEmail.toLowerCase(),
      timezone: BOOKING_TIMEZONE,
      reminderMinutesBefore: service.durationMinutes >= 60 ? [1440, 60] : [1440, 30],
    }, provider);
    providerEventId = meeting.eventId;
    const meetingUrl = meeting.meetingUrl;
    if (!meetingUrl) {
      throw new Error('kia_booking_meet_unavailable');
    }

    const { error: finalizeError } = await admin.from('appointments').update({
      status: 'confirmed',
      google_event_id: meeting.provider === 'google' ? meeting.eventId : null,
      booking_provider: meeting.bookingProvider,
      provider_booking_id: meeting.eventId,
      meeting_url: meetingUrl,
      updated_at: new Date().toISOString(),
    }).eq('id', confirmedAppointmentId);
    if (finalizeError) throw finalizeError;

    await ensureBookingAdminTask({
      admin,
      appointmentId: confirmedAppointmentId,
      serviceKey: service.key,
      serviceLabel: service.label,
      name: input.attendeeName,
      email: input.attendeeEmail.toLowerCase(),
      localDate,
      localTime,
      meetingUrl: meetingUrl,
      clientId: input.clientId ?? null,
      companyId: input.companyId ?? null,
      leadId: input.leadId ?? null,
    });

    await refreshAdminDailyAgenda(admin).catch((agendaError) => {
      console.error('[kia-booking] agenda refresh failed:', agendaError);
    });

    const managementToken = await createBookingManagementToken({
      appointmentId: confirmedAppointmentId,
      email: input.attendeeEmail.toLowerCase(),
      service: service.key,
    });
    const managementLinks = bookingManagementUrls(managementToken, service.key);
    const formattedDate = new Intl.DateTimeFormat('es-ES', {
      timeZone: BOOKING_TIMEZONE,
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(start);
    const template = citaConfirmed(
      input.attendeeName,
      service.label,
      formattedDate,
      localTime,
      meetingUrl,
      managementLinks,
    );
    const ics = buildBookingIcs({
      appointmentId: confirmedAppointmentId,
      service: service.label,
      start,
      end,
      meetingUrl: meetingUrl,
      attendeeEmail: input.attendeeEmail.toLowerCase(),
    });
    try {
      await sendBookingEmail({
        to: input.attendeeEmail.toLowerCase(),
        eventType: 'cita.confirmed',
        ...template,
        metadata: {
          appointment_id: confirmedAppointmentId,
          booking_provider: meeting.bookingProvider,
          source: 'kia',
        },
        idempotencyKey: `kia/booking/confirmed/${confirmedAppointmentId}`,
        attachments: [{
          filename: 'cita-expert.ics',
          content: Buffer.from(ics, 'utf8').toString('base64'),
          type: 'text/calendar; charset=utf-8',
        }],
      });
    } catch (emailError) {
      console.error('[kia-booking] confirmation email failed; booking retained:', emailError);
    }

    return {
      appointmentId: confirmedAppointmentId,
      service: service.label,
      start: start.toISOString(),
      end: end.toISOString(),
      meetingUrl: meetingUrl,
      cancelUrl: managementLinks.cancelUrl,
      rescheduleUrl: managementLinks.rescheduleUrl,
      timezone: BOOKING_TIMEZONE,
    };
  } catch (error) {
    if (!providerEventId && error instanceof BookingCalendarCreationError) {
      providerEventId = error.eventId;
    }
    let remoteCleanupSucceeded = true;
    if (providerEventId) {
      try {
        await deleteBookingCalendarEvent(providerEventId, provider);
      } catch (cleanupError) {
        if (!(cleanupError instanceof BookingCalendarDeletionError && cleanupError.remoteDeleted)) {
          remoteCleanupSucceeded = false;
        }
      }
    }
    if (appointmentId) {
      await cancelBookingAdminTask(
        admin,
        appointmentId,
        'Reserva KIA revertida durante compensación por error.',
      ).catch(() => {});
      if (remoteCleanupSucceeded) {
        await admin.from('appointments').delete().eq('id', appointmentId);
      } else {
        await admin.from('appointments').update({
          status: 'cancelled',
          provider_booking_id: providerEventId,
          google_event_id: provider === 'google' ? providerEventId : null,
          admin_notes: 'KIA booking cleanup failed; manual reconciliation required.',
          updated_at: new Date().toISOString(),
        }).eq('id', appointmentId);
      }
    }
    throw error;
  }
}
