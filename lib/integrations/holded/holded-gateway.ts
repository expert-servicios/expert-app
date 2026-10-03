import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { createHoldedClient, createExpertHoldedClient, type HoldedClient } from './holded-client';
import { createHoldedV2Client, type HoldedV2Client } from './holded-v2-client';
import { HoldedIntegrationError } from './holded-errors';

export type HoldedIntegrationMode = 'expert_account' | 'client_account' | 'advisor_managed';
export type HoldedApiVersion = 'v1' | 'v2';

export interface HoldedGatewayMetadata {
  integrationId: string | null;
  companyId: string | null;
  mode: HoldedIntegrationMode;
  apiVersion: HoldedApiVersion;
  syncMode: 'read_only' | 'read_write';
}

export type HoldedGateway =
  | { metadata: HoldedGatewayMetadata & { apiVersion: 'v1' }; client: HoldedClient; v1: HoldedClient; v2: null }
  | { metadata: HoldedGatewayMetadata & { apiVersion: 'v2' }; client: HoldedV2Client; v1: null; v2: HoldedV2Client };

type IntegrationRow = {
  id: string;
  company_id: string | null;
  mode: string | null;
  api_version: string | null;
  sync_mode: string | null;
  status: string;
};

function normalizeMode(value: string | null): HoldedIntegrationMode {
  if (value === 'expert_account' || value === 'advisor_managed') return value;
  return 'client_account';
}

function normalizeVersion(value: string | null): HoldedApiVersion {
  return value === 'v2' ? 'v2' : 'v1';
}

function normalizeSyncMode(value: string | null): 'read_only' | 'read_write' {
  return value === 'read_write' ? 'read_write' : 'read_only';
}

export async function createExpertHoldedGateway(): Promise<HoldedGateway> {
  const client = await createExpertHoldedClient();
  return {
    metadata: {
      integrationId: null,
      companyId: null,
      mode: 'expert_account',
      apiVersion: 'v1',
      syncMode: 'read_only',
    },
    client,
    v1: client,
    v2: null,
  };
}

export async function createHoldedGatewayForIntegration(integrationId: string): Promise<HoldedGateway> {
  const normalized = integrationId.trim();
  if (!normalized) throw new HoldedIntegrationError('integrationId is required');

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('client_integrations')
    .select('id,company_id,mode,api_version,sync_mode,status')
    .eq('id', normalized)
    .eq('provider', 'holded')
    .maybeSingle();

  if (error || !data) {
    throw new HoldedIntegrationError(
      `Holded integration not found for id=${normalized}: ${error?.message ?? 'no data'}`,
    );
  }

  const row = data as IntegrationRow;
  if (row.status !== 'active') {
    throw new HoldedIntegrationError(`Holded integration ${normalized} is not active (status=${row.status}).`);
  }

  const mode = normalizeMode(row.mode);
  const apiVersion = normalizeVersion(row.api_version);
  const syncMode = normalizeSyncMode(row.sync_mode);

  if (mode === 'advisor_managed' && apiVersion !== 'v2') {
    throw new HoldedIntegrationError(
      `advisor_managed integration ${normalized} must use Holded API v2 Bearer authentication.`,
    );
  }

  if (apiVersion === 'v2') {
    const client = await createHoldedV2Client(normalized);
    return {
      metadata: { integrationId: normalized, companyId: row.company_id, mode, apiVersion, syncMode },
      client,
      v1: null,
      v2: client,
    };
  }

  const client = await createHoldedClient(normalized);
  return {
    metadata: { integrationId: normalized, companyId: row.company_id, mode, apiVersion, syncMode },
    client,
    v1: client,
    v2: null,
  };
}

export async function createHoldedGatewayForCompany(companyId: string): Promise<HoldedGateway> {
  const normalized = companyId.trim();
  if (!normalized) throw new HoldedIntegrationError('companyId is required');

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('client_integrations')
    .select('id')
    .eq('provider', 'holded')
    .eq('company_id', normalized)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data?.id) {
    throw new HoldedIntegrationError(
      `No active Holded integration found for company=${normalized}: ${error?.message ?? 'no data'}`,
    );
  }

  return createHoldedGatewayForIntegration(data.id);
}
