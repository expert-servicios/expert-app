import Link from 'next/link';
import { ArrowLeft, FolderOpen, ChevronRight, MessageCircle } from 'lucide-react';
import { fetchWithCookies } from '@/lib/utils/server-fetch';
import { KiaGuidanceCard } from '@/components/kia/KiaGuidanceCard';
import { resolveCaseListGuidance } from '@/lib/ai/kia/kia-surface-guidance';

interface Case {
  id: string;
  category: string;
  service: string;
  state: string;
  opened_at: string;
  closed_at: string | null;
  unread_count: number;
}

const STATE_LABELS: Record<string, { es: string; ru: string }> = {
  pendiente_documentacion: { es: 'Pendiente de documentación', ru: 'Ожидаются документы' },
  en_revision: { es: 'En revisión', ru: 'На проверке' },
  en_proceso: { es: 'En proceso', ru: 'В работе' },
  presentado: { es: 'Presentado', ru: 'Подано' },
  finalizado: { es: 'Finalizado', ru: 'Завершено' }
};

const STATE_COLORS: Record<string, string> = {
  pendiente_documentacion: 'bg-yellow-100 text-yellow-800',
  en_revision: 'bg-blue-100 text-blue-800',
  en_proceso: 'bg-purple-100 text-purple-800',
  presentado: 'bg-green-100 text-green-800',
  finalizado: 'bg-gray-100 text-gray-600'
};

async function getCasesAndLocale(): Promise<{ cases: Case[]; locale: 'es' | 'ru' }> {
  const [casesData, profileData] = await Promise.all([
    fetchWithCookies<{ cases: Case[] }>('/api/cases'),
    fetchWithCookies<{ profile?: { preferred_language?: string | null } }>('/api/profile'),
  ]);
  return {
    cases: (casesData?.cases ?? []) as Case[],
    locale: profileData?.profile?.preferred_language === 'ru' ? 'ru' : 'es',
  };
}

export default async function ClientCasesPage() {
  const { cases, locale } = await getCasesAndLocale();
  const isRu = locale === 'ru';
  const active = cases.filter((c) => c.state !== 'finalizado');
  const closed = cases.filter((c) => c.state === 'finalizado');
  const guidance = resolveCaseListGuidance(active.length, closed.length, locale);

  return (
    <main className="min-h-screen bg-[#f8f4eb] py-12">
      <div className="mx-auto max-w-4xl px-6">
        <div className="mb-8 flex items-center gap-3 text-sm font-semibold text-[#061321]">
          <ArrowLeft className="h-4 w-4" />
          <Link href="/dashboard" className="underline underline-offset-4">{isRu ? 'Вернуться в кабинет' : 'Volver a mi panel'}</Link>
        </div>

        <div className="rounded-3xl border border-[#d8cbb5] bg-white p-8 shadow-lg">
          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.28em] text-[#c88b25]">{isRu ? 'Expediente' : 'Expedientes'}</p>
            <h1 className="mt-3 font-serif text-3xl font-bold text-[#07111d]">{isRu ? 'Мои expediente' : 'Mis expedientes'}</h1>
            <p className="mt-2 text-sm text-[#29384a]">
              {isRu ? `${active.length} активных · ${closed.length} завершённых` : `${active.length} activo${active.length !== 1 ? 's' : ''} · ${closed.length} finalizado${closed.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          <KiaGuidanceCard
            state={guidance.state}
            title={guidance.title}
            message={guidance.message}
            className="mb-8"
          />

          {cases.length === 0 ? (
            <div className="rounded-3xl border border-[#d8cbb5] bg-[#f8f4eb] p-10 text-center text-[#29384a]">
              {isRu ? 'У Вас пока нет expediente. Они создаются автоматически после оплаты услуги.' : 'No tienes expedientes todavía. Se crean automáticamente al realizar un pago.'}
            </div>
          ) : (
            <div className="space-y-8">
              {active.length > 0 && (
                <section>
                  <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#c88b25]">{isRu ? 'Активные' : 'Activos'}</h2>
                  <div className="space-y-3">
                    {active.map((c) => (
                      <Link key={c.id} href={`/dashboard/expedientes/${c.id}`}
                        className="group flex items-center justify-between rounded-2xl border border-[#d8cbb5] bg-[#f8f4eb] p-5 transition hover:border-[#c88b25] hover:shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="relative rounded-xl bg-[#c88b25]/10 p-3 text-[#c88b25]">
                            <FolderOpen className="h-5 w-5" />
                            {c.unread_count > 0 && (
                              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                {c.unread_count > 9 ? '9+' : c.unread_count}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-[#07111d]">{c.service}</p>
                            <p className="mt-1 text-xs text-[#29384a]">
                              {isRu ? 'Открыт ' : 'Abierto el '}{new Date(c.opened_at).toLocaleDateString(isRu ? 'ru-RU' : 'es-ES')}
                              {c.unread_count > 0 && (
                                <span className="ml-2 inline-flex items-center gap-1 font-semibold text-red-600">
                                  <MessageCircle className="h-3 w-3" />
                                  {isRu ? `${c.unread_count} новых` : `${c.unread_count} nuevo${c.unread_count !== 1 ? 's' : ''}`}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATE_COLORS[c.state] ?? 'bg-gray-100 text-gray-600'}`}>
                            {STATE_LABELS[c.state]?.[locale] ?? c.state}
                          </span>
                          <ChevronRight className="h-4 w-4 text-[#c88b25] transition group-hover:translate-x-1" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {closed.length > 0 && (
                <section>
                  <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#29384a]">{isRu ? 'Завершённые' : 'Finalizados'}</h2>
                  <div className="space-y-3 opacity-60">
                    {closed.map((c) => (
                      <Link key={c.id} href={`/dashboard/expedientes/${c.id}`}
                        className="group flex items-center justify-between rounded-2xl border border-[#d8cbb5] bg-[#f8f4eb] p-5 transition hover:border-[#d8cbb5] hover:shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="rounded-xl bg-gray-100 p-3 text-gray-400">
                            <FolderOpen className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-[#07111d]">{c.service}</p>
                            <p className="mt-1 text-xs text-[#29384a]">
                              {isRu ? 'Закрыт ' : 'Cerrado el '}{c.closed_at ? new Date(c.closed_at).toLocaleDateString(isRu ? 'ru-RU' : 'es-ES') : '—'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">{isRu ? 'Завершено' : 'Finalizado'}</span>
                          <ChevronRight className="h-4 w-4 text-gray-400 transition group-hover:translate-x-1" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
