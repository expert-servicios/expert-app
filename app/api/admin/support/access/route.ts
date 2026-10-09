import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

const schema = z.object({
  clientId: z.string().uuid(),
  companyId: z.string().uuid().nullable(),
  action: z.enum(['support_open', 'support_company_select', 'support_exit']),
}).strict();

function deviceCategory(agent: string): 'mobile' | 'tablet' | 'desktop' | 'unknown' {
  if (!agent) return 'unknown';
  if (/ipad|tablet|android(?!.*mobile)/i.test(agent)) return 'tablet';
  if (/mobi|iphone|ipod/i.test(agent)) return 'mobile';
  return 'desktop';
}
function browserFamily(agent: string): string {
  if (/edg\//i.test(agent)) return 'Edge';
  if (/firefox\//i.test(agent)) return 'Firefox';
  if (/chrome\//i.test(agent)) return 'Chrome';
  if (/safari\//i.test(agent)) return 'Safari';
  return 'Other';
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  const admin = getSupabaseAdmin();
  const { data: actor } = await admin.from('profiles').select('role,status').eq('id',user.id).maybeSingle();
  if (!actor || actor.status === 'inactive' || !['owner','admin'].includes(actor.role)) {
    return NextResponse.json({ error:'No autorizado' }, { status:403 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error:'Solicitud inválida' }, { status:400 });
  const { clientId,companyId,action } = parsed.data;
  const { data: client, error: clientError } = await admin.from('profiles').select('id').eq('id',clientId).maybeSingle();
  if (clientError) return NextResponse.json({ error:'No se pudo verificar el cliente' }, { status:500 });
  if (!client) return NextResponse.json({ error:'Cliente no encontrado' }, { status:404 });
  if (companyId) {
    const { data: membership, error: membershipError } = await admin.from('profile_companies')
      .select('company_id').eq('profile_id',clientId).eq('company_id',companyId).maybeSingle();
    if (membershipError) return NextResponse.json({ error:'No se pudo verificar la empresa' }, { status:500 });
    if (!membership) return NextResponse.json({ error:'Empresa ajena al cliente' }, { status:403 });
  }
  // Browser family/device class are contextual hints, not a unique fingerprint.
  // Never store full user-agent, IP, token or a session cookie in this audit event.
  const agent = request.headers.get('user-agent') ?? '';
  const { error: auditError } = await admin.from('audit_logs').insert({
    actor_id:user.id,
    action,
    entity:'client_support',
    entity_id:clientId,
    metadata: {
      company_id:companyId,
      route:'admin_client_portal',
      device_category:deviceCategory(agent),
      browser_family:browserFamily(agent),
      recorded_by:'server',
    },
  });
  if (auditError) {
    console.error('[admin/support/access] audit write failed:',auditError.message);
    return NextResponse.json({ error:'No se pudo registrar la auditoría' }, { status:503 });
  }
  return NextResponse.json({ ok:true });
}
