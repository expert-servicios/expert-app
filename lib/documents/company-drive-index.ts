import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { listDriveTreeFromFolder } from '@/lib/integrations/google-drive';

function categoryFromPath(relativePath: string): string | null {
  const first = relativePath.split('/').filter(Boolean)[0] ?? null;
  return first;
}

export async function indexCompanyGoogleDrive(companyId: string) {
  const admin = getSupabaseAdmin();
  const { data: root, error: rootError } = await admin
    .from('company_document_roots')
    .select('id,external_folder_id,status,sync_mode,display_name')
    .eq('company_id', companyId)
    .eq('provider', 'google')
    .maybeSingle();

  if (rootError) throw rootError;
  if (!root || root.status !== 'active') throw new Error('No active Google Drive root configured for company');

  try {
    const tree = await listDriveTreeFromFolder(root.external_folder_id);
    const now = new Date().toISOString();
    const rows = tree.map((item) => ({
      company_id: companyId,
      provider: 'google',
      external_file_id: item.id,
      external_parent_id: item.parentId,
      relative_path: item.relativePath,
      name: item.name,
      mime_type: item.mimeType,
      size_bytes: item.size ? Number(item.size) : null,
      provider_created_at: item.createdTime,
      provider_modified_at: item.modifiedTime,
      checksum: item.md5Checksum,
      is_folder: item.isFolder,
      category: categoryFromPath(item.relativePath),
      indexed_at: now,
      metadata: {},
    }));

    for (let i = 0; i < rows.length; i += 250) {
      const chunk = rows.slice(i, i + 250);
      const { error } = await admin
        .from('company_document_index')
        .upsert(chunk, { onConflict: 'company_id,provider,external_file_id' });
      if (error) throw error;
    }

    const { error: rootUpdateError } = await admin
      .from('company_document_roots')
      .update({ last_indexed_at: now, last_error: null, updated_at: now })
      .eq('id', root.id);
    if (rootUpdateError) throw rootUpdateError;

    const folders = rows.filter((row) => row.is_folder).length;
    return {
      root: root.display_name,
      total: rows.length,
      folders,
      files: rows.length - folders,
      indexedAt: now,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Drive indexing failed';
    await admin
      .from('company_document_roots')
      .update({ last_error: message, updated_at: new Date().toISOString() })
      .eq('id', root.id)
      .then(() => null);
    throw error;
  }
}
