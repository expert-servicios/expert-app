'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Building2, Loader2, RefreshCw, Send, ShieldCheck } from 'lucide-react';
import { KiaAvatar } from '@/components/kia/KiaAvatar';
import type { KiaAvatarState } from '@/lib/ai/kia/kia-avatar-state';

type Company = {
  id: string;
  display_name: string;
  cif_nif: string | null;
  status: string;
  integrations?: Array<{ provider: string; status: string; last_error?: string | null }>;
};

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  quickReplies?: string[];
  avatarState?: KiaAvatarState;
};

type KiaResponse = {
  reply?: string;
  error?: string;
  quickReplies?: string[];
  proactiveSuggestions?: string[];
  avatarState?: KiaAvatarState;
};

export function AdminKiaCopilotWorkspace() {
  const searchParams = useSearchParams();
  const requestedCompanyId = searchParams.get('companyId');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyId, setCompanyId] = useState('');
  const [input, setInput] = useState('');
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [error, setError] = useState('');
  const [messages, setMessages] = useState<Message[]>([{
    id: 'welcome',
    role: 'assistant',
    text: 'Selecciona una empresa. Trabajaré únicamente con ese contexto y con las capacidades autorizadas en EXPERT.',
    avatarState: 'bienvenida',
  }]);

  async function loadCompanies() {
    setLoadingCompanies(true);
    setError('');
    try {
      const response = await fetch('/api/admin/empresas', { cache: 'no-store' });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'No se pudieron cargar las empresas');
      const rows = (json.companies ?? []) as Company[];
      setCompanies(rows);
      setCompanyId((current) => current || (requestedCompanyId && rows.some((item) => item.id === requestedCompanyId) ? requestedCompanyId : '') || rows[0]?.id || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando empresas');
    } finally {
      setLoadingCompanies(false);
    }
  }

  useEffect(() => {
    void loadCompanies();
    // requestedCompanyId intentionally selects the Company 360 context on entry.
  }, [requestedCompanyId]); // eslint-disable-line react-hooks/exhaustive-deps

  const company = useMemo(
    () => companies.find((item) => item.id === companyId) ?? null,
    [companies, companyId],
  );
  const holded = company?.integrations?.find((item) => item.provider === 'holded' && item.status === 'active') ?? null;

  function changeCompany(nextId: string) {
    setCompanyId(nextId);
    setSessionId(undefined);
    setMessages([{
      id: crypto.randomUUID(),
      role: 'assistant',
      text: 'Contexto cambiado. La conversación anterior no se reutiliza para evitar mezclar datos entre empresas.',
      avatarState: 'seguimiento',
    }]);
    setError('');
  }

  async function send(text: string) {
    const message = text.trim();
    if (!message || !companyId || sending) return;

    const history = messages.slice(-8).map((item) => ({ role: item.role, text: item.text.slice(0, 1200) }));
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'user', text: message }]);
    setInput('');
    setSending(true);
    setError('');

    try {
      const response = await fetch('/api/ai/kia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          sessionId,
          companyId,
          currentPage: '/admin/kia',
          currentTask: 'admin_operator',
          pageData: { surface: 'admin', companyName: company?.display_name ?? null, holdedConnected: Boolean(holded), pagePurpose: 'company_operator_workspace' },
          history,
        }),
      });
      const json = await response.json() as KiaResponse;
      const returnedSessionId = response.headers.get('x-kia-session-id');
      if (returnedSessionId) setSessionId(returnedSessionId);
      const reply = json.reply?.trim() || (response.ok ? 'No he recibido contenido útil. Vuelve a formular la consulta.' : 'No he podido completar esta consulta.');
      const suggestions: string[] = [];
      setMessages((current) => [...current, {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: reply,
        quickReplies: suggestions.length ? suggestions : undefined,
        avatarState: json.avatarState ?? (response.ok ? 'ayuda' : 'aviso'),
      }]);
      if (!response.ok) setError(json.error ?? 'KIA ha devuelto un error');
    } catch {
      setError('No se ha podido conectar con KIA.');
      setMessages((current) => [...current, {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: 'No he podido completar la consulta por un problema de conexión.',
        avatarState: 'aviso',
      }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid min-h-[calc(100vh-9rem)] gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="space-y-4 rounded-2xl border border-[#d8cbb5] bg-white p-5 shadow-sm">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#c88b25]">KIA · Admin</p>
          <h1 className="mt-1 font-serif text-2xl font-bold text-[#07111d]">Copiloto operativo</h1>
          <p className="mt-2 text-sm leading-6 text-[#52606d]">Contexto explícito por empresa. Modo actual: lectura y diagnóstico.</p>
        </div>

        <label className="block text-xs font-bold uppercase tracking-wide text-[#52606d]">
          Empresa
          <select
            value={companyId}
            onChange={(event) => changeCompany(event.target.value)}
            disabled={loadingCompanies || sending}
            className="mt-2 w-full rounded-xl border border-[#d8cbb5] bg-white px-3 py-3 text-sm font-normal normal-case tracking-normal text-[#07111d]"
          >
            {companies.map((item) => (
              <option key={item.id} value={item.id}>{item.display_name}{item.cif_nif ? ` · ${item.cif_nif}` : ''}</option>
            ))}
          </select>
        </label>

        {company && (
          <div className="rounded-xl bg-[#fbf8f2] p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#c88b25]" />
              <p className="text-sm font-bold text-[#07111d]">{company.display_name}</p>
            </div>
            <p className="mt-1 text-xs text-[#52606d]">{company.cif_nif ?? 'Sin CIF/NIF'}</p>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className={`rounded-full px-2 py-1 font-bold ${holded ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                Holded {holded ? 'conectado' : 'sin conexión'}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={`/admin/empresas/${company.id}`} className="text-xs font-bold text-[#07111d] underline">Company 360</Link>
              <Link href={`/admin/empresas/${company.id}/integraciones`} className="text-xs font-bold text-[#07111d] underline">Integraciones</Link>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-[#e6dfd2] p-4 text-xs leading-5 text-[#52606d]">
          <ShieldCheck className="mb-2 h-4 w-4 text-[#c88b25]" />
          KIA recibe el <strong>company_id seleccionado</strong>. Al cambiar de empresa se reinicia el contexto para evitar cruces de datos.
        </div>

        <button type="button" onClick={() => void loadCompanies()} disabled={loadingCompanies || sending} className="inline-flex items-center gap-2 text-xs font-bold text-[#52606d]">
          <RefreshCw className={`h-3.5 w-3.5 ${loadingCompanies ? 'animate-spin' : ''}`} /> Actualizar empresas
        </button>
      </aside>

      <section className="flex min-h-[620px] flex-col overflow-hidden rounded-2xl border border-[#d8cbb5] bg-white shadow-sm">
        <header className="flex items-center justify-between gap-3 border-b border-[#e8e0d4] bg-[#07111d] px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <KiaAvatar state={sending ? 'pensando' : 'ayuda'} size="sm" />
            <div>
              <p className="font-bold">KIA Copiloto</p>
              <p className="text-xs text-white/55">{company?.display_name ?? 'Selecciona una empresa'}</p>
            </div>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide">Solo lectura</span>
        </header>

        {error && <div className="border-b border-red-200 bg-red-50 px-5 py-3 text-xs text-red-700">{error}</div>}

        <div className="flex-1 space-y-4 overflow-y-auto bg-[#fcfaf6] p-5">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.role === 'assistant' && <KiaAvatar state={message.avatarState ?? 'ayuda'} size="xs" />}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'bg-[#07111d] text-white' : 'border border-[#e8e0d4] bg-white text-[#07111d]'}`}>
                <div className="whitespace-pre-wrap">{message.text}</div>
                {message.quickReplies?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.quickReplies.map((reply) => (
                      <button key={reply} type="button" onClick={() => void send(reply)} disabled={sending} className="rounded-full border border-[#d8cbb5] bg-[#fbf8f2] px-3 py-1 text-xs font-semibold text-[#29384a] disabled:opacity-50">{reply}</button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex items-center gap-2 text-xs text-[#52606d]">
              <KiaAvatar state="pensando" size="xs" />
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> KIA está revisando la empresa…
            </div>
          )}
        </div>

        <div className="border-t border-[#e8e0d4] bg-white p-4">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void send(input);
                }
              }}
              rows={2}
              disabled={!companyId || sending}
              placeholder={companyId ? 'Pregunta a KIA sobre esta empresa, Holded, expedientes, documentos o tareas…' : 'Selecciona primero una empresa'}
              className="min-h-[54px] flex-1 resize-y rounded-xl border border-[#d8cbb5] px-4 py-3 text-sm outline-none focus:border-[#c88b25] disabled:bg-gray-50"
            />
            <button type="button" onClick={() => void send(input)} disabled={!companyId || sending || !input.trim()} className="flex h-[54px] w-[54px] items-center justify-center rounded-xl bg-[#07111d] text-white disabled:opacity-40" aria-label="Enviar a KIA">
              {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
