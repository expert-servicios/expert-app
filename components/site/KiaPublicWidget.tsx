'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Loader2, MessageCircle, Send, X } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { KiaAvatar } from '@/components/kia/KiaAvatar';
import { getRecaptchaToken } from '@/lib/utils/recaptcha-client';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

type LinkArtifact = {
  type: 'link';
  title: string;
  url: string;
  cta: string;
};

type PublicKiaResponse = {
  reply?: string;
  quickReplies?: string[];
  intent?: string;
  nextAction?: string;
  requiresMeeting?: boolean;
  serviceSlug?: string | null;
  artifacts?: LinkArtifact[];
  error?: string;
};

const TELEGRAM_URL = 'https://t.me/kia_expert_bot';

function commercialCta(data: PublicKiaResponse): { href: string; label: string } | null {
  if (data.nextAction === 'send_login_link' || data.nextAction === 'send_profile_link') {
    return { href: '/auth/login?next=%2Fdashboard', label: 'Identificarme en EXPERT' };
  }
  if (data.nextAction === 'book_call' && data.requiresMeeting) {
    return { href: '/cita?tipo=consulta-inicial', label: 'Reservar consulta' };
  }
  if (data.nextAction === 'send_checkout_link') {
    return { href: '/auth/login?next=%2Fservicios', label: 'Continuar de forma segura' };
  }
  if (data.serviceSlug && ['run_viability', 'run_readiness'].includes(data.nextAction ?? '')) {
    return { href: `/servicios/${encodeURIComponent(data.serviceSlug)}`, label: 'Ver requisitos y servicio' };
  }
  return null;
}

export function KiaPublicWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Soy KIA, asistente de EXPERT. Puedo orientarte sobre fiscalidad, extranjería, empresa, laboral y trámites, buscar fuentes oficiales y enseñarte el siguiente paso.',
    },
  ]);
  const [quickReplies, setQuickReplies] = useState<string[]>([
    'Tengo una consulta fiscal',
    'Necesito hacer un trámite',
    'Quiero saber qué servicio necesito',
  ]);
  const [artifacts, setArtifacts] = useState<LinkArtifact[]>([]);
  const [actionCta, setActionCta] = useState<{ href: string; label: string } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return;
    const supabase = createBrowserClient(url, key);
    void supabase.auth.getSession().then(({ data }) => setLoggedIn(Boolean(data.session)));
  }, []);

  useEffect(() => {
    if (!open) return;
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, open]);

  const history = useMemo(
    () => messages.filter((message) => message.id !== 'welcome').slice(-6).map(({ role, text }) => ({ role, text })),
    [messages],
  );

  const sendMessage = useCallback(async (message: string) => {
    const clean = message.trim();
    if (!clean || loading) return;

    setInput('');
    setLoading(true);
    setQuickReplies([]);
    setArtifacts([]);
    setActionCta(null);
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'user', text: clean }]);

    try {
      const recaptchaToken = await getRecaptchaToken('kia_public_chat');
      const response = await fetch('/api/ai/kia/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: clean,
          currentPage: window.location.pathname,
          history,
          recaptchaToken,
        }),
      });
      const data = await response.json().catch(() => ({})) as PublicKiaResponse;
      const reply = data.reply?.trim()
        || 'Ahora mismo no he podido completar la respuesta. Puedes intentarlo de nuevo o abrir KIA en Telegram.';

      setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'assistant', text: reply }]);
      setQuickReplies((data.quickReplies ?? []).slice(0, 4));
      setArtifacts((data.artifacts ?? []).filter((artifact) => artifact.type === 'link').slice(0, 4));
      setActionCta(commercialCta(data));
    } catch {
      setMessages((current) => [...current, {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: 'Ahora mismo no puedo conectar con el motor de KIA. Puedes abrir KIA en Telegram o volver a intentarlo en unos minutos.',
      }]);
    } finally {
      setLoading(false);
    }
  }, [history, loading]);

  const openTelegram = useCallback(async () => {
    if (telegramLoading) return;
    if (!loggedIn) {
      window.open(TELEGRAM_URL, '_blank', 'noopener,noreferrer');
      return;
    }

    setTelegramLoading(true);
    try {
      const response = await fetch('/api/ai/kia/telegram-link', { method: 'POST' });
      const data = await response.json().catch(() => ({})) as { deepLink?: string };
      const target = response.ok && data.deepLink ? data.deepLink : TELEGRAM_URL;
      const popup = window.open(target, '_blank', 'noopener,noreferrer');
      if (!popup) window.location.href = target;
    } finally {
      setTelegramLoading(false);
    }
  }, [loggedIn, telegramLoading]);

  return (
    <>
      <div
        role="dialog"
        aria-label="Chat con KIA"
        aria-hidden={!open}
        className={`fixed inset-x-3 bottom-[calc(88px+env(safe-area-inset-bottom))] z-[210] max-h-[min(680px,calc(100vh-110px))] flex-col overflow-hidden rounded-2xl border border-[#e8e0d4] bg-white shadow-[0_16px_48px_rgba(13,27,42,0.24)] sm:left-auto sm:right-5 sm:w-[390px] ${open ? 'flex' : 'hidden'}`}
      >
        <div className="flex items-center justify-between bg-[#0D1B2A] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <KiaAvatar state="ayuda" size="sm" priority animateOnChange />
            <div>
              <p className="text-sm font-semibold text-white">KIA · EXPERT</p>
              <p className="text-xs text-white/60">Chat web · fuentes oficiales · Telegram</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar KIA"
            className="rounded-lg p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <X size={17} />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[86%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed ${message.role === 'user'
                  ? 'rounded-br-md bg-[#0D1B2A] text-white'
                  : 'rounded-bl-md bg-[#f5f1eb] text-[#0D1B2A]'}`}
              >
                {message.text}
              </div>
            </div>
          ))}

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-[#7a6e5f]">
              <KiaAvatar state="pensando" size="xs" animateOnChange />
              <Loader2 size={14} className="animate-spin" />
              <span>Consultando…</span>
            </div>
          ) : null}

          {!loading && quickReplies.length ? (
            <div className="flex flex-wrap gap-1.5">
              {quickReplies.map((reply) => (
                <button
                  key={reply}
                  type="button"
                  onClick={() => void sendMessage(reply)}
                  className="rounded-full border border-[#D4A017]/35 bg-white px-3 py-1.5 text-xs font-medium text-[#0D1B2A] transition hover:border-[#D4A017] hover:bg-[#D4A017]/5"
                >
                  {reply}
                </button>
              ))}
            </div>
          ) : null}

          {!loading && artifacts.length ? (
            <div className="space-y-1.5">
              {artifacts.map((artifact) => (
                <Link
                  key={`${artifact.url}:${artifact.title}`}
                  href={artifact.url}
                  target={artifact.url.startsWith('https://') ? '_blank' : undefined}
                  rel={artifact.url.startsWith('https://') ? 'noopener noreferrer' : undefined}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[#e8e0d4] bg-white px-3 py-2 text-xs font-semibold text-[#0D1B2A] transition hover:border-[#D4A017]"
                >
                  <span>{artifact.title}</span>
                  <ExternalLink size={13} className="shrink-0" />
                </Link>
              ))}
            </div>
          ) : null}

          {!loading && actionCta ? (
            <Link
              href={actionCta.href}
              className="flex w-full items-center justify-center rounded-xl bg-[#D4A017] px-3 py-2.5 text-sm font-semibold text-[#0D1B2A] transition hover:brightness-95"
            >
              {actionCta.label}
            </Link>
          ) : null}

          {loggedIn ? (
            <Link
              href="/dashboard?kia=open"
              className="block text-center text-xs font-medium text-[#5f5549] underline-offset-4 hover:underline"
            >
              Abrir KIA con mis expedientes y datos
            </Link>
          ) : (
            <p className="text-center text-[11px] leading-relaxed text-[#7a6e5f]">
              Para consultar expedientes, documentos o datos personales tendrás que identificarte.
            </p>
          )}
          <div ref={endRef} />
        </div>

        <div className="border-t border-[#e8e0d4] bg-white p-3">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage(input);
                }
              }}
              rows={1}
              maxLength={2000}
              placeholder="Escribe tu consulta…"
              aria-label="Consulta para KIA"
              className="max-h-24 flex-1 resize-none rounded-xl border border-[#e8e0d4] px-3 py-2 text-sm outline-none focus:border-[#D4A017]"
            />
            <button
              type="button"
              onClick={() => void sendMessage(input)}
              disabled={loading || !input.trim()}
              aria-label="Enviar a KIA"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0D1B2A] text-white disabled:opacity-40"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </div>

          <button
            type="button"
            onClick={() => void openTelegram()}
            disabled={telegramLoading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-[#229ED9]/30 bg-[#229ED9]/5 px-3 py-2 text-xs font-semibold text-[#126f99] transition hover:bg-[#229ED9]/10 disabled:opacity-50"
          >
            {telegramLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {loggedIn ? 'Abrir Telegram KIA vinculado' : 'Abrir KIA en Telegram'}
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? 'Cerrar KIA' : 'Hablar con KIA'}
        aria-expanded={open}
        className="group relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#0D1B2A] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.22)] transition hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#D4A017]/25"
      >
        {open ? <X size={20} className="text-[#0D1B2A]" /> : <KiaAvatar state="ayuda" size="lg" animateOnChange />}
        {!open ? (
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#0D1B2A] text-white shadow-sm">
            <MessageCircle size={13} />
          </span>
        ) : null}
      </button>
    </>
  );
}
