'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, FileText, Loader2, MessageCircle, Mic, Paperclip, Send, Square, X } from 'lucide-react';
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

type PublicAttachment = {
  fileName: string;
  mimeType: string;
  analysis: string;
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
const PUBLIC_CHAT_TIMEOUT_MS = 45_000;
const REGULATORY_QUERY_RE = /\b(aeat|hacienda|impuesto|iva|irpf|renta|modelo\s*\d+|seguridad social|tgss|inss|reta|aut[oó]nom|extranjer[ií]a|nacionalidad|dgt|tr[aá]fico|registro|boe|normativa|ley|plazo|requisito|verifactu)\b/i;

type ThinkingStage = 'verifying' | 'searching' | 'composing' | 'slow';

const THINKING_COPY: Record<ThinkingStage, { eyebrow: string; detail: string }> = {
  verifying: {
    eyebrow: 'Conexión segura',
    detail: 'Estoy verificando la sesión antes de consultar.',
  },
  searching: {
    eyebrow: 'Consultando',
    detail: 'Estoy revisando contexto, guías y fuentes oficiales cuando procede.',
  },
  composing: {
    eyebrow: 'Contrastando',
    detail: 'Estoy ordenando la información para darte una respuesta clara.',
  },
  slow: {
    eyebrow: 'Sigo trabajando',
    detail: 'Las consultas con fuentes oficiales pueden tardar un poco más.',
  },
};

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
  const [thinkingStage, setThinkingStage] = useState<ThinkingStage>('verifying');
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [voiceRecording, setVoiceRecording] = useState(false);
  const [voiceTranscribing, setVoiceTranscribing] = useState(false);
  const [attachmentLoading, setAttachmentLoading] = useState(false);
  const [attachment, setAttachment] = useState<PublicAttachment | null>(null);
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const voiceChunksRef = useRef<BlobPart[]>([]);
  const voiceTimeoutRef = useRef<number | null>(null);
  const discardRecordingRef = useRef(false);

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

  useEffect(() => {
    return () => {
      if (voiceTimeoutRef.current) window.clearTimeout(voiceTimeoutRef.current);
      discardRecordingRef.current = true;
      voiceChunksRef.current = [];
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== 'inactive') recorder.stop();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const history = useMemo(
    () => messages.filter((message) => message.id !== 'welcome').slice(-6).map(({ role, text }) => ({ role, text })),
    [messages],
  );

  const sendMessage = useCallback(async (message: string) => {
    const clean = message.trim();
    if (!clean || loading) return;

    setInput('');
    setLoading(true);
    setThinkingStage('verifying');
    setQuickReplies([]);
    setArtifacts([]);
    setActionCta(null);
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'user', text: clean }]);

    const timers: number[] = [];
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), PUBLIC_CHAT_TIMEOUT_MS);

    try {
      const recaptchaToken = await getRecaptchaToken('kia_public_chat');
      if (!recaptchaToken) {
        throw new Error('recaptcha_unavailable');
      }

      setThinkingStage('searching');
      const isRegulatory = REGULATORY_QUERY_RE.test(clean);
      timers.push(window.setTimeout(() => setThinkingStage('composing'), isRegulatory ? 5_500 : 3_500));
      timers.push(window.setTimeout(() => setThinkingStage('slow'), isRegulatory ? 12_000 : 9_000));

      const response = await fetch('/api/ai/kia/public', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: clean,
          currentPage: window.location.pathname,
          history,
          attachment: attachment ?? undefined,
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
      setAttachment(null);
    } catch (error) {
      const reason = error instanceof Error ? error.message : '';
      const text = reason === 'recaptcha_unavailable'
        ? 'No he podido completar la verificación segura del chat. Recarga la página o abre KIA en Telegram.'
        : error instanceof DOMException && error.name === 'AbortError'
          ? 'La respuesta está tardando demasiado. Puedes intentarlo de nuevo o continuar ahora mismo en Telegram.'
          : 'Ahora mismo no puedo conectar con el motor de KIA. Puedes abrir KIA en Telegram o volver a intentarlo en unos minutos.';

      setMessages((current) => [...current, {
        id: crypto.randomUUID(),
        role: 'assistant',
        text,
      }]);
    } finally {
      clearTimeout(timeout);
      timers.forEach((timer) => clearTimeout(timer));
      setLoading(false);
    }
  }, [attachment, history, loading]);

  const transcribeRecordedAudio = useCallback(async (blob: Blob) => {
    if (!blob.size) return;
    setVoiceTranscribing(true);
    try {
      const recaptchaToken = await getRecaptchaToken('kia_public_voice');
      if (!recaptchaToken) throw new Error('verification_failed');

      const form = new FormData();
      const extension = blob.type.includes('ogg') ? 'ogg' : blob.type.includes('mp4') ? 'm4a' : 'webm';
      form.set('audio', new File([blob], `kia-voice.${extension}`, { type: blob.type || 'audio/webm' }));
      form.set('recaptchaToken', recaptchaToken);

      const response = await fetch('/api/ai/kia/public/voice', { method: 'POST', body: form });
      const data = await response.json().catch(() => ({})) as { transcript?: string; error?: string };
      if (!response.ok || !data.transcript?.trim()) throw new Error(data.error ?? 'transcription_failed');

      setInput((current) => current.trim()
        ? `${current.trim()} ${data.transcript!.trim()}`
        : data.transcript!.trim());
    } catch {
      setMessages((current) => [...current, {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: 'No he podido transcribir la nota de voz. Puedes escribirla o intentarlo de nuevo.',
      }]);
    } finally {
      setVoiceTranscribing(false);
    }
  }, []);

  const cleanupVoiceRecording = useCallback(({ discard = false }: { discard?: boolean } = {}) => {
    if (voiceTimeoutRef.current) {
      window.clearTimeout(voiceTimeoutRef.current);
      voiceTimeoutRef.current = null;
    }
    if (discard) {
      discardRecordingRef.current = true;
      voiceChunksRef.current = [];
    }
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    if (!recorder || recorder.state === 'inactive') {
      mediaRecorderRef.current = null;
      setVoiceRecording(false);
    }
  }, []);

  const handleVoiceToggle = useCallback(async () => {
    if (voiceRecording) {
      cleanupVoiceRecording();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setMessages((current) => [...current, {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: 'Este navegador no permite grabar voz.',
      }]);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const preferredTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
      const mimeType = preferredTypes.find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      voiceChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) voiceChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const shouldDiscard = discardRecordingRef.current;
        discardRecordingRef.current = false;
        const blob = new Blob(voiceChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        voiceChunksRef.current = [];
        mediaRecorderRef.current = null;
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        setVoiceRecording(false);
        if (!shouldDiscard) void transcribeRecordedAudio(blob);
      };
      recorder.start(500);
      mediaRecorderRef.current = recorder;
      setVoiceRecording(true);
      voiceTimeoutRef.current = window.setTimeout(() => cleanupVoiceRecording(), 90_000);
    } catch {
      cleanupVoiceRecording({ discard: true });
      setMessages((current) => [...current, {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: 'No tengo acceso al micrófono. Autorízalo en el navegador o escribe el mensaje.',
      }]);
    }
  }, [cleanupVoiceRecording, transcribeRecordedAudio, voiceRecording]);

  const handleAttachment = useCallback(async (file: File | undefined) => {
    if (!file) return;
    setAttachmentLoading(true);
    try {
      const recaptchaToken = await getRecaptchaToken('kia_public_attachment');
      if (!recaptchaToken) throw new Error('verification_failed');

      const form = new FormData();
      form.set('file', file);
      form.set('recaptchaToken', recaptchaToken);

      const response = await fetch('/api/ai/kia/public/attachment', { method: 'POST', body: form });
      const data = await response.json().catch(() => ({})) as {
        fileName?: string;
        mimeType?: string;
        analysis?: string;
        error?: string;
      };
      if (!response.ok || !data.analysis || !data.fileName || !data.mimeType) {
        throw new Error(data.error ?? 'attachment_failed');
      }
      setAttachment({
        fileName: data.fileName,
        mimeType: data.mimeType,
        analysis: data.analysis,
      });
      if (!input.trim()) setInput('Analiza este documento y dime qué debo hacer.');
    } catch (error) {
      const reason = error instanceof Error ? error.message : '';
      const text = reason.includes('attachment_type_invalid')
        ? 'Este tipo de archivo todavía no está admitido aquí. Puedes usar PDF, JPG/PNG/WEBP, TXT o CSV.'
        : reason.includes('attachment_size')
          ? 'El archivo es demasiado grande. El límite actual del chat público es 8 MB.'
          : 'No he podido analizar el archivo. Puedes intentarlo de nuevo o subirlo desde tu área EXPERT.';
      setMessages((current) => [...current, {
        id: crypto.randomUUID(),
        role: 'assistant',
        text,
      }]);
    } finally {
      setAttachmentLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [input]);

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
            <div
              role="status"
              aria-live="polite"
              className="overflow-hidden rounded-2xl border border-[#D4A017]/25 bg-[linear-gradient(135deg,#fbfaf7_0%,#f5f1eb_100%)] shadow-sm"
            >
              <div className="flex items-start gap-3 px-3.5 py-3">
                <div className="relative mt-0.5">
                  <KiaAvatar state="pensando" size="md" animateOnChange />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#f5f1eb] bg-[#D4A017] animate-pulse" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#A47B0B]">
                      {THINKING_COPY[thinkingStage].eyebrow}
                    </p>
                    <span className="flex items-center gap-1" aria-hidden="true">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#D4A017] animate-bounce [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-[#D4A017] animate-bounce [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-[#D4A017] animate-bounce" />
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-semibold leading-5 text-[#0D1B2A]">
                    KIA está pensando
                  </p>
                  <p className="mt-0.5 text-xs leading-5 text-[#6f6559]">
                    {THINKING_COPY[thinkingStage].detail}
                  </p>
                </div>
              </div>
              <div className="h-0.5 overflow-hidden bg-[#D4A017]/10">
                <div className="h-full w-1/2 bg-[#D4A017]/70 animate-pulse" />
              </div>
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
          {attachment ? (
            <div className="mb-2 flex items-center gap-2 rounded-xl border border-[#D4A017]/30 bg-[#D4A017]/5 px-3 py-2">
              <FileText size={15} className="shrink-0 text-[#A47B0B]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-[#0D1B2A]">{attachment.fileName}</p>
                <p className="text-[10px] text-[#7a6e5f]">Analizado temporalmente · no guardado en EXPERT</p>
              </div>
              <button
                type="button"
                onClick={() => setAttachment(null)}
                aria-label="Quitar adjunto"
                className="rounded-md p-1 text-[#7a6e5f] hover:bg-white"
              >
                <X size={13} />
              </button>
            </div>
          ) : null}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.csv,image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(event) => void handleAttachment(event.target.files?.[0])}
          />
          <div className="flex items-end gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || attachmentLoading}
              aria-label="Adjuntar documento"
              title="Adjuntar PDF, imagen, TXT o CSV"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#e8e0d4] bg-white text-[#0D1B2A] transition hover:border-[#D4A017] disabled:opacity-40 sm:h-9 sm:w-9"
            >
              {attachmentLoading ? <Loader2 size={15} className="animate-spin" /> : <Paperclip size={15} />}
            </button>
            <button
              type="button"
              onClick={() => void handleVoiceToggle()}
              disabled={loading || voiceTranscribing || attachmentLoading}
              aria-label={voiceRecording ? 'Detener grabación' : 'Grabar nota de voz'}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition disabled:opacity-40 sm:h-9 sm:w-9 ${voiceRecording ? 'border-red-300 bg-red-50 text-red-700' : 'border-[#e8e0d4] bg-white text-[#0D1B2A] hover:border-[#D4A017]'}`}
            >
              {voiceTranscribing
                ? <Loader2 size={15} className="animate-spin" />
                : voiceRecording
                  ? <Square size={14} />
                  : <Mic size={15} />}
            </button>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage(input);
                }
              }}
              rows={attachment ? 2 : 1}
              maxLength={2000}
              placeholder="Escribe…"
              aria-label="Consulta para KIA"
              disabled={loading || voiceTranscribing || attachmentLoading}
              className="max-h-24 min-h-11 min-w-0 flex-1 resize-none overflow-y-auto rounded-xl border border-[#e8e0d4] px-3 py-2.5 text-sm leading-5 outline-none focus:border-[#D4A017] disabled:bg-[#f8f6f1] disabled:text-[#8a8177] sm:min-h-9 sm:py-2"
            />
            <button
              type="button"
              onClick={() => void sendMessage(input)}
              disabled={loading || !input.trim()}
              aria-label="Enviar a KIA"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0D1B2A] text-white disabled:opacity-40 sm:h-9 sm:w-9"
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
