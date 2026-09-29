import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getFirstAdminProfileId, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { sendEmail } from '@/lib/email/send';
import { quoteReceivedClient, quoteReceivedAdmin } from '@/lib/email/templates';
import { verifyRecaptchaToken } from '@/lib/utils/recaptcha';
import { checkSpam, checkRateLimit, getClientIp } from '@/lib/utils/spam-guard';
import { notifyAdmins } from '@/lib/integrations/push';
import { buildLeadAttributionFields } from '@/lib/marketing/server-attribution';
import { describeContentOrigin, normalizeContentOrigin } from '@/lib/marketing/content-origin';
import { getCatalogService } from '@/lib/utils/catalog';
import { createQuoteClaimToken } from '@/lib/quotes/quote-claim-token';

const LEGACY_SERVICE_SLUGS: Record<string, string> = {
  noResidentes: 'no-residentes',
  modelo151: 'modelo-151',
};

function canonicalServiceSlug(slug: string): string {
  return LEGACY_SERVICE_SLUGS[slug] ?? slug;
}

function serviceDisplayName(slug: string): string {
  return getCatalogService(slug)?.name ?? slug.replace(/-/g, ' ');
}

const quoteRequestSchema = z.object({
  hp_url: z.string().optional(),
  email: z.string().email(),
  name: z.string().min(2).max(100),
  phone: z.string().max(20).optional(),
  services: z.array(z.string().min(1)).min(1),
  description: z.string().max(1000).optional(),
  origin: z.string().trim().max(240).optional(),
  recaptcha_token: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();

    if (String(requestBody.hp_url ?? '').trim()) {
      return NextResponse.json({ success: true });
    }

    const ip = getClientIp(request.headers);
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Inténtalo más tarde.' }, { status: 429 });
    }

    const validated = quoteRequestSchema.parse(requestBody);
    const normalizedEmail = validated.email.trim().toLowerCase();

    const spam = checkSpam({
      name: validated.name,
      email: normalizedEmail,
      message: validated.description
    });
    if (spam.isSpam) {
      return NextResponse.json({ success: true });
    }

    const recaptcha = await verifyRecaptchaToken({
      token: String(validated.recaptcha_token ?? ''),
      action: 'quote_request'
    });
    if (!recaptcha.ok) {
      return NextResponse.json({ error: 'Verificación anti-spam fallida. Inténtalo de nuevo.' }, { status: 400 });
    }

    const adminId = await getFirstAdminProfileId();
    if (!adminId) {
      return NextResponse.json(
        { error: 'No se encontró un perfil de administrador para asignar la solicitud' },
        { status: 500 }
      );
    }

    const serviceSlugs = [...new Set(validated.services.map(canonicalServiceSlug))];
    const serviceSlugList = serviceSlugs.join(', ');
    const serviceList = serviceSlugs.map(serviceDisplayName).join(', ');
    const descriptionText = validated.description?.trim() || 'No se proporcionaron detalles adicionales.';
    const supabaseAdmin = getSupabaseAdmin();
    const attributionFields = buildLeadAttributionFields(request);
    const contentOrigin = normalizeContentOrigin(validated.origin, 'form:solicitar-presupuesto');
    const contentOriginLabel = describeContentOrigin(contentOrigin);

    const normalizedPhone = validated.phone?.trim() || null;
    const quoteRequestInteraction = {
      action: 'quote_request',
      origin: contentOrigin,
      requested_services: serviceSlugs,
      at: new Date().toISOString(),
      contact: {
        email: normalizedEmail,
        phone: normalizedPhone,
      },
    };

    const escapedEmail = [...normalizedEmail]
        .map((char) => (char === '%' || char === '_' || char === '\\' ? `\\${char}` : char))
        .join('');
    const { data: emailMatches, error: leadByEmailError } = await supabaseAdmin
      .from('leads')
      .select('id,message,metadata')
      .ilike('email', escapedEmail)
      .limit(2);
    if (leadByEmailError) throw leadByEmailError;

    const { data: phoneMatches, error: leadByPhoneError } = normalizedPhone
      ? await supabaseAdmin
          .from('leads')
          .select('id,message,metadata')
          .eq('phone', normalizedPhone)
          .limit(2)
      : { data: [], error: null };
    if (leadByPhoneError) throw leadByPhoneError;

    const uniqueEmailMatch = (emailMatches ?? []).length === 1 ? emailMatches![0] : null;
    const uniquePhoneMatch = (phoneMatches ?? []).length === 1 ? phoneMatches![0] : null;
    const identifiersConflict = Boolean(
      uniqueEmailMatch && uniquePhoneMatch && uniqueEmailMatch.id !== uniquePhoneMatch.id
    );
    const ambiguousIdentity = identifiersConflict
      || (emailMatches ?? []).length > 1
      || (phoneMatches ?? []).length > 1;
    const existingLead = ambiguousIdentity ? null : (uniqueEmailMatch ?? uniquePhoneMatch);

    if (ambiguousIdentity) {
      console.warn('[quotes] ambiguous lead identity; preserving request as separate lead');
    }

    let leadId: string;
    if (existingLead) {
      const existingMetadata =
        existingLead.metadata && typeof existingLead.metadata === 'object' && !Array.isArray(existingLead.metadata)
          ? existingLead.metadata as Record<string, unknown>
          : {};
      const previousRequests = Array.isArray(existingMetadata.quote_requests)
        ? existingMetadata.quote_requests.slice(-19)
        : [];
      const previousMessage = typeof existingLead.message === 'string' ? existingLead.message.trim() : '';
      const nextMessage = [
        previousMessage,
        `[Solicitud de presupuesto ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}]\nServicios: ${serviceList}\n${descriptionText}`,
      ].filter(Boolean).join('\n\n');

      const { error: leadUpdateError } = await supabaseAdmin
        .from('leads')
        .update({
          name: validated.name,
          category: 'Presupuesto',
          service: serviceSlugList,
          message: nextMessage,
          state: 'new',
          updated_at: new Date().toISOString(),
          metadata: {
            ...existingMetadata,
            conversion: quoteRequestInteraction,
            last_acquisition: quoteRequestInteraction,
            quote_requests: [...previousRequests, quoteRequestInteraction],
          },
        })
        .eq('id', existingLead.id);
      if (leadUpdateError) throw leadUpdateError;
      leadId = existingLead.id;
    } else {
      const { data: lead, error: leadError } = await supabaseAdmin
        .from('leads')
        .insert({
          name: validated.name,
          email: normalizedEmail,
          phone: normalizedPhone,
          client_type: 'particular',
          category: 'Presupuesto',
          service: serviceSlugList,
          country: 'ES',
          urgency: 'media',
          message: descriptionText,
          state: 'new',
          source: attributionFields.source,
          source_key: attributionFields.source_key,
          metadata: {
            ...attributionFields.metadata,
            ...(ambiguousIdentity ? { identity_match_status: 'needs_review' } : {}),
            conversion: quoteRequestInteraction,
            last_acquisition: quoteRequestInteraction,
            quote_requests: [quoteRequestInteraction],
          },
        })
        .select('id')
        .single();

      if (leadError || !lead?.id) {
        console.error('Error creating lead:', leadError);
        return NextResponse.json({ error: 'Error al registrar la solicitud' }, { status: 500 });
      }
      leadId = lead.id;
    }

    const quoteTitle = `Solicitud de presupuesto de ${validated.name}`;
    const quoteDescription = `Servicios:\n${serviceList}\n\nDetalles:\n${descriptionText}`;

    const { data: quote, error: quoteError } = await supabaseAdmin
      .from('quotes')
      .insert({
        lead_id: leadId,
        client_id: null,
        title: quoteTitle,
        description: quoteDescription,
        amount_eur: 0.0,
        status: 'draft',
        stripe_checkout_id: null,
        expires_at: null,
        created_by: adminId,
        service_slugs: serviceSlugs,
        claim_email: normalizedEmail
      })
      .select('id')
      .single();

    if (quoteError || !quote?.id) {
      console.error('Error creating quote:', quoteError);
      return NextResponse.json({ error: 'Error al guardar el presupuesto' }, { status: 500 });
    }

    // Emails: client confirmation + admin notification
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map((e) => e.trim()).filter(Boolean) ?? [];

    const claimToken = createQuoteClaimToken({ quoteId: quote.id, email: normalizedEmail });
    const clientTpl = quoteReceivedClient(validated.name, serviceList, claimToken);
    await sendEmail({
      to: normalizedEmail,
      eventType: 'quote.received',
      ...clientTpl,
      metadata: { quote_id: quote.id, lead_id: leadId }
    });

    if (adminEmails.length) {
      const adminTpl = quoteReceivedAdmin(validated.name, normalizedEmail, serviceList, descriptionText, contentOriginLabel);
      await sendEmail({
        to: adminEmails,
        eventType: 'quote.received.admin',
        ...adminTpl,
        metadata: { quote_id: quote.id, lead_id: leadId, content_origin: contentOrigin }
      });
    }

    notifyAdmins({
      title: `💼 Nuevo presupuesto: ${validated.name}`,
      body: `${serviceList} · ${contentOriginLabel}`.slice(0, 240),
      url: '/admin/presupuestos',
      tag: `quote-${quote.id}`,
    }).catch(() => {});

    return NextResponse.json(
      { success: true, message: 'Presupuesto creado correctamente', quoteId: quote.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating quote:', error);
    return NextResponse.json({ error: 'Error al crear presupuesto' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Ownership is established only through the capability link sent to the lead email.
    // A logged-in session alone is not sufficient proof of mailbox possession.

    const { data: quotes, error: fetchError } = await supabase
      .from('quotes')
      .select('id,title,description,amount_eur,status,created_at,expires_at,client_id,quote_items(service_slug,description,quantity,unit_amount_cents,currency,position)')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching quotes:', fetchError);
      return NextResponse.json({ error: 'Error al obtener presupuestos' }, { status: 500 });
    }

    return NextResponse.json({ quotes: quotes ?? [] });
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
