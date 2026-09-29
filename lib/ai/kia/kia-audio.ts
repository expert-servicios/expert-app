const TRANSCRIPTION_URL = 'https://api.openai.com/v1/audio/transcriptions';
const SPEECH_URL = 'https://api.openai.com/v1/audio/speech';

const ALLOWED_AUDIO_TYPES = new Set([
  'audio/webm',
  'audio/ogg',
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/x-m4a',
  'audio/wav',
  'audio/x-wav',
]);

export const KIA_MAX_AUDIO_BYTES = 12 * 1024 * 1024;

function apiKey(): string {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new Error('openai_audio_not_configured');
  return key;
}

export function validateKiaAudioFile(file: File): void {
  if (!file.size || file.size > KIA_MAX_AUDIO_BYTES) throw new Error('audio_size_invalid');
  const mime = file.type.split(';')[0]?.trim().toLowerCase();
  if (!ALLOWED_AUDIO_TYPES.has(mime)) throw new Error('audio_type_invalid');
}

export async function transcribeKiaAudio(file: File): Promise<{ text: string; model: string }> {
  validateKiaAudioFile(file);
  const model = process.env.OPENAI_TRANSCRIBE_MODEL?.trim() || 'gpt-4o-mini-transcribe';
  const form = new FormData();
  form.set('model', model);
  form.set('file', file, file.name || 'kia-voice.webm');

  const response = await fetch(TRANSCRIPTION_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey()}` },
    body: form,
    signal: AbortSignal.timeout(45_000),
  });
  if (!response.ok) throw new Error(`transcription_failed_${response.status}`);
  const body = await response.json() as { text?: unknown };
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!text) throw new Error('empty_transcription');
  return { text: text.slice(0, 12_000), model };
}

export async function synthesizeKiaSpeech(input: {
  text: string;
  locale: 'es' | 'ru';
}): Promise<{ audio: ArrayBuffer; contentType: string; model: string; voice: string }> {
  const text = input.text.trim().slice(0, 4000);
  if (!text) throw new Error('empty_speech_text');
  const model = process.env.OPENAI_TTS_MODEL?.trim() || 'gpt-4o-mini-tts';
  const voice = process.env.OPENAI_TTS_VOICE?.trim() || 'alloy';

  const response = await fetch(SPEECH_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      voice,
      input: text,
      response_format: 'mp3',
      instructions: input.locale === 'ru'
        ? 'Говори естественно, спокойно и профессионально. Ты KIA, виртуальная ассистентка EXPERT.'
        : 'Habla en español natural, claro, calmado y profesional. Eres KIA, asistente virtual de EXPERT.',
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!response.ok) throw new Error(`speech_failed_${response.status}`);
  return {
    audio: await response.arrayBuffer(),
    contentType: response.headers.get('content-type') || 'audio/mpeg',
    model,
    voice,
  };
}
