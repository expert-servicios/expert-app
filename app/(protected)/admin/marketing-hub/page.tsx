'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  ImageIcon,
  Languages,
  ListChecks,
  Pencil,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  TestTube2,
  UploadCloud,
  X,
} from 'lucide-react';
import { MetaCatalogContentEditor } from '@/components/admin/MetaCatalogContentEditor';

type StatusMap = Record<string, number>;
type Panel = 'catalog' | 'readiness' | 'settings';
type CatalogFilter = 'all' | 'synced' | 'ready' | 'failed' | 'missing-ru';

type DiagnosticsPayload = {
  config: {
    enabled: boolean;
    configured: boolean;
    missing: string[];
    graphApiVersion: string | null;
    assets: Record<string, string | null>;
    secrets: {
      appSecretConfigured: boolean;
      systemUserAccessTokenConfigured: boolean;
    };
  };
  liveTestAvailable: boolean;
  diagnostics: {
    readOnly: true;
    standardVersion: string;
    errors: Array<{ source: string; message: string }>;
    c2: {
      services: { total: number; byStatus: StatusMap };
      contents: { total: number; byStatus: StatusMap; byLocale: StatusMap };
      offers: { total: number; byStatus: StatusMap; byPriceMode: StatusMap };
      stripeBindings: { total: number; byEnvironment: StatusMap; byReconciliation: StatusMap };
      channels: { total: number; metaTotal: number; metaReady: number; byPublishStatus: StatusMap };
      metaItems: { total: number; bySyncStatus: StatusMap };
      metaJobs: { total: number; byStatus: StatusMap };
    };
    manifest: {
      total: number;
      productionReady: number;
      channelReady: number;
      withContentGateIssues: number;
      entries: Array<{
        slug: string;
        stage: string;
        ruRequired: boolean;
        socialRequired: boolean;
        contentGatePassed: boolean;
        readinessIssues: Array<{ code: string; message: string }>;
        blogCount: number;
        knowledgeCount: number;
      }>;
    };
  };
};

type LocaleContent = {
  exists: boolean;
  status: string | null;
  imageUrl: string | null;
  updatedAt: string | null;
};

type MetaLocaleState = {
  syncStatus: string;
  metaItemId: string | null;
  lastSyncedAt: string | null;
  lastErrorCode: string | null;
  lastPayloadHash: string | null;
  isStale: boolean;
} | null;

type MetaCatalogDraft = {
  retailerId: string;
  name: string;
  price: { amount: number; currency: 'EUR' } | null;
  imageUrl: string | null;
  marketingReady: boolean;
  warnings: string[];
  locales: {
    es: LocaleContent;
    ru: LocaleContent;
  };
  meta: {
    es: MetaLocaleState;
    ru: MetaLocaleState;
  };
};

type MetaCatalogExcludedService = {
  retailerId: string;
  name: string;
  reason: 'quote_price' | 'missing_offer' | 'archived';
};

type MetaCatalogPayload = {
  drafts: MetaCatalogDraft[];
  excluded: MetaCatalogExcludedService[];
  readyCount: number;
  blockedCount: number;
  initialBatch: {
    expectedCount: number;
    readyCount: number;
    syncedCount: number;
    ready: boolean;
    complete: boolean;
  };
};

const EXCLUSION_LABEL: Record<MetaCatalogExcludedService['reason'], string> = {
  quote_price: 'Precio "Consultar"',
  missing_offer: 'Sin oferta comercial',
  archived: 'Archivado',
};

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function MetaStatusBadge({ state, marketingReady, stale }: { state: MetaLocaleState; marketingReady: boolean; stale: boolean }) {
  const status = state?.syncStatus;

  if (status === 'synced' && stale) {
    return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-900"><AlertTriangle className="h-3.5 w-3.5" /> Cambios pendientes</span>;
  }
  if (status === 'synced') {
    return <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-[11px] font-bold text-green-800"><CheckCircle2 className="h-3.5 w-3.5" /> Sincronizado</span>;
  }
  if (status === 'failed') {
    return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-[11px] font-bold text-red-800"><AlertTriangle className="h-3.5 w-3.5" /> Error</span>;
  }
  if (status === 'pending') {
    return <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-[11px] font-bold text-blue-800">Sincronizando</span>;
  }
  if (status === 'manual_review') {
    return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-900">Revisión</span>;
  }
  if (status === 'ready') {
    return <span className="inline-flex items-center gap-1 rounded-full bg-[#f3e5c5] px-2 py-1 text-[11px] font-bold text-[#7a5313]">Listo</span>;
  }
  if (marketingReady) {
    return <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700">Preparado</span>;
  }
  return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-800">Pendiente</span>;
}

function LocaleChip({ locale, content, meta }: { locale: 'ES' | 'RU'; content: LocaleContent; meta: MetaLocaleState }) {
  const synced = meta?.syncStatus === 'synced';
  const ready = content.exists && content.status === 'active';

  return (
    <span
      className={
        synced
          ? 'inline-flex items-center gap-1 rounded-md bg-green-100 px-2 py-1 text-[11px] font-bold text-green-800'
          : ready
            ? 'inline-flex items-center gap-1 rounded-md bg-[#f3e5c5] px-2 py-1 text-[11px] font-bold text-[#7a5313]'
            : 'inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-500'
      }
      title={synced ? `${locale} sincronizado` : ready ? `${locale} preparado` : `${locale} pendiente`}
    >
      {locale}
      {synced ? '✓' : ready ? '•' : '—'}
    </span>
  );
}

function CompactMetric({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-xl border border-[#ddd3c2] bg-white px-3 py-2">
      <span className={`text-lg font-bold ${accent ? 'text-green-700' : 'text-[#07111d]'}`}>{value}</span>
      <span className="truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-[#69717d]">{label}</span>
    </div>
  );
}

export default function MarketingHubPage() {
  const [data, setData] = useState<DiagnosticsPayload | null>(null);
  const [catalog, setCatalog] = useState<MetaCatalogPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [syncingCatalog, setSyncingCatalog] = useState(false);
  const [preparingCatalog, setPreparingCatalog] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [selectedRetailerIds, setSelectedRetailerIds] = useState<Set<string>>(new Set());
  const [panel, setPanel] = useState<Panel>('catalog');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<CatalogFilter>('all');
  const [imagePreview, setImagePreview] = useState<{ src: string; alt: string } | null>(null);
  const [editingRetailerId, setEditingRetailerId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [diagnosticsResponse, catalogResponse] = await Promise.all([
        fetch('/api/admin/meta/diagnostics', { cache: 'no-store' }),
        fetch('/api/admin/meta/catalog', { cache: 'no-store' }),
      ]);
      if (!diagnosticsResponse.ok) throw new Error('No se pudo cargar Marketing Hub');
      setData(await diagnosticsResponse.json());
      setCatalog(catalogResponse.ok ? await catalogResponse.json() : null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const testConnection = useCallback(async () => {
    if (!data?.liveTestAvailable) return;
    setTesting(true);
    setTestMessage(null);
    try {
      const response = await fetch('/api/admin/meta/diagnostics', { method: 'POST' });
      const payload = await response.json() as { ok?: boolean; catalog?: { id?: string; name?: string }; error?: string };
      setTestMessage(payload.ok
        ? `Conexión correcta: ${payload.catalog?.name ?? 'catálogo'}`
        : payload.error ?? 'Falló la prueba');
    } finally {
      setTesting(false);
    }
  }, [data?.liveTestAvailable]);

  const prepareRetailers = useCallback(async (retailerIds: string[]) => {
    if (retailerIds.length === 0) return;
    setPreparingCatalog(true);
    setSyncMessage(null);
    let prepared = 0;
    const failures: string[] = [];

    try {
      for (const retailerId of retailerIds) {
        const response = await fetch(
          `/api/admin/meta/catalog/${encodeURIComponent(retailerId)}/prepare`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ confirm: 'prepare_meta_catalog_item' }),
          },
        );
        const payload = await response.json() as { ok?: boolean; error?: string };
        if (response.ok && payload.ok) prepared += 1;
        else failures.push(`${retailerId}: ${payload.error ?? 'error'}`);
      }

      setSyncMessage(
        failures.length
          ? `Preparados: ${prepared}. Con bloqueo: ${failures.length}. ${failures.slice(0, 2).join(' · ')}`
          : `Preparados para Meta: ${prepared}.`,
      );
    } finally {
      await load();
      setPreparingCatalog(false);
    }
  }, [load]);

  const syncRetailers = useCallback(async (retailerIds: string[]) => {
    if (retailerIds.length === 0) return;
    const confirmed = window.confirm(
      `Se sincronizarán ${retailerIds.length} servicio(s) ES con Meta. Esta acción escribe en el catálogo externo. ¿Continuar?`,
    );
    if (!confirmed) return;

    setSyncingCatalog(true);
    setSyncMessage(null);
    try {
      const response = await fetch('/api/admin/meta/catalog/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirm: 'sync_meta_catalog_items',
          retailerIds,
        }),
      });
      const raw = await response.text();
      let payload: {
        ok?: boolean;
        succeeded?: number;
        failed?: number;
        error?: string;
      } = {};
      try {
        payload = raw ? JSON.parse(raw) : {};
      } catch {
        payload = { error: 'Respuesta no válida del servidor; se recargará el estado.' };
      }

      if (!response.ok) {
        setSyncMessage(payload.error ?? 'Falló la sincronización del catálogo Meta');
      } else {
        setSyncMessage(
          payload.ok
            ? `Sincronización completada: ${payload.succeeded ?? 0} servicio(s).`
            : `Sincronización parcial: ${payload.succeeded ?? 0} correctos · ${payload.failed ?? 0} fallidos.`,
        );
        setSelectedRetailerIds(new Set());
      }
    } catch {
      setSyncMessage('Resultado ambiguo. Se ha recargado el estado antes de permitir otro intento.');
    } finally {
      await load();
      setSyncingCatalog(false);
    }
  }, [load]);

  const filteredDrafts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return (catalog?.drafts ?? []).filter((draft) => {
      const matchesSearch = !normalized
        || draft.name.toLowerCase().includes(normalized)
        || draft.retailerId.toLowerCase().includes(normalized);

      const esStatus = draft.meta.es?.syncStatus;
      const matchesFilter =
        filter === 'all'
        || (filter === 'synced' && esStatus === 'synced')
        || (filter === 'ready' && (esStatus === 'ready' || (!esStatus && draft.marketingReady)))
        || (filter === 'failed' && esStatus === 'failed')
        || (filter === 'missing-ru' && !draft.locales.ru.exists);

      return matchesSearch && matchesFilter;
    });
  }, [catalog?.drafts, filter, query]);

  if (loading && !data) return <main className="p-8">Cargando catálogo Meta…</main>;
  if (!data) return <main className="p-8 text-red-700">No se pudo cargar Marketing Hub.</main>;

  const { diagnostics, config } = data;
  const syncedCount = catalog?.drafts.filter((draft) => draft.meta.es?.syncStatus === 'synced').length ?? 0;
  const failedCount = catalog?.drafts.filter((draft) => draft.meta.es?.syncStatus === 'failed').length ?? 0;
  const ruMissingCount = catalog?.drafts.filter((draft) => !draft.locales.ru.exists).length ?? 0;
  const manifestBySlug = new Map(diagnostics.manifest.entries.map((entry) => [entry.slug, entry]));
  const selectedDrafts = (catalog?.drafts ?? []).filter((draft) => selectedRetailerIds.has(draft.retailerId));
  const selectedReadyIds = selectedDrafts
    .filter((draft) => draft.meta.es?.syncStatus === 'ready')
    .map((draft) => draft.retailerId);
  const selectedPrepareIds = selectedDrafts
    .filter((draft) => {
      const manifest = manifestBySlug.get(draft.retailerId);
      if (manifest?.stage !== 'production_ready') return false;
      const status = draft.meta.es?.syncStatus;
      const localBlockers = draft.warnings.filter((warning) => warning !== 'meta_channel_not_ready');
      if (localBlockers.length > 0) return false;
      if (status === 'pending' || status === 'manual_review' || status === 'ready') return false;
      return status === 'failed'
        || status == null
        || (
          status === 'synced'
          && draft.meta.es?.isStale === true
        );
    })
    .map((draft) => draft.retailerId);

  return (
    <main className="min-h-screen bg-[#f7f3eb] px-4 py-5 lg:px-6">
      <div className="mx-auto max-w-[1500px]">
        <header className="rounded-2xl border border-[#d8cbb5] bg-white px-4 py-4 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#c88b25]" />
                <h1 className="font-serif text-2xl font-bold text-[#07111d]">Catálogo Meta</h1>
                <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${config.configured && config.enabled ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-900'}`}>
                  {config.configured && config.enabled ? 'Conectado' : 'Revisar conexión'}
                </span>
              </div>
              <p className="mt-1 text-xs text-[#69717d]">
                Gestión compacta de catálogo, contenidos ES/RU, imágenes y sincronización con Meta.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void load()}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8cbb5] bg-white px-3 py-2 text-xs font-bold text-[#07111d]"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Actualizar
              </button>
              <button
                type="button"
                onClick={() => void testConnection()}
                disabled={!data.liveTestAvailable || testing}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#07111d] px-3 py-2 text-xs font-bold text-[#d7a33a] disabled:opacity-40"
              >
                <TestTube2 className="h-3.5 w-3.5" /> {testing ? 'Probando…' : 'Probar Meta'}
              </button>
            </div>
          </div>

          {(testMessage || syncMessage) ? (
            <div className="mt-3 rounded-lg bg-[#f7f3eb] px-3 py-2 text-xs font-semibold text-[#374151]">
              {syncMessage ?? testMessage}
            </div>
          ) : null}
        </header>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          <CompactMetric label="Servicios" value={catalog?.drafts.length ?? 0} />
          <CompactMetric label="Sincronizados ES" value={syncedCount} accent={syncedCount > 0} />
          <CompactMetric label="Listos" value={catalog?.readyCount ?? 0} />
          <CompactMetric label="Errores" value={failedCount} />
          <CompactMetric label="RU pendientes" value={ruMissingCount} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-[#ddd3c2] bg-white p-1.5">
          <button
            type="button"
            onClick={() => setPanel('catalog')}
            className={`rounded-lg px-3 py-2 text-xs font-bold ${panel === 'catalog' ? 'bg-[#07111d] text-white' : 'text-[#5b6470] hover:bg-[#f7f3eb]'}`}
          >
            Catálogo
          </button>
          <button
            type="button"
            onClick={() => setPanel('readiness')}
            className={`rounded-lg px-3 py-2 text-xs font-bold ${panel === 'readiness' ? 'bg-[#07111d] text-white' : 'text-[#5b6470] hover:bg-[#f7f3eb]'}`}
          >
            Preparación
          </button>
          <button
            type="button"
            onClick={() => setPanel('settings')}
            className={`rounded-lg px-3 py-2 text-xs font-bold ${panel === 'settings' ? 'bg-[#07111d] text-white' : 'text-[#5b6470] hover:bg-[#f7f3eb]'}`}
          >
            Configuración
          </button>
        </div>

        {panel === 'catalog' ? (
          <section className="mt-3 overflow-hidden rounded-2xl border border-[#d8cbb5] bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-[#eee6d8] p-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <div className="relative min-w-0 flex-1 lg:max-w-md">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#9ca3af]" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Buscar servicio…"
                    className="w-full rounded-lg border border-[#ddd3c2] bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#c88b25]"
                  />
                </div>
                <select
                  value={filter}
                  onChange={(event) => setFilter(event.target.value as CatalogFilter)}
                  className="rounded-lg border border-[#ddd3c2] bg-white px-3 py-2 text-xs font-semibold text-[#374151]"
                  aria-label="Filtrar catálogo"
                >
                  <option value="all">Todos</option>
                  <option value="synced">Sincronizados</option>
                  <option value="ready">Listos</option>
                  <option value="failed">Con error</option>
                  <option value="missing-ru">Falta RU</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#69717d]">
                  <Languages className="h-4 w-4" />
                  {filteredDrafts.length} visibles · {selectedRetailerIds.size} seleccionados
                </span>
                <button
                  type="button"
                  onClick={() => void prepareRetailers(selectedPrepareIds)}
                  disabled={selectedPrepareIds.length === 0 || preparingCatalog || syncingCatalog}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#d8cbb5] bg-white px-2.5 py-2 text-[11px] font-bold text-[#374151] disabled:opacity-40"
                >
                  <ListChecks className="h-3.5 w-3.5" />
                  {preparingCatalog ? 'Preparando…' : `Preparar (${selectedPrepareIds.length})`}
                </button>
                <button
                  type="button"
                  onClick={() => void syncRetailers(selectedReadyIds)}
                  disabled={!data.liveTestAvailable || selectedReadyIds.length === 0 || syncingCatalog || preparingCatalog}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#c88b25] px-2.5 py-2 text-[11px] font-bold text-[#07111d] disabled:opacity-40"
                >
                  <UploadCloud className="h-3.5 w-3.5" />
                  {syncingCatalog ? 'Sincronizando…' : `Sincronizar (${selectedReadyIds.length})`}
                </button>
              </div>
            </div>

            <div className="max-h-[65vh] overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 z-10 bg-[#f7f3eb] text-left text-[10px] uppercase tracking-[0.08em] text-[#69717d]">
                  <tr>
                    <th className="w-10 px-3 py-2">
                      <input
                        type="checkbox"
                        aria-label="Seleccionar servicios visibles"
                        checked={filteredDrafts.length > 0 && filteredDrafts.every((draft) => selectedRetailerIds.has(draft.retailerId))}
                        onChange={(event) => {
                          setSelectedRetailerIds((current) => {
                            const next = new Set(current);
                            for (const draft of filteredDrafts) {
                              if (event.target.checked) next.add(draft.retailerId);
                              else next.delete(draft.retailerId);
                            }
                            return next;
                          });
                        }}
                      />
                    </th>
                    <th className="w-16 px-3 py-2">Imagen</th>
                    <th className="px-3 py-2">Servicio</th>
                    <th className="w-28 px-3 py-2">Idiomas</th>
                    <th className="w-28 px-3 py-2">Precio</th>
                    <th className="w-36 px-3 py-2">Meta ES</th>
                    <th className="w-44 px-3 py-2">ID / última sync</th>
                    <th className="w-56 px-3 py-2">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eee6d8]">
                  {filteredDrafts.map((draft) => {
                    const esStale = draft.meta.es?.isStale === true;
                    const manifest = manifestBySlug.get(draft.retailerId);
                    const productionReady = manifest?.stage === 'production_ready';
                    const metaStatus = draft.meta.es?.syncStatus ?? null;
                    const localBlockers = draft.warnings.filter((warning) => warning !== 'meta_channel_not_ready');
                    const canPrepare = productionReady
                      && localBlockers.length === 0
                      && metaStatus !== 'pending'
                      && metaStatus !== 'manual_review'
                      && metaStatus !== 'ready'
                      && (metaStatus === 'failed' || metaStatus == null || (metaStatus === 'synced' && esStale));
                    const canSync = metaStatus === 'ready';

                    return (
                    <tr key={draft.retailerId} className="hover:bg-[#fcfaf6]">
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          aria-label={`Seleccionar ${draft.name}`}
                          checked={selectedRetailerIds.has(draft.retailerId)}
                          onChange={(event) => {
                            setSelectedRetailerIds((current) => {
                              const next = new Set(current);
                              if (event.target.checked) next.add(draft.retailerId);
                              else next.delete(draft.retailerId);
                              return next;
                            });
                          }}
                        />
                      </td>
                      <td className="px-3 py-2">
                        {draft.imageUrl ? (
                          <button
                            type="button"
                            onClick={() => setImagePreview({ src: draft.imageUrl!, alt: draft.name })}
                            className="group relative h-11 w-11 overflow-hidden rounded-lg border border-[#ddd3c2] bg-[#f7f3eb]"
                            title="Ver imagen"
                          >
                            <Image
                              src={draft.imageUrl}
                              alt={draft.name}
                              fill
                              sizes="44px"
                              className="object-cover"
                            />
                            <span className="absolute inset-0 hidden items-center justify-center bg-black/35 text-white group-hover:flex">
                              <Eye className="h-4 w-4" />
                            </span>
                          </button>
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-dashed border-[#d8cbb5] bg-[#faf8f3] text-[#9ca3af]">
                            <ImageIcon className="h-4 w-4" />
                          </div>
                        )}
                      </td>
                      <td className="max-w-[28rem] px-3 py-2">
                        <p className="truncate font-semibold text-[#07111d]" title={draft.name}>{draft.name}</p>
                        <p className="mt-0.5 truncate font-mono text-[10px] text-[#7b8490]" title={draft.retailerId}>{draft.retailerId}</p>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <LocaleChip locale="ES" content={draft.locales.es} meta={draft.meta.es} />
                          <LocaleChip locale="RU" content={draft.locales.ru} meta={draft.meta.ru} />
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs font-semibold text-[#374151]">
                        {draft.price ? formatPrice(draft.price.amount, draft.price.currency) : '—'}
                      </td>
                      <td className="px-3 py-2">
                        <MetaStatusBadge state={draft.meta.es} marketingReady={draft.marketingReady} stale={esStale} />
                      </td>
                      <td className="px-3 py-2">
                        <p className="truncate font-mono text-[10px] text-[#374151]" title={draft.meta.es?.metaItemId ?? ''}>
                          {draft.meta.es?.metaItemId ?? '—'}
                        </p>
                        <p className="mt-0.5 text-[10px] text-[#7b8490]">
                          {formatDate(draft.meta.es?.lastSyncedAt ?? null)}
                        </p>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingRetailerId(draft.retailerId)}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#d8cbb5] bg-white px-2 py-1.5 text-[11px] font-bold text-[#374151] hover:border-[#c88b25]"
                            title="Editar ES / RU"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Editar
                          </button>
                          {canPrepare ? (
                            <button
                              type="button"
                              onClick={() => void prepareRetailers([draft.retailerId])}
                              disabled={preparingCatalog || syncingCatalog}
                              className="rounded-lg border border-[#d8cbb5] bg-white px-2 py-1.5 text-[11px] font-bold text-[#7a5313] disabled:opacity-40"
                              title={metaStatus === 'failed' ? 'Preparar reintento' : esStale ? 'Preparar cambios' : 'Validar y preparar para Meta'}
                            >
                              {metaStatus === 'failed' ? 'Reintentar' : esStale ? 'Preparar cambios' : 'Preparar'}
                            </button>
                          ) : null}
                          {canSync ? (
                            <button
                              type="button"
                              onClick={() => void syncRetailers([draft.retailerId])}
                              disabled={!data.liveTestAvailable || syncingCatalog || preparingCatalog}
                              className="rounded-lg bg-[#c88b25] px-2 py-1.5 text-[11px] font-bold text-[#07111d] disabled:opacity-40"
                            >
                              Sincronizar
                            </button>
                          ) : null}
                          {metaStatus === 'synced' && !esStale ? (
                            <span className="inline-flex items-center px-1.5 text-[10px] font-semibold text-green-700">Al día</span>
                          ) : null}
                          {!productionReady ? (
                            <span className="inline-flex items-center px-1.5 text-[10px] text-[#8a929d]" title="El servicio todavía no es production_ready">No publicable</span>
                          ) : null}
                          {productionReady && localBlockers.length > 0 ? (
                            <span
                              className="inline-flex items-center px-1.5 text-[10px] font-semibold text-amber-800"
                              title={localBlockers.join(', ')}
                            >
                              Bloqueado
                            </span>
                          ) : null}
                          {metaStatus === 'manual_review' ? (
                            <span className="inline-flex items-center px-1.5 text-[10px] font-semibold text-amber-800">Revisión manual</span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredDrafts.length === 0 ? (
                <div className="p-8 text-center text-sm text-[#69717d]">No hay servicios que coincidan con el filtro.</div>
              ) : null}
            </div>
          </section>
        ) : null}

        {panel === 'readiness' ? (
          <section className="mt-3 overflow-hidden rounded-2xl border border-[#d8cbb5] bg-white">
            <div className="border-b border-[#eee6d8] px-4 py-3">
              <h2 className="font-serif text-lg font-bold text-[#07111d]">Preparación por servicio</h2>
              <p className="text-xs text-[#69717d]">Contenido, blog, base de conocimiento y gate de producción.</p>
            </div>
            <div className="max-h-[65vh] overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-[#f7f3eb] text-left text-[10px] uppercase text-[#69717d]">
                  <tr>
                    <th className="px-3 py-2">Servicio</th>
                    <th className="px-3 py-2">Stage</th>
                    <th className="px-3 py-2">Blog</th>
                    <th className="px-3 py-2">KB</th>
                    <th className="px-3 py-2">Gate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eee6d8]">
                  {diagnostics.manifest.entries.map((entry) => (
                    <tr key={entry.slug}>
                      <td className="px-3 py-2 font-mono text-xs font-semibold">{entry.slug}</td>
                      <td className="px-3 py-2 text-xs">{entry.stage}</td>
                      <td className="px-3 py-2 text-xs">{entry.blogCount}</td>
                      <td className="px-3 py-2 text-xs">{entry.knowledgeCount}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${entry.contentGatePassed ? 'text-green-700' : 'text-amber-800'}`}>
                          {entry.contentGatePassed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                          {entry.contentGatePassed ? 'OK' : `${entry.readinessIssues.length} pendientes`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {panel === 'settings' ? (
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <section className="rounded-2xl border border-[#d8cbb5] bg-white p-4">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-[#c88b25]" />
                <h2 className="font-serif text-lg font-bold text-[#07111d]">Conexión Meta</h2>
              </div>
              <dl className="mt-3 grid gap-2 text-xs">
                <div className="flex justify-between gap-4"><dt className="text-[#69717d]">Estado</dt><dd className="font-bold">{config.enabled && config.configured ? 'Operativa' : 'Revisar'}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-[#69717d]">Graph API</dt><dd className="font-mono">{config.graphApiVersion ?? '—'}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-[#69717d]">Canales Meta ready</dt><dd className="font-bold">{diagnostics.c2.channels.metaReady}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-[#69717d]">Items Meta</dt><dd className="font-bold">{diagnostics.c2.metaItems.total}</dd></div>
              </dl>
              {config.missing.length ? (
                <p className="mt-3 rounded-lg bg-amber-50 p-2 text-xs text-amber-900">Faltan: {config.missing.join(' · ')}</p>
              ) : null}
            </section>

            <section className="rounded-2xl border border-[#d8cbb5] bg-white p-4">
              <h2 className="font-serif text-lg font-bold text-[#07111d]">Fuera del catálogo</h2>
              <div className="mt-3 max-h-52 space-y-2 overflow-auto">
                {(catalog?.excluded ?? []).map((item) => (
                  <div key={item.retailerId} className="rounded-lg bg-[#f7f3eb] px-3 py-2">
                    <p className="truncate font-mono text-[10px] font-semibold">{item.retailerId}</p>
                    <p className="text-[11px] text-[#69717d]">{EXCLUSION_LABEL[item.reason]}</p>
                  </div>
                ))}
                {(catalog?.excluded.length ?? 0) === 0 ? <p className="text-xs text-[#69717d]">Sin exclusiones.</p> : null}
              </div>
            </section>

            {diagnostics.errors.length > 0 ? (
              <section className="rounded-2xl border border-red-200 bg-red-50 p-4 lg:col-span-2">
                <div className="flex items-center gap-2 font-bold text-red-800">
                  <AlertTriangle className="h-4 w-4" /> Errores de lectura
                </div>
                {diagnostics.errors.map((error) => (
                  <p key={error.source} className="mt-2 text-xs text-red-700">{error.source}: {error.message}</p>
                ))}
              </section>
            ) : null}
          </div>
        ) : null}
      </div>

      <MetaCatalogContentEditor
        retailerId={editingRetailerId}
        onClose={() => setEditingRetailerId(null)}
        onSaved={load}
      />

      {imagePreview ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Vista previa de imagen"
          onClick={() => setImagePreview(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white p-3 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setImagePreview(null)}
              className="absolute right-4 top-4 z-10 rounded-full bg-black/70 p-2 text-white"
              aria-label="Cerrar vista previa"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#f7f3eb]">
              <Image
                src={imagePreview.src}
                alt={imagePreview.alt}
                fill
                sizes="(max-width: 768px) 90vw, 720px"
                className="object-contain"
              />
            </div>
            <p className="mt-2 truncate text-center text-xs font-semibold text-[#374151]">{imagePreview.alt}</p>
          </div>
        </div>
      ) : null}
    </main>
  );
}
