import type { KiaCopilotArtifact } from './kia-copilot-artifacts';

export interface KiaTelegramPresentation {
  text: string;
  quickReplies: string[];
  photos: Array<{ url: string; caption: string }>;
}

function absoluteUrl(url: string): string {
  if (/^https:\/\//i.test(url)) return url;
  const base = (process.env.NEXT_PUBLIC_APP_URL || 'https://expertconsulting.es').replace(/\/$/, '');
  return `${base}${url.startsWith('/') ? url : `/${url}`}`;
}

export function buildKiaTelegramPresentation(input: {
  reply: string;
  quickReplies: string[];
  artifacts: KiaCopilotArtifact[];
}): KiaTelegramPresentation {
  const links = input.artifacts
    .filter((artifact): artifact is Extract<KiaCopilotArtifact, { type: 'link' | 'report' }> =>
      artifact.type === 'link' || artifact.type === 'report')
    .slice(0, 4)
    .map((artifact) => `• ${artifact.title}: ${absoluteUrl(artifact.url)}`);

  const photos = input.artifacts
    .filter((artifact): artifact is Extract<KiaCopilotArtifact, { type: 'image' }> => artifact.type === 'image')
    .slice(0, 2)
    .map((artifact) => ({
      url: absoluteUrl(artifact.imageUrl),
      caption: [artifact.title, artifact.caption].filter(Boolean).join(' — '),
    }));

  return {
    text: [input.reply, links.length ? links.join('\n') : ''].filter(Boolean).join('\n\n'),
    quickReplies: input.quickReplies.slice(0, 3),
    photos,
  };
}
