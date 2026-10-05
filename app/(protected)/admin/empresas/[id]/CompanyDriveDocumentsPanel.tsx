'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileText, FolderOpen, Loader2, RefreshCw } from 'lucide-react';

type Root = {
  provider: string;
  display_name: string | null;
  status: string;
  sync_mode: string;
  last_indexed_at: string | null;
  last_error: string | null;
};

type Payload = {
  root: Root | null;
  summary: {
    total: number;
    folders: number;
    files: number;
  };
};

export function CompanyDriveDocumentsPanel({ companyId }: { companyId: string }) {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [indexing, setIndexing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/empresas/${companyId}/documents/index`, { cache: 'no-store' });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'No se pudo consultar Google Drive');
      setData(json as Payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const runIndex = useCallback(async () => {
    setIndexing(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/empresas/${companyId}/documents/index`, {
        method: 'POST',
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'No se pudo indexar Google Drive');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setIndexing(false);
    }
  }, [companyId, load]);

  if (loading && !data) {
    return (
      <section className="rounded-2xl border border-[#d8cbb5] bg-white p-5 shadow-sm">
        <Loader2 className="h-5 w-5 animate-spin text-[#c88b25]" />
      </section>
    );
  }

  const root = data?.root ?? null;
  const summary = data?.summary ?? { total: 0, folders: 0, files: 0 };

  return (
    <section className="rounded-2xl border border-[#d8cbb5] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-[#c88b25]" />
            <h2 className="font-serif text-xl font-bold text-[#07111d]">Documentación · Google Drive</h2>
          </div>
          <p className="mt-1 text-xs text-[#8a9aab]">
            {root?.display_name ?? 'Sin carpeta Google Drive vinculada'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void runIndex()}
          disabled={!root || root.status !== 'active' || indexing}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#07111d] px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {indexing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          {indexing ? 'Indexando…' : summary.total > 0 ? 'Reindexar Drive' : 'Indexar Drive'}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertTriangle className="mr-1.5 inline h-3.5 w-3.5" />
          {error}
        </div>
      )}

      {root ? (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-[#fbf8f2] p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#8a9aab]">Archivos</p>
              <p className="mt-1 flex items-center gap-1.5 text-lg font-bold text-[#07111d]">
                <FileText className="h-4 w-4 text-[#c88b25]" /> {summary.files}
              </p>
            </div>
            <div className="rounded-xl bg-[#fbf8f2] p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#8a9aab]">Carpetas</p>
              <p className="mt-1 flex items-center gap-1.5 text-lg font-bold text-[#07111d]">
                <FolderOpen className="h-4 w-4 text-[#c88b25]" /> {summary.folders}
              </p>
            </div>
            <div className="rounded-xl bg-[#fbf8f2] p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#8a9aab]">Estado</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-[#07111d]">
                <CheckCircle2 className="h-4 w-4 text-green-700" /> {root.status}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-[#52606d]">
            <span>Modo: <strong>{root.sync_mode}</strong></span>
            <span>
              Último índice: <strong>{root.last_indexed_at ? new Date(root.last_indexed_at).toLocaleString('es-ES') : 'pendiente'}</strong>
            </span>
          </div>

          {root.last_error && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <AlertTriangle className="mr-1.5 inline h-3.5 w-3.5" />
              {root.last_error}
            </div>
          )}
        </>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-[#d8cbb5] bg-[#fbf8f2] px-4 py-5 text-sm text-[#8a9aab]">
          Esta empresa todavía no tiene una carpeta documental vinculada.
        </div>
      )}
    </section>
  );
}
