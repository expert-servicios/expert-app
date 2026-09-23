import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { syncDocumentToDrive } from '@/lib/integrations/google-drive';
import {
  syncDocumentToMs365Files,
  type Ms365FilesTarget,
  type Ms365StoredTokens,
} from '@/lib/integrations/microsoft365';

export type DocumentMirrorProvider = 'google' | 'ms365' | 'none';

export interface DocumentMirrorInput {
  fileBuffer: Buffer;
  fileName: string;
  mimeType: string;
  clientName: string;
  serviceName: string;
}

export interface DocumentMirrorResult {
  provider: Exclude<DocumentMirrorProvider, 'none'>;
  fileId: string;
  storageId: string;
  webUrl: string | null;
}

function configuredDocumentMirrorProvider(): DocumentMirrorProvider {
  const raw = process.env.DOCUMENT_MIRROR_PROVIDER?.trim().toLowerCase();
  if (raw === 'none') return 'none';
  if (raw === 'ms365') return 'ms365';
  return 'google';
}

function configuredMs365FilesTarget(): Ms365FilesTarget {
  return process.env.MS365_FILES_TARGET?.trim().toLowerCase() === 'sharepoint'
    ? 'sharepoint'
    : 'onedrive';
}

async function getMs365StoredTokens(): Promise<Ms365StoredTokens> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('ms365_tokens')
    .select('access_token,refresh_token,expires_at')
    .eq('id', 'admin')
    .maybeSingle();

  if (error) throw error;
  if (!data?.access_token || !data.refresh_token || !data.expires_at) {
    throw new Error('Microsoft 365 files are not connected');
  }

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

export function getConfiguredDocumentMirrorProvider(): DocumentMirrorProvider {
  return configuredDocumentMirrorProvider();
}

export function isDocumentMirrorConfigured(
  provider = configuredDocumentMirrorProvider()
): boolean {
  if (provider === 'none') return false;
  if (provider === 'google') {
    return Boolean(
      process.env.GOOGLE_DRIVE_CLIENTS_FOLDER_ID &&
      process.env.GOOGLE_DRIVE_SA_EMAIL &&
      process.env.GOOGLE_DRIVE_SA_PRIVATE_KEY
    );
  }

  const rootFolderId = process.env.MS365_FILES_ROOT_FOLDER_ID?.trim();
  if (!rootFolderId || !process.env.MS365_CLIENT_ID || !process.env.MS365_CLIENT_SECRET) {
    return false;
  }

  if (
    configuredMs365FilesTarget() === 'sharepoint' &&
    !process.env.MS365_SHAREPOINT_DRIVE_ID?.trim()
  ) {
    return false;
  }

  return true;
}

export async function syncDocumentToMirror(
  input: DocumentMirrorInput,
  provider = configuredDocumentMirrorProvider()
): Promise<DocumentMirrorResult | null> {
  if (provider === 'none') return null;

  if (provider === 'google') {
    const result = await syncDocumentToDrive(input);
    if (!result) return null;
    return {
      provider: 'google',
      fileId: result.fileId,
      storageId: `google:${result.fileId}`,
      webUrl: result.webViewLink ?? null,
    };
  }

  const rootFolderId = process.env.MS365_FILES_ROOT_FOLDER_ID?.trim();
  if (!rootFolderId) {
    throw new Error('MS365_FILES_ROOT_FOLDER_ID is required for Microsoft file mirroring');
  }

  const stored = await getMs365StoredTokens();
  const result = await syncDocumentToMs365Files(stored, {
    target: configuredMs365FilesTarget(),
    rootFolderId,
    ...input,
  });
  await persistMs365Refresh(result.refreshed);

  return {
    provider: 'ms365',
    fileId: result.fileId,
    storageId: `ms365:${result.fileId}`,
    webUrl: result.webUrl,
  };
}
