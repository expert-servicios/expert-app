import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/auth/require-admin';
import { attributionFromMetadata } from '@/lib/marketing/server-attribution';
import { CRM_ATTENTION_FILTER, CRM_STRIPE_HISTORY_FILTER, combineCrmOrFilters } from '@/lib/crm/lead-segment-filters';

const LIFECYCLE_STAGES = ['lead', 'prospect', 'customer', 'former_customer'] as const;
const STRIPE_ACTIVITIES = ['no_activity', 'abandoned', 'paid', 'subscribed'] as const;
const MARKETING_STATUSES = ['unknown', 'consented', 'unsubscribed', 'blocked'] as const;
const ATTRIBUTION_LOCALES = ['es', 'ru', 'en'] as const;
const CRM_SEGMENTS = ['all', 'attention', 'stripe_history', 'mentorday-projects', 'stripe_customer', 'stripe_imported', 'stripe_abandoned', 'mentorday_directory', 'mentoring_followup', 'actionable', 'needs_review', 'spam_review', 'internal_test', 'system_notice'] as const;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function positiveInt(raw: string | null, fallback: number, max: number) {
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) return fallback;
  return Math.min(value, max);
}

function sanitizeSearch(raw: string) {
  return raw
    .replace(/[^\p{L}\p{N}\s@._+\-']/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);
}

function localeFilter(locale: string | null) {
  return locale && ATTRIBUTION_LOCALES.includes(locale as (typeof ATTRIBUTION_LOCALES)[number])
    ? locale as (typeof ATTRIBUTION_LOCALES)[number]
    : null;
}

function withLocale<T extends { contains: (column: string, value: Record<string, unknown>) => T }>(query: T, locale: string) {
  return query.contains('metadata', { acquisition: { locale } });
}

function projectProfileFromMetadata(metadata: unknown) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  const raw = (metadata as Record<string, unknown>).project_profile;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const profile = raw as Record<string, unknown>;
  return {
    project_name: typeof profile.project_name === 'string' ? profile.project_name : null,
    kia_summary: typeof profile.kia_summary === 'string' ? profile.kia_summary : null,
    website_url: typeof profile.website_url === 'string' ? profile.website_url : null,
    logo_url: typeof profile.logo_url === 'string' ? profile.logo_url : null,
    source_type: typeof profile.source_type === 'string' ? profile.source_type : null,
    verified_at: typeof profile.verified_at === 'string' ? profile.verified_at : null,
  };
}

function latestInteractionFromMetadata(metadata: unknown) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  const value = (metadata as Record<string, unknown>).last_acquisition;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const contact =
    record.contact && typeof record.contact === 'object' && !Array.isArray(record.contact)
      ? record.contact as Record<string, unknown>
      : {};
  return {
    at: typeof record.at === 'string' ? record.at : null,
    intent: typeof record.intent === 'string' ? record.intent : null,
    origin: typeof record.origin === 'string' ? record.origin : null,
    service: typeof record.service === 'string' ? record.service : null,
    email: typeof contact.email === 'string' ? contact.email : null,
    phone: typeof contact.phone === 'string' ? contact.phone : null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminClient(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const url = new URL(request.url);
    const page = positiveInt(url.searchParams.get('page'), 1, 100000);
    const limit = positiveInt(url.searchParams.get('limit'), 50, 100);
    const lifecycle = url.searchParams.get('lifecycle');
    const activity = url.searchParams.get('activity');
    const marketing = url.searchParams.get('marketing');
    const locale = localeFilter(url.searchParams.get('locale'));
    const segment = url.searchParams.get('segment');
    if (segment && !CRM_SEGMENTS.includes(segment as (typeof CRM_SEGMENTS)[number])) {
      return NextResponse.json({ error: 'Segmento CRM no válido' }, { status: 400 });
    }
    const search = sanitizeSearch(url.searchParams.get('q') ?? '');
    const focus = url.searchParams.get('focus');
    if (focus && !UUID_PATTERN.test(focus)) {
      return NextResponse.json({ error: 'Lead no válido' }, { status: 400 });
    }

    let query = admin
      .from('leads')
      .select(
        'id,name,email,phone,client_type,category,service,message,country,state,source,source_key,metadata,created_at,updated_at,lifecycle_stage,stripe_activity,marketing_status,marketing_consent_at,marketing_source,first_stripe_activity_at,last_stripe_activity_at',
        { count: 'exact' },
      )
      .order('last_stripe_activity_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (lifecycle && LIFECYCLE_STAGES.includes(lifecycle as (typeof LIFECYCLE_STAGES)[number])) {
      query = query.eq('lifecycle_stage', lifecycle);
    }
    if (activity && STRIPE_ACTIVITIES.includes(activity as (typeof STRIPE_ACTIVITIES)[number])) {
      query = query.eq('stripe_activity', activity);
    }
    if (marketing && MARKETING_STATUSES.includes(marketing as (typeof MARKETING_STATUSES)[number])) {
      query = query.eq('marketing_status', marketing);
    }
    if (locale) {
      query = query.contains('metadata', { acquisition: { locale } });
    }
    let segmentOr: string | null = null;
    if (segment === 'mentorday-projects') {
      query = query.contains('metadata', { source_group: 'mentorday', program: 'Mentor Tips / Speed Mentoring' });
    } else if (segment === 'attention') {
      segmentOr = CRM_ATTENTION_FILTER;
    } else if (segment === 'stripe_history') {
      segmentOr = CRM_STRIPE_HISTORY_FILTER;
    } else if (segment && segment !== 'all') {
      query = query.contains('metadata', { crm_segment: segment });
    }
    // Compose search and CRM segments in a single PostgREST OR parameter.
    // Two successive .or() calls can overwrite the first and leak other segments.
    const searchOr = search ? `name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%` : null;
    const combinedOr = combineCrmOrFilters(segmentOr, searchOr);
    if (combinedOr) query = query.or(combinedOr);
    if (focus) {
      query = query.eq('id', focus);
    }

    const ruBase = () => withLocale(admin.from('leads').select('id', { count: 'exact', head: true }), 'ru');

    const [
      listResult,
      totalResult,
      leadsResult,
      prospectsResult,
      customersResult,
      formerResult,
      subscribedResult,
      paidResult,
      abandonedResult,
      consentedResult,
      unknownResult,
      ruTotalResult,
      ruProspectsResult,
      ruCustomersResult,
      ruPaidResult,
      ruSubscribedResult,
      attentionResult,
    ] = await Promise.all([
      query,
      admin.from('leads').select('id', { count: 'exact', head: true }),
      admin.from('leads').select('id', { count: 'exact', head: true }).eq('lifecycle_stage', 'lead'),
      admin.from('leads').select('id', { count: 'exact', head: true }).eq('lifecycle_stage', 'prospect'),
      admin.from('leads').select('id', { count: 'exact', head: true }).eq('lifecycle_stage', 'customer'),
      admin.from('leads').select('id', { count: 'exact', head: true }).eq('lifecycle_stage', 'former_customer'),
      admin.from('leads').select('id', { count: 'exact', head: true }).eq('stripe_activity', 'subscribed'),
      admin.from('leads').select('id', { count: 'exact', head: true }).eq('stripe_activity', 'paid'),
      admin.from('leads').select('id', { count: 'exact', head: true }).eq('stripe_activity', 'abandoned'),
      admin.from('leads').select('id', { count: 'exact', head: true }).eq('marketing_status', 'consented'),
      admin.from('leads').select('id', { count: 'exact', head: true }).eq('marketing_status', 'unknown'),
      ruBase(),
      ruBase().eq('lifecycle_stage', 'prospect'),
      ruBase().eq('lifecycle_stage', 'customer'),
      ruBase().eq('stripe_activity', 'paid'),
      ruBase().eq('stripe_activity', 'subscribed'),
      admin.from('leads').select('id', { count: 'exact', head: true }).or(CRM_ATTENTION_FILTER),
    ]);

    if (listResult.error) throw listResult.error;

    const statsResults = [
      totalResult,
      leadsResult,
      prospectsResult,
      customersResult,
      formerResult,
      subscribedResult,
      paidResult,
      abandonedResult,
      consentedResult,
      unknownResult,
      ruTotalResult,
      ruProspectsResult,
      ruCustomersResult,
      ruPaidResult,
      ruSubscribedResult,
      attentionResult,
    ];
    const statsError = statsResults.find((result) => result.error)?.error;
    if (statsError) throw statsError;

    const leads = listResult.data ?? [];
    const leadIds = leads.map((lead) => lead.id);
    const summaries = new Map<string, {
      customer_count: number;
      active_subscription: boolean;
      successful_charges: number;
      succeeded_payment_intents: number;
      paid_invoices: number;
      paid_checkouts: number;
      last_activity_at: string | null;
    }>();

    if (leadIds.length > 0) {
      const { data: mappings, error: mappingError } = await admin
        .from('lead_stripe_customers')
        .select('lead_id,stripe_customer_id,has_active_subscription,successful_charges,succeeded_payment_intents,paid_invoices,paid_checkouts,last_activity_at')
        .in('lead_id', leadIds);

      if (mappingError) throw mappingError;

      for (const mapping of mappings ?? []) {
        const current = summaries.get(mapping.lead_id) ?? {
          customer_count: 0,
          active_subscription: false,
          successful_charges: 0,
          succeeded_payment_intents: 0,
          paid_invoices: 0,
          paid_checkouts: 0,
          last_activity_at: null,
        };
        current.customer_count += 1;
        current.active_subscription ||= Boolean(mapping.has_active_subscription);
        current.successful_charges += mapping.successful_charges ?? 0;
        current.succeeded_payment_intents += mapping.succeeded_payment_intents ?? 0;
        current.paid_invoices += mapping.paid_invoices ?? 0;
        current.paid_checkouts += mapping.paid_checkouts ?? 0;
        if (mapping.last_activity_at && (!current.last_activity_at || mapping.last_activity_at > current.last_activity_at)) {
          current.last_activity_at = mapping.last_activity_at;
        }
        summaries.set(mapping.lead_id, current);
      }
    }

    return NextResponse.json({
      leads: leads.map((lead) => ({
        ...lead,
        attribution: attributionFromMetadata(lead.metadata),
        latest_interaction: latestInteractionFromMetadata(lead.metadata),
        project_profile: projectProfileFromMetadata(lead.metadata),
        crm_segment: typeof (lead.metadata as Record<string, unknown> | null)?.crm_segment === 'string' ? (lead.metadata as Record<string, string>).crm_segment : null,
        crm_summary: typeof (lead.metadata as Record<string, unknown> | null)?.crm_summary === 'string' ? (lead.metadata as Record<string, string>).crm_summary : null,
        stripe_summary: summaries.get(lead.id) ?? {
          customer_count: 0,
          active_subscription: false,
          successful_charges: 0,
          succeeded_payment_intents: 0,
          paid_invoices: 0,
          paid_checkouts: 0,
          last_activity_at: null,
        },
      })),
      pagination: {
        page,
        limit,
        total: listResult.count ?? 0,
        pages: Math.max(1, Math.ceil((listResult.count ?? 0) / limit)),
      },
      stats: {
        total: totalResult.count ?? 0,
        attention: attentionResult.count ?? 0,
        leads: leadsResult.count ?? 0,
        prospects: prospectsResult.count ?? 0,
        customers: customersResult.count ?? 0,
        former_customers: formerResult.count ?? 0,
        subscribed: subscribedResult.count ?? 0,
        paid: paidResult.count ?? 0,
        abandoned: abandonedResult.count ?? 0,
        marketing_consented: consentedResult.count ?? 0,
        marketing_unknown: unknownResult.count ?? 0,
        ru_funnel: {
          total: ruTotalResult.count ?? 0,
          prospects: ruProspectsResult.count ?? 0,
          customers: ruCustomersResult.count ?? 0,
          paid: ruPaidResult.count ?? 0,
          subscribed: ruSubscribedResult.count ?? 0,
        },
      },
    });
  } catch (error) {
    console.error('[admin/leads] GET error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdminClient(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    if (!UUID_PATTERN.test(id)) return NextResponse.json({ error: 'ID no válido' }, { status: 400 });

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Solicitud no válida' }, { status: 400 });
    }

    const lifecycleStage = body.lifecycle_stage;
    if (typeof lifecycleStage !== 'string' || !LIFECYCLE_STAGES.includes(lifecycleStage as (typeof LIFECYCLE_STAGES)[number])) {
      return NextResponse.json({ error: 'Etapa no válida' }, { status: 400 });
    }

    const { data, error } = await admin
      .from('leads')
      .update({ lifecycle_stage: lifecycleStage, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id,lifecycle_stage')
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });

    return NextResponse.json({ ok: true, lead: data });
  } catch (error) {
    console.error('[admin/leads] PATCH error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
