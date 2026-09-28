import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { z } from 'zod';
import { getSegmentRecipients, type SegmentKey } from '@/lib/campaigns/segments';

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = getSupabaseAdmin();
  const { data: p } = await admin.from('profiles').select('role').eq('id', user.id).single();
  return (p?.role === 'admin' || p?.role === 'owner') ? admin : null;
}

const updateSchema = z.object({
  title:     z.string().min(1).max(200).optional(),
  subject:   z.string().min(1).max(300).optional(),
  body_html: z.string().min(1).optional(),
  body_text: z.string().optional(),
  segment:   z.enum(['all_active','subscribers','no_subscription','leads','all','newsletter']).optional(),
  audience_segment: z.enum(['particular_residente','particular_no_residente','autonomo','empresa']).nullable().optional(),
  status:    z.enum(['draft','archived']).optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const { data: currentCampaign, error: currentError } = await admin
    .from('campaigns')
    .select('segment,audience_segment,status')
    .eq('id', id)
    .maybeSingle();
  if (currentError) return NextResponse.json({ error: currentError.message }, { status: 500 });
  if (!currentCampaign || currentCampaign.status !== 'draft') {
    return NextResponse.json({ error: 'Solo se pueden editar campañas en borrador.' }, { status: 409 });
  }

  const nextSegment = (parsed.data.segment ?? currentCampaign.segment) as SegmentKey;
  const requestedAudience = parsed.data.audience_segment !== undefined
    ? parsed.data.audience_segment
    : currentCampaign.audience_segment;
  const nextAudienceSegment = nextSegment === 'newsletter' ? requestedAudience ?? null : null;
  const recipients = await getSegmentRecipients(nextSegment, nextAudienceSegment);

  const { error } = await admin
    .from('campaigns')
    .update({
      ...parsed.data,
      audience_segment: nextAudienceSegment,
      recipient_count: recipients.length,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'draft');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { id } = await params;
  const { error } = await admin.from('campaigns').delete().eq('id', id).in('status', ['draft', 'archived']);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
