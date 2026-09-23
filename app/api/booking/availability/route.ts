import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { listCalendarBusyWindowsSA } from '@/lib/integrations/google-calendar';
import {
  BOOKING_MAX_DAYS,
  buildBookingSlots,
  getBookingService,
  type BusyRange,
} from '@/lib/booking/native-booking';

async function hasAuthenticatedUser(request: NextRequest): Promise<boolean> {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  return Boolean(user);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const service = getBookingService(searchParams.get('service') ?? 'consulta-inicial');
    if (!service) {
      return NextResponse.json({ error: 'Tipo de cita no válido.' }, { status: 400 });
    }

    if (!service.public && !(await hasAuthenticatedUser(request))) {
      return NextResponse.json({ error: 'Inicia sesión para reservar este tipo de cita.' }, { status: 401 });
    }

    const requestedDays = Number(searchParams.get('days') ?? 14);
    const days = Number.isFinite(requestedDays)
      ? Math.max(1, Math.min(Math.trunc(requestedDays), BOOKING_MAX_DAYS))
      : 14;

    const now = new Date();
    const rangeEnd = new Date(now.getTime() + (days + 1) * 24 * 60 * 60 * 1000);

    const [googleBusy, dbResult] = await Promise.all([
      listCalendarBusyWindowsSA(now.toISOString(), rangeEnd.toISOString()),
      getSupabaseAdmin()
        .from('appointments')
        .select('appointment_date,appointment_end')
        .in('status', ['pending_calendar', 'confirmed'])
        .not('appointment_end', 'is', null)
        .lt('appointment_date', rangeEnd.toISOString())
        .gt('appointment_end', now.toISOString()),
    ]);

    const dbBusy = (dbResult.data ?? [])
      .filter((row) => row.appointment_date && row.appointment_end)
      .map((row) => ({
        start: new Date(row.appointment_date as string),
        end: new Date(row.appointment_end as string),
      }));

    const busy: BusyRange[] = [
      ...googleBusy.map((window) => ({
        start: new Date(window.start),
        end: new Date(window.end),
      })),
      ...dbBusy,
    ].filter((window) => Number.isFinite(window.start.getTime()) && Number.isFinite(window.end.getTime()));

    const slots = buildBookingSlots({
      from: now,
      days,
      durationMinutes: service.durationMinutes,
      busy,
      now,
    });

    return NextResponse.json({
      service: {
        key: service.key,
        label: service.label,
        durationMinutes: service.durationMinutes,
      },
      timezone: 'Europe/Madrid',
      slots,
    });
  } catch (error) {
    console.error('[booking/availability]', error);
    return NextResponse.json({ error: 'No se pudo consultar la agenda.' }, { status: 503 });
  }
}
