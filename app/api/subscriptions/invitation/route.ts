import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { getSubscriptionInvitePlanByServiceSlug } from '@/lib/subscriptions/invitation-plans';

export async function GET(request: NextRequest) {
  try {
    const quoteId = request.nextUrl.searchParams.get('quote')?.trim() ?? '';
    if (!quoteId) return NextResponse.json({ error: 'Falta el presupuesto.' }, { status: 400 });

    const supabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const admin = getSupabaseAdmin();
    const { data: quote, error: quoteError } = await admin
      .from('quotes')
      .select('id,client_id,lead_id,title,description,amount_eur,status,expires_at,company_id,service_slugs,claim_email')
      .eq('id', quoteId)
      .maybeSingle();

    if (quoteError || !quote) return NextResponse.json({ error: 'Presupuesto no encontrado.' }, { status: 404 });
    if (quote.client_id !== user.id) {
      return NextResponse.json({ error: 'Este enlace no pertenece a tu cuenta.' }, { status: 403 });
    }
    if (!['sent', 'accepted'].includes(quote.status)) {
      return NextResponse.json({ error: 'Este presupuesto ya no admite contratación.' }, { status: 409 });
    }
    if (quote.expires_at && new Date(quote.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: 'Este presupuesto ha caducado.' }, { status: 410 });
    }

    const planService = Array.isArray(quote.service_slugs)
      ? quote.service_slugs.find((slug) => typeof slug === 'string' && slug.startsWith('plan-'))
      : null;
    const plan = getSubscriptionInvitePlanByServiceSlug(planService);
    if (!plan || !plan.priceId) {
      return NextResponse.json({ error: 'El plan de este presupuesto no está disponible.' }, { status: 409 });
    }
    if (Number(quote.amount_eur) !== plan.amountEur) {
      return NextResponse.json({ error: 'El importe del presupuesto no coincide con la tarifa vigente.' }, { status: 409 });
    }

    const { data: lead } = quote.lead_id
      ? await admin.from('leads').select('name,email,client_type').eq('id', quote.lead_id).maybeSingle()
      : { data: null };

    const claimEmail = quote.claim_email?.trim().toLowerCase() ?? '';
    const userEmail = user.email?.trim().toLowerCase() ?? '';
    if (claimEmail && claimEmail !== userEmail) {
      return NextResponse.json({ error: 'Accede con el email que recibió esta propuesta.' }, { status: 403 });
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('full_name,phone')
      .eq('id', user.id)
      .maybeSingle();

    const { data: memberships, error: membershipsError } = await admin
      .from('profile_companies')
      .select('company_id,role,company:companies(id,razon_social,cif_nif,forma_juridica,direccion,ciudad,provincia,codigo_postal,pais)')
      .eq('profile_id', user.id);

    if (membershipsError) {
      return NextResponse.json({ error: 'No se pudieron cargar tus entidades.' }, { status: 500 });
    }

    return NextResponse.json({
      quote: {
        id: quote.id,
        title: quote.title,
        description: quote.description,
        amountEur: Number(quote.amount_eur),
        status: quote.status,
        expiresAt: quote.expires_at,
        companyId: quote.company_id,
      },
      plan: {
        slug: plan.slug,
        name: plan.name,
        amountEur: plan.amountEur,
        priceId: plan.priceId,
        planPath: plan.planPath,
      },
      invitation: {
        recipientName: lead?.name ?? '',
        entityType: lead?.client_type === 'autonomo' ? 'autonomo' : 'empresa',
        email: userEmail,
      },
      profile: {
        fullName: profile?.full_name ?? '',
        phone: profile?.phone ?? '',
      },
      companies: (memberships ?? []).map((membership) => {
        const raw = membership.company;
        const company = Array.isArray(raw) ? raw[0] : raw;
        return company ? { ...company, role: membership.role } : null;
      }).filter(Boolean),
    });
  } catch (error) {
    console.error('[subscription invitation] GET:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
