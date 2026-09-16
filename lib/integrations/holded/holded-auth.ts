/**
 * Holded authentication layer.
 *
 * Resolves the correct API key for a given integration:
 *   - integrationId=null explicitly selects the EXPERT global account.
 *   - any string value must be a non-empty client integration id.
 *
 * The decrypted key NEVER leaves this module in any response payload.
 */

import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { decryptSecret } from '@/lib/security/encryption';
import { HoldedAuthError, HoldedIntegrationError } from './holded-errors';

export interface HoldedAuthConfig {
  apiKey: string;
  baseUrl: string;
  crmUrl: string;
  projectsUrl: string;
}

const BASE_URL = 'https://api.holded.com/api/invoicing/v1';
const CRM_URL = 'https://api.holded.com/api/crm/v1';
const PROJECTS_URL = 'https://api.holded.com/api/projects/v1';

/** Build standard Holded request headers from an API key. Never log the key. */
export function buildHoldedHeaders(apiKey: string): HeadersInit {
  return { key: apiKey, 'Content-Type': 'application/json' };
}

/** Resolve the EXPERT global Holded account. Only explicit null callers use it. */
export function getExpertAccountAuth(): HoldedAuthConfig {
  const apiKey = process.env.HOLDED_API_KEY?.trim();
  if (!apiKey) throw new HoldedAuthError('/global', 'HOLDED_API_KEY not set');
  return { apiKey, baseUrl: BASE_URL, crmUrl: CRM_URL, projectsUrl: PROJECTS_URL };
}

export async function getClientIntegrationAuth(integrationId: string): Promise<HoldedAuthConfig> {
  const normalizedIntegrationId = integrationId.trim();
  if (!normalizedIntegrationId) {
    throw new HoldedAuthError('/integration', 'integrationId is required');
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('client_integrations')
    .select('id, status, mode, provider')
    .eq('id', normalizedIntegrationId)
    .single();

  if (error || !data) {
    throw new HoldedIntegrationError(
      `client_integrations row not found for id=${normalizedIntegrationId}: ${error?.message ?? 'no data'}`,
    );
  }
  if (data.provider !== 'holded') {
    throw new HoldedIntegrationError(`Integration ${normalizedIntegrationId} is not a Holded integration.`);
  }
  if (data.status !== 'active') {
    throw new HoldedIntegrationError(
      `Integration ${normalizedIntegrationId} is not active (status=${data.status}). Connect Holded first.`,
    );
  }

  const { data: secret, error: secretError } = await admin
    .from('client_integration_secrets')
    .select('encrypted_api_key')
    .eq('integration_id', normalizedIntegrationId)
    .single();

  if (secretError || !secret?.encrypted_api_key) {
    throw new HoldedIntegrationError(`Integration ${normalizedIntegrationId} has no encrypted API key stored.`);
  }

  let apiKey: string;
  try {
    apiKey = decryptSecret(secret.encrypted_api_key).trim();
  } catch (decryptErr) {
    throw new HoldedIntegrationError(
      `Failed to decrypt API key for integration ${normalizedIntegrationId}: ${decryptErr instanceof Error ? decryptErr.message : String(decryptErr)}`,
    );
  }

  if (!apiKey) {
    throw new HoldedAuthError(`/integration/${normalizedIntegrationId}`, 'Decrypted API key is empty');
  }

  return { apiKey, baseUrl: BASE_URL, crmUrl: CRM_URL, projectsUrl: PROJECTS_URL };
}

/**
 * Resolve authentication. `null` is the only value that selects the EXPERT
 * global account. Blank/whitespace strings are rejected rather than falling
 * back to a different tenant credential.
 */
export async function resolveHoldedAuth(integrationId: string | null): Promise<HoldedAuthConfig> {
  if (integrationId === null) return getExpertAccountAuth();
  return getClientIntegrationAuth(integrationId);
}
