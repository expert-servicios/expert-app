'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw, ShieldCheck, TestTube2 } from 'lucide-react';

type StatusMap = Record<string, number>;

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

type MetaCatalogDraft = {
  retailerId: string;
  name: string;
  price: { amount: number; currency: 'EUR' } | null;
  imageUrl: string | null;
  marketingReady: boolean;
  warnings: string[];
};

type MetaCatalogExcludedService = {
  retailerId: string;
  name: string;
  reason: 'quote_price' | 'missing_offer';
};

type MetaCatalogPayload = {
  drafts: MetaCatalogDraft[];
  excluded: MetaCatalogExcludedService[];
  readyCount: number;
  blockedCount: number;
};

const EXCLUSION_LABEL: Record<MetaCatalogExcludedService['reason'], string> = {
  quote_price: 'Precio "Consultar"',
  missing_offer: 'Sin oferta comercial',
};

function Metric({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <div className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6b7280]">{label}</p>
      <p className="mt-2 font-serif text-3xl font-bold text-[#07111d]">{value}</p>
      {detail ? <p className="mt-1 text-xs text-[#5b6470]">{detail}</p> : null}
    </div>
  );
}

export default function MarketingHubPage() {
  const [data, setData] = useState<DiagnosticsPayload | null>(null);
  const [catalog, setCatalog] = useState<MetaCatalogPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);

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
        ? `Conexión correcta: ${payload.catalog?.name ?? 'catálogo'} (${payload.catalog?.id ?? 'sin id'})`
        : payload.error ?? 'Falló la prueba');
    } finally {
      setTesting(false);
    }
  }, [data?.liveTestAvailable]);

  if (loading && !data) return <main className="p-8">Cargando Marketing Hub…</main>;
  if (!data) return <main className="p-8 text-red-700">No se pudo cargar Marketing Hub.</main>;

  const { diagnostics, config } = data;

  return (
    <main className="min-h-screen bg-[#f8f4eb] px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-[#c88b25]" />
              <h1 className="font-serif text-3xl font-bold text-[#07111d]">EXPERT Marketing Hub</h1>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5b6470]">
              Diagnóstico read-only del catálogo canónico C2, readiness de servicios y preparación para Meta.
              No publica campañas, no cambia precios y no crea productos.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void load()} disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-[#d8cbb5] bg-white px-4 py-2 text-sm font-semibold">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Actualizar
            </button>
            <button type="button" onClick={() => void testConnection()} disabled={!data.liveTestAvailable || testing}
              className="inline-flex items-center gap-2 rounded-xl bg-[#07111d] px-4 py-2 text-sm font-semibold text-[#d7a33a] disabled:opacity-40">
              <TestTube2 className="h-4 w-4" /> {testing ? 'Probando…' : 'Probar Meta'}
            </button>
          </div>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Servicios C2" value={diagnostics.c2.services.total} detail="Fuente comercial canónica" />
          <Metric label="Production ready" value={diagnostics.manifest.productionReady} detail={`Estándar v${diagnostics.standardVersion}`} />
          <Metric label="Canales Meta ready" value={diagnostics.c2.channels.metaReady} detail={`de ${diagnostics.c2.channels.metaTotal} configurados`} />
          <Metric label="Items Meta" value={diagnostics.c2.metaItems.total} detail="Proyección C2, no fuente maestra" />
        </div>

        <section className="mt-6 rounded-2xl border border-[#d8cbb5] bg-white p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-serif text-xl font-bold text-[#07111d]">Configuración Meta</h2>
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${config.configured ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-900'}`}>
              {config.configured ? 'Configurada' : 'Incompleta'}
            </span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${config.enabled ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-700'}`}>
              {config.enabled ? 'Habilitada' : 'Deshabilitada'}
            </span>
          </div>
          <p className="mt-3 text-sm text-[#5b6470]">Graph API: {config.graphApiVersion ?? 'pendiente'}</p>
          {config.missing.length ? (
            <p className="mt-2 text-xs text-amber-800">Faltan: {config.missing.join(' · ')}</p>
          ) : null}
          {testMessage ? <p className="mt-3 text-sm font-semibold text-[#07111d]">{testMessage}</p> : null}
        </section>

        {diagnostics.errors.length > 0 ? (
          <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
            <div className="flex items-center gap-2 font-bold text-red-800">
              <AlertTriangle className="h-4 w-4" /> Errores de lectura C2
            </div>
            {diagnostics.errors.map((error) => (
              <p key={error.source} className="mt-2 text-xs text-red-700">{error.source}: {error.message}</p>
            ))}
          </section>
        ) : null}

        <section className="mt-6 overflow-hidden rounded-2xl border border-[#d8cbb5] bg-white">
          <div className="border-b border-[#eee6d8] p-5">
            <h2 className="font-serif text-xl font-bold text-[#07111d]">Readiness por servicio</h2>
            <p className="mt-1 text-sm text-[#5b6470]">
              Un servicio no se publica automáticamente hasta estar production_ready y con el canal aprobado.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#f8f4eb] text-left text-xs uppercase text-[#6b7280]">
                <tr>
                  <th className="px-4 py-3">Servicio</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3">Blog</th>
                  <th className="px-4 py-3">KB</th>
                  <th className="px-4 py-3">Gate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee6d8]">
                {diagnostics.manifest.entries.map((entry) => (
                  <tr key={entry.slug}>
                    <td className="px-4 py-3 font-mono text-xs font-semibold">{entry.slug}</td>
                    <td className="px-4 py-3">{entry.stage}</td>
                    <td className="px-4 py-3">{entry.blogCount}</td>
                    <td className="px-4 py-3">{entry.knowledgeCount}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 font-semibold ${entry.contentGatePassed ? 'text-green-700' : 'text-amber-800'}`}>
                        {entry.contentGatePassed ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                        {entry.contentGatePassed ? 'OK' : `${entry.readinessIssues.length} pendientes`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-[#d8cbb5] bg-white">
          <div className="border-b border-[#eee6d8] p-5">
            <h2 className="font-serif text-xl font-bold text-[#07111d]">Catálogo para Meta</h2>
            <p className="mt-1 text-sm text-[#5b6470]">
              Proyección de solo lectura de lo que se exportaría al catálogo de comercio de Meta a partir de las tablas C2.
              No crea ni sincroniza nada.
            </p>
            {catalog ? (
              <p className="mt-2 text-sm font-semibold text-[#07111d]">
                {catalog.readyCount} listos de {catalog.readyCount + catalog.blockedCount}
              </p>
            ) : null}
          </div>
          <div className="max-h-[32rem] overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-[#f8f4eb] text-left text-xs uppercase text-[#6b7280]">
                <tr>
                  <th className="px-4 py-3">Servicio (retailer_id)</th>
                  <th className="px-4 py-3">Precio</th>
                  <th className="px-4 py-3">Imagen</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee6d8]">
                {(catalog?.drafts ?? []).map((draft) => (
                  <tr key={draft.retailerId}>
                    <td className="px-4 py-3 font-mono text-xs font-semibold">{draft.retailerId}</td>
                    <td className="px-4 py-3">{draft.price ? `${draft.price.amount.toFixed(2)} ${draft.price.currency}` : '—'}</td>
                    <td className="px-4 py-3">{draft.imageUrl ? 'OK' : 'Falta'}</td>
                    <td className="px-4 py-3">
                      {draft.marketingReady ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-green-700">
                          <CheckCircle2 className="h-4 w-4" /> Listo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-amber-800" title={draft.warnings.join(', ')}>
                          <AlertTriangle className="h-4 w-4" /> {draft.warnings.join(', ')}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {catalog && catalog.drafts.length === 0 && catalog.excluded.length === 0 ? (
              <p className="p-5 text-sm text-[#5b6470]">
                No hay servicios en catalog_services todavía. Ejecuta el backfill (scripts/backfill-meta-catalog-c2.ts --apply) primero.
              </p>
            ) : null}
          </div>
        </section>

        {catalog && catalog.excluded.length > 0 ? (
          <section className="mt-6 overflow-hidden rounded-2xl border border-[#d8cbb5] bg-white">
            <div className="border-b border-[#eee6d8] p-5">
              <h2 className="font-serif text-xl font-bold text-[#07111d]">Fuera del catálogo de Meta</h2>
              <p className="mt-1 text-sm text-[#5b6470]">
                {catalog.excluded.length} servicios sin precio fijo o &ldquo;desde&rdquo; (p. ej. &ldquo;Consultar&rdquo;). Meta exige un
                número por artículo, así que se quedan fuera en vez de mostrar un precio inventado.
              </p>
            </div>
            <div className="max-h-64 overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-[#f8f4eb] text-left text-xs uppercase text-[#6b7280]">
                  <tr>
                    <th className="px-4 py-3">Servicio (retailer_id)</th>
                    <th className="px-4 py-3">Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eee6d8]">
                  {catalog.excluded.map((item) => (
                    <tr key={item.retailerId}>
                      <td className="px-4 py-3 font-mono text-xs font-semibold">{item.retailerId}</td>
                      <td className="px-4 py-3 text-[#5b6470]">{EXCLUSION_LABEL[item.reason]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
