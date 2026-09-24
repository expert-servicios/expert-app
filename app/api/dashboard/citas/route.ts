import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import {
  getAuthorizedBookingEmails,
  resolveAuthenticatedBookingIdentity,
} from '@/lib/admin/onboarding-booking-identity';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || !user.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    const identity = await resolveAuthenticatedBookingIdentity(admin, user.id);
    const emails = await getAuthorizedBookingEmails(
      admin,
      user.id,
      identity.companyId,
      user.email
    );
    if (!emails.length) return NextResponse.json({ appointments: [] });

    const { data: appointments, error } = await admin
      .from('appointments')
      .select('id,service,status,confirmed_date,confirmed_time,meeting_url,notes,created_at')
      .in('email', emails)
      .order('confirmed_date', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('[dashboard/citas] GET:', error);
      return NextResponse.json({ error: 'Error al obtener citas' }, { status: 500 });
    }

    return NextResponse.json({ appointments: appointments ?? [] });
  } catch (err) {
    console.error('[dashboard/citas]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
