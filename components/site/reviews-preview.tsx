import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { Star } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  service_name: string | null;
  created_at: string;
  publication_mode: string;
  public_name: string | null;
  public_avatar_url: string | null;
  avatar_consent: boolean;
}

async function fetchPublicReviews(): Promise<Review[]> {
  try {
    const admin = getSupabaseAdmin();
    const { data } = await admin
      .from('reviews')
      .select('id,rating,comment,service_name,created_at,publication_mode,public_name,public_avatar_url,avatar_consent')
      .eq('status', 'approved')
      .neq('publication_mode','private')
      .eq('allow_publish', true)
      .eq('published', true)
      .eq('comment_publishable', true)
      .not('comment', 'is', null)
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(6);
    return (data ?? []).filter((review) => Boolean(review.comment?.trim()));
  } catch {
    return [];
  }
}

export async function ReviewsPreview() {
  const reviews = await fetchPublicReviews();

  if (reviews.length === 0) return null;

  const avg = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);

  return (
    <section className="bg-[#0D1B2A] py-16 text-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-2 flex items-center justify-center gap-2">
          {[1,2,3,4,5].map((s) => (
            <Star key={s} className="h-5 w-5 fill-[#D4A017] stroke-[#D4A017]" />
          ))}
          <span className="ml-1 text-lg font-bold text-[#D4A017]">{avg}</span>
        </div>
        <h2 className="text-center font-serif text-3xl font-bold uppercase tracking-wide">
          Opiniones reales de clientes
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-6 text-white/65">
          Las valoraciones se publican únicamente después de finalizar un servicio y con autorización del cliente.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="flex flex-col border border-[#D4A017]/35 bg-[#23364D] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.25)]"
            >
              <div className="flex">
                {[1,2,3,4,5].map((s) => (
                  <Star
                    key={s}
                    className={`h-4 w-4 ${s <= r.rating ? 'fill-[#D4A017] stroke-[#D4A017]' : 'fill-transparent stroke-white/20'}`}
                  />
                ))}
              </div>
              <p className="mt-4 flex-1 text-sm leading-6 text-white/80">
                {r.comment}
              </p>
              <div className="mt-5 border-t border-white/10 pt-4 text-xs text-white/50">
                <span className="font-semibold text-white">{r.publication_mode === 'profile' && r.public_name ? r.public_name : 'Cliente EXPERT'}</span>
                {r.publication_mode === 'profile' && r.avatar_consent && r.public_avatar_url && /^https:\/\/lh\d+\.googleusercontent\.com\//i.test(r.public_avatar_url) && <img src={r.public_avatar_url} alt="Foto de perfil autorizada" width={36} height={36} referrerPolicy="no-referrer" className="mt-2 h-9 w-9 rounded-full object-cover" />}

                {r.service_name && <span className="font-semibold text-[#D4A017]/80">{r.service_name} · </span>}
                {new Date(r.created_at).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
