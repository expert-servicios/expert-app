import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  return profile?.role === 'admin' || profile?.role === 'owner' ? { admin, userId: user.id } : null;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { data, error } = await auth.admin
    .from('kia_feedback')
    .select('id, rating, channel, user_message, kia_reply, intent, task_type, approved_for_learning, created_at')
    .eq('rating', 'positive')
    .not('user_message', 'is', null)
    .not('kia_reply', 'is', null)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: 'feedback_query_failed' }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

const patchSchema = z.object({
  id: z.string().uuid(),
  approved: z.boolean(),
}).strict();

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_request' }, { status: 400 });

  const { data, error } = await auth.admin
    .from('kia_feedback')
    .update({
      approved_for_learning: parsed.data.approved,
      feedback_context: {
        review_source: 'admin_kia_feedback',
        reviewed_by: auth.userId,
        reviewed_at: new Date().toISOString(),
      },
    })
    .eq('id', parsed.data.id)
    .eq('rating', 'positive')
    .select('id, approved_for_learning')
    .maybeSingle();

  if (error) return NextResponse.json({ error: 'feedback_update_failed' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'feedback_not_found' }, { status: 404 });
  return NextResponse.json({ ok: true, item: data });
}
