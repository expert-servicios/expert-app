'use client';

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#07111d] px-6 text-center">
      <img src="/branding/expert-approved/horizontal-oscuro.webp" alt="EXPERT Consulting" width="280" height="70" className="h-auto w-[240px] object-contain" />
      <p className="mt-4 text-sm font-semibold text-white">Sin conexión</p>
      <p className="mt-2 max-w-xs text-xs text-white/50">
        Comprueba tu conexión a internet e inténtalo de nuevo.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-6 rounded-full bg-[#d7a33a] px-6 py-2.5 text-xs font-bold text-[#07111d] transition hover:bg-[#c88b25]"
      >
        Reintentar
      </button>
    </div>
  );
}
