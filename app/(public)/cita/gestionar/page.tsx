import { BookingManageCancel } from '@/components/booking/BookingManageCancel';

export default async function ManageBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token?.trim() ?? '';

  return (
    <main className="min-h-screen bg-[#F8F6F1] px-4 py-12 text-[#0D1B2A]">
      <div className="mx-auto max-w-xl border border-[#D4A017]/25 bg-white p-8 shadow-[0_4px_24px_rgba(13,27,42,0.07)]">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4A017]">Agenda EXPERT</p>
        <h1 className="mt-2 font-serif text-3xl font-bold">Cancelar cita</h1>
        <div className="mt-6">
          {token ? (
            <BookingManageCancel token={token} />
          ) : (
            <p className="text-sm text-red-700">El enlace de gestión no es válido.</p>
          )}
        </div>
      </div>
    </main>
  );
}
