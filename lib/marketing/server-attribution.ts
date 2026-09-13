import type { NextRequest } from 'next/server';
import { leadAttributionSchema, type LeadAttribution } from '@/lib/marketing/acquisition-taxonomy';
import { ACQUISITION_COOKIE_NAME } from '@/lib/marketing/client-attribution';

export function readRequestAttribution(request: NextRequest): LeadAttribution | null {
  const raw = request.cookies.get(ACQUISITION_COOKIE_NAME)?.value;
  if (!raw) return null;

  try {
    const decoded = decodeURIComponent(raw);
    const parsedJson = JSON.parse(decoded);
    const parsed = leadAttributionSchema.safeParse(parsedJson);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function buildLeadAttributionFields(
  request: NextRequest,
  options: { fallbackSource?: string; existingMetadata?: Record<string, unknown> } = {},
) {
  const acquisition = readRequestAttribution(request);
  const fallbackSource = options.fallbackSource ?? 'direct';
  const sourceKey = acquisition?.campaign ?? acquisition?.utmCampaign ?? acquisition?.utmSource ?? null;

  return {
    source: acquisition?.source ?? fallbackSource,
    source_key: sourceKey,
    metadata: {
      ...(options.existingMetadata ?? {}),
      ...(acquisition ? { acquisition } : {}),
    },
    acquisition,
  };
}

export function attributionFromMetadata(metadata: unknown): LeadAttribution | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  const acquisition = (metadata as Record<string, unknown>).acquisition;
  const parsed = leadAttributionSchema.safeParse(acquisition);
  return parsed.success ? parsed.data : null;
}
