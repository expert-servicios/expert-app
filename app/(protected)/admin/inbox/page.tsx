'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  CircleDot,
  ExternalLink,
  Inbox,
  Mail,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  UserRound,
} from 'lucide-react';

type Channel = 'email' | 'telegram' | 'web' | 'kia' | 'meta' | 'google' | 'linkedin';
type Status = 'needs_action' | 'kia_working' | 'resolved';

type InboxItem = {
  id: string;
  source: string;
  channel: Channel;
  direction: 'in' | 'out' | 'mixed';
  externalId: string | null;
  threadId: string | null;
  leadId: string | null;
  clientId: string | null;
  companyId: string | null;
  caseId: string | null;
  actor: { name: string | null; email: string | null; phone: string | null };
  subject: string;
  preview: string;
  status: Status;
  priority: 'high' | 'normal' | 'low';
  kiaState: string | null;
  identity: 'lead' | 'client' | 'unknown';
  lastActivityAt: string;
  sourceHref: string;
  taskCount: number;
  nextMeetingAt: string | null;
  ownerId: string | null;
  ownerName: string | null;
  slaDueAt: string | null;
  controlMode: 'kia' | 'manual' | null;
  metadata: Record<string, unknown>;
};


type TimelineItem = {
  id: string;
  kind: 'message' | 'audit';
  role: string;
  text: string;
  intent: string | null;
  createdAt: string;
  metadata: Record<string, unknown>;
};

type Payload = {
  generatedAt: string;
  summary: {
    total: number;
    needs_action: number;
    kia_working: number;
    resolved: number;
    byChannel: Record<string, number>;
  };
  items: InboxItem[];
  warnings: string[];
  contract: {
    mode: string;
    sources: string[];
    enrichments: string[];
    persistentEnvelope: string;
  };
};

const CHANNEL_LABELS: Record<Channel, string> = {
  email: 'Email',
  telegram: 'Telegram',
  web: 'Web',
  kia: 'KIA',
  meta: 'Meta',
  google: 'Google',
  linkedin: 'LinkedIn',
};

const STATUS_LABELS: Record<Status, string> = {
  needs_action: 'Necesita acción',
  kia_working: 'KIA trabajando',
  resolved: 'Resuelto',
};

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
}

function statusTone(status: Status) {
  if (status === 'needs_action') return 'border-amber-200 bg-amber-50 text-amber-800';
  if (status === 'kia_working') return 'border-sky-200 bg-sky-50 text-sky-800';
  return 'border-emerald-200 bg-emerald-50 text-emerald-800';
}

function channelIcon(channel: Channel) {
  if (channel === 'email') return Mail;
  if (channel === 'telegram') return Send;
  if (channel === 'kia') return Bot;
  return MessageCircle;
}

export default function AdminOperations360InboxPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [channel, setChannel] = useState('all');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [manualReply, setManualReply] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (channel !== 'all') params.set('channel', channel);
      if (status !== 'all') params.set('status', status);
      params.set('limit', '160');

      const response = await fetch(`/api/admin/inbox?${params.toString()}`, { cache: 'no-store' });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'No se pudo cargar Operations 360 Inbox');
      setData(json);
      setSelectedId((current) => {
        if (current && json.items.some((item: InboxItem) => item.id === current)) return current;
        return json.items[0]?.id ?? null;
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [channel, q, status]);

  useEffect(() => {
    const timeout = setTimeout(() => void load(), 180);
    return () => clearTimeout(timeout);
  }, [load]);

  const selected = useMemo(
    () => data?.items.find((item) => item.id === selectedId) ?? null,
    [data, selectedId],
  );

  const loadTimeline = useCallback(async () => {
    if (!selected) {
      setTimeline([]);
      return;
    }
    setTimelineLoading(true);
    try {
      if (selected.source === 'kia_conversations' && selected.threadId) {
        const response = await fetch(`/api/admin/inbox/timeline?conversationId=${encodeURIComponent(selected.threadId)}`, { cache: 'no-store' });
        const json = await response.json();
        if (!response.ok) throw new Error(json.error ?? 'No se pudo cargar el timeline');
        setTimeline(json.timeline ?? []);
        return;
      }
      if (selected.source === 'email_inbox_cache' && selected.threadId) {
        const provider = typeof selected.metadata.provider === 'string' ? selected.metadata.provider : 'gmail';
        const response = await fetch(`/api/admin/correo?action=conversation&provider=${encodeURIComponent(provider)}&conversationId=${encodeURIComponent(selected.threadId)}`, { cache: 'no-store' });
        const json = await response.json();
        if (!response.ok) throw new Error(json.error ?? 'No se pudo cargar el hilo');
        setTimeline((json.messages ?? []).map((message: Record<string, unknown>) => ({
          id: `email:${String(message.id ?? crypto.randomUUID())}`,
          kind: 'message' as const,
          role: String(message.fromEmail ?? '') === selected.actor.email ? 'user' : 'professional',
          text: String(message.body ?? ''),
          intent: null,
          createdAt: String(message.date ?? selected.lastActivityAt),
          metadata: {},
        })));
        return;
      }
      setTimeline([]);
    } catch (timelineError) {
      setTimeline([{
        id: 'timeline-error',
        kind: 'audit',
        role: 'system',
        text: timelineError instanceof Error ? timelineError.message : 'No se pudo cargar el timeline',
        intent: null,
        createdAt: new Date().toISOString(),
        metadata: {},
      }]);
    } finally {
      setTimelineLoading(false);
    }
  }, [selected]);

  useEffect(() => {
    void loadTimeline();
  }, [loadTimeline]);

  const escalateSelected = useCallback(async () => {
    if (!selected || actionBusy) return;
    setActionBusy(true);
    setActionMessage('');
    try {
      const response = await fetch('/api/admin/inbox/escalate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: selected.id }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'No se pudo escalar la entrada');
      setActionMessage('Tarea creada o reutilizada correctamente.');
      await load();
    } catch (actionError) {
      setActionMessage(actionError instanceof Error ? actionError.message : 'No se pudo escalar la entrada');
    } finally {
      setActionBusy(false);
    }
  }, [actionBusy, load, selected]);


  const changeControlMode = useCallback(async (mode: 'kia' | 'manual') => {
    if (!selected?.threadId || selected.source !== 'kia_conversations' || actionBusy) return;
    setActionBusy(true);
    setActionMessage('');
    try {
      const response = await fetch('/api/admin/inbox/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: selected.threadId, mode }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'No se pudo cambiar el control');
      setActionMessage(mode === 'manual' ? 'Control manual activado.' : 'Conversación devuelta a KIA.');
      await Promise.all([load(), loadTimeline()]);
    } catch (controlError) {
      setActionMessage(controlError instanceof Error ? controlError.message : 'No se pudo cambiar el control');
    } finally {
      setActionBusy(false);
    }
  }, [actionBusy, load, loadTimeline, selected]);

  const sendManualTelegramReply = useCallback(async () => {
    if (!selected?.threadId || selected.channel !== 'telegram' || !manualReply.trim() || actionBusy) return;
    setActionBusy(true);
    setActionMessage('');
    try {
      const response = await fetch('/api/admin/inbox/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: selected.threadId, text: manualReply.trim() }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'No se pudo enviar la respuesta');
      setManualReply('');
      setActionMessage('Respuesta Telegram enviada y auditada.');
      await Promise.all([load(), loadTimeline()]);
    } catch (replyError) {
      setActionMessage(replyError instanceof Error ? replyError.message : 'No se pudo enviar la respuesta');
    } finally {
      setActionBusy(false);
    }
  }, [actionBusy, load, loadTimeline, manualReply, selected]);

  const stats = data?.summary ?? { total: 0, needs_action: 0, kia_working: 0, resolved: 0, byChannel: {} };

  return (
    <main className="min-h-screen bg-[#f8f4eb] px-3 py-4 text-[#07111d] sm:px-5 lg:px-6">
      <div className="mx-auto max-w-[1500px] space-y-4">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c88b25]">KIA · Operations 360</p>
            <h1 className="mt-1 font-serif text-2xl font-bold sm:text-3xl">Inbox unificado</h1>
            <p className="mt-1 max-w-3xl text-xs text-[#5f6d7a] sm:text-sm">
              Email, Telegram, formularios y conversaciones KIA en una sola bandeja operativa.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-xl border border-[#d8cbb5] bg-white px-3 py-2 text-xs font-bold"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </header>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        {data?.warnings.length ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            <AlertTriangle className="mr-1 inline h-4 w-4" />
            Lectura parcial: {data.warnings.join(' · ')}
          </div>
        ) : null}

        <section className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {[
            ['all', 'Total', stats.total],
            ['needs_action', 'Necesita acción', stats.needs_action],
            ['kia_working', 'KIA trabajando', stats.kia_working],
            ['resolved', 'Resuelto', stats.resolved],
          ].map(([key, label, count]) => (
            <button
              key={String(key)}
              type="button"
              onClick={() => setStatus(key === 'all' ? 'all' : String(key))}
              className={`rounded-xl border px-3 py-2.5 text-left transition ${status === key ? 'border-[#c88b25] bg-[#fffaf0]' : 'border-[#ded2bf] bg-white'}`}
            >
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#73695d]">{label}</p>
              <p className="mt-0.5 font-serif text-2xl font-bold">{count}</p>
            </button>
          ))}
        </section>

        <section className="grid min-h-[68vh] overflow-hidden rounded-2xl border border-[#d8cbb5] bg-white lg:grid-cols-[390px_minmax(0,1fr)]">
          <div className="border-b border-[#e8dfd2] lg:border-b-0 lg:border-r">
            <div className="space-y-2 border-b border-[#eee6da] p-3">
              <label className="relative block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b8175]" />
                <input
                  value={q}
                  onChange={(event) => setQ(event.target.value)}
                  placeholder="Buscar nombre, email, teléfono, empresa, expediente…"
                  className="w-full rounded-xl border border-[#ddd1bf] bg-[#fffdf8] py-2 pl-9 pr-3 text-xs outline-none focus:border-[#c88b25]"
                />
              </label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {['all', 'email', 'telegram', 'web', 'kia', 'meta', 'google', 'linkedin'].map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setChannel(key)}
                    className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-bold ${channel === key ? 'border-[#c88b25] bg-[#fff7e8] text-[#8a6111]' : 'border-[#e2d8c9] bg-white text-[#687480]'}`}
                  >
                    {key === 'all' ? 'Todos' : CHANNEL_LABELS[key as Channel]}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-[58vh] overflow-y-auto lg:max-h-[calc(100vh-320px)]">
              {loading && !data ? (
                <div className="p-8 text-center text-xs text-[#74808c]">
                  <RefreshCw className="mx-auto mb-2 h-4 w-4 animate-spin" />
                  Cargando…
                </div>
              ) : data?.items.length ? data.items.map((item) => {
                const Icon = channelIcon(item.channel);
                const active = selectedId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full border-b border-[#f0e8dc] p-3 text-left transition ${active ? 'bg-[#fff8e9]' : 'hover:bg-[#fffdf8]'}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#07111d]/5">
                        <Icon className="h-4 w-4 text-[#8a6111]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-xs font-bold">{item.actor.name || item.actor.email || 'Contacto sin identificar'}</p>
                          {item.priority === 'high' && <CircleDot className="h-3 w-3 shrink-0 text-amber-600" />}
                        </div>
                        <p className="mt-0.5 truncate text-xs font-semibold text-[#374554]">{item.subject}</p>
                        <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[#71808e]">{item.preview}</p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${statusTone(item.status)}`}>
                            {STATUS_LABELS[item.status]}
                          </span>
                          <span className="text-[9px] text-[#9a8f81]">{formatWhen(item.lastActivityAt)}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              }) : (
                <div className="p-8 text-center text-xs text-[#74808c]">
                  <Inbox className="mx-auto mb-2 h-5 w-5" />
                  No hay entradas con estos filtros.
                </div>
              )}
            </div>
          </div>

          <div className="min-w-0">
            {selected ? (
              <div className="flex h-full flex-col">
                <div className="border-b border-[#eee6da] p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-[#decda9] bg-[#fff8e8] px-2 py-1 text-[10px] font-bold text-[#8a6111]">
                          {CHANNEL_LABELS[selected.channel]}
                        </span>
                        <span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${statusTone(selected.status)}`}>
                          {STATUS_LABELS[selected.status]}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">
                          {selected.identity === 'client' ? 'Cliente' : selected.identity === 'lead' ? 'Lead' : 'Sin identificar'}
                        </span>
                      </div>
                      <h2 className="mt-3 font-serif text-2xl font-bold">{selected.subject}</h2>
                      <p className="mt-1 text-sm text-[#5f6d7a]">{selected.actor.name || 'Contacto'}</p>
                    </div>
                    <Link
                      href={selected.sourceHref}
                      className="inline-flex items-center gap-1 rounded-xl bg-[#07111d] px-3 py-2 text-xs font-bold text-white"
                    >
                      Abrir origen <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>

                <div className="grid flex-1 gap-4 overflow-y-auto p-4 sm:p-5 xl:grid-cols-[minmax(0,1fr)_300px]">
                  <div className="space-y-4">
                    <section className="rounded-2xl border border-[#e2d7c7] bg-[#fffdf8] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a6111]">Timeline</p>
                        <button type="button" onClick={() => void loadTimeline()} className="text-[10px] font-bold text-[#8a6111]">Actualizar hilo</button>
                      </div>
                      {timelineLoading ? (
                        <p className="mt-3 text-xs text-[#71808e]">Cargando conversación…</p>
                      ) : timeline.length ? (
                        <div className="mt-3 space-y-3">
                          {timeline.map((entry) => (
                            <div key={entry.id} className={`rounded-xl border p-3 ${entry.kind === 'audit' ? 'border-slate-200 bg-slate-50' : entry.role === 'user' ? 'border-[#ead9b8] bg-white' : 'border-sky-100 bg-sky-50/40'}`}>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wide text-[#6b7280]">
                                  {entry.kind === 'audit' ? 'Audit' : entry.role === 'user' ? 'Cliente' : entry.role === 'assistant' ? 'KIA' : 'Profesional'}
                                </span>
                                <span className="text-[9px] text-[#9a8f81]">{formatWhen(entry.createdAt)}</span>
                              </div>
                              <p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-[#29384a]">{entry.text}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 text-xs text-[#71808e]">Sin timeline persistido para esta entrada.</p>
                      )}
                    </section>

                    <section className="rounded-2xl border border-[#dfe5eb] bg-white p-4">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-[#8a6111]" />
                        <h3 className="font-semibold">Estado KIA</h3>
                      </div>
                      <p className="mt-2 text-sm text-[#526171]">
                        {selected.status === 'needs_action'
                          ? 'La entrada requiere intervención humana o revisión antes de continuar.'
                          : selected.status === 'kia_working'
                            ? 'KIA mantiene la conversación activa y no hay escalación humana registrada.'
                            : 'La entrada no tiene acción inmediata pendiente.'}
                      </p>
                      {selected.kiaState && <p className="mt-2 text-xs text-[#8a8177]">Estado técnico: {selected.kiaState}</p>}
                      {selected.controlMode && (
                        <p className="mt-2 text-xs font-semibold text-[#526171]">
                          Control: {selected.controlMode === 'manual' ? 'Humano' : 'KIA'}
                        </p>
                      )}
                    </section>

                    <section className="rounded-2xl border border-[#e2d7c7] bg-white p-4">
                      <h3 className="font-semibold">Acciones</h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selected.source === 'kia_conversations' && selected.controlMode !== 'manual' && (
                          <button
                            type="button"
                            onClick={() => void changeControlMode('manual')}
                            disabled={actionBusy}
                            className="rounded-xl border border-[#d8cbb5] px-3 py-2 text-xs font-bold disabled:opacity-50"
                          >
                            Tomar yo
                          </button>
                        )}
                        {selected.source === 'kia_conversations' && selected.controlMode === 'manual' && (
                          <button
                            type="button"
                            onClick={() => void changeControlMode('kia')}
                            disabled={actionBusy}
                            className="rounded-xl border border-[#d8cbb5] px-3 py-2 text-xs font-bold disabled:opacity-50"
                          >
                            Dejar a KIA
                          </button>
                        )}
                        {selected.source === 'email_inbox_cache' && (
                          <Link href={selected.sourceHref} className="rounded-xl border border-[#d8cbb5] px-3 py-2 text-xs font-bold">
                            Responder en Correo 360
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => void escalateSelected()}
                          disabled={actionBusy}
                          className="rounded-xl bg-[#07111d] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                        >
                          {actionBusy ? 'Escalando…' : 'Escalar a mí'}
                        </button>
                        {selected.clientId && (
                          <Link href={`/admin/clientes/${selected.clientId}/operaciones`} className="rounded-xl border border-[#d8cbb5] px-3 py-2 text-xs font-bold">
                            Abrir cliente 360
                          </Link>
                        )}
                        {selected.leadId && (
                          <Link href={`/admin/leads?focus=${selected.leadId}`} className="rounded-xl border border-[#d8cbb5] px-3 py-2 text-xs font-bold">
                            Abrir lead
                          </Link>
                        )}
                        {selected.caseId && (
                          <Link href={`/admin/expedientes/${selected.caseId}`} className="rounded-xl border border-[#d8cbb5] px-3 py-2 text-xs font-bold">
                            Abrir expediente
                          </Link>
                        )}
                      </div>
                      {selected.channel === 'telegram' && selected.controlMode === 'manual' && (
                        <div className="mt-3 space-y-2">
                          <textarea
                            value={manualReply}
                            onChange={(event) => setManualReply(event.target.value)}
                            rows={3}
                            maxLength={4000}
                            placeholder="Respuesta manual a Telegram…"
                            className="w-full rounded-xl border border-[#d8cbb5] p-3 text-sm outline-none focus:border-[#c88b25]"
                          />
                          <button
                            type="button"
                            onClick={() => void sendManualTelegramReply()}
                            disabled={actionBusy || !manualReply.trim()}
                            className="rounded-xl bg-[#07111d] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                          >
                            Enviar por Telegram
                          </button>
                        </div>
                      )}
                      {actionMessage && <p className="mt-3 text-xs text-[#526171]">{actionMessage}</p>}
                    </section>
                  </div>

                  <aside className="space-y-3">
                    <section className="rounded-2xl border border-[#e2d7c7] bg-[#fbf8f2] p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a6111]">Identidad y contexto</p>
                      <dl className="mt-3 space-y-2 text-xs">
                        <div><dt className="text-[#8a8177]">Email</dt><dd className="break-all font-semibold">{selected.actor.email || '—'}</dd></div>
                        <div><dt className="text-[#8a8177]">Teléfono</dt><dd className="font-semibold">{selected.actor.phone || '—'}</dd></div>
                        <div><dt className="text-[#8a8177]">Lead</dt><dd className="break-all font-mono text-[10px]">{selected.leadId || '—'}</dd></div>
                        <div><dt className="text-[#8a8177]">Cliente</dt><dd className="break-all font-mono text-[10px]">{selected.clientId || '—'}</dd></div>
                        <div><dt className="text-[#8a8177]">Empresa</dt><dd className="break-all font-mono text-[10px]">{selected.companyId || '—'}</dd></div>
                        <div><dt className="text-[#8a8177]">Expediente</dt><dd className="break-all font-mono text-[10px]">{selected.caseId || '—'}</dd></div>
                      </dl>
                    </section>

                    <section className="rounded-2xl border border-[#e2d7c7] bg-white p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a6111]">Siguiente trabajo</p>
                      <div className="mt-3 space-y-2 text-xs">
                        <p><span className="font-bold">{selected.taskCount}</span> tarea(s) abiertas asociadas.</p>
                        <p>Owner: <span className="font-semibold">{selected.ownerName || selected.ownerId || 'Sin asignar'}</span></p>
                        <p>SLA: <span className="font-semibold">{selected.slaDueAt ? formatWhen(selected.slaDueAt) : 'Sin vencimiento'}</span></p>
                        <p>
                          {selected.nextMeetingAt
                            ? `Próxima reunión: ${formatWhen(selected.nextMeetingAt)}`
                            : 'Sin próxima reunión asociada.'}
                        </p>
                      </div>
                    </section>

                    <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900">
                      <CheckCircle2 className="mr-1 inline h-4 w-4" />
                      Read-model: no duplica emails, conversaciones ni leads.
                    </section>
                  </aside>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[55vh] items-center justify-center p-8 text-center text-sm text-[#74808c]">
                <div>
                  <UserRound className="mx-auto mb-3 h-7 w-7" />
                  Selecciona una entrada para revisar su contexto.
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
