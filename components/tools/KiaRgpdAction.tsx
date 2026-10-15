'use client';

type Topic = 'rgpd-help' | 'rgpd-guided' | 'rgpd-training';

export function KiaRgpdAction({ topic, children }: { topic: Topic; children: React.ReactNode }) {
  return <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('expert:kia-open', { detail: { topic } }))}
    className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#D4A017] bg-white px-4 py-3 text-sm font-semibold text-[#0D1B2A] hover:bg-[#D4A017]/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4A017]">
    {children}
  </button>;
}
