'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, Server, Plus, Trash2 } from 'lucide-react';

type Provider = {
  id: string;
  name: string;
  purpose: string;
  role: 'encargado' | 'responsable' | 'por-revisar';
  location: string;
  internationalTransfer: boolean;
  dpaReviewed: boolean;
  notes: string;
};

const PRESETS: Provider[] = [
  { id: 'google', name: 'Google Workspace / Google Cloud', purpose: 'Correo, calendario, reuniones, almacenamiento o infraestructura', role: 'por-revisar', location: 'UE/EEE y otras regiones según servicio', internationalTransfer: true, dpaReviewed: false, notes: '' },
  { id: 'microsoft', name: 'Microsoft 365', purpose: 'Correo, calendario, reuniones y productividad', role: 'por-revisar', location: 'UE/EEE y otras regiones según servicio', internationalTransfer: true, dpaReviewed: false, notes: '' },
  { id: 'stripe', name: 'Stripe', purpose: 'Pagos y prevención de fraude', role: 'por-revisar', location: 'Internacional', internationalTransfer: true, dpaReviewed: false, notes: 'El rol puede variar según la operación.' },
  { id: 'supabase', name: 'Supabase', purpose: 'Base de datos, autenticación y almacenamiento', role: 'encargado', location: 'Según región de proyecto y subencargados', internationalTransfer: false, dpaReviewed: false, notes: '' },
  { id: 'vercel', name: 'Vercel', purpose: 'Alojamiento y despliegue web', role: 'encargado', location: 'Internacional', internationalTransfer: true, dpaReviewed: false, notes: '' },
  { id: 'resend', name: 'Resend', purpose: 'Correo transaccional', role: 'encargado', location: 'Internacional', internationalTransfer: true, dpaReviewed: false, notes: '' },
  { id: 'holded', name: 'Holded', purpose: 'Facturación, contabilidad, CRM o laboral', role: 'por-revisar', location: 'UE/EEE', internationalTransfer: false, dpaReviewed: false, notes: '' },
  { id: 'openai', name: 'OpenAI', purpose: 'Funciones de IA', role: 'encargado', location: 'Internacional', internationalTransfer: true, dpaReviewed: false, notes: 'Revisar configuración empresarial, retención y subencargados.' },
  { id: 'anthropic', name: 'Anthropic', purpose: 'Funciones de IA', role: 'encargado', location: 'Internacional', internationalTransfer: true, dpaReviewed: false, notes: 'Revisar configuración empresarial, retención y subencargados.' },
];

const STORAGE_KEY = 'expert-rgpd-provider-inventory-v1';

function downloadMarkdown(providers: Provider[]) {
  const lines = [
    '# Inventario de proveedores y encargados — borrador',
    '',
    'Documento generado por la herramienta EXPERT. Debe revisarse antes de considerarlo documentación de cumplimiento.',
    '',
    '| Proveedor | Finalidad | Rol | Ubicación | Transferencia internacional | DPA revisado | Notas |',
    '|---|---|---|---|---|---|---|',
    ...providers.map((p) => [
      p.name,
      p.purpose,
      p.role,
      p.location,
      p.internationalTransfer ? 'Sí' : 'No / revisar',
      p.dpaReviewed ? 'Sí' : 'Pendiente',
      p.notes || '',
    ].map((v) => String(v).replaceAll('|', '/')).join(' | ')).map((row) => '| ' + row + ' |'),
    '',
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'proveedores-rgpd-borrador.md';
  a.click();
  URL.revokeObjectURL(url);
}

export function RgpdProviderInventory() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [custom, setCustom] = useState<Provider[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setSelectedIds(parsed.selectedIds ?? []);
        setCustom(parsed.custom ?? []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ selectedIds, custom }));
    } catch {}
  }, [selectedIds, custom]);

  const providers = useMemo(() => [
    ...PRESETS.filter((p) => selectedIds.includes(p.id)),
    ...custom,
  ], [selectedIds, custom]);

  const toggle = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const addCustom = () => {
    setCustom((prev) => [...prev, {
      id: 'custom-provider-' + Date.now(),
      name: 'Nuevo proveedor',
      purpose: '',
      role: 'por-revisar',
      location: '',
      internationalTransfer: false,
      dpaReviewed: false,
      notes: '',
    }]);
  };

  const updateCustom = (id: string, field: keyof Provider, value: Provider[keyof Provider]) => {
    setCustom((prev) => prev.map((p) => p.id === id ? { ...p, [field]: value } : p));
  };

  return (
    <section className="mt-8 border border-[#D4A017]/25 bg-white p-5 md:p-6">
      <div className="flex items-start gap-3">
        <Server className="mt-1 h-6 w-6 shrink-0 text-[#D4A017]" />
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#D4A017]">Fase 4 · Proveedores y transferencias</p>
          <h3 className="mt-1 font-serif text-2xl font-bold">Inventario de encargados y terceros</h3>
          <p className="mt-2 text-sm leading-6 text-[#23364D]">
            Selecciona los proveedores que utilizas y documenta qué debes revisar: rol, ubicación, transferencias y DPA.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {PRESETS.map((p) => {
          const active = selectedIds.includes(p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle(p.id)}
              className={'border px-4 py-3 text-left text-sm transition ' + (active ? 'border-[#D4A017] bg-[#D4A017]/10' : 'border-[#D4A017]/20')}
            >
              <span className="font-semibold">{active ? '✓ ' : ''}{p.name}</span>
              <span className="mt-1 block text-xs text-[#6B7280]">{p.purpose}</span>
            </button>
          );
        })}
      </div>

      {providers.length > 0 && (
        <div className="mt-6 space-y-3">
          {providers.map((p) => (
            <div key={p.id} className="border border-[#D4A017]/20 bg-[#F8F6F1] p-4 text-sm">
              <div className="font-bold">{p.name}</div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 text-[#23364D]">
                <p><strong>Rol:</strong> {p.role}</p>
                <p><strong>Ubicación:</strong> {p.location || 'pendiente'}</p>
                <p><strong>Transferencia:</strong> {p.internationalTransfer ? 'sí / revisar garantías' : 'no detectada / revisar'}</p>
                <p><strong>DPA:</strong> {p.dpaReviewed ? 'revisado' : 'pendiente'}</p>
              </div>
              {p.notes && <p className="mt-2 text-xs text-[#6B7280]">{p.notes}</p>}
            </div>
          ))}
        </div>
      )}

      <div className="mt-7 border-t border-[#D4A017]/20 pt-5">
        <div className="flex items-center justify-between gap-3">
          <h4 className="font-bold">Añadir proveedor no incluido</h4>
          <button type="button" onClick={addCustom} className="inline-flex min-h-10 items-center gap-2 border border-[#D4A017]/30 px-3 text-sm font-semibold">
            <Plus className="h-4 w-4" /> Añadir
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {custom.map((p) => (
            <div key={p.id} className="border border-[#D4A017]/20 p-4">
              <div className="flex gap-3">
                <input
                  value={p.name}
                  onChange={(e) => updateCustom(p.id, 'name', e.target.value)}
                  className="min-h-10 flex-1 border border-[#D4A017]/25 px-3 font-semibold"
                />
                <button type="button" onClick={() => setCustom((prev) => prev.filter((x) => x.id !== p.id))} aria-label="Eliminar proveedor">
                  <Trash2 className="h-5 w-5 text-[#6B7280]" />
                </button>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <input value={p.purpose} onChange={(e) => updateCustom(p.id, 'purpose', e.target.value)} placeholder="Finalidad" className="min-h-10 border border-[#D4A017]/25 px-3" />
                <input value={p.location} onChange={(e) => updateCustom(p.id, 'location', e.target.value)} placeholder="Ubicación / región" className="min-h-10 border border-[#D4A017]/25 px-3" />
                <select value={p.role} onChange={(e) => updateCustom(p.id, 'role', e.target.value as Provider['role'])} className="min-h-10 border border-[#D4A017]/25 px-3">
                  <option value="por-revisar">Rol por revisar</option>
                  <option value="encargado">Encargado</option>
                  <option value="responsable">Responsable independiente</option>
                </select>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={p.internationalTransfer} onChange={(e) => updateCustom(p.id, 'internationalTransfer', e.target.checked)} />
                  Transferencia internacional
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={p.dpaReviewed} onChange={(e) => updateCustom(p.id, 'dpaReviewed', e.target.checked)} />
                  DPA revisado
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => downloadMarkdown(providers)}
        disabled={!providers.length}
        className="mt-6 inline-flex min-h-12 items-center gap-2 bg-[#D4A017] px-5 text-sm font-bold text-[#0D1B2A] disabled:opacity-40"
      >
        <Download className="h-4 w-4" /> Descargar inventario
      </button>
    </section>
  );
}
