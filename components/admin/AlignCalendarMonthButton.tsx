'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AlignCalendarMonthButton({
  subscriptionId,
  currentPeriodEnd,
}: {
  subscriptionId: string;
  currentPeriodEnd: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function align() {
    const renewal = currentPeriodEnd
      ? new Date(currentPeriodEnd).toLocaleDateString('es-ES')
      : 'la fecha actual';

    const confirmed = window.confirm(
      `Esta acción cobrará el mes natural en curso completo si todavía no está facturado y moverá las siguientes renovaciones al día 1. Renovación actual: ${renewal}. ¿Continuar?`,
    );
    if (!confirmed) return;

    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/subscriptions/${subscriptionId}/align-calendar-month`, {
        method: 'POST',
      });
      const data = await response.json().catch(() => ({})) as {
        error?: string;
        invoiceNumber?: string | null;
        invoiceStatus?: string;
        nextBillingAt?: string;
        amountPaid?: number;
        currency?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? 'No se pudo alinear la suscripción.');
      }

      const amount = typeof data.amountPaid === 'number'
        ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: (data.currency ?? 'eur').toUpperCase() }).format(data.amountPaid / 100)
        : null;
      const nextBilling = data.nextBillingAt
        ? new Date(data.nextBillingAt).toLocaleDateString('es-ES')
        : 'día 1 del mes siguiente';

      setMessage(
        `Alineada. ${data.invoiceNumber ? `Factura ${data.invoiceNumber}. ` : ''}${amount ? `Cobrado: ${amount}. ` : ''}Próxima facturación: ${nextBilling}.`,
      );
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo alinear la suscripción.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={align}
        disabled={loading}
        className="rounded-lg border border-[#c88b25] bg-white px-3 py-2 text-xs font-bold text-[#8a5d14] transition hover:bg-[#fff8e8] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Alineando…' : 'Alinear cobro al día 1'}
      </button>
      {message ? <p className="mt-2 max-w-xl text-xs text-[#6b7280]">{message}</p> : null}
    </div>
  );
}
