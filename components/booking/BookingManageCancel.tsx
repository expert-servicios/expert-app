'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export function BookingManageCancel({ token }: { token: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function cancel() {
    setState('loading');
    setMessage('');
    try {
      const res = await fetch('/api/booking/manage/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'No se pudo cancelar la cita.');
      setState('done');
      setMessage('La cita ha sido cancelada.');
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : 'No se pudo cancelar la cita.');
    }
  }

  if (state === 'done') {
    return <p className="text-sm font-semibold text-green-700">{message}</p>;
  }

  return (
    <div>
      <p className="text-sm leading-6 text-[#374151]">
        La cancelación elimina también la reunión de Google Calendar. Esta acción no se puede deshacer.
      </p>
      {state === 'error' && <p className="mt-3 text-sm font-semibold text-red-700">{message}</p>}
      <button
        type="button"
        onClick={cancel}
        disabled={state === 'loading'}
        className="mt-5 inline-flex items-center gap-2 bg-[#0D1B2A] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
      >
        {state === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
        Confirmar cancelación
      </button>
    </div>
  );
}
