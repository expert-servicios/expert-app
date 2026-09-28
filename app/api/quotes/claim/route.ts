import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { verifyQuoteClaimToken } from '@/lib/quotes/quote-claim-token';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')?.trim() ?? '';
  let claim;
  try {
    claim = verifyQuoteClaimToken(token);
  } catch (error) {
    console.error('[quote claim] token verification configuration:', error);
    return NextResponse.json({ error: 'No se pudo verificar el enlace.' }, { status: 500 });
  }
  if (!claim) {
    return NextResponse.json({ error: 'El enlace de presupuesto no es válido o ha caducado.' }, { status: 400 });
  }

  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    const next = `/api/quotes/claim?token=${encodeURIComponent(token)}`;
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('next', next);
    return NextResponse.redirect(loginUrl);
  }

  const userEmail = user.email?.trim().toLowerCase() ?? '';
  if (!userEmail || userEmail !== claim.email) {
    return NextResponse.json(
      { error: 'Accede con el mismo email que recibió este presupuesto.' },
      { status: 403 },
    );
  }

  const admin = getSupabaseAdmin();
  const { data: quote, error: quoteError } = await admin
    .from('quotes')
    .select('id,client_id,lead_id,status')
    .eq('id', claim.quoteId)
    .maybeSingle();

  if (quoteError || !quote) {
    return NextResponse.json({ error: 'Presupuesto no encontrado.' }, { status: 404 });
  }

  if (quote.lead_id) {
    const { data: lead, error: leadError } = await admin
      .from('leads')
      .select('email')
      .eq('id', quote.lead_id)
      .maybeSingle();
    if (leadError || !lead?.email || lead.email.trim().toLowerCase() !== claim.email) {
      return NextResponse.json({ error: 'El enlace no corresponde a este presupuesto.' }, { status: 403 });
    }
  }

  if (quote.client_id && quote.client_id !== user.id) {
    return NextResponse.json({ error: 'Este presupuesto ya está vinculado a otra cuenta.' }, { status: 409 });
  }

  if (!quote.client_id) {
    const { error: claimError } = await admin
      .from('quotes')
      .update({ client_id: user.id })
      .eq('id', quote.id)
      .is('client_id', null)
      .in('status', ['draft', 'sent', 'accepted']);
    if (claimError) {
      console.error('[quote claim] ownership update:', claimError);
      return NextResponse.json({ error: 'No se pudo vincular el presupuesto.' }, { status: 500 });
    }
  }

  return NextResponse.redirect(new URL('/dashboard/presupuestos?claimed=1', request.url));
}
