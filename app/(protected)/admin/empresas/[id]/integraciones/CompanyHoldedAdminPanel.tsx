'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Eye, EyeOff, Loader2, Plug, RefreshCw, ShieldCheck, Unplug } from 'lucide-react';

type Company = {
  id: string;
  name: string;
  nif: string | null;
  status: string;
};

type Integration = {
  id: string;
  company_id: string | null;
  status: string;
  api_key_last4: string | null;
  sync_mode: string;
  permissions_detected?: Record<string, boolean> | null;
  permissions_enabled?: Record<string, boolean> | null;
  last_success_at: string | null;
  last_error: string | null;
};

type Payload = {
  company: Company;
  integration: Integration | null;
};

export function CompanyHoldedAdminPanel({ companyId }: { companyId: string }) {
  const [data, setData] = useState<Payload | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [consent, setConsent] = useState(false);
  const [laborConsent, setLaborConsent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/empresas/${companyId}/holded`, { cache: 'no-store' });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'No se pudo cargar la integración');
      setData(json as Payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [companyId]);

  async function action(payload: Record<string, unknown>) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`/api/admin/empresas/${companyId}/holded`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await response.json();
      if (!response.ok || json.ok === false) {
        throw new Error(json.error ?? 'No se pudo completar la operación');
      }
      setNotice(
        payload.action === 'connect'
          ? 'Holded conectado y credencial cifrada correctamente.'
          : payload.action === 'disconnect'
            ? 'Holded desconectado. La credencial almacenada se ha eliminado.'
            : 'Conexión Holded verificada correctamente.',
      );
      setApiKey('');
      setShowKey(false);
      setConsent(false);
      setLaborConsent(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setBusy(false);
    }
  }

  if (loading && !data) {
    return (
      <div className="rounded-2xl border border-[#d8cbb5] bg-white p-8 text-sm text-[#6b7280]">
        <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Cargando integración…
      </div>
    );
  }

  const integration = data?.integration ?? null;
  const company = data?.company ?? null;

  return (
    <div className="space-y-5">
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {notice && <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{notice}</div>}

      <section className="rounded-2xl border border-[#d8cbb5] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#c88b25]">Company 360 · Holded</p>
            <h1 className="mt-1 font-serif text-2xl font-bold text-[#07111d]">{company?.name ?? 'Empresa'}</h1>
            <p className="mt-1 text-sm text-[#6b7280]">
              {company?.nif ?? 'Sin CIF/NIF'} · gestión directa de la entidad, aunque no tenga usuario vinculado.
            </p>
          </div>
          <button type="button" onClick={() => void load()} disabled={loading || busy} className="rounded-xl border border-[#d8cbb5] p-2 text-[#29384a]">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </section>

      {integration?.status === 'active' ? (
        <section className="rounded-2xl border border-green-200 bg-green-50 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-700" />
              <div>
                <h2 className="font-bold text-green-900">Holded conectado</h2>
                <p className="mt-1 text-sm text-green-800">
                  clave ••••{integration.api_key_last4 ?? '????'} · {integration.sync_mode === 'read_write' ? 'lectura/escritura' : 'solo lectura'}
                </p>
                {integration.last_success_at && (
                  <p className="mt-1 text-xs text-green-700">
                    Última verificación correcta: {new Date(integration.last_success_at).toLocaleString('es-ES')}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" disabled={busy} onClick={() => void action({ action: 'test_stored' })} className="inline-flex items-center gap-1.5 rounded-xl border border-green-300 bg-white px-3 py-2 text-xs font-bold text-green-900">
                <ShieldCheck className="h-3.5 w-3.5" /> Probar conexión
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  if (window.confirm('¿Desconectar Holded de esta entidad? La credencial cifrada se eliminará.')) {
                    void action({ action: 'disconnect' });
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700"
              >
                <Unplug className="h-3.5 w-3.5" /> Desconectar
              </button>
            </div>
          </div>

          {integration.last_error && <p className="mt-4 rounded-xl bg-white px-4 py-3 text-sm text-red-700">Último error: {integration.last_error}</p>}

          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-green-800">Permisos efectivos</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(integration.permissions_enabled ?? {})
                .filter(([, value]) => value)
                .map(([key]) => (
                  <span key={key} className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-green-800">{key}</span>
                ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-[#d8cbb5] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Plug className="h-5 w-5 text-[#c88b25]" />
            <h2 className="font-serif text-xl font-bold">Conectar tenant Holded</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-[#6b7280]">
            Pega el API Token autorizado por la empresa. EXPERT lo valida en servidor, lo cifra y no vuelve a mostrarlo.
          </p>

          <div className="relative mt-5">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              autoComplete="off"
              placeholder="API Token de Holded"
              className="w-full rounded-xl border border-[#d8cbb5] px-4 py-3 pr-12 text-sm outline-none focus:border-[#c88b25]"
            />
            <button type="button" onClick={() => setShowKey((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280]">
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <label className="mt-4 flex items-start gap-2 text-xs leading-5 text-[#4b5563]">
            <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1" />
            <span>Confirmo que la empresa ha autorizado la conexión de su cuenta Holded a EXPERT y el registro cifrado de esta credencial.</span>
          </label>

          <label className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs leading-5 text-amber-900">
            <input type="checkbox" checked={laborConsent} onChange={(event) => setLaborConsent(event.target.checked)} className="mt-1" />
            <span><strong>Datos laborales:</strong> confirmo autorización expresa para leer empleados, contratos, nóminas y registros salariales. Si no se marca, las capacidades laborales permanecerán desactivadas.</span>
          </label>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              disabled={busy || apiKey.trim().length < 8 || !consent}
              onClick={() => void action({
                action: 'connect',
                apiKey: apiKey.trim(),
                consentConfirmed: true,
                laborReadAuthorized: laborConsent,
              })}
              className="inline-flex items-center gap-2 rounded-xl bg-[#07111d] px-5 py-3 text-sm font-bold text-white disabled:opacity-40"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plug className="h-4 w-4" />}
              Verificar y conectar
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
