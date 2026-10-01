import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { isStaffRole } from '@/lib/auth/roles';
import { createQuoteClaimToken } from '@/lib/quotes/quote-claim-token';
import { getPublicAppUrl } from '@/lib/utils/app-url';
import { getSubscriptionInvitePlan } from '@/lib/subscriptions/invitation-plans';

const schema = z.object({
  clientEmail: z.string().email(),
  recipientName: z.string().trim().min(2).max(180),
  entityType: z.enum(['empresa', 'autonomo']),
  planSlug: z.enum(['supervision', 'avanzado', 'colaborativo']),
  billing: z.enum(['monthly', 'annual']).default('monthly'),
  proposedEntityName: z.string().trim().min(2).max(220).optional(),
  expiresInDays: z.number().int().min(1).max(30).default(14),
});

async function requireAdmin(request: NextRequest): Promise<string | null> {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('profiles')
    .select('role,status')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || profile.status === 'inactive' || !isStaffRole(profile.role)) return null;
  return user.id;
}

export async function POST(request: NextRequest) {
  try {
    const actorId = await requireAdmin(request);
    if (!actorId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 });
    }

    const input = parsed.data;
    const email = input.clientEmail.trim().toLowerCase();
    const plan = getSubscriptionInvitePlan(input.planSlug, input.billing);
    if (!plan || !plan.priceId) {
      return NextResponse.json({ error: 'El plan seleccionado no está configurado en Stripe.' }, { status: 503 });
    }

    const admin = getSupabaseAdmin();

    const { data: lead, error: leadError } = await admin
      .from('leads')
      .insert({
        name: input.proposedEntityName ?? input.recipientName,
        email,
        client_type: input.entityType,
        category: 'subscription',
        service: `${plan.name} · ${plan.billing === 'annual' ? 'Anual' : 'Mensual'}`,
        state: 'converted',
        source: 'subscription_invitation',
        notes: [
          `Invitación individual para ${plan.name} (${plan.billing === 'annual' ? 'anual' : 'mensual'}).`,
          `Titular previsto: ${input.proposedEntityName ?? input.recipientName}.`,
          'La entidad fiscal se confirma por el cliente antes del checkout.',
        ].join(' '),
      })
      .select('id')
      .single();

    if (leadError || !lead) {
      console.error('[subscription invitations] lead create:', leadError);
      return NextResponse.json({ error: 'No se pudo crear la trazabilidad comercial.' }, { status: 500 });
    }

    const expiresAt = new Date(Date.now() + input.expiresInDays * 86_400_000).toISOString();
    const { data: quote, error: quoteError } = await admin
      .from('quotes')
      .insert({
        lead_id: lead.id,
        client_id: null,
        company_id: null,
        title: plan.name,
        description: `Suscripción ${plan.billing === 'annual' ? 'anual' : 'mensual'} ${plan.name}. Un titular fiscal, un contrato y una factura. Importe base ${plan.amountEur} EUR + IVA.`,
        amount_eur: plan.amountEur,
        status: 'sent',
        expires_at: expiresAt,
        created_by: actorId,
        docs_checklist: [],
        service_slugs: [plan.serviceSlug],
        claim_email: email,
      })
      .select('id')
      .single();

    if (quoteError || !quote) {
      console.error('[subscription invitations] quote create:', quoteError);
      await admin.from('leads').delete().eq('id', lead.id).then(() => null, () => null);
      return NextResponse.json({ error: 'No se pudo crear el presupuesto de suscripción.' }, { status: 500 });
    }

    const { error: itemError } = await admin.from('quote_items').insert({
      quote_id: quote.id,
      service_slug: plan.serviceSlug,
      stripe_price_id: plan.priceId,
      description: `${plan.name} · ${plan.billing === 'annual' ? 'anual (10 mensualidades, 2 meses gratis)' : 'mensual'}`,
      quantity: 1,
      unit_amount_cents: Math.round(plan.amountEur * 100),
      currency: 'EUR',
      tax_behavior: 'exclusive',
      position: 0,
      metadata: {
        product_type: 'subscription',
        billing: plan.billing,
        interval: plan.interval,
      },
    });
    if (itemError) {
      console.error('[subscription invitations] quote item create:', itemError);
      await admin.from('leads').delete().eq('id', lead.id).then(() => null, () => null);
      return NextResponse.json({ error: 'No se pudo guardar la modalidad contractual del plan.' }, { status: 500 });
    }

    const token = createQuoteClaimToken({
      quoteId: quote.id,
      email,
      expiresInSeconds: input.expiresInDays * 86_400,
    });
    const appUrl = getPublicAppUrl();
    const activationUrl = `${appUrl}/api/quotes/claim?token=${encodeURIComponent(token)}`;

    await admin.from('audit_logs').insert({
      actor_id: actorId,
      action: 'subscription.invitation_created',
      entity: 'quotes',
      entity_id: quote.id,
      metadata: {
        lead_id: lead.id,
        client_email: email,
        entity_type: input.entityType,
        proposed_entity_name: input.proposedEntityName ?? null,
        plan_slug: plan.slug,
        billing: plan.billing,
        interval: plan.interval,
        stripe_price_id: plan.priceId,
        amount_eur: plan.amountEur,
        expires_at: expiresAt,
      },
    }).then(() => null, () => null);

    return NextResponse.json({
      ok: true,
      quoteId: quote.id,
      leadId: lead.id,
      plan: {
        slug: plan.slug,
        name: plan.name,
        billing: plan.billing,
        interval: plan.interval,
        amountEur: plan.amountEur,
        planPath: plan.planPath,
      },
      entityType: input.entityType,
      activationUrl,
      expiresAt,
    });
  } catch (error) {
    console.error('[subscription invitations] unexpected error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
