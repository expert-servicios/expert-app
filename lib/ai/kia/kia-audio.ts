const TRANSCRIPTION_URL = 'https://api.openai.com/v1/audio/transcriptions';
const SPEECH_URL = 'https://api.openai.com/v1/audio/speech';
const GEMINI_INTERACTIONS_URL = 'https://generativelanguage.googleapis.com/v1beta/interactions';

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

function openAiApiKey(): string {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new Error('openai_audio_not_configured');
  return key;
}

function geminiApiKey(): string | null {
  return process.env.GOOGLE_API_KEY?.trim()
    || process.env.GEMINI_API_KEY?.trim()
    || process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim()
    || null;
}

function interactionOutputText(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const record = data as Record<string, unknown>;
  if (typeof record.output_text === 'string') return record.output_text.trim();
  if (!Array.isArray(record.steps)) return '';
  const parts: string[] = [];
  for (const step of record.steps) {
    if (!step || typeof step !== 'object') continue;
    const content = (step as Record<string, unknown>).content;
    if (!Array.isArray(content)) continue;
    for (const item of content) {
      if (!item || typeof item !== 'object') continue;
      const text = (item as Record<string, unknown>).text;
      if (typeof text === 'string' && text.trim()) parts.push(text.trim());
    }
  }
  return parts.join('\n').trim();
}

async function transcribeKiaAudioWithGemini(file: File, key: string): Promise<{ text: string; model: string }> {
  const model = process.env.GEMINI_TRANSCRIBE_MODEL?.trim() || 'gemini-3.5-transcribe';
  const mimeType = file.type.split(';')[0]?.trim().toLowerCase() || 'audio/webm';
  const data = Buffer.from(await file.arrayBuffer()).toString('base64');
  const response = await fetch(GEMINI_INTERACTIONS_URL, {
    method: 'POST',
    headers: {
      'x-goog-api-key': key,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: [{ type: 'audio', data, mime_type: mimeType }],
      generation_config: {
        transcription_config: {
          language_codes: [],
          mode: 'smart',
          custom_vocabulary: ['KIA', 'EXPERT', 'AEAT', 'TGSS', 'VeriFactu', 'Holded'],
        },
      },
    }),
    signal: AbortSignal.timeout(45_000),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`gemini_transcription_failed_${response.status}`);
  const text = interactionOutputText(body);
  if (!text) throw new Error('empty_transcription');
  return { text: text.slice(0, 12_000), model };
}

async function transcribeKiaAudioWithOpenAi(file: File): Promise<{ text: string; model: string }> {
  const model = process.env.OPENAI_TRANSCRIBE_MODEL?.trim() || 'gpt-4o-mini-transcribe';
  const form = new FormData();
  form.set('model', model);
  form.set('file', file, file.name || 'kia-voice.webm');

  const response = await fetch(TRANSCRIPTION_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${openAiApiKey()}` },
    body: form,
    signal: AbortSignal.timeout(45_000),
  });
  if (!response.ok) throw new Error(`transcription_failed_${response.status}`);
  const body = await response.json() as { text?: unknown };
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!text) throw new Error('empty_transcription');
  return { text: text.slice(0, 12_000), model };
}

export function validateKiaAudioFile(file: File): void {
  if (!file.size || file.size > KIA_MAX_AUDIO_BYTES) throw new Error('audio_size_invalid');
  const mime = file.type.split(';')[0]?.trim().toLowerCase();
  if (!ALLOWED_AUDIO_TYPES.has(mime)) throw new Error('audio_type_invalid');
}

export async function transcribeKiaAudio(file: File): Promise<{ text: string; model: string }> {
  validateKiaAudioFile(file);
  const key = geminiApiKey();
  if (key) {
    try {
      return await transcribeKiaAudioWithGemini(file, key);
    } catch (error) {
      console.error('[KIA audio] Gemini transcription failed; trying OpenAI fallback:', error instanceof Error ? error.message : 'unknown_error');
    }
  }
  return transcribeKiaAudioWithOpenAi(file);
}

export async function synthesizeKiaSpeech(input: {
  text: string;
  locale: 'es' | 'ru';
}): Promise<{ audio: ArrayBuffer; contentType: string; model: string; voice: string }> {
  const text = input.text.trim().slice(0, 4000);
  if (!text) throw new Error('empty_speech_text');
  const model = process.env.OPENAI_TTS_MODEL?.trim() || 'gpt-4o-mini-tts';
  const voice = process.env.OPENAI_TTS_VOICE?.trim();
  if (!voice) throw new Error('openai_tts_not_configured');

  const response = await fetch(SPEECH_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openAiApiKey()}`,
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
