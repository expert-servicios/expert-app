import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import {
  getBatch1PublicationReadiness,
  prepareBatch1PublicationReview,
  prepareServicePublicationReview,
} from '@/lib/services/service-publication-orchestrator';

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('profiles')
    .select('role,status')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.status === 'inactive') return null;
  if (profile?.role !== 'admin' && profile?.role !== 'owner') return null;
  return { user, admin };
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  return NextResponse.json({
    mode: 'readiness',
    externalWrites: false,
    services: getBatch1PublicationReadiness(),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const body = await request.json().catch(() => ({})) as { slug?: string; batch1?: boolean };

  if (body.batch1 === true) {
    const result = await prepareBatch1PublicationReview(auth.admin);
    return NextResponse.json({
      ...result,
      externalWrites: false,
      publishAction: 'review_only',
    });
  }

  const slug = body.slug?.trim();
  if (!slug) {
    return NextResponse.json({ error: 'slug o batch1=true es obligatorio' }, { status: 400 });
  }

  const result = await prepareServicePublicationReview(auth.admin, slug);
  return NextResponse.json({
    result,
    externalWrites: false,
    publishAction: 'review_only',
  });
}
