'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, AlertTriangle, Loader2, RefreshCw, Unplug } from 'lucide-react';
import { HoldedPermissionStatus, type HoldedPermissions } from './HoldedPermissionStatus';
import { HOLDED_READ_PERMISSION_KEYS } from '@/lib/integrations/holded/holded-permissions';
import { HoldedApiKeyForm } from './HoldedApiKeyForm';
import { HoldedConnectionGuide } from './HoldedConnectionGuide';
import { KiaGuidanceCard } from '@/components/kia/KiaGuidanceCard';
import {
  resolveHoldedIntegrationGuidance,
  type KiaHoldedConnectionPhase,
} from '@/lib/ai/kia/kia-surface-guidance';

interface Integration {
  id                  : string;
  status              : string;
  mode                : 'expert_account' | 'client_account' | 'advisor_managed';
  api_version         : 'v1' | 'v2' | null;
  api_key_last4       : string | null;
  permissions_detected: HoldedPermissions;
  permissions_enabled?: HoldedPermissions;
  last_success_at     : string | null;
  last_error          : string | null;
  sync_mode           : string;
  created_at          : string;
}

interface Props {
  integration : Integration | null;
  companyId  ?: string | null;
  canManage  ?: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  active  : 'Conectado',
  pending : 'Pendiente',
  failed  : 'Error de conexión',
  disabled: 'Desactivado',
  revoked : 'Desconectado',
};

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
}

export function HoldedConnectionCard({ integration: initialIntegration, companyId, canManage = true }: Props) {
  const router = useRouter();
  const [integration, setIntegration] = useState<Integration | null>(initialIntegration);
  const [disconnecting, setDisconnecting] = useState(false);
  const [refreshingPermissions,setRefreshingPermissions] = useState(false);
  const [permissionNotice,setPermissionNotice] = useState('');
  const [replacingToken,setReplacingToken] = useState(false);
  const [savingScope, setSavingScope] = useState(false);
  const [phase, setPhase] = useState<KiaHoldedConnectionPhase>('idle');
  const [error, setError] = useState('');

  const isActive = integration?.status === 'active';
  const isManagedByExpert = integration?.mode === 'advisor_managed' || integration?.mode === 'expert_account';
  const guidance = resolveHoldedIntegrationGuidance({
    integrationStatus: integration?.status ?? null,
    phase: disconnecting ? 'disconnecting' : phase,
    hasUiError: Boolean(error),
  });

  async function handleRefreshPermissions() {
    setRefreshingPermissions(true);
    setError('');
    setPermissionNotice('');
    try {
      const res = await fetch('/api/integrations/holded/refresh-permissions', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'No se pudieron revisar los permisos.');
      setIntegration(previous => previous ? { ...previous,
        permissions_detected: data.detected,
        permissions_enabled: data.permissions,
      } : previous);
      setPermissionNotice('Permisos del token revisados. KIA utiliza las capacidades efectivamente disponibles.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo comprobar el token.');
    } finally {
      setRefreshingPermissions(false);
    }
  }

  async function changeReadPermission(key: keyof HoldedPermissions, enabled: boolean) {
    if (!integration || !companyId || savingScope) return;
    setSavingScope(true);
    setError('');
    setPermissionNotice('');
    try {
      const res = await fetch('/api/integrations/holded/update-permissions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, changes: { [key]: enabled } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'No se pudo actualizar el permiso');
      setIntegration(previous => previous ? { ...previous, permissions_enabled: data.permissions } : previous);
      setPermissionNotice('Permisos guardados. KIA aplicará el nuevo alcance en la próxima consulta.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de actualización');
    } finally {
      setSavingScope(false);
    }
  }

  async function handleDisconnect() {
    if (!integration) return;
    const confirmed = window.confirm(
      '¿Desconectar Holded? Se eliminará la clave API almacenada. Podrás volver a conectar cuando quieras.'
    );
    if (!confirmed) return;

    setDisconnecting(true);
    setError('');
    try {
      const res = await fetch('/api/integrations/holded/disconnect', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ integrationId: integration.id }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? 'Error al desconectar');
        return;
      }
      setIntegration(null);
      setPhase('idle');
      router.refresh();
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setDisconnecting(false);
    }
  }

  // ── Connected state ────────────────────────────────────────────────────────
  if (isActive && integration) {
    return (
      <div className="space-y-6">
        <KiaGuidanceCard
          state={guidance.state}
          title={guidance.title}
          message={guidance.message}
          compact
          animateOnChange
        />

        {/* Status badge */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} className="shrink-0 text-emerald-600" />
            <div>
              <p className="font-semibold text-[#3d3528]">Holded conectado</p>
              <p className="text-xs text-[#7a6e5f]">
                Clave: ••••{integration.api_key_last4 ?? '????'} · Última sync: {formatDate(integration.last_success_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.refresh()}
              className="flex items-center gap-1.5 rounded-xl border border-[#e8dfc8] bg-white px-3 py-2 text-xs font-medium text-[#7a6e5f] hover:border-[#c88b25] hover:text-[#c88b25]"
            >
              <RefreshCw size={12} />
              Actualizar
            </button>
            {!isManagedByExpert && canManage && (
              <button type="button" disabled={refreshingPermissions} onClick={handleRefreshPermissions} className="rounded-xl border border-[#e8dfc8] bg-white px-3 py-2 text-xs font-medium text-[#3d3528] disabled:opacity-50">{refreshingPermissions ? 'Comprobando…' : 'Revisar permisos del token'}</button>
            )}
            {!isManagedByExpert && canManage && (
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
              >
                {disconnecting ? <Loader2 size={12} className="animate-spin" /> : <Unplug size={12} />}
                Desconectar
              </button>
            )}
          </div>
        </div>

        {permissionNotice && <p role="status" className="text-sm text-emerald-700">{permissionNotice}</p>}
        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        {isManagedByExpert && (
          <div className="rounded-xl border border-[#d8cbb5] bg-[#faf8f2] px-4 py-3 text-xs leading-5 text-[#6b7280]">
            Esta conexión está gestionada por EXPERT y usa Holded API {integration.api_version ?? 'v2'}.
            Para cambiar la credencial o desconectarla, solicita la gestión a tu asesor.
          </div>
        )}

        <div className="flex flex-wrap gap-3 text-xs"><Link className="text-[#c88b25] underline" href="/docs/conectar-holded-kia-token-api-v2">Crear token</Link><Link className="text-[#c88b25] underline" href="/docs/permisos-holded-kia-lectura-escritura">Permisos necesarios</Link><Link className="text-[#c88b25] underline" href="/docs/actualizar-permisos-token-holded-kia">Modificar permisos</Link></div>
        {!isManagedByExpert && canManage && (
          <div className="rounded-xl border border-[#e8dfc8] bg-white p-4">
            <button type="button" onClick={() => setReplacingToken(v => !v)} className="text-sm font-semibold text-[#29384a] underline">
              {replacingToken ? 'Cancelar sustitución' : 'Sustituir token de esta empresa'}
            </button>
            {replacingToken && (
              <div className="mt-4">
                <p className="mb-3 text-xs text-[#7a6e5f]">Genera un token nuevo en la misma empresa de Holded y utiliza solo este formulario cifrado. La credencial anterior se conservará si falla la verificación.</p>
                <HoldedApiKeyForm companyId={companyId} onPhaseChange={setPhase}
                  onConnected={(newIntegration) => {
                    setIntegration(newIntegration as unknown as Integration);
                    setReplacingToken(false);
                    router.refresh();
                  }} />
              </div>
            )}
          </div>
        )}
        {/* Permissions */}
        <div className="rounded-2xl border border-[#e8dfc8] bg-[#faf9f6] p-5">
          <HoldedPermissionStatus permissions={integration.permissions_enabled ?? integration.permissions_detected} />
          {!isManagedByExpert && canManage && companyId && (
            <div className="mt-4 space-y-2 border-t border-[#e8dfc8] pt-4">
              <p className="text-sm font-semibold text-[#29384a]">Permisos de lectura autorizados para KIA</p>
              <p className="text-xs text-[#7a6e5f]">Solo puedes activar permisos ya disponibles en el token de esta empresa.</p>
              {HOLDED_READ_PERMISSION_KEYS.map(key => (
                <label key={key} className="flex items-center justify-between gap-4 text-xs text-[#29384a]">
                  <span>{key}</span>
                  <input type="checkbox" checked={integration.permissions_enabled?.[key] === true}
                    disabled={savingScope || integration.permissions_detected?.[key] !== true}
                    onChange={event => void changeReadPermission(key, event.target.checked)}
                    aria-label={`Permitir ${key}`} />
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Sync mode note */}
        <p className="text-xs text-[#a89880]">
          Modo de sincronización: <span className="font-medium">{integration.sync_mode === 'read_write' ? 'Lectura y escritura' : 'Solo lectura'}</span>.
          EXPERT solo lee tus datos — nunca modifica tu contabilidad sin confirmación explícita.
        </p>
      </div>
    );
  }

  // ── Read-only member state ────────────────────────────────────────────────
  if (!canManage) {
    return (
      <div className="space-y-6">
        <KiaGuidanceCard
          state={guidance.state}
          title={guidance.title}
          message={guidance.message}
          compact
          animateOnChange
        />

        {integration && !isActive && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            {integration.status === 'failed' ? (
              <XCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
            ) : (
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
            )}
            <div className="text-sm">
              <p className="font-medium text-[#3d3528]">{STATUS_LABELS[integration.status] ?? integration.status}</p>
              {integration.last_error && (
                <p className="mt-0.5 text-[#7a6e5f]">{integration.last_error}</p>
              )}
            </div>
          </div>
        )}

        <div className="rounded-xl border border-[#d8cbb5] bg-[#faf8f2] px-4 py-3 text-sm leading-6 text-[#6b7280]">
          Puedes consultar el estado de la integración, pero solo un propietario o administrador de la empresa puede conectar, reconectar o desconectar Holded.
        </div>

        <button
          type="button"
          onClick={() => router.refresh()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#e8dfc8] bg-white px-3 py-2 text-xs font-medium text-[#7a6e5f] hover:border-[#c88b25] hover:text-[#c88b25]"
        >
          <RefreshCw size={12} />
          Actualizar estado
        </button>
      </div>
    );
  }

  // ── Managed but non-active state ─────────────────────────────────────────
  if (integration && isManagedByExpert) {
    return (
      <div className="space-y-6">
        <KiaGuidanceCard
          state={guidance.state}
          title={guidance.title}
          message={guidance.message}
          compact
          animateOnChange
        />

        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          {integration.status === 'failed' ? (
            <XCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
          ) : (
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
          )}
          <div className="text-sm">
            <p className="font-medium text-[#3d3528]">{STATUS_LABELS[integration.status] ?? integration.status}</p>
            {integration.last_error && (
              <p className="mt-0.5 text-[#7a6e5f]">{integration.last_error}</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-[#d8cbb5] bg-[#faf8f2] px-4 py-3 text-sm leading-6 text-[#6b7280]">
          Esta conexión está gestionada por EXPERT y usa Holded API {integration.api_version ?? 'v2'}.
          El cliente no puede sustituir la credencial ni reconectarla desde este panel. Solicita la revisión a tu asesor.
        </div>

        <button
          type="button"
          onClick={() => router.refresh()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#e8dfc8] bg-white px-3 py-2 text-xs font-medium text-[#7a6e5f] hover:border-[#c88b25] hover:text-[#c88b25]"
        >
          <RefreshCw size={12} />
          Actualizar estado
        </button>
      </div>
    );
  }

  // ── Non-active self-managed state (show error if any + form) ──────────────
  return (
    <div className="space-y-6">
      <KiaGuidanceCard
        state={guidance.state}
        title={guidance.title}
        message={guidance.message}
        compact
        animateOnChange
      />

      {integration && !isActive && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          {integration.status === 'failed' ? (
            <XCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
          ) : (
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
          )}
          <div className="text-sm">
            <p className="font-medium text-[#3d3528]">{STATUS_LABELS[integration.status] ?? integration.status}</p>
            {integration.last_error && (
              <p className="mt-0.5 text-[#7a6e5f]">{integration.last_error}</p>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {/* Guide */}
      <div className="rounded-2xl border border-[#e8dfc8] bg-[#faf9f6] p-5">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-[#c88b25]">
          Cómo obtener tu API key
        </p>
        <HoldedConnectionGuide />
      </div>

      {/* Form */}
      <div className="rounded-2xl border border-[#e8dfc8] bg-white p-5">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-[#c88b25]">
          Conectar Holded
        </p>
        <HoldedApiKeyForm
          companyId={companyId}
          onPhaseChange={setPhase}
          onConnected={(newIntegration) => {
            setPhase('verified');
            setIntegration(newIntegration as unknown as Integration);
            router.refresh();
          }}
        />
      </div>
    </div>
  );
}
