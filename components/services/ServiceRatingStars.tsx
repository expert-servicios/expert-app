import { Star } from 'lucide-react';
import type { PublicServiceReviewSummary } from '@/lib/services/public-service-reviews';

export function ServiceRatingStars({ summary, compact = false }: {
  summary?: PublicServiceReviewSummary;
  compact?: boolean;
}) {
  if (!summary?.count || summary.average === null) {
    return <span className="text-xs text-[#23364D]/65">Sin valoraciones todavía</span>;
  }
  const rounded = Math.round(summary.average);
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label={`${summary.average.toFixed(1)} de 5 estrellas, ${summary.count} valoraciones verificadas`}>
      <span className="flex items-center gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((value) => <Star key={value}
          className={`${compact ? 'h-3 w-3' : 'h-4 w-4'} ${value <= rounded ? 'fill-[#D4A017] stroke-[#D4A017]' : 'fill-transparent stroke-[#D4A017]/40'}`} />)}
      </span>
      <span className="text-xs font-semibold text-[#0D1B2A]">{summary.average.toFixed(1).replace('.', ',')} / 5</span>
      <span className="text-xs text-[#23364D]/70">({summary.count})</span>
    </div>
  );
}
