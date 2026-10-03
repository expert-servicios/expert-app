import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import {
  buildMetaCatalogImageStoragePath,
  validateMetaCatalogImageMetadata,
  validateMetaCatalogImageSignature,
} from '@/lib/security/uploads';

const PUBLIC_BUCKET = 'user-files';
const ALLOWED_LOCALES = new Set(['es', 'ru']);

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ retailerId: string }> },
) {
  const actorId = await requireAdmin(request);
  if (!actorId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { retailerId } = await params;
  const formData = await request.formData();
  const file = formData.get('file');
  const locale = String(formData.get('locale') ?? '').toLowerCase();

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Imagen requerida' }, { status: 400 });
  }
  if (!ALLOWED_LOCALES.has(locale)) {
    return NextResponse.json({ error: 'Idioma no permitido' }, { status: 400 });
  }

  const validation = validateMetaCatalogImageMetadata(file.name, file.type, file.size);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: validation.status });
  }

  const admin = getSupabaseAdmin();
  const { data: service, error: serviceError } = await admin
    .from('catalog_services')
    .select('id,slug')
    .eq('slug', retailerId)
    .single();

  if (serviceError || !service) {
    return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!validateMetaCatalogImageSignature(buffer.subarray(0, 16), validation.contentType)) {
    return NextResponse.json({ error: 'La firma binaria de la imagen no coincide con el formato declarado.' }, { status: 400 });
  }

  const storagePath = buildMetaCatalogImageStoragePath(
    retailerId,
    locale,
    validation.safeName,
  );

  const { data: uploadData, error: uploadError } = await admin.storage
    .from(PUBLIC_BUCKET)
    .upload(storagePath, buffer, {
      contentType: validation.contentType,
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError || !uploadData) {
    return NextResponse.json(
      { error: `No se pudo subir la imagen: ${uploadError?.message ?? 'sin ruta'}` },
      { status: 500 },
    );
  }

  const { data: publicData } = admin.storage
    .from(PUBLIC_BUCKET)
    .getPublicUrl(uploadData.path);

  return NextResponse.json({
    ok: true,
    actorId,
    locale,
    publicUrl: publicData.publicUrl,
    storagePath: uploadData.path,
    contentType: validation.contentType,
    size: file.size,
  });
}
