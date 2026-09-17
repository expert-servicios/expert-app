import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, FileText, MessageCircle } from 'lucide-react';

const SERVICE_PATH = '/ru/uslugi/grazhdanstvo-ispanii-rebenok-rozhdennyy-v-ispanii';

export const metadata: Metadata = {
  title: 'Оплата подтверждена | EXPERT',
  robots: { index: false, follow: false },
};

export default function RuPaymentSuccessPage() {
  return (
    <main className="min-h-screen bg-[#F8F6F1] px-6 py-16 text-[#0D1B2A]">
      <div className="mx-auto max-w-2xl rounded-2xl border border-[#D4A017]/25 bg-white p-8 shadow-sm md:p-10">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 className="h-8 w-8 text-emerald-700" />
        </div>

        <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-[#D4A017]">Оплата завершена</p>
        <h1 className="mt-2 font-serif text-3xl font-bold md:text-4xl">Спасибо! Оплата подтверждена.</h1>
        <p className="mt-4 text-sm leading-7 text-[#23364D]">
          Мы получили оплату услуги. Профессиональное вознаграждение и государственная пошлина 790-026 учитываются раздельно: пошлина 104,05 € является suplido и не входит в базу профессиональных услуг.
        </p>

        <div className="mt-6 grid gap-3 rounded-xl border border-[#D4A017]/20 bg-[#F8F6F1] p-5 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs text-[#23364D]/60">Услуги с IVA</p>
            <p className="mt-1 font-bold">302,50 €</p>
          </div>
          <div>
            <p className="text-xs text-[#23364D]/60">Пошлина как suplido</p>
            <p className="mt-1 font-bold">104,05 €</p>
          </div>
          <div>
            <p className="text-xs text-[#23364D]/60">Итого</p>
            <p className="mt-1 font-bold">406,55 €</p>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <h2 className="font-serif text-xl font-bold">Что дальше</h2>
          <p className="text-sm leading-7 text-[#23364D]">
            Отправьте документы по делу. Мы проверим срок легальной резиденции ребёнка и комплект документов, после чего подготовим заявление и оплатим пошлину от имени и за счёт клиента.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href="https://wa.me/34669045528"
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#D4A017] px-5 py-3 text-sm font-bold text-[#0D1B2A] transition hover:bg-[#F2C14E]"
          >
            <MessageCircle className="h-4 w-4" /> Отправить документы в WhatsApp
          </a>
          <Link
            href={SERVICE_PATH}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[#D4A017] px-5 py-3 text-sm font-bold text-[#0D1B2A] transition hover:bg-[#D4A017]/10"
          >
            <FileText className="h-4 w-4" /> Вернуться к услуге
          </Link>
        </div>
      </div>
    </main>
  );
}
