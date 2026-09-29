import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/integrations/supabase';
import { synthesizeKiaSpeech } from '@/lib/ai/kia/kia-audio';

export const maxDuration = 60;

const schema = z.object({
  text: z.string().trim().min(1).max(4000),
  locale: z.enum(['es', 'ru']).default('es'),
}).strict();

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('unauthorized', { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new Response('invalid_request', { status: 400 });

  try {
    const result = await synthesizeKiaSpeech(parsed.data);
    return new Response(result.audio, {
      status: 200,
      headers: {
        'Content-Type': result.contentType,
        'Cache-Control': 'no-store, private',
        'X-KIA-Audio-Model': result.model,
      },
    });
  } catch {
    return new Response('speech_unavailable', { status: 503 });
  }
}
