import { getSupabaseAdmin, listAllAuthUsers } from '@/lib/integrations/supabase';

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

type AppointmentRow = {
  id: string;
  service: string | null;
  appointment_type: string | null;
  status: string | null;
  appointment_date: string | null;
  confirmed_date: string | null;
  confirmed_time: string | null;
  email?: string | null;
  client_id?: string | null;
  company_id?: string | null;
};

export type BookingIdentity = {
  clientId: string;
  companyId: string | null;
  source: 'auth_email' | 'company_email';
};

function normalizeEmail(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

export async function getAuthorizedBookingEmails(
  admin: AdminClient,
  clientId: string,
  companyId: string | null | undefined,
  authEmail: string | null | undefined,
): Promise<string[]> {
  const emails = new Set<string>();
  const normalizedAuth = normalizeEmail(authEmail);
  if (normalizedAuth) emails.add(normalizedAuth);

  const { data: memberships, error: membershipError } = await admin
    .from('profile_companies')
    .select('company_id')
    .eq('profile_id', clientId);
  if (membershipError) throw membershipError;

  const allowedCompanyIds = (memberships ?? []).map((row) => row.company_id as string);
  const companyIds = companyId
    ? allowedCompanyIds.filter((id) => id === companyId)
    : allowedCompanyIds;

  if (companyIds.length) {
    const { data: companies, error: companyError } = await admin
      .from('companies')
      .select('id,email')
      .in('id', companyIds);
    if (companyError) throw companyError;
    for (const company of companies ?? []) {
      const companyEmail = normalizeEmail(company.email);
      if (companyEmail) emails.add(companyEmail);
    }
  }

  return [...emails];
}

export async function loadOnboardingAppointmentsForIdentity(
  admin: AdminClient,
  clientId: string,
  companyId: string | null | undefined,
  authEmail: string | null | undefined,
): Promise<AppointmentRow[]> {
  let scopedQuery = admin
    .from('appointments')
    .select('id,email,client_id,company_id,service,appointment_type,status,appointment_date,confirmed_date,confirmed_time')
    .eq('client_id', clientId)
    .neq('status', 'cancelled');
  scopedQuery = companyId
    ? scopedQuery.eq('company_id', companyId)
    : scopedQuery.is('company_id', null);
  const { data: scopedRows, error: scopedError } = await scopedQuery
    .order('appointment_date', { ascending: false });
  if (scopedError) throw scopedError;

  // Legacy rows created before entity-scoped appointments remain discoverable by
  // authorized email, but are never rewritten or attributed automatically.
  const emails = await getAuthorizedBookingEmails(admin, clientId, companyId, authEmail);
  const legacyResults = await Promise.all(emails.map(async (email) => {
    const { data, error } = await admin
      .from('appointments')
      .select('id,email,client_id,company_id,service,appointment_type,status,appointment_date,confirmed_date,confirmed_time')
      .is('client_id', null)
      .is('company_id', null)
      .ilike('email', email)
      .neq('status', 'cancelled')
      .order('appointment_date', { ascending: false });
    if (error) throw error;
    return (data ?? []) as AppointmentRow[];
  }));

  const unique = new Map<string, AppointmentRow>();
  for (const row of scopedRows ?? []) unique.set(row.id, row as AppointmentRow);
  for (const row of legacyResults.flat()) unique.set(row.id, row);
  return [...unique.values()].sort((a, b) => {
    const aTime = a.appointment_date ? new Date(a.appointment_date).getTime() : 0;
    const bTime = b.appointment_date ? new Date(b.appointment_date).getTime() : 0;
    return bTime - aTime;
  });
}

export async function listOpenOnboardingCompanyIds(
  admin: AdminClient,
  clientId: string,
): Promise<string[]> {
  const { data, error } = await admin
    .from('subscriptions')
    .select('company_id')
    .eq('client_id', clientId)
    .in('status', ['active', 'trialing'])
    .is('post_purchase_onboarding_at', null)
    .limit(20);
  if (error) throw error;
  return [...new Set((data ?? []).map((row) => row.company_id).filter(Boolean))] as string[];
}

async function resolveSingleOpenOnboardingCompanyId(admin: AdminClient, clientId: string): Promise<string | null> {
  const { data, error } = await admin
    .from('subscriptions')
    .select('company_id')
    .eq('client_id', clientId)
    .in('status', ['active', 'trialing'])
    .is('post_purchase_onboarding_at', null)
    .limit(3);
  if (error) throw error;

  const companyIds = [...new Set((data ?? []).map((row) => row.company_id).filter(Boolean))] as string[];
  return companyIds.length === 1 ? companyIds[0] : null;
}

export async function resolveAuthenticatedBookingIdentity(
  admin: AdminClient,
  clientId: string,
): Promise<BookingIdentity> {
  return {
    clientId,
    companyId: await resolveSingleOpenOnboardingCompanyId(admin, clientId),
    source: 'auth_email',
  };
}

/**
 * Resolve a Cal.com attendee to a customer and, when it can be proven
 * unambiguously, to the fiscal entity that owns the booking.
 *
 * Rules:
 * - exact auth email -> client; company only when exactly one active/trialing
 *   subscription still needs post-purchase onboarding;
 * - exact companies.email -> company; client only when that company has exactly
 *   one active/trialing subscription owner;
 * - never infer from domains, names or fuzzy matches.
 */
export async function resolveBookingIdentityByEmail(
  admin: AdminClient,
  email: string,
): Promise<BookingIdentity | null> {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  const authUsers = await listAllAuthUsers();
  const direct = authUsers.find((user) => normalizeEmail(user.email) === normalized);
  if (direct) {
    return {
      clientId: direct.id,
      companyId: await resolveSingleOpenOnboardingCompanyId(admin, direct.id),
      source: 'auth_email',
    };
  }

  const { data: companies, error: companyError } = await admin
    .from('companies')
    .select('id')
    .ilike('email', normalized)
    .limit(2);
  if (companyError) throw companyError;
  if (!companies || companies.length !== 1) return null;

  const companyId = companies[0].id as string;
  const { data: subscriptions, error: subscriptionError } = await admin
    .from('subscriptions')
    .select('client_id')
    .eq('company_id', companyId)
    .in('status', ['active', 'trialing'])
    .limit(3);
  if (subscriptionError) throw subscriptionError;

  const clientIds = [...new Set((subscriptions ?? []).map((row) => row.client_id).filter(Boolean))] as string[];
  if (clientIds.length !== 1) return null;

  return { clientId: clientIds[0], companyId, source: 'company_email' };
}

/** Backwards-compatible client-only resolver for existing consumers/tests. */
export async function resolveBookingClientIdByEmail(
  admin: AdminClient,
  email: string,
): Promise<string | null> {
  const identity = await resolveBookingIdentityByEmail(admin, email);
  return identity?.clientId ?? null;
}
