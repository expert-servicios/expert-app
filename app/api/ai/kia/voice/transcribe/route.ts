import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/integrations/supabase';
import { KIA_MAX_AUDIO_BYTES, transcribeKiaAudio } from '@/lib/ai/kia/kia-audio';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const audio = form?.get('audio');
  if (!(audio instanceof File)) return NextResponse.json({ error: 'missing_audio' }, { status: 400 });
  if (audio.size > KIA_MAX_AUDIO_BYTES) return NextResponse.json({ error: 'audio_too_large' }, { status: 413 });

  try {
    const result = await transcribeKiaAudio(audio);
    return NextResponse.json({ transcript: result.text, model: result.model }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'transcription_failed';
    const status = message === 'audio_type_invalid' || message === 'audio_size_invalid' ? 400 : 503;
    return NextResponse.json({ error: message }, { status });
  }
}
