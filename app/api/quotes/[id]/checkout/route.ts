import { NextRequest, NextResponse } from 'next/server';
import { getStripeClient, toStripeAscii } from '@/lib/integrations/stripe';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { getPublicAppUrl } from '@/lib/utils/app-url';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Require authenticated session
    const supabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const stripe = getStripeClient();
    const { id } = await params;
    const appUrl = getPublicAppUrl();

    const supabaseAdmin = getSupabaseAdmin();
    const { data: quote, error: quoteError } = await supabaseAdmin
      .from('quotes')
      .select('amount_eur,title,description,status,client_id,company_id,expires_at,stripe_checkout_id')
      .eq('id', id)
      .single();

    if (quoteError || !quote) {
      console.error('Quote lookup failed:', quoteError);
      return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 });
    }

    // Only the quote owner can pay it
    if (quote.client_id !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Only sent/accepted quotes within their commercial validity can be paid.
    if (
      !['sent', 'accepted'].includes(quote.status) ||
      (quote.expires_at && new Date(quote.expires_at) <= new Date())
    ) {
      return NextResponse.json({ error: 'Este presupuesto no admite pago en su estado actual' }, { status: 400 });
    }

    if (quote.company_id) {
      const { data: membership, error: membershipError } = await supabaseAdmin
        .from('profile_companies')
        .select('company_id')
        .eq('profile_id', user.id)
        .eq('company_id', quote.company_id)
        .maybeSingle();
      if (membershipError) {
        return NextResponse.json({ error: 'No se pudo validar la entidad del presupuesto' }, { status: 500 });
      }
      if (!membership) {
        return NextResponse.json({
          error: 'La entidad asociada a este presupuesto ya no está vinculada a tu cuenta.',
          code: 'quote_company_forbidden'
        }, { status: 403 });
      }
    }

    const previousSessionId = quote.stripe_checkout_id ?? null;
    if (previousSessionId) {
      try {
        const previousSession = await stripe.checkout.sessions.retrieve(previousSessionId);
        if (previousSession.status === 'open' && previousSession.url) {
          return NextResponse.json({ url: previousSession.url, reused: true });
        }
        if (previousSession.status === 'complete') {
          return NextResponse.json({
            error: 'Este pago ya se ha completado o está pendiente de confirmación.',
            code: 'quote_payment_already_completed'
          }, { status: 409 });
        }
      } catch (previousSessionError) {
        console.error('Previous quote checkout lookup failed:', previousSessionError);
      }
    }

    const { data: quoteItems, error: quoteItemsError } = await supabaseAdmin
      .from('quote_items')
      .select('service_slug,stripe_price_id,description,quantity,unit_amount_cents,currency,tax_behavior,position')
      .eq('quote_id', id)
      .order('position', { ascending: true });
    if (quoteItemsError) {
      console.error('Quote items lookup failed:', quoteItemsError);
      return NextResponse.json({ error: 'No se pudieron verificar las líneas del presupuesto' }, { status: 500 });
    }

    const amountEur = Number(quote.amount_eur);
    if (!amountEur || amountEur <= 0) {
      return NextResponse.json(
        { error: 'El presupuesto no tiene un importe válido para pago' },
        { status: 400 }
      );
    }

    const structuredTotalCents = (quoteItems ?? []).reduce(
      (total, line) => total + Number(line.unit_amount_cents) * Number(line.quantity),
      0,
    );
    if ((quoteItems?.length ?? 0) > 0 && structuredTotalCents !== Math.round(amountEur * 100)) {
      return NextResponse.json({
        error: 'El total del presupuesto no coincide con sus líneas. Revisión manual necesaria.',
        code: 'quote_total_mismatch',
      }, { status: 409 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      client_reference_id: id,
      metadata: {
        quote_id: id,
        product_type: 'presupuesto',
        ...(quote.company_id ? { company_id: quote.company_id } : {}),
        ...((quoteItems?.length ?? 0) > 0 ? {
          structured_quote: 'true',
          service_slugs: quoteItems!.map((line) => line.service_slug).join(',').slice(0, 499),
        } : {}),
      },
      automatic_tax: { enabled: true },
      billing_address_collection: 'required',
      ...(quote.company_id ? { tax_id_collection: { enabled: true, required: 'if_supported' as const } } : {}),
      line_items: (quoteItems?.length ?? 0) > 0
        ? quoteItems!.map((line) => ({
            price_data: {
              currency: String(line.currency).toLowerCase(),
              unit_amount: Number(line.unit_amount_cents),
              tax_behavior: line.tax_behavior,
              product_data: {
                name: toStripeAscii(line.description),
                metadata: {
                  line_type: 'service_fee',
                  service_slug: line.service_slug,
                  configured_price_id: line.stripe_price_id ?? '',
                  quote_id: id,
                },
              },
            },
            quantity: Number(line.quantity),
          }))
        : [
            {
              price_data: {
                currency: 'eur',
                tax_behavior: 'exclusive',
                product_data: {
                  name: toStripeAscii(quote.title),
                  description: quote.description ? toStripeAscii(quote.description) : undefined
                },
                unit_amount: Math.round(amountEur * 100)
              },
              quantity: 1
            }
          ],
      success_url: `${appUrl}/gracias/pago`,
      cancel_url: `${appUrl}/dashboard/presupuestos`
    });

    const conditionalUpdate = supabaseAdmin
      .from('quotes')
      .update({ stripe_checkout_id: session.id })
      .eq('id', id)
      .eq('status', quote.status);

    const { data: persistedQuote, error: persistError } = previousSessionId
      ? await conditionalUpdate.eq('stripe_checkout_id', previousSessionId).select('id,stripe_checkout_id').maybeSingle()
      : await conditionalUpdate.is('stripe_checkout_id', null).select('id,stripe_checkout_id').maybeSingle();

    if (persistError || !persistedQuote) {
      try { await stripe.checkout.sessions.expire(session.id); } catch {}

      const { data: latestQuote } = await supabaseAdmin
        .from('quotes')
        .select('stripe_checkout_id,status')
        .eq('id', id)
        .maybeSingle();

      if (latestQuote?.status === 'paid') {
        return NextResponse.json({
          error: 'El presupuesto ya figura como pagado.',
          code: 'quote_already_paid'
        }, { status: 409 });
      }

      if (latestQuote?.stripe_checkout_id) {
        try {
          const winningSession = await stripe.checkout.sessions.retrieve(latestQuote.stripe_checkout_id);
          if (winningSession.status === 'open' && winningSession.url) {
            return NextResponse.json({ url: winningSession.url, reused: true });
          }
        } catch {}
      }

      return NextResponse.json({
        error: 'No se pudo registrar de forma segura la sesión de pago. Inténtalo de nuevo.',
        code: 'quote_checkout_race'
      }, { status: 409 });
    }

    return NextResponse.json({ url: session.url, reused: false });
  } catch (error) {
    console.error('Quote checkout error:', error);
    return NextResponse.json({ error: 'Error al crear la sesión de pago' }, { status: 500 });
  }
}
