import type { getSupabaseAdmin } from '@/lib/integrations/supabase';

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

type RegistryDocumentEvent = {
  event_type: string;
  source_table?: string | null;
  source_id?: string | null;
};

type DocumentSourceRow = {
  id: string;
  ingestion_source: string | null;
};

export async function filterSupersededDocumentEvents<T extends RegistryDocumentEvent>(
  admin: AdminClient,
  rows: T[],
): Promise<T[]> {
  const documentIds = [...new Set(
    rows
      .filter((row) => row.source_table === 'documents' && row.source_id)
      .map((row) => String(row.source_id)),
  )];

  if (!documentIds.length) return rows;

  const sourceById = new Map<string, string | null>();
  const chunkSize = 100;
  for (let offset = 0; offset < documentIds.length; offset += chunkSize) {
    const chunk = documentIds.slice(offset, offset + chunkSize);
    const { data, error } = await admin
      .from('documents')
      .select('id,ingestion_source')
      .in('id', chunk);

    if (error) throw error;
    for (const row of data ?? []) {
      sourceById.set(String(row.id), row.ingestion_source);
    }
  }

  return rows.filter((row) => {
    if (row.source_table !== 'documents' || !row.source_id) return true;
    return !(row.event_type === 'document.received'
      && sourceById.get(String(row.source_id)) === 'historical_import');
  });
}
