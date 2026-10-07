export type DocumentProvenanceRow = {
  id: string;
  created_at: string | null;
  document_date: string | null;
  ingestion_source: string | null;
  ingestion_ref?: string | null;
};

export type DocumentRegistryTiming = {
  eventType: 'document.received' | 'document.historical';
  occurredAt: string;
  sourceKey: string;
  metadata: {
    document_date: string | null;
    ingestion_source: string;
    ingestion_ref: string | null;
    incorporated_at: string | null;
  };
};

export function resolveDocumentRegistryTiming(
  row: DocumentProvenanceRow,
): DocumentRegistryTiming | null {
  const source = row.ingestion_source ?? 'unknown';
  const historical = source === 'historical_import';

  if (historical && !row.document_date) {
    return null;
  }

  const occurredAt = historical
    ? `${row.document_date}T00:00:00.000Z`
    : row.created_at;

  if (!occurredAt) return null;

  return {
    eventType: historical ? 'document.historical' : 'document.received',
    occurredAt,
    sourceKey: `document:${row.id}:${historical ? 'historical' : 'received'}`,
    metadata: {
      document_date: row.document_date,
      ingestion_source: source,
      ingestion_ref: row.ingestion_ref ?? null,
      incorporated_at: row.created_at,
    },
  };
}
