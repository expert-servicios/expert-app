import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

type HoldedContactClaimState =
  | 'claimed'
  | 'creating'
  | 'completed'
  | 'released'
  | 'manual_review'
  | 'retry'
  | string;

export type HoldedContactCreationClaim = {
  acquired: boolean;
  claimId: string | null;
  state: HoldedContactClaimState;
  holdedContactId: string | null;
};

function parseClaimPayload(value: unknown): HoldedContactCreationClaim {
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid Holded contact creation claim payload');
  }

  const payload = value as Record<string, unknown>;
  return {
    acquired: payload.acquired === true,
    claimId: typeof payload.claim_id === 'string' ? payload.claim_id : null,
    state: typeof payload.state === 'string' ? payload.state : 'unknown',
    holdedContactId: typeof payload.holded_contact_id === 'string' ? payload.holded_contact_id : null,
  };
}

export function newHoldedContactClaimOwnerToken() {
  return randomUUID();
}

export async function claimHoldedContactCreation(
  admin: SupabaseClient,
  input: { companyId: string; ownerToken: string },
): Promise<HoldedContactCreationClaim> {
  const { data, error } = await admin.rpc('claim_holded_contact_creation', {
    p_company_id: input.companyId,
    p_owner_token: input.ownerToken,
    p_lease_seconds: 120,
  });

  if (error) throw new Error(`Holded contact creation claim failed: ${error.message}`);
  return parseClaimPayload(data);
}

export async function markHoldedContactCreationStarted(
  admin: SupabaseClient,
  input: { claimId: string; ownerToken: string },
) {
  const { error } = await admin.rpc('mark_holded_contact_creation_started', {
    p_claim_id: input.claimId,
    p_owner_token: input.ownerToken,
  });
  if (error) throw new Error(`Holded contact creation start failed: ${error.message}`);
}

export async function completeHoldedContactCreation(
  admin: SupabaseClient,
  input: { claimId: string; ownerToken: string; holdedContactId: string },
) {
  const { error } = await admin.rpc('complete_holded_contact_creation', {
    p_claim_id: input.claimId,
    p_owner_token: input.ownerToken,
    p_holded_contact_id: input.holdedContactId,
  });
  if (error) throw new Error(`Holded contact creation completion failed: ${error.message}`);
}

export async function releaseHoldedContactCreationClaim(
  admin: SupabaseClient,
  input: { claimId: string; ownerToken: string; error?: string },
) {
  const { error } = await admin.rpc('release_holded_contact_creation_claim', {
    p_claim_id: input.claimId,
    p_owner_token: input.ownerToken,
    p_error: input.error ?? null,
  });
  if (error) throw new Error(`Holded contact creation release failed: ${error.message}`);
}

export async function flagHoldedContactCreationReview(
  admin: SupabaseClient,
  input: { claimId: string; ownerToken: string; error: string },
) {
  const { error } = await admin.rpc('flag_holded_contact_creation_review', {
    p_claim_id: input.claimId,
    p_owner_token: input.ownerToken,
    p_error: input.error,
  });
  if (error) throw new Error(`Holded contact creation review flag failed: ${error.message}`);
}
