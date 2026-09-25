import type { KiaToolResult } from './kia-tool-definitions';

const EMAIL_SIGNATURE_PATTERN = /\b(firma|signature)\b/i;
const EMAIL_CONTEXT_PATTERN = /\b(correo|email|e-mail|mail|kia|expert)\b/i;

export function buildAutomaticKiaVisualResult(input: {
  message: string;
  existingToolResults: KiaToolResult[];
}): KiaToolResult | null {
  if (input.existingToolResults.some((item) => item.toolName === 'visual_resources')) return null;
  if (!EMAIL_SIGNATURE_PATTERN.test(input.message) || !EMAIL_CONTEXT_PATTERN.test(input.message)) return null;

  return {
    toolName: 'visual_resources',
    ok: true,
    result: {
      images: [
        {
          id: 'kia-email-signature',
          title: 'Ejemplo visual de la firma KIA · EXPERT',
          imageUrl: '/kia/visuals/email-signature-preview.svg',
          alt: 'Vista previa de la firma de correo de KIA de EXPERT',
          caption: 'La firma real mantiene los enlaces contextuales a Chat y Telegram.',
        },
      ],
    },
  };
}
