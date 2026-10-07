import type { getSupabaseAdmin } from '@/lib/integrations/supabase';

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

type InboundInteraction = {
  at: string;
  channel: string;
  origin: string;
  source_key: string;
  service?: string | null;
  subject?: string | null;
};

export async function ensureInboundLead(input: {
  admin: AdminClient;
  name: string;
  email?: string | null;
  phone?: string | null;
  source: string;
  sourceKey: string;
  category: string;
  service: string;
  message: string;
  channel: string;
  origin: string;
  metadata?: Record<string, unknown>;
}): Promise<{ leadId: string; created: boolean }> {
  const email = input.email?.trim().toLowerCase() || null;
  const phone = input.phone?.trim() || null;
  const interaction: InboundInteraction = {
    at: new Date().toISOString(),
    channel: input.channel,
    origin: input.origin,
    source_key: input.sourceKey,
    service: input.service || null,
  };

  const candidateIds = new Set<string>();

  if (email) {
    const escapedEmail = [...email]
      .map((char) => (char === '%' || char === '_' || char === '\\' ? `\\${char}` : char))
      .join('');
    const { data, error } = await input.admin
      .from('leads')
      .select('id')
      .ilike('email', escapedEmail)
      .limit(2);
    if (error) throw error;
    for (const row of data ?? []) candidateIds.add(row.id);
  }

  if (phone) {
    const { data, error } = await input.admin
      .from('leads')
      .select('id')
      .eq('phone', phone)
      .limit(2);
    if (error) throw error;
    for (const row of data ?? []) candidateIds.add(row.id);
  }

  if (!email && !phone) {
    const { data, error } = await input.admin
      .from('leads')
      .select('id')
      .eq('source', input.source)
      .eq('source_key', input.sourceKey)
      .limit(2);
    if (error) throw error;
    for (const row of data ?? []) candidateIds.add(row.id);
  }

  if (candidateIds.size === 1) {
    const leadId = [...candidateIds][0];
    const { data: current, error: currentError } = await input.admin
      .from('leads')
      .select('metadata,message')
      .eq('id', leadId)
      .single();
    if (currentError) throw currentError;

    const metadata = current.metadata && typeof current.metadata === 'object' && !Array.isArray(current.metadata)
      ? current.metadata as Record<string, unknown>
      : {};
    const previous = Array.isArray(metadata.inquiries) ? metadata.inquiries.slice(-29) : [];
    const previousMessage = typeof current.message === 'string' ? current.message.trim() : '';

    const { error: updateError } = await input.admin
      .from('leads')
      .update({
        name: input.name,
        ...(email ? { email } : {}),
        ...(phone ? { phone } : {}),
        category: input.category,
        service: input.service,
        message: [previousMessage, input.message].filter(Boolean).join('\n\n').slice(-12000),
        state: 'new',
        lifecycle_stage: 'lead',
        updated_at: new Date().toISOString(),
        metadata: {
          ...metadata,
          ...input.metadata,
          last_acquisition: interaction,
          inquiries: [...previous, interaction],
        },
      })
      .eq('id', leadId);
    if (updateError) throw updateError;
    return { leadId, created: false };
  }

  const identityAmbiguous = candidateIds.size > 1;
  const { data: created, error: createError } = await input.admin
    .from('leads')
    .insert({
      name: input.name,
      email,
      phone: identityAmbiguous ? null : phone,
      client_type: 'particular',
      category: input.category,
      service: input.service,
      country: 'ES',
      urgency: 'media',
      message: input.message,
      state: 'new',
      lifecycle_stage: 'lead',
      source: input.source,
      source_key: input.sourceKey,
      metadata: {
        ...input.metadata,
        ...(identityAmbiguous ? {
          identity_match_status: 'needs_review',
          submitted_contact: { email, phone },
        } : {}),
        last_acquisition: interaction,
        inquiries: [interaction],
      },
    })
    .select('id')
    .single();

  if (!createError && created?.id) return { leadId: created.id, created: true };

  if (createError?.code === '23505') {
    const { data: raced, error: racedError } = await input.admin
      .from('leads')
      .select('id')
      .eq('source', input.source)
      .eq('source_key', input.sourceKey)
      .maybeSingle();
    if (racedError) throw racedError;
    if (raced?.id) return { leadId: raced.id, created: false };
  }

  throw createError ?? new Error('Could not create inbound lead');
}
