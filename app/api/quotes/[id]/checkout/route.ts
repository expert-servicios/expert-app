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
      .select('amount_eur,title,description,status,client_id,company_id,expires_at')
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

    // Reject already paid or expired quotes
    if (quote.status === 'paid' || quote.status === 'expired' || (quote.expires_at && new Date(quote.expires_at) <= new Date())) {
      return NextResponse.json({ error: 'Este presupuesto no admite pago en su estado actual' }, { status: 400 });
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

    const { error: persistError } = await supabaseAdmin.from('quotes').update({ stripe_checkout_id: session.id }).eq('id', id);
    if (persistError) {
      try { await stripe.checkout.sessions.expire(session.id); } catch {}
      return NextResponse.json({ error: 'No se pudo registrar de forma segura la sesión de pago' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Quote checkout error:', error);
    return NextResponse.json({ error: 'Error al crear la sesión de pago' }, { status: 500 });
  }
}
