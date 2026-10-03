import { NextRequest, NextResponse } from 'next/server';
import { ImageResponse } from 'next/og';
import { z } from 'zod';
import { getKiaAiBudgetGuard } from '@/lib/ai/kia/kia-ai-budget';
import { recordKiaProviderUsage } from '@/lib/ai/kia/kia-usage-log';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import {
  EXPERT_CATALOG_IMAGE_DEFAULT_MODEL,
  EXPERT_CATALOG_IMAGE_SIZE,
  EXPERT_CATALOG_IMAGE_STYLE_VERSION,
  buildExpertCatalogArtworkPrompt,
  catalogImageTitleSize,
  getExpertCatalogImagePreset,
  truncateCatalogImageSupport,
  type CatalogImageLocale,
} from '@/lib/marketing/expert-catalog-image-ai';
import { buildMetaCatalogImageStoragePath } from '@/lib/security/uploads';

export const runtime = 'nodejs';
export const maxDuration = 300;

const PUBLIC_BUCKET = 'user-files';

const bodySchema = z.object({
  locale: z.enum(['es', 'ru']),
  name: z.string().trim().min(1).max(180),
  shortDescription: z.string().trim().max(500).nullable().optional(),
  customBrief: z.string().trim().max(500).nullable().optional(),
}).strict();

type OpenAiImageResponse = {
  data?: Array<{
    b64_json?: string;
    revised_prompt?: string;
  }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
    input_tokens_details?: {
      image_tokens?: number;
      text_tokens?: number;
    };
  };
  error?: {
    message?: string;
    code?: string;
    type?: string;
    moderation_details?: unknown;
  };
};

let expertLogoDataUriPromise: Promise<string | null> | null = null;

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('profiles')
    .select('role,status')
    .eq('id', user.id)
    .single();

  if (profile?.status === 'inactive') return null;
  if (profile?.role !== 'admin' && profile?.role !== 'owner') return null;
  return user.id;
}

async function getExpertLogoDataUri(): Promise<string | null> {
  if (!expertLogoDataUriPromise) {
    expertLogoDataUriPromise = (async () => {
      try {
        const response = await fetch('https://expertconsulting.es/branding/expert-logo.png', {
          cache: 'force-cache',
        });
        if (!response.ok) return null;
        const buffer = Buffer.from(await response.arrayBuffer());
        return `data:image/png;base64,${buffer.toString('base64')}`;
      } catch {
        return null;
      }
    })();
  }
  return expertLogoDataUriPromise;
}

function buildSubtitleChildren(subtitle: string) {
  const parts = subtitle.split('•').map((part) => part.trim()).filter(Boolean);
  return parts.flatMap((part, index) => {
    const children: unknown[] = [
      {
        type: 'div',
        props: {
          style: {
            display: 'flex',
            color: '#0D2B59',
            fontSize: 23,
            fontWeight: 600,
            whiteSpace: 'nowrap',
          },
          children: part,
        },
      },
    ];

    if (index < parts.length - 1) {
      children.push({
        type: 'div',
        props: {
          style: {
            display: 'flex',
            width: 7,
            height: 7,
            borderRadius: 999,
            background: '#C9941A',
            margin: '0 11px',
          },
          children: [],
        },
      });
    }

    return children;
  });
}

function buildPremiumCardElement(input: {
  artworkDataUri: string;
  logoDataUri: string | null;
  locale: CatalogImageLocale;
  categoryKey: string;
  name: string;
  shortDescription?: string | null;
}) {
  const preset = getExpertCatalogImagePreset(input.categoryKey, input.locale);
  const support = truncateCatalogImageSupport(input.shortDescription);
  const title = input.name.trim().toUpperCase();
  const titleSize = catalogImageTitleSize(title);

  return {
    type: 'div',
    props: {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
        background: '#F8F3E9',
        fontFamily: 'serif',
      },
      children: [
        {
          type: 'img',
          props: {
            src: input.artworkDataUri,
            width: EXPERT_CATALOG_IMAGE_SIZE,
            height: EXPERT_CATALOG_IMAGE_SIZE,
            style: {
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            },
          },
        },
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              inset: 0,
              display: 'flex',
              background:
                'linear-gradient(90deg, rgba(250,247,240,0.99) 0%, rgba(250,247,240,0.98) 34%, rgba(250,247,240,0.80) 50%, rgba(250,247,240,0.16) 70%, rgba(250,247,240,0.02) 100%)',
            },
            children: [],
          },
        },
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              left: 48,
              top: 45,
              width: 555,
              display: 'flex',
              flexDirection: 'column',
            },
            children: [
              input.logoDataUri
                ? {
                    type: 'img',
                    props: {
                      src: input.logoDataUri,
                      width: 205,
                      height: 118,
                      style: { objectFit: 'contain', objectPosition: 'left center' },
                    },
                  }
                : {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        color: '#0D2B59',
                        fontSize: 40,
                        fontWeight: 700,
                        letterSpacing: 5,
                      },
                      children: 'EXPERT',
                    },
                  },
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    marginTop: 40,
                    color: '#0D2B59',
                    fontSize: titleSize,
                    fontWeight: 700,
                    lineHeight: 0.98,
                    letterSpacing: -1,
                    maxWidth: 555,
                    textTransform: 'uppercase',
                  },
                  children: title,
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    marginTop: 22,
                    maxWidth: 545,
                  },
                  children: buildSubtitleChildren(preset.subtitle),
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    marginTop: 20,
                    width: 360,
                  },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: { display: 'flex', width: 145, height: 2, background: '#C9941A' },
                        children: [],
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          width: 8,
                          height: 8,
                          borderRadius: 999,
                          background: '#C9941A',
                          margin: '0 10px',
                        },
                        children: [],
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: { display: 'flex', width: 145, height: 2, background: '#C9941A' },
                        children: [],
                      },
                    },
                  ],
                },
              },
              support
                ? {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        marginTop: 23,
                        color: '#394A5E',
                        fontFamily: 'sans-serif',
                        fontSize: 24,
                        lineHeight: 1.25,
                        maxWidth: 500,
                      },
                      children: support,
                    },
                  }
                : null,
            ].filter(Boolean),
          },
        },
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              left: 44,
              right: 44,
              bottom: 34,
              display: 'flex',
              justifyContent: 'space-between',
              gap: 14,
            },
            children: preset.features.map((feature) => ({
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  width: '32%',
                  minHeight: 94,
                  padding: '14px 16px',
                  borderRadius: 20,
                  background: 'rgba(255,253,248,0.94)',
                  border: '1px solid rgba(201,148,26,0.55)',
                  boxShadow: '0 8px 24px rgba(13,43,89,0.10)',
                },
                children: [
                  {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 50,
                        height: 50,
                        borderRadius: 999,
                        background: '#0D2B59',
                        border: '2px solid #C9941A',
                        marginRight: 12,
                        flexShrink: 0,
                      },
                      children: {
                        type: 'div',
                        props: {
                          style: {
                            display: 'flex',
                            width: 15,
                            height: 15,
                            borderRadius: 4,
                            border: '3px solid #E0B544',
                          },
                          children: [],
                        },
                      },
                    },
                  },
                  {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        color: '#0D2B59',
                        fontFamily: 'sans-serif',
                        fontSize: feature.length > 22 ? 17 : 19,
                        fontWeight: 600,
                        lineHeight: 1.15,
                      },
                      children: feature,
                    },
                  },
                ],
              },
            })),
          },
        },
      ],
    },
  };
}

function imageGenerationErrorMessage(data: OpenAiImageResponse, status: number): string {
  const code = data.error?.code ?? '';
  if (code === 'moderation_blocked') {
    return 'La solicitud de imagen fue bloqueada por los controles de seguridad. Ajusta las indicaciones visuales.';
  }
  return data.error?.message ?? `OpenAI Images respondió HTTP ${status}`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ retailerId: string }> },
) {
  const actorId = await requireAdmin(request);
  if (!actorId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos de generación no válidos' }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY no está configurada' }, { status: 503 });
  }

  const budgetGuard = await getKiaAiBudgetGuard();
  if (budgetGuard.mode === 'exhausted' || budgetGuard.blockedProviders.includes('openai')) {
    return NextResponse.json(
      { error: 'El presupuesto de OpenAI ha alcanzado el límite configurado.' },
      { status: 429 },
    );
  }

  const { retailerId } = await params;
  const admin = getSupabaseAdmin();
  const { data: service, error: serviceError } = await admin
    .from('catalog_services')
    .select('id,slug,category_key,status')
    .eq('slug', retailerId)
    .single();

  if (serviceError || !service) {
    return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });
  }
  if (service.status !== 'active') {
    return NextResponse.json({ error: 'Solo se generan imágenes para servicios activos' }, { status: 409 });
  }

  const model = process.env.OPENAI_CATALOG_IMAGE_MODEL?.trim() || EXPERT_CATALOG_IMAGE_DEFAULT_MODEL;
  const qualityRaw = process.env.OPENAI_CATALOG_IMAGE_QUALITY?.trim().toLowerCase();
  const quality = ['medium', 'high', 'xhigh', 'max'].includes(qualityRaw ?? '')
    ? qualityRaw
    : 'high';

  const prompt = buildExpertCatalogArtworkPrompt({
    categoryKey: service.category_key,
    locale: parsed.data.locale,
    serviceName: parsed.data.name,
    shortDescription: parsed.data.shortDescription,
    customBrief: parsed.data.customBrief,
  });

  const startedAt = Date.now();
  let openAiData: OpenAiImageResponse;

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt,
        n: 1,
        size: '1024x1024',
        quality,
        background: 'opaque',
        output_format: 'png',
      }),
      signal: AbortSignal.timeout(240_000),
    });

    openAiData = await response.json() as OpenAiImageResponse;
    if (!response.ok) {
      return NextResponse.json(
        { error: imageGenerationErrorMessage(openAiData, response.status) },
        { status: response.status >= 500 ? 502 : response.status },
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? `No se pudo generar la imagen: ${error.message}` : 'No se pudo generar la imagen' },
      { status: 502 },
    );
  }

  const encodedArtwork = openAiData.data?.[0]?.b64_json;
  if (!encodedArtwork) {
    return NextResponse.json({ error: 'OpenAI no devolvió una imagen' }, { status: 502 });
  }

  const artworkBuffer = Buffer.from(encodedArtwork, 'base64');
  if (artworkBuffer.length <= 0 || artworkBuffer.length > 12 * 1024 * 1024) {
    return NextResponse.json({ error: 'La imagen generada tiene un tamaño no válido' }, { status: 502 });
  }

  const artworkDataUri = `data:image/png;base64,${artworkBuffer.toString('base64')}`;
  const logoDataUri = await getExpertLogoDataUri();

  let finalBuffer: Buffer;
  try {
    const imageResponse = new ImageResponse(
      buildPremiumCardElement({
        artworkDataUri,
        logoDataUri,
        locale: parsed.data.locale,
        categoryKey: service.category_key,
        name: parsed.data.name,
        shortDescription: parsed.data.shortDescription,
      }) as never,
      {
        width: EXPERT_CATALOG_IMAGE_SIZE,
        height: EXPERT_CATALOG_IMAGE_SIZE,
      },
    );
    finalBuffer = Buffer.from(await imageResponse.arrayBuffer());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? `No se pudo componer la creatividad: ${error.message}` : 'No se pudo componer la creatividad' },
      { status: 500 },
    );
  }

  const storagePath = buildMetaCatalogImageStoragePath(
    retailerId,
    parsed.data.locale,
    `${EXPERT_CATALOG_IMAGE_STYLE_VERSION}-ia.png`,
  );

  const { data: uploadData, error: uploadError } = await admin.storage
    .from(PUBLIC_BUCKET)
    .upload(storagePath, finalBuffer, {
      contentType: 'image/png',
      cacheControl: '31536000',
      upsert: false,
    });

  if (uploadError || !uploadData) {
    return NextResponse.json(
      { error: `No se pudo guardar la imagen generada: ${uploadError?.message ?? 'sin ruta'}` },
      { status: 500 },
    );
  }

  const { data: publicData } = admin.storage.from(PUBLIC_BUCKET).getPublicUrl(uploadData.path);

  await recordKiaProviderUsage({
    providerResult: {
      provider: 'openai',
      model,
      usage: openAiData.usage,
    },
    taskType: 'catalog_image_generation',
    channel: 'admin_marketing_hub',
    serviceSlug: retailerId,
    rawInput: {
      locale: parsed.data.locale,
      categoryKey: service.category_key,
      styleVersion: EXPERT_CATALOG_IMAGE_STYLE_VERSION,
      prompt,
    },
  });

  return NextResponse.json({
    ok: true,
    actorId,
    locale: parsed.data.locale,
    publicUrl: publicData.publicUrl,
    storagePath: uploadData.path,
    contentType: 'image/png',
    size: finalBuffer.length,
    width: EXPERT_CATALOG_IMAGE_SIZE,
    height: EXPERT_CATALOG_IMAGE_SIZE,
    model,
    quality,
    styleVersion: EXPERT_CATALOG_IMAGE_STYLE_VERSION,
    revisedPrompt: openAiData.data?.[0]?.revised_prompt ?? null,
    latencyMs: Date.now() - startedAt,
  });
}
