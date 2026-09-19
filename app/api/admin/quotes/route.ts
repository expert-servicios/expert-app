import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin, listAllAuthUsers } from '@/lib/integrations/supabase';
import { sendEmail } from '@/lib/email/send';
import { quoteWithPaymentLink } from '@/lib/email/templates';
import { getRandomFunFact } from '@/lib/utils/fun-facts';
import { generateContractHtml, contractToBuffer } from '@/lib/utils/contract';
import { getPublicAppUrl } from '@/lib/utils/app-url';
import { syncQuoteAsEstimate } from '@/lib/integrations/holded';
import { getServiceBillingPolicy } from '@/lib/payments/service-billing-scope';
import { quoteLineTotalCents, resolveQuoteLineSnapshots } from '@/lib/quotes/quote-line-catalog';

const quoteSchema = z.object({
  clientEmail: z.string().email('Email de cliente inválido'),
  companyId: z.string().uuid().nullable().optional(),
  billingScope: z.enum(['profile', 'company']).optional(),
  serviceSlug: z.string().min(1).max(160).optional(),
  title: z.string().min(3, 'Título demasiado corto'),
  description: z.string().min(5, 'Descripción demasiado corta'),
  amountEur: z.number().positive('El importe debe ser positivo').optional(),
  items: z.array(z.object({
    serviceSlug: z.string().min(1).max(160),
    quantity: z.number().int().positive(),
  })).min(1).max(20).optional(),
  expiresInDays: z.number().int().min(1).max(90).default(14),
  docsChecklist: z.array(z.string()).default([])
}).refine((data) => data.amountEur !== undefined || (data.items?.length ?? 0) > 0, {
  message: 'Indica un importe o al menos una línea de catálogo.'
});

async function requireAdmin(request: NextRequest): Promise<string | null> {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('profiles').select('role').eq('id', user.id).single();
  return (profile?.role === 'admin' || profile?.role === 'owner') ? user.id : null;
}

export async function POST(request: NextRequest) {
  try {
    const actorId = await requireAdmin(request);
    if (!actorId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = quoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 });
    }

    const { clientEmail, title, description, amountEur, items, expiresInDays, docsChecklist, serviceSlug, billingScope } = parsed.data;
    const adminSupabase = getSupabaseAdmin();

    let structuredLines = null as ReturnType<typeof resolveQuoteLineSnapshots> | null;
    if (items?.length) {
      try {
        structuredLines = resolveQuoteLineSnapshots(items);
      } catch (lineError) {
        return NextResponse.json({
          error: lineError instanceof Error ? lineError.message : 'Líneas de presupuesto no válidas.'
        }, { status: 400 });
      }
    }
    const resolvedAmountEur = structuredLines
      ? quoteLineTotalCents(structuredLines) / 100
      : amountEur!;
    const structuredServiceSlugs = structuredLines?.map((line) => line.serviceSlug) ?? [];

    const listData = await listAllAuthUsers();
    const authUser = listData.find((u) => u.email?.toLowerCase() === clientEmail.toLowerCase());
    if (!authUser) {
      return NextResponse.json({ error: 'No existe ningún usuario con ese email. Crea el usuario primero.' }, { status: 404 });
    }
    const clientId = authUser.id;

    const { data: clientProfile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('full_name,phone,client_type,company,tax_id,address,city,postal_code')
      .eq('id', clientId)
      .single();
    if (profileError || !clientProfile) {
      return NextResponse.json({ error: 'No se pudo cargar el perfil del cliente' }, { status: 500 });
    }

    const { data: memberships, error: membershipsError } = await adminSupabase
      .from('profile_companies')
      .select('company_id,company:companies(id,razon_social,cif_nif,forma_juridica,direccion,ciudad,codigo_postal,email,telefono)')
      .eq('profile_id', clientId);
    if (membershipsError) {
      return NextResponse.json({ error: 'No se pudieron resolver las entidades del cliente' }, { status: 500 });
    }

    const policySlugs = structuredServiceSlugs.length > 0
      ? structuredServiceSlugs
      : serviceSlug ? [serviceSlug] : [];
    const policies = policySlugs.map(getServiceBillingPolicy);
    if (policies.includes('profile_only') && policies.includes('company_only')) {
      return NextResponse.json({
        error: 'Este presupuesto mezcla servicios personales y servicios exclusivos de empresa. Deben emitirse por separado.',
        code: 'mixed_billing_scope'
      }, { status: 409 });
    }
    const servicePolicy = policies.includes('company_only')
      ? 'company_only'
      : policies.includes('profile_only') ? 'profile_only' : 'flexible';
    if (servicePolicy === 'profile_only' && billingScope === 'company') {
      return NextResponse.json({
        error: 'Este servicio corresponde a la persona física y no puede presupuestarse a una sociedad.',
        code: 'billing_scope_conflict'
      }, { status: 409 });
    }
    if (servicePolicy === 'company_only' && billingScope === 'profile') {
      return NextResponse.json({
        error: 'Este servicio requiere una entidad fiscal como destinataria.',
        code: 'billing_scope_conflict'
      }, { status: 409 });
    }

    const forceProfile = servicePolicy === 'profile_only' || billingScope === 'profile';
    const forceCompany = servicePolicy === 'company_only' || billingScope === 'company';

    let companyId: string | null = null;
    if (!forceProfile) {
      companyId = parsed.data.companyId ?? null;
      if (!companyId && forceCompany && (memberships?.length ?? 0) === 1) {
        companyId = memberships![0].company_id;
      }
    }

    if (forceCompany && !companyId) {
      return NextResponse.json({
        error: (memberships?.length ?? 0) > 1
          ? 'El cliente tiene varias entidades. Selecciona cuál contrata el servicio.'
          : 'Este servicio requiere una entidad fiscal vinculada al cliente.',
        code: 'company_required'
      }, { status: 409 });
    }

    const selectedMembership = companyId
      ? memberships?.find((m) => m.company_id === companyId) ?? null
      : null;
    if (companyId && !selectedMembership) {
      return NextResponse.json({ error: 'La entidad seleccionada no pertenece al cliente.' }, { status: 403 });
    }

    const companyRaw = selectedMembership?.company ?? null;
    const contractingCompany = Array.isArray(companyRaw) ? companyRaw[0] : companyRaw;
    if (companyId && !contractingCompany) {
      return NextResponse.json({ error: 'No se pudo cargar la entidad seleccionada' }, { status: 500 });
    }

    const clientName = clientProfile.full_name ?? clientEmail.split('@')[0];
    const resolvedBillingScope = companyId ? 'company' : 'profile';
    const contractingName = contractingCompany?.razon_social ?? clientName;
    const contractingTaxId = contractingCompany?.cif_nif ?? clientProfile.tax_id ?? null;
    const contractingAddress = contractingCompany
      ? (contractingCompany.ciudad
          ? `${contractingCompany.direccion ?? ''}, ${contractingCompany.ciudad}`.trim().replace(/^,\s*/, '')
          : contractingCompany.direccion ?? null)
      : (clientProfile.city
          ? `${clientProfile.address ?? ''}, ${clientProfile.city}`.trim().replace(/^,\s*/, '')
          : clientProfile.address ?? null);

    // Rows created below belong exclusively to this request and can be safely
    // compensated if Stripe/email setup fails before the quote is delivered.
    const { data: lead, error: leadErr } = await adminSupabase
      .from('leads')
      .insert({
        name: clientName,
        email: clientEmail,
        client_type: contractingCompany
          ? (contractingCompany.forma_juridica === 'autonomo' ? 'autonomo' : 'empresa')
          : (clientProfile.client_type ?? 'particular'),
        category: 'presupuesto',
        service: title,
        state: 'converted'
      })
      .select('id')
      .single();

    if (leadErr || !lead) {
      console.error('[admin/quotes] lead insert error:', leadErr);
      return NextResponse.json({ error: 'Error al crear lead' }, { status: 500 });
    }

    const expiresAt = new Date(Date.now() + expiresInDays * 86_400_000).toISOString();

    const { data: quote, error: quoteErr } = await adminSupabase
      .from('quotes')
      .insert({
        lead_id: lead.id,
        client_id: clientId,
        company_id: companyId,
        title,
        description,
        amount_eur: resolvedAmountEur,
        status: 'sent',
        expires_at: expiresAt,
        created_by: actorId,
        docs_checklist: docsChecklist
      })
      .select('id')
      .single();

    if (quoteErr || !quote) {
      console.error('[admin/quotes] quote insert error:', quoteErr);
      await adminSupabase.from('leads').delete().eq('id', lead.id).then(() => {});
      return NextResponse.json({ error: 'Error al crear presupuesto' }, { status: 500 });
    }

    let persistedQuoteItems: Array<{
      service_slug: string;
      stripe_price_id: string | null;
      description: string;
      quantity: number;
      unit_amount_cents: number;
      currency: string;
      tax_behavior: 'exclusive' | 'inclusive' | 'unspecified';
      position: number;
    }> = [];

    if (structuredLines) {
      const { error: itemsError } = await adminSupabase.from('quote_items').insert(
        structuredLines.map((line) => ({
          quote_id: quote.id,
          service_slug: line.serviceSlug,
          stripe_price_id: line.stripePriceId,
          description: line.description,
          quantity: line.quantity,
          unit_amount_cents: line.unitAmountCents,
          currency: line.currency,
          tax_behavior: line.taxBehavior,
          position: line.position,
          metadata: line.metadata,
        }))
      );
      if (itemsError) {
        console.error('[admin/quotes] quote_items insert error:', itemsError);
        await adminSupabase.from('leads').delete().eq('id', lead.id).then(() => {});
        return NextResponse.json({ error: 'No se pudieron guardar las líneas del presupuesto.' }, { status: 500 });
      }

      const { data: storedItems, error: storedItemsError } = await adminSupabase
        .from('quote_items')
        .select('service_slug,stripe_price_id,description,quantity,unit_amount_cents,currency,tax_behavior,position')
        .eq('quote_id', quote.id)
        .order('position', { ascending: true });
      if (storedItemsError || !storedItems?.length) {
        console.error('[admin/quotes] quote_items reload error:', storedItemsError);
        await adminSupabase.from('leads').delete().eq('id', lead.id).then(() => {});
        return NextResponse.json({ error: 'No se pudieron verificar las líneas persistidas del presupuesto.' }, { status: 500 });
      }
      persistedQuoteItems = storedItems;
    }

    const appUrl = getPublicAppUrl();
    const paymentUrl = `${appUrl}/dashboard/presupuestos`;

    const contractDate = new Date().toLocaleDateString('es-ES', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
    const contractHtml = generateContractHtml({
      clientName,
      clientEmail,
      clientCompany: contractingName,
      clientTaxId: contractingTaxId,
      clientAddress: contractingAddress,
      serviceTitle: title,
      serviceDescription: description,
      amountEur: resolvedAmountEur,
      contractDate,
      contractType: 'service'
    });
    const contractBase64 = contractToBuffer(contractHtml);

    const funFact = getRandomFunFact();
    const tpl = quoteWithPaymentLink(clientName, resolvedAmountEur, title, paymentUrl, expiresAt, funFact);

    try {
      await sendEmail({
        to: clientEmail,
        eventType: 'quote.payment_link_sent',
        ...tpl,
        metadata: { quote_id: quote.id, billing_scope: resolvedBillingScope, company_id: companyId },
        attachments: [
          {
            filename: `Contrato_EXPERT_${title.replace(/\s+/g, '_').slice(0, 40)}.html`,
            content: contractBase64,
            type: 'text/html'
          }
        ]
      });
    } catch (emailError) {
      console.error('[admin/quotes] delivery email failed:', emailError);
      const { error: cleanupError } = await adminSupabase.from('leads').delete().eq('id', lead.id);
      if (cleanupError) {
        console.error('[admin/quotes] failed to clean request-created quote after email failure:', cleanupError);
        return NextResponse.json({
          error: 'El email falló y no se pudo limpiar el presupuesto creado. Revisión manual necesaria.',
          code: 'email_failed_cleanup_manual_review'
        }, { status: 409 });
      }
      return NextResponse.json({
        error: 'El email no pudo enviarse y el presupuesto de esta petición se revirtió de forma segura.',
        code: 'email_failed_safe_retry'
      }, { status: 502 });
    }

    await adminSupabase.from('audit_logs').insert({
      actor_id: actorId,
      action: 'quote.sent',
      entity: 'quotes',
      entity_id: quote.id,
      metadata: { client_email: clientEmail, billing_scope: resolvedBillingScope, company_id: companyId, amount_eur: resolvedAmountEur, structured_lines: persistedQuoteItems.length, payment_entrypoint: paymentUrl }
    }).then(() => {});

    syncQuoteAsEstimate({
      quoteId: quote.id,
      clientName: contractingName,
      clientEmail: contractingCompany?.email ?? clientEmail,
      clientPhone: contractingCompany?.telefono ?? clientProfile.phone ?? null,
      companyId,
      title,
      amountEur: resolvedAmountEur,
    }).catch((e) => console.error('[admin/quotes] holded estimate sync:', e));

    return NextResponse.json({ ok: true, quoteId: quote.id, paymentUrl, companyId, billingScope: resolvedBillingScope });
  } catch (err) {
    console.error('[admin/quotes] error:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}