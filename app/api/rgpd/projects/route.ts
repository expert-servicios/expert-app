import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

const MAX_PAYLOAD_BYTES = 250_000;

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'authentication_required' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const consent = Boolean((body as { consent?: boolean })?.consent);
  const payload = (body as { payload?: unknown })?.payload;

  if (!consent) {
    return NextResponse.json({ error: 'storage_consent_required' }, { status: 400 });
  }

  if (!payload || typeof payload !== 'object') {
    return NextResponse.json({ error: 'payload_required' }, { status: 400 });
  }

  const serialized = JSON.stringify(payload);
  if (new TextEncoder().encode(serialized).length > MAX_PAYLOAD_BYTES) {
    return NextResponse.json({ error: 'payload_too_large' }, { status: 413 });
  }

  const admin = getSupabaseAdmin();

  const { data: previous, error: versionError } = await admin
    .from('rgpd_self_implementation_projects')
    .select('version')
    .eq('user_id', user.id)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (versionError) {
    return NextResponse.json({ error: 'version_lookup_failed' }, { status: 500 });
  }

  const nextVersion = (previous?.version ?? 0) + 1;
  const now = new Date().toISOString();

  const { data, error } = await admin
    .from('rgpd_self_implementation_projects')
    .insert({
      user_id: user.id,
      version: nextVersion,
      status: 'draft',
      payload,
      consent_to_store: true,
      consent_at: now,
      updated_at: now,
    })
    .select('id,version,status,created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: 'save_failed' }, { status: 500 });
  }

  return NextResponse.json({ project: data }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'authentication_required' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('rgpd_self_implementation_projects')
    .select('id,version,status,created_at,updated_at')
    .eq('user_id', user.id)
    .order('version', { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: 'list_failed' }, { status: 500 });
  }

  return NextResponse.json({ projects: data ?? [] });
}
