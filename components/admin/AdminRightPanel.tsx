'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { Mail, Bell, PanelRightOpen, PanelRightClose, Loader2, Maximize2, Minimize2, ListTodo, Sparkles } from 'lucide-react';
import KiaCopilotWidget from '../KiaCopilotWidget';

type PanelTab = 'kia' | 'notificaciones';

type AlertTask = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  client_id: string | null;
  client: { id: string; full_name: string | null } | null;
  case: { id: string; service: string } | null;
};

function NotificacionesTab() {
  const [tasks, setTasks] = useState<AlertTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/tasks', { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        setTasks((json.tasks ?? []).filter((task: AlertTask) => task.status === 'pendiente' || task.status === 'en_progreso'));
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (loading) return <PanelLoader />;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
        <div>
          <p className="text-xs font-semibold text-white/70">Tareas abiertas</p>
          <p className="text-[10px] text-white/35">EXPERT · KIA · manual</p>
        </div>
        <span className="rounded-full bg-[#D4A017]/15 px-2 py-1 text-[10px] font-bold text-[#D4A017]">{tasks.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {tasks.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <Bell className="h-10 w-10 text-white/20" />
            <p className="text-sm font-semibold text-white/50">Sin tareas abiertas</p>
            <p className="text-xs text-white/30">Los seguimientos automáticos aparecerán aquí.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.slice(0, 12).map((task) => {
              const overdue = Boolean(task.due_date && task.due_date < today);
              return (
                <div key={task.id} className={`rounded-xl border p-3 ${overdue ? 'border-red-400/30 bg-red-500/8' : 'border-white/8 bg-white/4'}`}>
                  <div className="flex items-start gap-2">
                    <ListTodo className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${overdue ? 'text-red-300' : 'text-[#D4A017]'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white/80">{task.title}</p>
                      {task.description && <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-white/40">{task.description}</p>}
                      <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-white/35">
                        {task.due_date && <span className={overdue ? 'font-bold text-red-300' : ''}>{overdue ? 'Vencida' : 'Vence'} {new Date(`${task.due_date}T12:00:00`).toLocaleDateString('es-ES')}</span>}
                        {task.client && <Link href={`/admin/clientes/${task.client.id}`} className="font-semibold text-[#D4A017] hover:underline">{task.client.full_name ?? 'Cliente'}</Link>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="border-t border-white/8 p-3">
        <Link href="/admin/tareas" className="flex w-full items-center justify-center rounded-lg bg-[#D4A017]/15 px-3 py-2 text-xs font-bold text-[#D4A017] hover:bg-[#D4A017]/20">Abrir lista completa de tareas</Link>
      </div>
    </div>
  );
}

function PanelLoader() {
  return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-white/30" />
    </div>
  );
}

const TABS: { id: PanelTab; label: string; icon: React.ElementType }[] = [
  { id: 'kia', label: 'KIA Copiloto', icon: Sparkles },
  { id: 'notificaciones', label: 'Avisos', icon: Bell },
];

/**
 * Single Admin KIA dock across the workspace (including delegated support).
 *
 * On very wide desktops the panel is a dedicated right-hand column; on
 * narrower desktop/mobile screens it overlays the page without squeezing
 * the working area. The same embedded KIA instance stays mounted when hidden
 * or when the user switches between KIA and Notifications.
 */
export function AdminRightPanel({ emailUnreadCount = 0 }: { emailUnreadCount?: number }) {
  const [open, setOpen] = useState(false);
  const [wide, setWide] = useState(false);
  const [tab, setTab] = useState<PanelTab>('kia');
  const [mounted, setMounted] = useState<Set<PanelTab>>(new Set());

  useEffect(() => {
    const saved = localStorage.getItem('adminRightPanel');
    // Keep the current preference. For new visitors, show KIA as the
    // additional open window on spacious desktops.
    if (saved === 'open' || saved === 'closed') {
      setOpen(saved === 'open');
    } else {
      setOpen(window.matchMedia('(min-width: 1536px)').matches);
    }
    if (localStorage.getItem('adminRightPanelWide') === 'true') setWide(true);
  }, []);

  const toggle = useCallback(() => {
    setOpen((previous) => {
      const next = !previous;
      localStorage.setItem('adminRightPanel', next ? 'open' : 'closed');
      return next;
    });
  }, []);

  const toggleWide = useCallback(() => {
    setWide((previous) => {
      const next = !previous;
      localStorage.setItem('adminRightPanelWide', String(next));
      return next;
    });
  }, []);

  const handleTabChange = (nextTab: PanelTab) => {
    setTab(nextTab);
    setMounted((previous) => new Set([...previous, nextTab]));
  };

  useEffect(() => {
    if (open) setMounted((previous) => new Set([...previous, tab])); // eslint-disable-line react-hooks/set-state-in-effect
  }, [open, tab]);

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={toggle}
          aria-label="Abrir ventana KIA Copiloto"
          aria-controls="expert-workspace-kia-dock"
          aria-expanded={false}
          title="Abrir KIA Copiloto"
          className="fixed bottom-[calc(88px+env(safe-area-inset-bottom))] right-3 z-[60] inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#0D1B2A] px-3 py-2.5 text-xs font-semibold text-[#D4A017] shadow-lg transition hover:bg-[#172b42] lg:bottom-auto lg:right-0 lg:top-1/2 lg:-translate-y-1/2 lg:rounded-r-none"
        >
          <PanelRightOpen className="h-4 w-4" aria-hidden="true" />
          <span>KIA</span>
        </button>
      )}

      <aside
        id="expert-workspace-kia-dock"
        aria-label="Panel lateral KIA Copiloto y notificaciones"
        aria-hidden={!open}
        className={
          open
            ? `fixed inset-x-3 top-[max(12px,env(safe-area-inset-top))] bottom-[calc(76px+env(safe-area-inset-bottom))] z-[70] flex min-h-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0D1B2A] shadow-2xl sm:inset-x-auto sm:right-4 sm:top-4 sm:bottom-4 ${wide ? 'sm:w-[min(620px,calc(100vw-2rem))]' : 'sm:w-[390px]'} 2xl:sticky 2xl:top-0 2xl:right-auto 2xl:bottom-auto 2xl:h-screen 2xl:shrink-0 2xl:rounded-none 2xl:border-y-0 2xl:border-r-0 2xl:shadow-none ${wide ? '2xl:w-[min(45vw,620px)]' : '2xl:w-[370px]'}`
            : 'hidden'
        }
      >
        {mounted.size > 0 && (
          <>
            <div className="flex shrink-0 items-center border-b border-white/10 px-1 py-1">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleTabChange(id)}
                  aria-pressed={tab === id}
                  className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition ${tab === id ? 'bg-[#D4A017]/15 text-[#D4A017]' : 'text-white/50 hover:text-white/80'}`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{label}</span>
                </button>
              ))}
              <Link
                href="/admin/correo"
                title="Abrir Correo 360"
                aria-label="Abrir Correo 360"
                className="relative ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/10"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                {emailUnreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-blue-500 px-0.5 text-[8px] font-bold text-white">
                    {emailUnreadCount > 99 ? '99+' : emailUnreadCount}
                  </span>
                )}
              </Link>
              <button
                type="button"
                onClick={toggleWide}
                title={wide ? 'Reducir ventana KIA' : 'Ampliar ventana KIA'}
                aria-label={wide ? 'Reducir ventana KIA' : 'Ampliar ventana KIA'}
                className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/60 hover:bg-white/10"
              >
                {wide ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={toggle}
                title="Cerrar ventana KIA"
                aria-label="Cerrar ventana KIA Copiloto"
                className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/60 hover:bg-white/10"
              >
                <PanelRightClose className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="relative min-h-0 flex-1 overflow-hidden">
              {TABS.map(({ id }) => (
                <div key={id} className={`absolute inset-0 overflow-auto ${tab === id ? 'z-10 visible' : 'z-0 invisible'}`}>
                  {mounted.has(id) && (id === 'kia'
                    ? <KiaCopilotWidget embedded active={open && tab === 'kia'} />
                    : <NotificacionesTab />)}
                </div>
              ))}
            </div>
          </>
        )}
      </aside>
    </>
  );
}
