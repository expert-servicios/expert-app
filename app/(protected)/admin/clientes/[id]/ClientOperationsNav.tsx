'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CalendarClock, CreditCard, Eye, FileText, Gauge, Gift, ListTodo, Mail, Plug, ReceiptText } from 'lucide-react';

export function ClientOperationsNav({ clientId }: { clientId: string }) {
  const searchParams = useSearchParams();
  const companyId = searchParams.get('companyId');

  const childHref = (suffix: string) => {
    const base = `/admin/clientes/${clientId}${suffix}`;
    return companyId ? `${base}?companyId=${encodeURIComponent(companyId)}` : base;
  };

  const adminHref = (base: string) => {
    const query = new URLSearchParams({ clientId });
    if (companyId) query.set('companyId', companyId);
    return `${base}?${query.toString()}`;
  };

  return (
    <nav className="border-b border-[#e6dfd2] bg-[#faf8f2]">
      <div className="mx-auto flex max-w-7xl flex-wrap gap-2 px-6 py-2.5">
        <Link href={childHref('/portal')} className="inline-flex items-center gap-1.5 rounded-lg border border-[#c88b25]/40 bg-[#fff8e8] px-3 py-1.5 text-xs font-bold text-[#8a5a0a] hover:border-[#c88b25]">
          <Eye className="h-3.5 w-3.5" /> Vista cliente
        </Link>
        <Link href={childHref('/operaciones')} className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8cbb5] bg-white px-3 py-1.5 text-xs font-bold text-[#07111d] hover:border-[#c88b25]">
          <Gauge className="h-3.5 w-3.5" /> Operaciones
        </Link>
        <Link href={childHref('/obligaciones')} className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8cbb5] bg-white px-3 py-1.5 text-xs font-bold text-[#07111d] hover:border-[#c88b25]">
          <CalendarClock className="h-3.5 w-3.5" /> Fiscal
        </Link>
        <Link href={childHref('/beneficios')} className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8cbb5] bg-white px-3 py-1.5 text-xs font-bold text-[#07111d] hover:border-[#c88b25]">
          <Gift className="h-3.5 w-3.5" /> Beneficios
        </Link>
        <Link href={childHref('/comunicaciones')} className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8cbb5] bg-white px-3 py-1.5 text-xs font-bold text-[#07111d] hover:border-[#c88b25]">
          <Mail className="h-3.5 w-3.5" /> Comunicaciones
        </Link>
        <Link href={childHref('/documentos')} className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8cbb5] bg-white px-3 py-1.5 text-xs font-bold text-[#07111d] hover:border-[#c88b25]">
          <FileText className="h-3.5 w-3.5" /> Documentos
        </Link>
        <Link href={adminHref('/admin/tareas')} className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8cbb5] bg-white px-3 py-1.5 text-xs font-bold text-[#07111d] hover:border-[#c88b25]">
          <ListTodo className="h-3.5 w-3.5" /> Tareas
        </Link>
        <Link href={childHref('/integraciones')} className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8cbb5] bg-white px-3 py-1.5 text-xs font-bold text-[#07111d] hover:border-[#c88b25]">
          <Plug className="h-3.5 w-3.5" /> Integraciones
        </Link>
        <Link href={childHref('/stripe')} className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8cbb5] bg-white px-3 py-1.5 text-xs font-bold text-[#07111d] hover:border-[#c88b25]">
          <CreditCard className="h-3.5 w-3.5" /> Stripe
        </Link>
        <Link href={childHref('/stripe/facturas')} className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8cbb5] bg-white px-3 py-1.5 text-xs font-bold text-[#07111d] hover:border-[#c88b25]">
          <ReceiptText className="h-3.5 w-3.5" /> Facturas Stripe
        </Link>
      </div>
    </nav>
  );
}
