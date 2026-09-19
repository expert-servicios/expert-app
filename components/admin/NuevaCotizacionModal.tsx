'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Search, FileText, Euro, Calendar, Plus, Check, Loader2, BookMarked } from 'lucide-react';

interface Client {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
}

interface ClientCompany {
  id: string;
  name: string | null;
  razon_social: string | null;
  nif: string | null;
}

interface QuoteService {
  slug: string;
  name: string;
  category: string;
  unitAmountCents: number;
  minQuantity: number;
  maxQuantity: number;
  quantityLabel: string;
}

interface QuoteLineDraft {
  serviceSlug: string;
  quantity: number;
}

interface QuoteTemplate {
  id: string;
  name: string;
  title: string;
  description: string;
  amount_eur: number | null;
  expires_in_days: number;
  docs_checklist: string[];
}

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

const DOCS_SUGERIDOS = [
  'DNI/NIE vigente',
  'Pasaporte vigente',
  'Contrato de trabajo',
  'Nóminas últimos 3 meses',
  'Declaración de la renta',
  'Certificado de empadronamiento',
  'Vida laboral',
  'Extracto bancario',
];

export function NuevaCotizacionModal({ onClose, onCreated }: Props) {
  // Client selector state
  const [query, setQuery]           = useState('');
  const [clients, setClients]       = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [billingScope, setBillingScope] = useState<'profile' | 'company'>('profile');
  const [companies, setCompanies] = useState<ClientCompany[]>([]);
  const [companyId, setCompanyId] = useState('');
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Template state
  const [templates, setTemplates]         = useState<QuoteTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState<string | null>(null);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName]   = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Structured catalog quote state
  const [quoteMode, setQuoteMode] = useState<'catalog' | 'manual'>('catalog');
  const [quoteServices, setQuoteServices] = useState<QuoteService[]>([]);
  const [loadingQuoteServices, setLoadingQuoteServices] = useState(false);
  const [selectedServiceSlug, setSelectedServiceSlug] = useState('');
  const [quoteItems, setQuoteItems] = useState<QuoteLineDraft[]>([]);

  // Form state
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount]         = useState('');
  const [expiresInDays, setExpiresInDays] = useState('14');
  const [docs, setDocs]             = useState<string[]>([]);
  const [customDoc, setCustomDoc]   = useState('');

  // Submit state
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // Fetch clients on query change (debounced)
  const fetchClients = useCallback(async (q: string) => {
    setLoadingClients(true);
    try {
      const res = await fetch(`/api/admin/clients-quick?q=${encodeURIComponent(q)}`);
      if (res.ok) { const d = await res.json(); setClients(d.clients ?? []); }
    } finally { setLoadingClients(false); }
  }, []);

  const fetchTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetch('/api/admin/quote-templates');
      if (res.ok) { const d = await res.json(); setTemplates(d.templates ?? []); }
    } finally { setLoadingTemplates(false); }
  }, []);

  useEffect(() => {
    fetchClients(''); // eslint-disable-line react-hooks/set-state-in-effect
  }, [fetchClients]);

  useEffect(() => {
    void fetchTemplates(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [fetchTemplates]);

  useEffect(() => {
    setLoadingQuoteServices(true);
    void fetch('/api/admin/quote-services', { cache: 'no-store' })
      .then(async (res) => res.ok ? await res.json() as { services?: QuoteService[] } : { services: [] })
      .then((data) => setQuoteServices(data.services ?? []))
      .finally(() => setLoadingQuoteServices(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchClients(query), 200);
    return () => clearTimeout(t);
  }, [query, fetchClients]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        searchRef.current && !searchRef.current.contains(e.target as Node)
      ) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setQuery(client.name ?? client.email);
    setShowDropdown(false);
    setBillingScope('profile');
    setCompanyId('');
    setCompanies([]);
    setLoadingCompanies(true);
    void fetch(`/api/admin/clientes/${client.id}`, { cache: 'no-store' })
      .then(async (res) => res.ok ? await res.json() as { companies?: ClientCompany[] } : { companies: [] })
      .then((data) => setCompanies(data.companies ?? []))
      .finally(() => setLoadingCompanies(false));
  };

  const handleClearClient = () => {
    setSelectedClient(null);
    setQuery('');
    setClients([]);
    setBillingScope('profile');
    setCompanyId('');
    setCompanies([]);
    fetchClients('');
    setTimeout(() => searchRef.current?.focus(), 50);
  };

  const addQuoteItem = () => {
    const service = quoteServices.find((item) => item.slug === selectedServiceSlug);
    if (!service || quoteItems.some((item) => item.serviceSlug === service.slug)) return;
    const nextItems = [...quoteItems, { serviceSlug: service.slug, quantity: service.minQuantity }];
    setQuoteItems(nextItems);
    setSelectedServiceSlug('');
    if (!title.trim()) {
      setTitle(nextItems
        .map((item) => quoteServices.find((serviceItem) => serviceItem.slug === item.serviceSlug)?.name)
        .filter(Boolean)
        .join(' + '));
    }
    if (!description.trim()) {
      setDescription('Servicios profesionales EXPERT según el desglose de líneas de este presupuesto.');
    }
  };

  const updateQuoteItemQuantity = (serviceSlug: string, quantity: number) => {
    setQuoteItems((prev) => prev.map((item) =>
      item.serviceSlug === serviceSlug ? { ...item, quantity } : item
    ));
  };

  const removeQuoteItem = (serviceSlug: string) => {
    setQuoteItems((prev) => prev.filter((item) => item.serviceSlug !== serviceSlug));
  };

  const structuredTotalCents = quoteItems.reduce((total, item) => {
    const service = quoteServices.find((candidate) => candidate.slug === item.serviceSlug);
    return total + (service?.unitAmountCents ?? 0) * item.quantity;
  }, 0);

  const toggleDoc = (doc: string) => {
    setDocs((prev) => prev.includes(doc) ? prev.filter((d) => d !== doc) : [...prev, doc]);
  };

  const addCustomDoc = () => {
    const d = customDoc.trim();
    if (d && !docs.includes(d)) { setDocs((prev) => [...prev, d]); }
    setCustomDoc('');
  };

  const applyTemplate = (tpl: QuoteTemplate) => {
    setTitle(tpl.title);
    setDescription(tpl.description);
    if (tpl.amount_eur != null) setAmount(String(tpl.amount_eur));
    setExpiresInDays(String(tpl.expires_in_days));
    setDocs(tpl.docs_checklist);
  };

  const deleteTemplate = async (id: string) => {
    setDeletingTemplate(id);
    try {
      await fetch(`/api/admin/quote-templates/${id}`, { method: 'DELETE' });
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } finally {
      setDeletingTemplate(null);
    }
  };

  const saveAsTemplate = async () => {
    if (!templateName.trim() || !title.trim() || !description.trim()) return;
    setSavingTemplate(true);
    try {
      const res = await fetch('/api/admin/quote-templates', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({
          name           : templateName.trim(),
          title          : title.trim(),
          description    : description.trim(),
          amount_eur     : amount ? parseFloat(amount) : null,
          expires_in_days: parseInt(expiresInDays, 10),
          docs_checklist : docs,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        setTemplates((prev) => [d.template, ...prev]);
        setTemplateName('');
        setShowSaveTemplate(false);
      }
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedClient) { setError('Selecciona un cliente.'); return; }
    if (!title.trim())   { setError('El título es obligatorio.'); return; }
    if (!description.trim()) { setError('La descripción es obligatoria.'); return; }
    if (billingScope === 'company' && !companyId) { setError('Selecciona la entidad que recibirá la factura.'); return; }
    if (quoteMode === 'catalog' && quoteItems.length === 0) { setError('Añade al menos un servicio del catálogo.'); return; }
    if (quoteMode === 'manual' && (!amount || parseFloat(amount) <= 0)) { setError('El importe debe ser mayor que 0.'); return; }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientEmail:    selectedClient.email,
          billingScope,
          companyId:      billingScope === 'company' ? companyId : undefined,
          title:          title.trim(),
          description:    description.trim(),
          ...(quoteMode === 'catalog'
            ? { items: quoteItems }
            : { amountEur: parseFloat(amount) }),
          expiresInDays:  parseInt(expiresInDays, 10),
          docsChecklist:  docs,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Error al crear el presupuesto.'); return; }
      onCreated();
    } finally { setSaving(false); }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl max-h-[92dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f0e9d8] px-5 py-4 shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#c88b25]" />
            <p className="font-semibold text-[#07111d]">Nueva cotización</p>
          </div>
          <button type="button" onClick={onClose} title="Cerrar" className="rounded-lg p-1.5 text-[#29384a] hover:bg-[#f0e9d8]">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* ── Templates ── */}
          {(templates.length > 0 || loadingTemplates) && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#07111d]">
                Plantillas
              </label>
              {loadingTemplates ? (
                <div className="flex items-center gap-2 text-xs text-[#9ca3af]">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Cargando…
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {templates.map((tpl) => (
                    <div
                      key={tpl.id}
                      className="flex items-center rounded-full border border-[#d8cbb5] bg-[#f8f4eb] text-xs"
                    >
                      <button
                        type="button"
                        onClick={() => applyTemplate(tpl)}
                        className="rounded-l-full py-1 pl-3 pr-2 font-semibold text-[#29384a] transition hover:text-[#c88b25]"
                      >
                        {tpl.name}
                      </button>
                      <button
                        type="button"
                        onClick={() => { void deleteTemplate(tpl.id); }}
                        disabled={deletingTemplate === tpl.id}
                        title={`Eliminar "${tpl.name}"`}
                        className="rounded-r-full py-1 pl-1 pr-2.5 text-[#d8cbb5] transition hover:text-red-500 disabled:opacity-40"
                      >
                        {deletingTemplate === tpl.id
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : <X className="h-3 w-3" />
                        }
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Client selector ── */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#07111d]">
              Cliente *
            </label>
            {selectedClient ? (
              <div className="flex items-center gap-3 rounded-xl border border-[#D4A017] bg-[#D4A017]/5 px-4 py-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#D4A017]/15 text-xs font-bold text-[#c88b25]">
                  {(selectedClient.name ?? selectedClient.email)[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#07111d]">{selectedClient.name ?? selectedClient.email}</p>
                  <p className="truncate text-xs text-[#29384a]/60">{selectedClient.email}</p>
                </div>
                <button type="button" onClick={handleClearClient} title="Quitar cliente seleccionado" className="shrink-0 text-[#9ca3af] hover:text-[#29384a]">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Buscar por nombre o email…"
                  className="w-full rounded-xl border border-[#d8cbb5] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#c88b25]"
                />
                {showDropdown && (
                  <div
                    ref={dropdownRef}
                    className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-xl border border-[#d8cbb5] bg-white shadow-lg"
                  >
                    {loadingClients ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-4 w-4 animate-spin text-[#d7a33a]" />
                      </div>
                    ) : clients.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-[#9ca3af]">Sin resultados</p>
                    ) : (
                      clients.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onMouseDown={() => handleSelectClient(c)}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-[#f8f4eb]"
                        >
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f0e9d8] text-xs font-semibold text-[#c88b25]">
                            {(c.name ?? c.email)[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[#07111d]">{c.name ?? <span className="text-[#9ca3af]">Sin nombre</span>}</p>
                            <p className="truncate text-xs text-[#29384a]/60">{c.email}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {selectedClient && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#07111d]">
                Destinatario de factura *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setBillingScope('profile'); setCompanyId(''); }}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                    billingScope === 'profile'
                      ? 'border-[#D4A017] bg-[#D4A017]/10 text-[#07111d]'
                      : 'border-[#d8cbb5] text-[#29384a] hover:border-[#c88b25]'
                  }`}
                >
                  Persona / autónomo
                </button>
                <button
                  type="button"
                  onClick={() => setBillingScope('company')}
                  disabled={loadingCompanies || companies.length === 0}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                    billingScope === 'company'
                      ? 'border-[#D4A017] bg-[#D4A017]/10 text-[#07111d]'
                      : 'border-[#d8cbb5] text-[#29384a] hover:border-[#c88b25]'
                  } disabled:cursor-not-allowed disabled:opacity-45`}
                >
                  Sociedad / entidad
                </button>
              </div>
              {billingScope === 'company' && (
                <select
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#d8cbb5] px-4 py-2.5 text-sm outline-none focus:border-[#c88b25]"
                  aria-label="Entidad destinataria de la factura"
                >
                  <option value="">Selecciona entidad</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.razon_social ?? company.name ?? 'Entidad'}{company.nif ? ` · ${company.nif}` : ''}
                    </option>
                  ))}
                </select>
              )}
              {!loadingCompanies && companies.length === 0 && (
                <p className="mt-1.5 text-xs text-[#8a9aab]">
                  Este cliente no tiene sociedades vinculadas. El presupuesto puede emitirse a su perfil personal.
                </p>
              )}
            </div>
          )}

          {/* ── Quote mode / structured lines ── */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#07111d]">
              Tipo de presupuesto
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setQuoteMode('catalog')}
                className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                  quoteMode === 'catalog'
                    ? 'border-[#D4A017] bg-[#D4A017]/10 text-[#07111d]'
                    : 'border-[#d8cbb5] text-[#29384a] hover:border-[#c88b25]'
                }`}
              >
                Desde catálogo
              </button>
              <button
                type="button"
                onClick={() => setQuoteMode('manual')}
                className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                  quoteMode === 'manual'
                    ? 'border-[#D4A017] bg-[#D4A017]/10 text-[#07111d]'
                    : 'border-[#d8cbb5] text-[#29384a] hover:border-[#c88b25]'
                }`}
              >
                Importe libre
              </button>
            </div>
          </div>

          {quoteMode === 'catalog' && (
            <div className="space-y-3 rounded-2xl border border-[#e6dcc9] bg-[#fbf8f2] p-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#07111d]">
                  Servicios y cantidades
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedServiceSlug}
                    onChange={(e) => setSelectedServiceSlug(e.target.value)}
                    disabled={loadingQuoteServices}
                    className="min-w-0 flex-1 rounded-xl border border-[#d8cbb5] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#c88b25]"
                    aria-label="Servicio del catálogo"
                  >
                    <option value="">{loadingQuoteServices ? 'Cargando servicios…' : 'Selecciona servicio'}</option>
                    {quoteServices
                      .filter((service) => !quoteItems.some((item) => item.serviceSlug === service.slug))
                      .map((service) => (
                        <option key={service.slug} value={service.slug}>
                          {service.name} · {(service.unitAmountCents / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    onClick={addQuoteItem}
                    disabled={!selectedServiceSlug}
                    className="flex items-center gap-1 rounded-xl border border-[#d8cbb5] bg-white px-3 py-2.5 text-sm font-semibold text-[#29384a] hover:border-[#c88b25] disabled:opacity-40"
                  >
                    <Plus className="h-3.5 w-3.5" /> Añadir
                  </button>
                </div>
              </div>

              {quoteItems.length > 0 && (
                <div className="space-y-2">
                  {quoteItems.map((item) => {
                    const service = quoteServices.find((candidate) => candidate.slug === item.serviceSlug);
                    if (!service) return null;
                    return (
                      <div key={item.serviceSlug} className="rounded-xl border border-[#e2d6c2] bg-white p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#07111d]">{service.name}</p>
                            <p className="mt-0.5 text-xs text-[#6b7280]">
                              {(service.unitAmountCents / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })} + IVA / {service.quantityLabel}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeQuoteItem(item.serviceSlug)}
                            title={`Quitar ${service.name}`}
                            className="text-[#9ca3af] hover:text-red-500"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <label className="text-xs font-semibold text-[#29384a]">
                            Cantidad ({service.minQuantity === service.maxQuantity
                              ? 'fija'
                              : `${service.minQuantity}–${service.maxQuantity}`})
                          </label>
                          <input
                            type="number"
                            min={service.minQuantity}
                            max={service.maxQuantity}
                            step="1"
                            value={item.quantity}
                            disabled={service.minQuantity === service.maxQuantity}
                            onChange={(e) => updateQuoteItemQuantity(item.serviceSlug, Number(e.target.value))}
                            className="w-24 rounded-lg border border-[#d8cbb5] px-2 py-1.5 text-right text-sm outline-none focus:border-[#c88b25] disabled:bg-[#f3f4f6]"
                          />
                        </div>
                        <p className="mt-2 text-right text-sm font-bold text-[#07111d]">
                          {((service.unitAmountCents * item.quantity) / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })} + IVA
                        </p>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between border-t border-[#e2d6c2] pt-3">
                    <span className="text-sm font-semibold text-[#29384a]">Base imponible</span>
                    <span className="text-lg font-bold text-[#07111d]">
                      {(structuredTotalCents / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </span>
                  </div>
                  <p className="text-xs text-[#8a9aab]">
                    El precio y la cantidad se validan de nuevo en servidor antes de generar Stripe.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Title ── */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#07111d]">
              Título / Servicio *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Autorización de residencia por arraigo social"
              className="w-full rounded-xl border border-[#d8cbb5] px-4 py-2.5 text-sm outline-none focus:border-[#c88b25]"
            />
          </div>

          {/* ── Description ── */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#07111d]">
              Descripción *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalla el alcance del servicio, gestiones incluidas, plazo estimado…"
              rows={3}
              className="w-full resize-none rounded-xl border border-[#d8cbb5] px-4 py-2.5 text-sm outline-none focus:border-[#c88b25]"
            />
          </div>

          {/* ── Amount + Expires ── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#07111d]">
                {quoteMode === 'catalog' ? 'Base calculada (€)' : 'Importe (€) *'}
              </label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={quoteMode === 'catalog' ? (structuredTotalCents / 100).toFixed(2) : amount}
                  onChange={(e) => setAmount(e.target.value)}
                  readOnly={quoteMode === 'catalog'}
                  placeholder="450.00"
                  className="w-full rounded-xl border border-[#d8cbb5] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#c88b25] read-only:bg-[#f3f4f6]"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#07111d]">
                Vence en (días)
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
                <select
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(e.target.value)}
                  title="Días de validez del presupuesto"
                  className="w-full rounded-xl border border-[#d8cbb5] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#c88b25]"
                >
                  {[7, 14, 21, 30, 45, 60, 90].map((d) => (
                    <option key={d} value={d}>{d} días</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ── Docs checklist ── */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#07111d]">
              Documentos a aportar <span className="font-normal text-[#9ca3af]">(opcional)</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {DOCS_SUGERIDOS.map((doc) => (
                <button
                  key={doc}
                  type="button"
                  onClick={() => toggleDoc(doc)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    docs.includes(doc)
                      ? 'border-[#D4A017] bg-[#D4A017]/10 text-[#c88b25]'
                      : 'border-[#d8cbb5] text-[#29384a] hover:border-[#c88b25]'
                  }`}
                >
                  {docs.includes(doc) && <Check className="h-3 w-3" />}
                  {doc}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customDoc}
                onChange={(e) => setCustomDoc(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomDoc(); } }}
                placeholder="Añadir otro documento…"
                className="flex-1 rounded-xl border border-[#d8cbb5] px-3 py-2 text-sm outline-none focus:border-[#c88b25]"
              />
              <button type="button" onClick={addCustomDoc} disabled={!customDoc.trim()}
                className="flex items-center gap-1 rounded-xl border border-[#d8cbb5] px-3 py-2 text-sm text-[#29384a] hover:border-[#c88b25] disabled:opacity-40">
                <Plus className="h-3.5 w-3.5" /> Añadir
              </button>
            </div>
            {docs.length > 0 && (
              <ul className="mt-2 space-y-1">
                {docs.map((d) => (
                  <li key={d} className="flex items-center gap-2 text-xs text-[#07111d]">
                    <Check className="h-3 w-3 shrink-0 text-[#D4A017]" /> {d}
                    <button type="button" onClick={() => setDocs((prev) => prev.filter((x) => x !== d))}
                      title={`Eliminar: ${d}`}
                      className="ml-auto text-[#9ca3af] hover:text-red-500">
                      <X className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ── Save as template ── */}
          {(title.trim().length > 0 || description.trim().length > 0) && (
            <div>
              {!showSaveTemplate ? (
                <button
                  type="button"
                  onClick={() => setShowSaveTemplate(true)}
                  className="flex items-center gap-1.5 text-xs text-[#9ca3af] transition hover:text-[#c88b25]"
                >
                  <BookMarked className="h-3.5 w-3.5" />
                  Guardar como plantilla
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <BookMarked className="h-3.5 w-3.5 shrink-0 text-[#c88b25]" />
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); void saveAsTemplate(); }
                      if (e.key === 'Escape') { setShowSaveTemplate(false); setTemplateName(''); }
                    }}
                    placeholder="Nombre de la plantilla…"
                    autoFocus
                    className="flex-1 rounded-lg border border-[#d8cbb5] px-3 py-1.5 text-xs outline-none focus:border-[#c88b25]"
                  />
                  <button
                    type="button"
                    onClick={() => { void saveAsTemplate(); }}
                    disabled={!templateName.trim() || savingTemplate}
                    className="flex items-center gap-1 rounded-lg bg-[#07111d] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                  >
                    {savingTemplate ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowSaveTemplate(false); setTemplateName(''); }}
                    className="rounded-lg border border-[#d8cbb5] px-3 py-1.5 text-xs text-[#29384a] hover:bg-[#f0e9d8]"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          )}

          {error && <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#f0e9d8] px-5 py-4 shrink-0">
          <p className="text-xs text-[#9ca3af]">Se envía email con enlace de pago al cliente.</p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose}
              className="rounded-xl border border-[#d8cbb5] px-4 py-2 text-sm font-semibold text-[#29384a] hover:bg-[#f0e9d8]">
              Cancelar
            </button>
            <button type="button" onClick={handleSubmit} disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-[#07111d] px-5 py-2 text-sm font-bold text-white hover:bg-[#1a2a3a] disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              {saving ? 'Creando…' : 'Crear y enviar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
