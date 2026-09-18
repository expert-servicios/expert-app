'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CircleOff,
  Database,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  TestTube2,
} from 'lucide-react';

type ConfigStatus = {
  enabled: boolean;
  configured: boolean;
  missing: string[];
  graphApiVersion: string | null;
  assets: {
    appId: string | null;
    businessId: string | null;
    catalogId: string | null;
    adAccountId: string | null;
    pageId: string | null;
    instagramAccountId: string | null;
    datasetId: string | null;
  };
  secrets: {
    appSecretConfigured: boolean;
    systemUserAccessTokenConfigured: boolean;
  };
};

type CommercialIssue = {
  slug: string;
  publicPrice: number | null;
  adminSuggestedPrice: number | null;
  issue: string;
};

type InventoryRow = {
  id: string;
  publicName: string | null;
  adminLabel: string | null;
  conversationTitle: string | null;
  publicPriceText: string | null;
  publicFixedPrice: number | null;
  adminSuggestedPrice: number | null;
  adminMode: 'payment' | 'subscription' | null;
  stripePriceId: string | null;
  stripePriceEnvKey: string | null;
  flowType: string | null;
  hasCheckout: boolean;
  isSubscription: boolean;
  issues: string[];
};

type DiagnosticsPayload = {
  config: ConfigStatus;
  liveTestAvailable: boolean;
  catalog: {
    total: number;
    ready: number;
    manualReview: number;
    warningCounts: Record<string, number>;
    byCategory: Array<{ category: string; total: number; ready: number; manualReview: number }>;
    pilotCandidates: string[];
    commercialConsistency: {
      publicServiceCount: number;
      adminItemCount: number;
      overlappingSlugs: number;
      exactPriceMatches: number;
      priceMismatches: number;
      publicWithoutAdmin: number;
      adminWithoutPublic: number;
      publicWithoutFixedPrice: number;
      issues: CommercialIssue[];
    };
  };
  canonicalSummary: {
    services: number;
    servicesWithAliases: number;
    servicesWithMultipleOffers: number;
    servicesWithWarnings: number;
    totalOffers: number;
    warningCounts: Record<string, number>;
  };
  commercialInventory: {
    readOnly: true;
    totals: {
      uniqueIds: number;
      publicItems: number;
      adminItems: number;
      conversationItems: number;
      rowsWithIssues: number;
      stripeBoundRows: number;
      checkoutableRows: number;
    };
    issueCounts: Record<string, number>;
    aliasCandidates: Array<{
      alias: string;
      canonical: string;
      reason: string;
      status: 'candidate';
    }>;
    rows: InventoryRow[];
  };
};

type LiveTestResult = {
  ok: boolean;
  catalog?: { id?: string; name?: string };
  error?: string;
};

const issueLabels: Record<string, string> = {
  price_mismatch: 'Precio distinto',
  public_price_ambiguous: 'Precio público variable',
  missing_admin_item: 'Sin ficha Admin',
  admin_only_item: 'Solo Admin',
  conversation_only_item: 'Solo catálogo conversacional',
  stripe_binding_without_fixed_public_price: 'Stripe sin precio público fijo',
  registry_without_public_item: 'Registry sin ficha pública',
  missing_public_fixed_price: 'Sin precio público fijo',
  admin_alias_only: 'Posible alias Admin',
  price_requires_manual_review: 'Precio requiere revisión',
  missing_short_description: 'Falta descripción corta',
  missing_catalog_image: 'Falta imagen',
};

function Badge({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${ok ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-900'}`}>
      {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
      {children}
    </span>
  );
}

function Metric({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-[#d8cbb5] bg-white p-5 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6b7280]">{label}</div>
      <div className="mt-2 font-serif text-3xl font-bold text-[#07111d]">{value}</div>
      {sub && <div className="mt-1 text-xs text-[#5b6470]">{sub}</div>}
    </div>
  );
}

export default function AdminMarketingHubPage() {
  const [data, setData] = useState<DiagnosticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<LiveTestResult | null>(null);
  const [onlyIssues, setOnlyIssues] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/meta/diagnostics', { cache: 'no-store' });
      if (!response.ok) throw new Error('No se pudo cargar el diagnóstico de Marketing Hub');
      setData(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const runLiveTest = useCallback(async () => {
    if (!data?.liveTestAvailable) return;
    setTesting(true);
    setTestResult(null);
    try {
      const response = await fetch('/api/admin/meta/diagnostics', { method: 'POST' });
      const payload = await response.json() as LiveTestResult;
      setTestResult(payload);
    } catch (err) {
      setTestResult({ ok: false, error: err instanceof Error ? err.message : 'Error inesperado' });
    } finally {
      setTesting(false);
    }
  }, [data?.liveTestAvailable]);

  const rows = useMemo(() => {
    const source = data?.commercialInventory.rows ?? [];
    return onlyIssues ? source.filter((row) => row.issues.length > 0) : source;
  }, [data, onlyIssues]);

  if (loading && !data) return <div className="p-6">Cargando Marketing Hub…</div>;
  if (error && !data) return <div className="p-6 text-red-700">{error}</div>;
  if (!data) return null;

  const { config, catalog, commercialInventory, canonicalSummary } = data;

  return (
    <main className="min-h-screen bg-[#f8f4eb]">
      <div className="border-b border-[#d8cbb5] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-serif text-2xl font-bold text-[#07111d] md:text-3xl">EXPERT Marketing Hub</h1>
                <Badge ok={config.configured}>{config.configured ? 'Configurado' : 'Configuración incompleta'}</Badge>
                <Badge ok={config.enabled}>{config.enabled ? 'Integración habilitada' : 'Integración deshabilitada'}</Badge>
              </div>
              <p className="mt-2 max-w-3xl text-sm text-[#29384a]">
                Panel de control read-only para catálogo comercial, Meta Catalog y coherencia entre Web, Admin, Stripe y KIA. No publica campañas ni modifica precios.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void load()}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl border border-[#d8cbb5] bg-white px-4 py-2 text-sm font-semibold text-[#07111d] hover:border-[#c88b25] disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
              <button
                type="button"
                onClick={() => void runLiveTest()}
                disabled={!data.liveTestAvailable || testing}
                title={!data.liveTestAvailable ? 'Completa y habilita la configuración Meta para probar la conexión' : 'Lectura id/name del catálogo Meta configurado'}
                className="inline-flex items-center gap-2 rounded-xl bg-[#07111d] px-4 py-2 text-sm font-semibold text-[#d7a33a] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <TestTube2 className="h-4 w-4" />
                {testing ? 'Probando…' : 'Probar conexión Meta'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Servicios canónicos" value={canonicalSummary.services} sub={`${canonicalSummary.totalOffers} ofertas shadow`} />
          <Metric label="Con aliases" value={canonicalSummary.servicesWithAliases} sub="Identidades legacy vinculadas explícitamente" />
          <Metric label="Ofertas múltiples" value={canonicalSummary.servicesWithMultipleOffers} sub="Variantes comerciales bajo una identidad" />
          <Metric label="Warnings C1" value={canonicalSummary.servicesWithWarnings} sub="Sin corrección automática" />
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Servicios públicos" value={catalog.total} sub={`${catalog.ready} aptos para marketing`} />
          <Metric label="Revisión manual" value={catalog.manualReview} sub="Bloqueados para publicación automática" />
          <Metric label="IDs comerciales C0" value={commercialInventory.totals.uniqueIds} sub={`${commercialInventory.totals.rowsWithIssues} con incidencias`} />
          <Metric label="Bindings Stripe" value={commercialInventory.totals.stripeBoundRows} sub={`${commercialInventory.totals.checkoutableRows} checkoutables en registry`} />
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-[#d8cbb5] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#c88b25]" />
              <h2 className="font-serif text-lg font-bold text-[#07111d]">Configuración Meta</h2>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-[#f8f4eb] p-3">
                <div className="text-xs text-[#6b7280]">Graph API</div>
                <div className="mt-1 font-semibold text-[#07111d]">{config.graphApiVersion ?? 'Pendiente'}</div>
              </div>
              <div className="rounded-xl bg-[#f8f4eb] p-3">
                <div className="text-xs text-[#6b7280]">Secrets</div>
                <div className="mt-1 text-sm font-semibold text-[#07111d]">
                  {config.secrets.appSecretConfigured && config.secrets.systemUserAccessTokenConfigured ? 'Configurados' : 'Incompletos'}
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              {Object.entries(config.assets).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between gap-3 border-b border-[#eee6d8] py-2 last:border-0">
                  <span className="text-[#5b6470]">{key}</span>
                  <span className="max-w-[60%] truncate font-mono text-xs font-semibold text-[#07111d]">{value ?? '—'}</span>
                </div>
              ))}
            </div>
            {config.missing.length > 0 && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <div className="font-semibold">Pendiente de configuración</div>
                <div className="mt-1 break-words font-mono text-xs">{config.missing.join(' · ')}</div>
              </div>
            )}
            {testResult && (
              <div className={`mt-4 rounded-xl border p-4 text-sm ${testResult.ok ? 'border-green-200 bg-green-50 text-green-900' : 'border-red-200 bg-red-50 text-red-900'}`}>
                <div className="font-semibold">{testResult.ok ? 'Conexión read-only correcta' : 'Falló la prueba de conexión'}</div>
                <div className="mt-1 text-xs">{testResult.ok ? `${testResult.catalog?.name ?? 'Catálogo'} · ${testResult.catalog?.id ?? ''}` : testResult.error}</div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[#d8cbb5] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-[#c88b25]" />
              <h2 className="font-serif text-lg font-bold text-[#07111d]">Readiness de catálogo</h2>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-green-50 p-3"><div className="text-xs text-green-700">Aptos</div><div className="mt-1 text-2xl font-bold text-green-900">{catalog.ready}</div></div>
              <div className="rounded-xl bg-amber-50 p-3"><div className="text-xs text-amber-700">Revisión</div><div className="mt-1 text-2xl font-bold text-amber-900">{catalog.manualReview}</div></div>
              <div className="rounded-xl bg-[#f8f4eb] p-3"><div className="text-xs text-[#6b7280]">Price mismatches</div><div className="mt-1 text-2xl font-bold text-[#07111d]">{catalog.commercialConsistency.priceMismatches}</div></div>
            </div>
            <div className="mt-5">
              <h3 className="text-sm font-semibold text-[#07111d]">Candidatos piloto</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {catalog.pilotCandidates.length > 0 ? catalog.pilotCandidates.map((slug) => (
                  <span key={slug} className="rounded-full bg-[#07111d] px-3 py-1 text-xs font-semibold text-[#d7a33a]">{slug}</span>
                )) : <span className="text-sm text-[#6b7280]">Aún no hay candidatos aptos.</span>}
              </div>
            </div>
            <div className="mt-5">
              <h3 className="text-sm font-semibold text-[#07111d]">Bloqueos por tipo</h3>
              <div className="mt-2 space-y-2">
                {Object.entries(catalog.warningCounts).length === 0 ? (
                  <div className="text-sm text-green-700">Sin bloqueos.</div>
                ) : Object.entries(catalog.warningCounts).map(([issue, count]) => (
                  <div key={issue} className="flex items-center justify-between rounded-lg bg-[#f8f4eb] px-3 py-2 text-sm">
                    <span>{issueLabels[issue] ?? issue}</span><strong>{count}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#d8cbb5] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="font-serif text-lg font-bold text-[#07111d]">Aliases candidatos</h2>
              <p className="mt-1 text-sm text-[#5b6470]">Solo observaciones C0. No se cambia ningún slug ni se fusionan servicios automáticamente.</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
              <CircleOff className="h-3.5 w-3.5" /> Solo lectura
            </span>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {commercialInventory.aliasCandidates.map((candidate) => (
              <div key={candidate.alias} className="rounded-xl border border-[#eee6d8] p-4">
                <div className="font-mono text-xs text-[#6b7280]">{candidate.alias}</div>
                <div className="my-1 text-[#c88b25]">↓</div>
                <div className="font-mono text-sm font-bold text-[#07111d]">{candidate.canonical}</div>
                <p className="mt-2 text-xs leading-relaxed text-[#5b6470]">{candidate.reason}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[#d8cbb5] bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-[#eee6d8] p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-serif text-lg font-bold text-[#07111d]">Inventario comercial C0</h2>
              <p className="mt-1 text-sm text-[#5b6470]">Web + Admin + catálogo conversacional + service registry. Stripe se muestra como binding conocido, nunca como fuente maestra.</p>
            </div>
            <button
              type="button"
              onClick={() => setOnlyIssues((value) => !value)}
              className="rounded-lg border border-[#d8cbb5] px-3 py-2 text-xs font-semibold text-[#07111d] hover:bg-[#f8f4eb]"
            >
              {onlyIssues ? `Ver todos (${commercialInventory.totals.uniqueIds})` : `Solo incidencias (${commercialInventory.totals.rowsWithIssues})`}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#eee6d8] text-sm">
              <thead className="bg-[#f8f4eb] text-left text-xs uppercase tracking-wide text-[#6b7280]">
                <tr>
                  <th className="px-4 py-3">Servicio / ID</th>
                  <th className="px-4 py-3">Precio público</th>
                  <th className="px-4 py-3">Admin</th>
                  <th className="px-4 py-3">Flujo</th>
                  <th className="px-4 py-3">Stripe</th>
                  <th className="px-4 py-3">Incidencias</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee6d8]">
                {rows.map((row) => (
                  <tr key={row.id} className="align-top hover:bg-[#fcfaf5]">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#07111d]">{row.publicName ?? row.adminLabel ?? row.conversationTitle ?? row.id}</div>
                      <div className="mt-1 font-mono text-[11px] text-[#6b7280]">{row.id}</div>
                    </td>
                    <td className="px-4 py-3 text-[#29384a]">{row.publicPriceText ?? '—'}</td>
                    <td className="px-4 py-3 text-[#29384a]">{row.adminSuggestedPrice !== null ? `${row.adminSuggestedPrice} € · ${row.adminMode}` : '—'}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">{row.flowType ?? '—'}</span></td>
                    <td className="px-4 py-3">
                      {row.stripePriceId || row.stripePriceEnvKey ? (
                        <div className="max-w-[180px] break-all font-mono text-[11px] text-[#29384a]">{row.stripePriceId ?? row.stripePriceEnvKey}</div>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {row.issues.length === 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700"><CheckCircle2 className="h-3.5 w-3.5" /> OK</span>
                      ) : (
                        <div className="flex max-w-sm flex-wrap gap-1">
                          {row.issues.map((issue) => <span key={issue} className="rounded bg-amber-100 px-2 py-1 text-[11px] font-medium text-amber-900">{issueLabels[issue] ?? issue}</span>)}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="flex items-center gap-2 text-xs text-[#6b7280]">
          <ExternalLink className="h-3.5 w-3.5" />
          Primera versión operativa: diagnóstico y control. Publicación/escrituras Meta, campañas, presupuestos Ads y DDL siguen fuera de alcance.
        </div>
      </div>
    </main>
  );
}
