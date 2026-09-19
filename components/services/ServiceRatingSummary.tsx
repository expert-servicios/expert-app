import { Star } from 'lucide-react';
import { getPublicServiceReviewSummary } from '@/lib/services/public-service-reviews';

type Props = {
  serviceSlug: string;
  locale?: 'es' | 'ru';
  showComments?: boolean;
};

const COPY = {
  es: {
    heading: 'Valoraciones de clientes',
    empty: 'Todavía no hay valoraciones públicas para este servicio.',
    reviews: (count: number) => `${count} valoración${count === 1 ? '' : 'es'} verificadas`,
    anonymous: 'Cliente EXPERT',
  },
  ru: {
    heading: 'Отзывы клиентов',
    empty: 'Для этой услуги пока нет опубликованных отзывов.',
    reviews: (count: number) => `${count} проверенн${count === 1 ? 'ый отзыв' : 'ых отзыва'}`,
    anonymous: 'Клиент EXPERT',
  },
} as const;

export async function ServiceRatingSummary({
  serviceSlug,
  locale = 'es',
  showComments = true,
}: Props) {
  const copy = COPY[locale];
  const summary = await getPublicServiceReviewSummary(serviceSlug);
  const rounded = summary.average ? Math.round(summary.average) : 0;

  return (
    <section
      className="border border-[#D4A017]/20 bg-white p-5"
      aria-label={copy.heading}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#23364D]">
            {copy.heading}
          </p>
          <div className="mt-2 flex items-center gap-1" aria-label={summary.average ? `${summary.average} de 5` : copy.empty}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-5 w-5 ${
                  star <= rounded
                    ? 'fill-[#D4A017] stroke-[#D4A017]'
                    : 'fill-transparent stroke-[#D4A017]/35'
                }`}
              />
            ))}
          </div>
        </div>
        {summary.average !== null && (
          <div className="text-right">
            <p className="text-2xl font-bold text-[#0D1B2A]">{summary.average.toFixed(1)} / 5</p>
            <p className="text-xs text-[#23364D]/70">{copy.reviews(summary.count)}</p>
          </div>
        )}
      </div>

      {summary.average === null ? (
        <p className="mt-3 text-sm leading-6 text-[#23364D]/70">{copy.empty}</p>
      ) : (
        showComments && summary.reviews.length > 0 && (
          <div className="mt-4 space-y-3 border-t border-[#D4A017]/15 pt-4">
            {summary.reviews.map((review) => (
              <blockquote key={review.id} className="text-sm leading-6 text-[#23364D]">
                <span aria-hidden="true">“</span>{review.comment}<span aria-hidden="true">”</span>
                <footer className="mt-1 text-xs font-semibold text-[#0D1B2A]">
                  {copy.anonymous}
                </footer>
              </blockquote>
            ))}
          </div>
        )
      )}
    </section>
  );
}
