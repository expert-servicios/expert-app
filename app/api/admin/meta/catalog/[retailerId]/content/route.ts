import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

const localeSchema = z.enum(['es', 'ru']);
const statusSchema = z.enum(['draft', 'active', 'paused', 'retired']);

const contentSchema = z.object({
  locale: localeSchema,
  name: z.string().trim().min(1).max(180),
  shortDescription: z.string().trim().max(500).nullable(),
  description: z.string().trim().max(5000).nullable(),
  metaTitle: z.string().trim().max(180).nullable(),
  metaDescription: z.string().trim().max(500).nullable(),
  landingPath: z.string().trim().startsWith('/').max(500),
  imageUrl: z.string().trim().max(1000).nullable(),
  status: statusSchema,
}).strict();

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

async function getService(retailerId: string) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('catalog_services')
    .select('id,slug,category_key,status')
    .eq('slug', retailerId)
    .single();

  if (error || !data) return null;
  return data;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ retailerId: string }> },
) {
  const actorId = await requireAdmin(request);
  if (!actorId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { retailerId } = await params;
  const service = await getService(retailerId);
  if (!service) return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('service_contents')
    .select('locale,name,short_description,description,meta_title,meta_description,landing_path,image_url,status,updated_at')
    .eq('service_id', service.id)
    .in('locale', ['es', 'ru'])
    .order('locale');

  if (error) {
    return NextResponse.json({ error: `No se pudo cargar el contenido: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({
    service,
    contents: data ?? [],
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ retailerId: string }> },
) {
  const actorId = await requireAdmin(request);
  if (!actorId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { retailerId } = await params;
  const service = await getService(retailerId);
  if (!service) return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });

  const parsed = contentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Contenido no válido', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const body = parsed.data;
  const admin = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { data, error } = await admin
    .from('service_contents')
    .upsert({
      service_id: service.id,
      locale: body.locale,
      name: body.name,
      short_description: body.shortDescription,
      description: body.description,
      meta_title: body.metaTitle,
      meta_description: body.metaDescription,
      landing_path: body.landingPath,
      image_url: body.imageUrl,
      status: body.status,
      updated_at: now,
    }, {
      onConflict: 'service_id,locale',
    })
    .select('locale,name,short_description,description,meta_title,meta_description,landing_path,image_url,status,updated_at')
    .single();

  if (error) {
    return NextResponse.json({ error: `No se pudo guardar el contenido: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    actorId,
    content: data,
  });
}
