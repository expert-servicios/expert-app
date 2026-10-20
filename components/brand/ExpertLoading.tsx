import Image from 'next/image';

/** Shared loading state for route transitions, not a timed splash screen. */
export function ExpertLoading({ label = 'Cargando EXPERT…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex min-h-[45vh] flex-col items-center justify-center gap-5 bg-[#F8F6F1] px-6 text-center text-[#0D1B2A]">
      <Image src="/branding/expert-approved/isotipo-claro.webp" alt="EXPERT" width={128} height={79} unoptimized className="h-auto w-28 motion-safe:animate-pulse" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}
