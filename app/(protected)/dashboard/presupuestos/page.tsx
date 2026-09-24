import Link from 'next/link';
import { ArrowLeft, FileText, Clock, CheckCircle2 } from 'lucide-react';
import { CheckoutButton } from '@/components/quotes/CheckoutButton';
import { fetchWithCookies } from '@/lib/utils/server-fetch';

interface QuoteItem {
  service_slug: string;
  description: string;
  quantity: number;
  unit_amount_cents: number;
  currency: string;
  position: number;
}

interface Quote {
  id: string;
  title: string;
  amount_eur: number;
  status: string;
  created_at: string;
  expires_at: string | null;
  quote_items?: QuoteItem[];
}

async function getQuotes(): Promise<Quote[]> {
  const data = await fetchWithCookies<{ quotes: Quote[] }>('/api/quotes');
  return data?.quotes ?? [];
}

export default async function DashboardQuotesPage() {
  const quotes = await getQuotes();

  return (
    <main className="min-h-screen bg-[#f8f4eb] py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-8 flex items-center gap-3 text-sm font-semibold text-[#061321]">
          <ArrowLeft className="h-4 w-4" />
          <Link href="/dashboard" className="underline underline-offset-4">Volver a mi panel</Link>
        </div>

        <div className="rounded-3xl border border-[#d8cbb5] bg-white p-8 shadow-lg">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-[#c88b25]">Presupuestos</p>
              <h1 className="mt-3 text-3xl font-serif font-bold text-[#07111d]">Tus presupuestos</h1>
            </div>
            <p className="text-sm text-[#29384a]">Revisa tus solicitudes, estados y pagos pendientes.</p>
          </div>

          {quotes.length === 0 ? (
            <div className="rounded-3xl border border-[#d8cbb5] bg-[#f8f4eb] p-10 text-center text-[#29384a]">
              No hay presupuestos todavía. Solicita uno desde el sitio público o revisa tu bandeja de entrada.
            </div>
          ) : (
            <div className="space-y-6">
              {quotes.map((quote) => (
                <div key={quote.id} className="rounded-3xl border border-[#d8cbb5] bg-[#f8f4eb] p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#07111d]">{quote.title}</p>
                      <p className="mt-2 text-sm text-[#29384a]">Creado el {new Date(quote.created_at).toLocaleDateString('es-ES')}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center gap-2 rounded-full bg-[#061321] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#F8F6F1]">
                        <FileText className="h-4 w-4" />
                        {quote.status}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-[#d7a33a]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#061321]">
                        <CheckCircle2 className="h-4 w-4" />
                        Base €{quote.amount_eur.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {Array.isArray(quote.quote_items) && quote.quote_items.length > 0 && (
                    <div className="mt-5 overflow-hidden rounded-2xl border border-[#d8cbb5] bg-white">
                      <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-[#eee5d6] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                        <span>Concepto</span>
                        <span>Cantidad</span>
                        <span>Importe</span>
                      </div>
                      {[...quote.quote_items]
                        .sort((a, b) => a.position - b.position)
                        .map((item) => (
                          <div key={item.service_slug} className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-[#f1eadf] px-4 py-3 text-sm last:border-b-0">
                            <div>
                              <p className="font-semibold text-[#07111d]">{item.description}</p>
                              <p className="mt-0.5 text-xs text-[#6b7280]">
                                {(item.unit_amount_cents / 100).toLocaleString('es-ES', { style: 'currency', currency: item.currency || 'EUR' })} / unidad
                              </p>
                            </div>
                            <span className="self-center text-right font-semibold text-[#29384a]">{item.quantity}</span>
                            <span className="self-center text-right font-bold text-[#07111d]">
                              {((item.unit_amount_cents * item.quantity) / 100).toLocaleString('es-ES', { style: 'currency', currency: item.currency || 'EUR' })}
                            </span>
                          </div>
                        ))}
                      <div className="flex items-center justify-between border-t border-[#d8cbb5] bg-[#fbf8f2] px-4 py-3">
                        <span className="text-sm font-semibold text-[#29384a]">Base imponible</span>
                        <span className="font-bold text-[#07111d]">
                          {Number(quote.amount_eur).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        </span>
                      </div>
                      <p className="px-4 pb-3 text-xs text-[#6b7280]">El IVA aplicable se calcula de forma segura en Stripe según los datos de facturación.</p>
                    </div>
                  )}

                  <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div className="space-y-2 text-sm text-[#29384a]">
                      <p>
                        <span className="font-semibold">Vence:</span>{' '}
                        {quote.expires_at
                          ? new Date(quote.expires_at).toLocaleDateString('es-ES')
                          : 'Sin fecha'}
                      </p>
                      <p className="inline-flex items-center gap-2 text-[#07111d]">
                        <Clock className="h-4 w-4" />
                        {quote.status === 'paid' ? 'Pago recibido' : 'Esperando acción'}
                      </p>
                    </div>

                    {['sent', 'accepted'].includes(quote.status) && quote.amount_eur > 0 ? (
                      <CheckoutButton quoteId={quote.id} />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
