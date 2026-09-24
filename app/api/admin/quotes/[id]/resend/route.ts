import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { sendEmail } from '@/lib/email/send';
import { quoteWithPaymentLink } from '@/lib/email/templates';
import { getRandomFunFact } from '@/lib/utils/fun-facts';
import { getPublicAppUrl } from '@/lib/utils/app-url';

async function requireAdmin(request: NextRequest): Promise<string | null> {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  return (profile?.role === 'admin' || profile?.role === 'owner') ? user.id : null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actorId = await requireAdmin(request);
    if (!actorId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { id } = await params;
    const admin = getSupabaseAdmin();

    const { data: quote, error } = await admin
      .from('quotes')
      .select('id,title,description,amount_eur,expires_at,client_id,lead_id,status,company_id')
      .eq('id', id)
      .single();

    if (error || !quote) return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 });

    if (quote.status === 'paid') {
      return NextResponse.json({ error: 'Un presupuesto pagado no puede reenviarse como pendiente de pago.' }, { status: 409 });
    }
    if (quote.status === 'expired' || (quote.expires_at && new Date(quote.expires_at) <= new Date())) {
      return NextResponse.json({
        error: 'El presupuesto está caducado. Amplía primero su fecha de validez antes de reenviarlo.',
        code: 'quote_expired'
      }, { status: 409 });
    }

    let recipientEmail: string | null = null;
    let recipientName: string = 'Cliente';

    if (quote.client_id) {
      const { data: authUser } = await admin.auth.admin.getUserById(quote.client_id);
      recipientEmail = authUser?.user?.email ?? null;
      const { data: profile } = await admin.from('profiles').select('full_name').eq('id', quote.client_id).single();
      recipientName = profile?.full_name ?? recipientEmail?.split('@')[0] ?? 'Cliente';
    }

    if (!recipientEmail && quote.lead_id) {
      const { data: lead } = await admin.from('leads').select('email,name').eq('id', quote.lead_id).single();
      recipientEmail = lead?.email ?? null;
      recipientName = lead?.name ?? 'Cliente';
    }

    if (!recipientEmail) {
      return NextResponse.json({ error: 'No se encontró email de destino para este presupuesto' }, { status: 422 });
    }

    const appUrl = getPublicAppUrl();
    const expiresAt = quote.expires_at ?? new Date(Date.now() + 14 * 86_400_000).toISOString();
    const paymentUrl = `${appUrl}/dashboard/presupuestos`;

    const funFact = getRandomFunFact();
    const tpl = quoteWithPaymentLink(recipientName, Number(quote.amount_eur), quote.title, paymentUrl, expiresAt, funFact);

    try {
      await sendEmail({
        to: recipientEmail,
        eventType: 'quote.payment_link_resent',
        ...tpl,
        metadata: { quote_id: quote.id, company_id: quote.company_id ?? null }
      });
    } catch (emailError) {
      console.error('[admin/quotes/[id]/resend] email failed:', emailError);
      return NextResponse.json({
        error: 'El email no pudo enviarse. El presupuesto no se modificó y puedes reintentarlo.',
        code: 'email_failed_safe_retry'
      }, { status: 502 });
    }

    await admin.from('audit_logs').insert({
      actor_id: actorId,
      action: 'quote.resent',
      entity: 'quotes',
      entity_id: quote.id,
      metadata: {
        recipient_email: recipientEmail,
        company_id: quote.company_id ?? null,
        payment_entrypoint: paymentUrl
      }
    }).then(() => {});

    return NextResponse.json({ ok: true, paymentUrl });
  } catch (err) {
    console.error('[admin/quotes/[id]/resend] POST error:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}