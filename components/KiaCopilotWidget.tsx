'use client';

/**
 * IMP-022: KIA copiloto flotante in-app.
 *
 * Botón fijo en esquina inferior derecha del portal (admin y dashboard cliente).
 * Al hacer clic abre un panel de chat sin salir de la página actual.
 * Llama a POST /api/ai/kia con el mensaje y la ruta actual.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { X, Send, Loader2, ChevronDown, ExternalLink, ThumbsUp, ThumbsDown } from 'lucide-react';
import { KiaAvatar } from '@/components/kia/KiaAvatar';
import type { KiaAvatarState } from '@/lib/ai/kia/kia-avatar-state';
import type { KiaCopilotArtifact } from '@/lib/ai/kia/kia-copilot-artifacts';
import { kiaFriendlyError } from '@/lib/ai/kia/kia-error-copy';
import { detectKiaMessageLocale } from '@/lib/ai/kia/kia-locale';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  quickReplies?: string[];
  proactiveSuggestions?: string[];
  avatarState?: KiaAvatarState;
  artifacts?: KiaCopilotArtifact[];
  decisionLogId?: string;
  sourceUserMessage?: string;
  feedback?: 'positive' | 'negative';
}

interface KiaApiResponse {
  reply: string;
  quickReplies?: string[];
  proactiveSuggestions?: string[];
  intent?: string;
  nextAction?: string;
  avatarState?: KiaAvatarState;
  artifacts?: KiaCopilotArtifact[];
  error?: string;
  decisionLogId?: string | null;
}

interface KiaContextSummary {
  firstName: string | null;
  preferredLanguage: 'es' | 'ru';
  intentHint: string | null;
  serviceSlug: string | null;
  case: {
    id: string;
    service: string;
    service_id: string | null;
    state: string;
    status: string;
    next_action: string | null;
    due_date: string | null;
    company_id: string | null;
    updated_at: string;
  } | null;
  company: { id: string; name: string | null } | null;
  originEmail?: { subject: string | null } | null;
  staffPreview?: boolean;
}

function contextualFieldForLocale(value: string | null | undefined, locale: 'es' | 'ru'): string | null {
  const text = value?.trim() ?? '';
  if (!text) return null;
  const detected = detectKiaMessageLocale(text);
  return detected && detected !== locale ? null : text;
}

function contextualWelcome(context: KiaContextSummary): ChatMessage {
  const name = context.firstName ? `, ${context.firstName}` : '';
  const hasOpenCase = Boolean(context.case);

  if (!hasOpenCase) {
    if (context.preferredLanguage === 'ru') {
      return {
        id: 'context-welcome',
        role: 'assistant',
        text: context.originEmail?.subject
          ? `👋 Здравствуйте${name}! Я открыла письмо «${context.originEmail.subject}» и могу помочь по нему или по вашей ситуации в EXPERT.`
          : `👋 Здравствуйте${name}! Чем могу помочь сегодня?`,
        quickReplies: context.originEmail?.subject
          ? ['Объясни это письмо', 'Что мне делать?', 'Проверь мою ситуацию']
          : ['Мои дела', 'Holded', 'Налоговый вопрос'],
        avatarState: 'bienvenida',
      };
    }

    return {
      id: 'context-welcome',
      role: 'assistant',
      text: context.originEmail?.subject
        ? `👋 ¡Hola${name}! He abierto el correo «${context.originEmail.subject}» y puedo ayudarte con él o con tu situación en EXPERT.`
        : `👋 ¡Hola${name}! ¿En qué te ayudo hoy?`,
      quickReplies: context.originEmail?.subject
        ? ['Explícame este correo', '¿Qué tengo que hacer?', 'Revisa mi situación']
        : ['Ver mis expedientes', 'Estado de Holded', 'Consulta fiscal'],
      avatarState: 'bienvenida',
    };
  }

  const service = contextualFieldForLocale(context.case?.service, context.preferredLanguage);
  const nextAction = contextualFieldForLocale(context.case?.next_action, context.preferredLanguage);

  if (context.preferredLanguage === 'ru') {
    return {
      id: 'context-welcome',
      role: 'assistant',
      text: [
        `👋 Здравствуйте${name}! Вижу ваш открытый кейс.`,
        service ? `Сейчас работаем по вопросу: ${service}.` : null,
        nextAction ? `Следующий шаг: ${nextAction}` : null,
        'Можете сразу задать вопрос по этому делу.',
      ].filter(Boolean).join('\n\n'),
      quickReplies: ['Что сейчас нужно сделать?', 'Какие документы нужны?', 'Проверить статус'],
      avatarState: 'seguimiento',
    };
  }

  return {
    id: 'context-welcome',
    role: 'assistant',
    text: [
      `👋 ¡Hola${name}! Veo que tienes un expediente abierto.`,
      service ? `Estamos trabajando en: ${service}.` : null,
      nextAction ? `El siguiente paso es: ${nextAction}` : null,
      'Puedes preguntarme directamente sobre este expediente.',
    ].filter(Boolean).join('\n\n'),
    quickReplies: ['¿Qué tengo que hacer ahora?', '¿Qué documentos faltan?', 'Comprobar estado'],
    avatarState: 'seguimiento',
  };
}

function welcomeMessage(returning = false): ChatMessage {
  return {
    id: 'welcome',
    role: 'assistant',
    text: returning
      ? '¡Hola de nuevo! ¿En qué te ayudo?'
      : '¡Hola! Soy KIA, tu copiloto en EXPERT. Puedo ayudarte con tus expedientes, empresas conectadas, Holded y cualquier consulta fiscal o legal. ¿En qué te ayudo?',
    quickReplies: ['Ver mis expedientes', 'Estado de Holded', 'Consulta fiscal'],
    avatarState: 'bienvenida',
  };
}

function useKiaChat(pathname: string, contextToken?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => contextToken ? [] : [welcomeMessage()]);
  const [contextSummary, setContextSummary] = useState<KiaContextSummary | null>(null);
  const [contextLoading, setContextLoading] = useState(Boolean(contextToken));
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [staffPreview, setStaffPreview] = useState(false);
  const [uiLocale, setUiLocale] = useState<'es' | 'ru'>('es');

  useEffect(() => {
    if (!contextToken) return;
    let cancelled = false;

    fetch(`/api/ai/kia/context?token=${encodeURIComponent(contextToken)}`, { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error('context_unavailable');
        return res.json() as Promise<KiaContextSummary>;
      })
      .then((context) => {
        if (!cancelled) {
          setContextSummary(context);
          setUiLocale(context.preferredLanguage);
          setContextLoading(false);
          setMessages([contextualWelcome(context)]);
          setStaffPreview(Boolean(context.staffPreview));
          setSessionId(undefined);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setContextSummary(null);
          setContextLoading(false);
          setStaffPreview(false);
          setMessages([{
            id: 'context-error',
            role: 'assistant',
            text: kiaFriendlyError('context_unavailable', 'es'),
            avatarState: 'aviso',
          }]);
        }
      });

    return () => { cancelled = true; };
  }, [contextToken]);

  useEffect(() => {
    const handleCompanyChanged = () => {
      setContextSummary(null);
      setContextLoading(false);
      setMessages([welcomeMessage(true)]);
      setStaffPreview(false);
      setSessionId(undefined);
      setLoading(false);
    };

    window.addEventListener('expert:active-company-changed', handleCompanyChanged);
    return () => window.removeEventListener('expert:active-company-changed', handleCompanyChanged);
  }, []);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || loading || contextLoading) return;

    const history = messages
      .slice(-8)
      .filter((message) => message.text.trim())
      .map((message) => ({
        role: message.role,
        text: message.text.slice(0, 1200),
      }));

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', text };
    const detectedLocale = contextSummary?.staffPreview
      ? contextSummary.preferredLanguage
      : (detectKiaMessageLocale(text) ?? contextSummary?.preferredLanguage ?? uiLocale);
    setUiLocale(detectedLocale);
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/kia', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({
          message    : text,
          sessionId,
          currentPage: pathname,
          contextToken,
          history,
        }),
      });

      const data: KiaApiResponse = await res.json();

      const assistantMsg: ChatMessage = {
        id          : crypto.randomUUID(),
        role        : 'assistant',
        text        : data.reply?.trim() || kiaFriendlyError(data.error ?? 'kia_error', detectKiaMessageLocale(text) ?? contextSummary?.preferredLanguage ?? 'es'),
        quickReplies: data.quickReplies?.length ? data.quickReplies : undefined,
        proactiveSuggestions: data.proactiveSuggestions?.length ? data.proactiveSuggestions : undefined,
        avatarState : data.avatarState ?? (data.error ? 'aviso' : 'ayuda'),
        artifacts   : data.artifacts?.length ? data.artifacts : undefined,
        decisionLogId: data.decisionLogId ?? undefined,
        sourceUserMessage: text,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      if (!sessionId && res.headers.get('x-kia-session-id')) {
        setSessionId(res.headers.get('x-kia-session-id') ?? undefined);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id  : crypto.randomUUID(),
          role: 'assistant',
          text: kiaFriendlyError('network_error', uiLocale),
          avatarState: 'aviso',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [contextLoading, contextSummary, contextToken, loading, messages, pathname, sessionId, uiLocale]);

  const rate = useCallback(async (messageId: string, rating: 'positive' | 'negative') => {
    const target = messages.find((message) => message.id === messageId);
    if (!target?.decisionLogId || !target.sourceUserMessage || target.feedback) return;

    const response = await fetch('/api/ai/kia/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decisionLogId: target.decisionLogId,
        rating,
        userMessage: target.sourceUserMessage,
      }),
    });

    if (response.ok) {
      setMessages((previous) => previous.map((message) =>
        message.id === messageId ? { ...message, feedback: rating } : message
      ));
    }
  }, [messages]);

  const reset = useCallback(() => {
    setMessages(contextSummary ? [contextualWelcome(contextSummary)] : [welcomeMessage(true)]);
    setSessionId(undefined);
  }, [contextSummary]);

  return { messages, loading, contextLoading, send, rate, reset, staffPreview, uiLocale };
}

function KiaMessageArtifacts({ artifacts }: { artifacts: KiaCopilotArtifact[] }) {
  return (
    <div className="mt-2 space-y-2">
      {artifacts.map((artifact, index) => {
        if (artifact.type === 'image') {
          return (
            <figure
              key={`${artifact.type}-${index}`}
              className="overflow-hidden rounded-xl border border-[#e8e0d4] bg-white"
            >
              <Image
                src={artifact.imageUrl}
                alt={artifact.alt}
                width={920}
                height={270}
                className="h-auto w-full"
              />
              <figcaption className="px-3 py-2 text-[11px] leading-4 text-[#7a6e5f]">
                <span className="font-semibold text-[#3d3528]">{artifact.title}</span>
                {artifact.caption ? <span className="block mt-0.5">{artifact.caption}</span> : null}
              </figcaption>
            </figure>
          );
        }

        if (artifact.type === 'table') {
          return (
            <div
              key={`${artifact.type}-${index}`}
              className="overflow-hidden rounded-xl border border-[#e8e0d4] bg-white"
            >
              <p className="border-b border-[#e8e0d4] px-2.5 py-2 text-xs font-semibold text-[#3d3528]">
                {artifact.title}
              </p>
              <div className="max-w-full overflow-x-auto">
                <table className="min-w-full text-left text-[11px] text-[#3d3528]">
                  <thead className="bg-[#faf8f4] text-[#7a6e5f]">
                    <tr>
                      {artifact.columns.map((column) => (
                        <th key={column} className="whitespace-nowrap px-2.5 py-1.5 font-medium">{column}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {artifact.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-t border-[#f0ebe3]">
                        {artifact.columns.map((column) => (
                          <td key={column} className="max-w-[160px] px-2.5 py-1.5 align-top">
                            <span className="line-clamp-2">{String(row[column] ?? '—')}</span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        }

        return (
          <a
            key={`${artifact.type}-${index}`}
            href={artifact.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`block rounded-xl border bg-white px-3 py-2 text-xs shadow-sm transition-colors hover:border-[#0D1B2A] ${
              artifact.type === 'link' && artifact.tone === 'warning'
                ? 'border-amber-300'
                : 'border-[#e8e0d4]'
            }`}
          >
            <span className="font-semibold text-[#3d3528]">{artifact.title}</span>
            {artifact.type === 'report' && artifact.period ? (
              <span className="ml-1 text-[#7a6e5f]">· {artifact.period}</span>
            ) : null}
            <span className="mt-1 flex items-center gap-1 font-medium text-[#0D1B2A]">
              {artifact.cta} <ExternalLink size={11} aria-hidden="true" />
            </span>
          </a>
        );
      })}
    </div>
  );
}

export default function KiaCopilotWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [animatedMessageIds, setAnimatedMessageIds] = useState<Set<string>>(() => new Set());
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [contextToken] = useState<string | undefined>(() => searchParams.get('ctx') ?? undefined);
  const { messages, loading, contextLoading, send, rate, reset, staffPreview, uiLocale } = useKiaChat(pathname, contextToken);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const lastAssistantMessage = [...messages].reverse().find((message) => message.role === 'assistant');
  const currentKiaState: KiaAvatarState = loading || contextLoading
    ? 'pensando'
    : (lastAssistantMessage?.avatarState ?? 'bienvenida');

  useEffect(() => {
    if (open) {
      // Keep the latest row visible before enabling any response-scoped one-shot.
      // `auto` is deliberate: the animation begins on the next frame, after the
      // scroll position is already settled, so a short 320–560 ms motion is not
      // consumed off-screen during a smooth scroll.
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages, loading, open]);

  useEffect(() => {
    if (!open || !lastAssistantMessage || animatedMessageIds.has(lastAssistantMessage.id)) return;

    const messageId = lastAssistantMessage.id;
    const frame = window.requestAnimationFrame(() => {
      setAnimatedMessageIds((previous) => {
        if (previous.has(messageId)) return previous;
        const next = new Set(previous);
        next.add(messageId);
        return next;
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [animatedMessageIds, lastAssistantMessage, open]);

  useEffect(() => {
    if (searchParams.get('kia') === 'open') {
      setOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  function handleOpen() {
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
  }

  function handleSend() {
    const text = input.trim();
    if (!text) return;
    setInput('');
    send(text);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleQuickReply(text: string) {
    send(text);
  }

  return (
    <>
      <div
        id="kia-copilot-panel"
        role="dialog"
        aria-label="KIA copiloto"
        aria-modal="false"
        aria-hidden={!open}
        className={`fixed inset-x-2 top-[max(10px,env(safe-area-inset-top))] bottom-[calc(76px+env(safe-area-inset-bottom))] z-[200] sm:inset-x-auto sm:top-auto sm:bottom-[132px] sm:right-4 sm:h-[min(560px,calc(100vh-148px))] sm:w-[380px] lg:bottom-20 ${open ? 'flex' : 'hidden'} flex-col`}
        style={{
          background    : '#fff',
          borderRadius  : '16px',
          boxShadow     : '0 8px 32px rgba(13,27,42,0.18)',
          border        : '1px solid #e8e0d4',
        }}
      >
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ background: '#0D1B2A', borderRadius: '16px 16px 0 0' }}
        >
          <div className="flex items-center gap-2">
            <KiaAvatar state={currentKiaState} size="sm" priority animateOnChange />
            <div>
              <p className="text-sm font-semibold text-white">KIA</p>
              <p className="text-xs" style={{ color: '#9ba8b4' }}>Copiloto EXPERT</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={reset}
              title="Nueva conversación"
              className="rounded-lg p-1 text-white transition-colors hover:bg-white/10"
              aria-label="Nueva conversación"
            >
              <ChevronDown size={16} aria-hidden="true" />
            </button>
            <button
              onClick={handleClose}
              className="rounded-lg p-1 text-white transition-colors hover:bg-white/10"
              aria-label="Cerrar KIA copiloto"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </div>

        {staffPreview ? (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-900">
            Modo prueba Admin · Vista cliente delegada · Solo lectura
          </div>
        ) : null}

        <div
          role="log"
          aria-live="polite"
          aria-relevant="additions text"
          className="flex-1 overflow-y-auto px-4 py-3"
          style={{ gap: '12px', display: 'flex', flexDirection: 'column' }}
        >
          {contextLoading ? (
            <div role="status" aria-label="KIA" className="flex items-start justify-start gap-2">
              <KiaAvatar state="pensando" size="xs" className="mt-0.5" />
              <div className="flex items-center gap-1 rounded-2xl bg-[#f5f1eb] px-3 py-2 text-sm text-[#7a6e5f]">
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                <span aria-hidden="true">•••</span>
              </div>
            </div>
          ) : null}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' ? (
                <KiaAvatar
                  state={msg.avatarState ?? 'ayuda'}
                  size="xs"
                  className="mt-0.5"
                  animateResponse={animatedMessageIds.has(msg.id)}
                />
              ) : null}
              <div style={{ maxWidth: msg.role === 'user' ? '85%' : '78%' }}>
                <div
                  className="rounded-2xl px-3 py-2 text-sm"
                  style={
                    msg.role === 'user'
                      ? { background: '#0D1B2A', color: '#fff', borderBottomRightRadius: '4px' }
                      : { background: '#f5f1eb', color: '#07111d', borderBottomLeftRadius: '4px' }
                  }
                >
                  {msg.text}
                </div>
                {msg.role === 'assistant' && msg.artifacts?.length ? (
                  <KiaMessageArtifacts artifacts={msg.artifacts} />
                ) : null}
                {msg.role === 'assistant' && msg.decisionLogId && !staffPreview ? (
                  <div className="mt-1.5 flex items-center gap-1 text-[#7a6e5f]">
                    <button
                      type="button"
                      onClick={() => rate(msg.id, 'positive')}
                      disabled={Boolean(msg.feedback)}
                      aria-label="Esta respuesta fue útil"
                      className={`rounded-md p-1 transition-colors hover:bg-[#f5f1eb] disabled:opacity-60 ${msg.feedback === 'positive' ? 'bg-[#f5f1eb] text-[#0D1B2A]' : ''}`}
                    >
                      <ThumbsUp size={12} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => rate(msg.id, 'negative')}
                      disabled={Boolean(msg.feedback)}
                      aria-label="Esta respuesta no fue útil"
                      className={`rounded-md p-1 transition-colors hover:bg-[#f5f1eb] disabled:opacity-60 ${msg.feedback === 'negative' ? 'bg-[#f5f1eb] text-[#0D1B2A]' : ''}`}
                    >
                      <ThumbsDown size={12} aria-hidden="true" />
                    </button>
                  </div>
                ) : null}
                {msg.role === 'assistant' && msg.quickReplies?.length ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {msg.quickReplies.map((qr) => (
                      <button
                        key={qr}
                        onClick={() => handleQuickReply(qr)}
                        className="rounded-full border px-3 py-1 text-xs transition-colors hover:bg-[#f5f1eb]"
                        style={{ borderColor: '#c8b89a', color: '#3d3528' }}
                        disabled={loading || contextLoading}
                      >
                        {qr}
                      </button>
                    ))}
                  </div>
                ) : null}
                {msg.role === 'assistant' && msg.proactiveSuggestions?.length ? (
                  <div className="mt-3 rounded-xl bg-[#faf8f4] p-2.5">
                    <p className="mb-2 text-[11px] font-semibold text-[#7a6e5f]">
                      {uiLocale === 'ru' ? 'Я также могу помочь:' : 'También puedo ayudarte con:'}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.proactiveSuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => handleQuickReply(suggestion)}
                          className="rounded-lg border border-[#e3d8c8] bg-white px-2.5 py-1.5 text-left text-xs text-[#3d3528] transition-colors hover:bg-[#f5f1eb]"
                          disabled={loading || contextLoading}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
          {loading && (
            <div
              role="status"
              aria-label={uiLocale === 'ru' ? 'KIA проверяет запрос' : 'KIA está revisando tu consulta'}
              className="flex items-start justify-start gap-2"
            >
              <KiaAvatar state="pensando" size="xs" className="mt-0.5" />
              <div
                className="flex items-center gap-1 rounded-2xl px-3 py-2 text-sm"
                style={{ background: '#f5f1eb', color: '#7a6e5f', borderBottomLeftRadius: '4px' }}
              >
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                <span>{uiLocale === 'ru' ? 'Думаю…' : 'Pensando…'}</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div
          className="flex items-end gap-2 px-3 py-3"
          style={{ borderTop: '1px solid #e8e0d4' }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={uiLocale === 'ru' ? 'Напишите ваш вопрос…' : 'Escribe tu consulta…'}
            aria-label={uiLocale === 'ru' ? 'Напишите вопрос KIA' : 'Escribe tu consulta a KIA'}
            rows={1}
            disabled={loading}
            className="flex-1 resize-none rounded-xl border px-3 py-2 text-sm outline-none transition-colors focus:border-[#0D1B2A] disabled:opacity-50"
            style={{
              borderColor: '#e8e0d4',
              maxHeight  : '96px',
              lineHeight : '1.4',
            }}
          />
          <button
            onClick={handleSend}
            disabled={loading || contextLoading || !input.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors disabled:opacity-40"
            style={{ background: '#0D1B2A', color: '#fff' }}
            aria-label="Enviar"
          >
            <Send size={15} aria-hidden="true" />
          </button>
        </div>
      </div>

      <button
        onClick={open ? handleClose : handleOpen}
        aria-label={open ? 'Cerrar KIA' : 'Abrir KIA copiloto'}
        aria-expanded={open}
        aria-controls="kia-copilot-panel"
        className={`fixed bottom-[calc(76px+env(safe-area-inset-bottom))] right-3 z-[200] sm:bottom-4 sm:right-4 ${open ? 'hidden sm:flex' : 'flex'} items-center justify-center overflow-hidden rounded-full shadow-lg transition-all hover:scale-105 active:scale-95`}
        style={{
          width     : '56px',
          height    : '56px',
          background: open ? '#3d3528' : '#fff',
          color     : '#fff',
          border    : open ? 'none' : '2px solid #0D1B2A',
        }}
      >
        {open ? (
          <X size={20} aria-hidden="true" />
        ) : (
          <KiaAvatar state={currentKiaState} size="lg" animateOnChange />
        )}
      </button>
    </>
  );
}
