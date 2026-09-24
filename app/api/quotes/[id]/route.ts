import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { getStripeClient } from '@/lib/integrations/stripe';
import { sendEmail } from '@/lib/email/send';
import { quoteResponded, quoteAcceptedAdmin } from '@/lib/email/templates';

const quoteUpdateSchema = z
  .object({
    amount_eur: z.number().nonnegative().optional(),
    status: z.enum(['draft', 'sent', 'accepted', 'paid', 'expired']).optional(),
    expires_at: z.string().datetime().optional()
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar'
  });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const paramsData = await params;
    const sessionSupabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await sessionSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const adminSupabase = getSupabaseAdmin();
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || (profile?.role !== 'admin' && profile?.role !== 'owner')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const parseResult = quoteUpdateSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message ?? 'Datos de entrada inválidos' },
        { status: 400 }
      );
    }

    // Fetch current quote state before update (for email triggers and immutable structured totals)
    const { data: currentQuote } = await adminSupabase
      .from('quotes')
      .select('status,amount_eur,lead_id,client_id,expires_at,stripe_checkout_id')
      .eq('id', paramsData.id)
      .single();

    if (!currentQuote) {
      return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 });
    }

    if (parseResult.data.status === 'paid' && currentQuote.status !== 'paid') {
      return NextResponse.json({
        error: 'El estado pagado solo puede confirmarse desde el pago recibido en Stripe.',
        code: 'paid_status_webhook_only'
      }, { status: 409 });
    }

    if (parseResult.data.amount_eur !== undefined && parseResult.data.amount_eur !== Number(currentQuote.amount_eur)) {
      const { count: structuredLineCount, error: structuredLineError } = await adminSupabase
        .from('quote_items')
        .select('id', { count: 'exact', head: true })
        .eq('quote_id', paramsData.id);
      if (structuredLineError) {
        return NextResponse.json({ error: 'No se pudo validar el desglose del presupuesto' }, { status: 500 });
      }
      if ((structuredLineCount ?? 0) > 0) {
        return NextResponse.json({
          error: 'El importe de un presupuesto estructurado se calcula desde sus líneas y no puede editarse manualmente.',
          code: 'structured_quote_amount_locked'
        }, { status: 409 });
      }
    }

    const amountWillChange =
      parseResult.data.amount_eur !== undefined &&
      parseResult.data.amount_eur !== Number(currentQuote.amount_eur);
    const expiryWillChange =
      parseResult.data.expires_at !== undefined &&
      parseResult.data.expires_at !== currentQuote.expires_at;
    const statusWillInvalidate =
      parseResult.data.status !== undefined &&
      !['sent', 'accepted'].includes(parseResult.data.status);

    if (
      currentQuote.stripe_checkout_id &&
      (amountWillChange || expiryWillChange || statusWillInvalidate)
    ) {
      try {
        const stripe = getStripeClient();
        const session = await stripe.checkout.sessions.retrieve(currentQuote.stripe_checkout_id);
        if (session.status === 'open') {
          await stripe.checkout.sessions.expire(currentQuote.stripe_checkout_id);
        }
      } catch (stripeError) {
        console.error('Quote checkout invalidation failed:', stripeError);
        return NextResponse.json({
          error: 'No se pudo invalidar la sesión Stripe activa. Revisa el presupuesto antes de modificar sus condiciones.',
          code: 'active_checkout_invalidation_failed'
        }, { status: 409 });
      }
    }

    const updates: Record<string, unknown> = {};
    if (parseResult.data.amount_eur !== undefined) updates.amount_eur = parseResult.data.amount_eur;
    if (parseResult.data.status) updates.status = parseResult.data.status;
    if (parseResult.data.expires_at) updates.expires_at = parseResult.data.expires_at;
    if (currentQuote.stripe_checkout_id && (amountWillChange || expiryWillChange || statusWillInvalidate)) {
      updates.stripe_checkout_id = null;
    }

    const { data: updatedQuote, error: updateError } = await adminSupabase
      .from('quotes')
      .update(updates)
      .eq('id', paramsData.id)
      .select('id,title,amount_eur,status,expires_at,client_id,lead_id')
      .single();

    if (updateError || !updatedQuote) {
      console.error('Quote update failed:', updateError);
      return NextResponse.json({ error: 'No se pudo actualizar el presupuesto' }, { status: 500 });
    }

    // ── Email: quote responded (admin set amount + status sent) ─────────────
    const newAmount = Number(updates.amount_eur ?? currentQuote?.amount_eur ?? 0);
    const newStatus = (updates.status ?? currentQuote?.status) as string;

    if (newStatus === 'sent' && newAmount > 0 && currentQuote?.amount_eur !== newAmount) {
      const { data: lead } = await adminSupabase
        .from('leads')
        .select('email,name')
        .eq('id', updatedQuote.lead_id)
        .single();

      if (lead?.email) {
        const tpl = quoteResponded(lead.name ?? 'Cliente', newAmount, updatedQuote.expires_at);
        await sendEmail({
          to: lead.email,
          eventType: 'quote.responded',
          ...tpl,
          metadata: { quote_id: paramsData.id }
        });
      }
    }

    // ── Email: quote accepted — notify admin ────────────────────────────────
    if (newStatus === 'accepted' && currentQuote?.status !== 'accepted') {
      const adminEmails = process.env.ADMIN_EMAILS?.split(',').map((e) => e.trim()).filter(Boolean) ?? [];
      if (adminEmails.length) {
        const { data: lead } = await adminSupabase
          .from('leads')
          .select('name')
          .eq('id', updatedQuote.lead_id)
          .single();

        const tpl = quoteAcceptedAdmin(lead?.name ?? 'Cliente', newAmount);
        await sendEmail({
          to: adminEmails,
          eventType: 'quote.accepted.admin',
          ...tpl,
          metadata: { quote_id: paramsData.id }
        });
      }
    }

    return NextResponse.json({ quote: updatedQuote });
  } catch (error) {
    console.error('Quote PATCH error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
