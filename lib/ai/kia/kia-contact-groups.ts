/**
 * CRM contact groups are not authentication roles.
 *
 * A known lead email is useful for continuity, but does not confer client
 * identity, Supabase permissions, or access to any private KIA tool.
 */
export type KiaContactGroup = 'visitor' | 'lead' | 'verified_client';

export function resolveKiaContactGroup(identity: {
  clientId?: string | null;
  leadId?: string | null;
}): KiaContactGroup {
  if (identity.clientId) return 'verified_client';
  if (identity.leadId) return 'lead';
  return 'visitor';
}

/**
 * Only a verified-client identity can select the private client tool set.
 * Email/lead correspondence alone never authorizes private reads.
 */
export function mayUsePrivateKiaEmailTools(group: KiaContactGroup): boolean {
  return group === 'verified_client';
}

/** Known leads get a separate sending gate; not ordinary client auto-send. */
export function canAutoReplyToKiaContact(input: {
  group: KiaContactGroup;
  safeUnknownProspect: boolean;
  newLeadAutoSend: boolean;
}): boolean {
  if (input.group === 'verified_client') return true;
  if (!input.newLeadAutoSend) return false;
  return input.group === 'lead' || input.safeUnknownProspect;
}
