import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import {
  listDriveFilesForClient,
  syncDocumentToDrive,
  type DriveFileSummary,
} from '@/lib/integrations/google-drive';
import {
  listMs365DriveFilesForClient,
  syncDocumentToMs365Drive,
  type Ms365StoredTokens,
} from '@/lib/integrations/microsoft365';
import {
  findExternalMapping,
  upsertExternalMapping,
} from '@/lib/integrations/external-mappings';

export type DocumentCopyProviderName = 'google' | 'ms365';

export interface ExternalDocumentCopyResult {
  provider: DocumentCopyProviderName;
  fileId: string;
  webViewLink: string;
  existing: boolean;
}

export interface ExternalDocumentFileSummary {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  size: string | null;
  createdTime: string | null;
}

function configuredProvider(): DocumentCopyProviderName {
  return process.env.DOCUMENT_COPY_PROVIDER?.trim().toLowerCase() === 'ms365'
    ? 'ms365'
    : 'google';
}

function mappingProvider(provider: DocumentCopyProviderName): string {
  return provider === 'ms365' ? 'ms365_drive' : 'google_drive';
}

async function getMs365StoredTokens(): Promise<Ms365StoredTokens | null> {
  if (!process.env.MS365_CLIENT_ID || !process.env.MS365_CLIENT_SECRET) return null;

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('ms365_tokens')
    .select('access_token,refresh_token,expires_at')
    .eq('id', 'admin')
    .maybeSingle();

  if (error) throw error;
  if (!data?.access_token || !data.refresh_token || !data.expires_at) return null;

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Number(data.expires_at),
  };
}

async function persistMs365Refresh(refreshed: Ms365StoredTokens | null): Promise<void> {
  if (!refreshed) return;
  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from('ms365_tokens')
    .update({
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token,
      expires_at: refreshed.expires_at,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 'admin');
  if (error) throw error;
}

export function getConfiguredDocumentCopyProvider(): DocumentCopyProviderName {
  return configuredProvider();
}

export async function isDocumentCopyProviderConfigured(
  provider = configuredProvider()
): Promise<boolean> {
  if (provider === 'google') {
    return Boolean(
      process.env.GOOGLE_DRIVE_CLIENTS_FOLDER_ID &&
      process.env.GOOGLE_DRIVE_SA_EMAIL &&
      process.env.GOOGLE_DRIVE_SA_PRIVATE_KEY
    );
  }

  return Boolean(await getMs365StoredTokens());
}

export async function syncDocumentExternalCopy(input: {
  documentId: string;
  fileBuffer: Buffer;
  fileName: string;
  mimeType: string;
  clientName: string;
  serviceName: string;
  companyId?: string | null;
  provider?: DocumentCopyProviderName;
}): Promise<ExternalDocumentCopyResult | null> {
  const provider = input.provider ?? configuredProvider();
  const providerKey = mappingProvider(provider);

  const existing = await findExternalMapping({
    provider: providerKey,
    localEntity: 'documents',
    localId: input.documentId,
    externalEntity: 'file',
  });

  if (existing) {
    return {
      provider,
      fileId: existing.external_id,
      webViewLink: String(existing.metadata?.webViewLink ?? ''),
      existing: true,
    };
  }

  const uniqueName = `${input.documentId}-${input.fileName}`;
  let fileId: string;
  let webViewLink: string;

  if (provider === 'google') {
    const result = await syncDocumentToDrive({
      fileBuffer: input.fileBuffer,
      fileName: uniqueName,
      mimeType: input.mimeType,
      clientName: input.clientName,
      serviceName: input.serviceName,
    });
    if (!result) return null;
    fileId = result.fileId;
    webViewLink = result.webViewLink;
  } else {
    const stored = await getMs365StoredTokens();
    if (!stored) return null;
    const result = await syncDocumentToMs365Drive(stored, {
      fileBuffer: input.fileBuffer,
      fileName: uniqueName,
      mimeType: input.mimeType,
      clientName: input.clientName,
      serviceName: input.serviceName,
    });
    await persistMs365Refresh(result.refreshed);
    fileId = result.fileId;
    webViewLink = result.webViewLink;
  }

  await upsertExternalMapping({
    provider: providerKey,
    localEntity: 'documents',
    localId: input.documentId,
    externalEntity: 'file',
    externalId: fileId,
    metadata: {
      webViewLink,
      fileName: input.fileName,
      clientName: input.clientName,
      serviceName: input.serviceName,
      companyId: input.companyId ?? null,
    },
  });

  return {
    provider,
    fileId,
    webViewLink,
    existing: false,
  };
}

export async function listExternalDocumentCopiesForClient(
  clientName: string,
  serviceName?: string,
  provider = configuredProvider()
): Promise<ExternalDocumentFileSummary[]> {
  if (provider === 'google') {
    const files: DriveFileSummary[] = await listDriveFilesForClient(clientName, serviceName);
    return files;
  }

  const stored = await getMs365StoredTokens();
  if (!stored) return [];

  const result = await listMs365DriveFilesForClient(stored, clientName, serviceName);
  await persistMs365Refresh(result.refreshed);
  return result.files;
}
