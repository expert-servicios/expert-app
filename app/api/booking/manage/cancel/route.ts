import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { verifyBookingManagementToken } from '@/lib/booking/booking-management-token';
import {
  calendarProviderFromBookingProvider,
  deleteBookingCalendarEvent,
} from '@/lib/booking/calendar-provider';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = typeof body?.token === 'string' ? body.token : null;
    const auth = await verifyBookingManagementToken(token);
    if (!auth) {
      return NextResponse.json({ error: 'El enlace de gestión no es válido o ha caducado.' }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    const { data: appointment, error } = await admin
      .from('appointments')
      .select('id,email,status,appointment_type,booking_provider,provider_booking_id,google_event_id')
      .eq('id', auth.appointmentId)
      .maybeSingle();

    if (error) throw error;
    if (!appointment) {
      return NextResponse.json({ error: 'No encontramos esta cita.' }, { status: 404 });
    }
    if (
      appointment.email?.toLowerCase() !== auth.email ||
      appointment.appointment_type !== auth.service
    ) {
      return NextResponse.json({ error: 'El enlace no corresponde a esta cita.' }, { status: 403 });
    }
    if (appointment.status === 'cancelled') {
      return NextResponse.json({ ok: true, alreadyCancelled: true });
    }
    if (appointment.status !== 'confirmed') {
      return NextResponse.json({ error: 'La cita ya no se puede cancelar desde este enlace.' }, { status: 409 });
    }

    const eventId = appointment.provider_booking_id ?? appointment.google_event_id;
    const provider = calendarProviderFromBookingProvider(appointment.booking_provider)
      ?? (appointment.google_event_id ? 'google' : null);

    const { error: updateError } = await admin
      .from('appointments')
      .update({
        status: 'cancelled',
        admin_notes: 'Cancelada por el cliente desde enlace seguro de gestión.',
        updated_at: new Date().toISOString(),
      })
      .eq('id', appointment.id)
      .eq('status', 'confirmed');

    if (updateError) throw updateError;

    try {
      if (eventId && provider) {
        await deleteBookingCalendarEvent(eventId, provider);
      }
    } catch (calendarError) {
      await admin
        .from('appointments')
        .update({
          status: 'confirmed',
          admin_notes: 'La cancelación solicitada por el cliente no pudo sincronizarse con Calendar; se restauró la cita.',
          updated_at: new Date().toISOString(),
        })
        .eq('id', appointment.id);
      throw calendarError;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[booking/manage/cancel]', error);
    return NextResponse.json({ error: 'No se pudo cancelar la cita. Contacta con EXPERT.' }, { status: 500 });
  }
}
