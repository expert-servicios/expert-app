import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { prepareKiaJournalProposal } from '@/lib/ai/kia/kia-journal-proposals';

const input = z.object({
  date: z.string(), reason: z.string(), evidenceRefs: z.array(z.string()),
  lines: z.array(z.object({ account: z.string(), debitCents: z.number(), creditCents: z.number(), explanation: z.string().optional() }).strict()),
}).strict();
const decision = z.object({ id: z.string().uuid(), status: z.enum(['approved','rejected']), note: z.string().trim().min(3).max(2000) }).strict();

async function authorize(request: NextRequest, companyId: string) {
  const session = createServerSupabaseClient(request);
  const { data: { user }, error } = await session.auth.getUser();
  if (error || !user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role,status').eq('id',user.id).maybeSingle();
  if (!profile || profile.status === 'inactive' || !['owner','admin'].includes(profile.role)) return null;
  const { data: company } = await admin.from('companies').select('id').eq('id',companyId).maybeSingle();
  return company ? { admin, userId: user.id } : null;
}
type RouteContext = { params: Promise<{id:string}> };

export async function GET(request: NextRequest, {params}:RouteContext) {
  const {id} = await params; const ctx = await authorize(request,id);
  if(!ctx) return NextResponse.json({error:'Acceso denegado'},{status:403});
  const {data,error} = await ctx.admin.from('kia_journal_proposals')
    .select('id,company_id,entry_date,reason,evidence_refs,lines,total_debit_cents,total_credit_cents,status,created_at,review_note,reviewed_at')
    .eq('company_id',id).order('created_at',{ascending:false}).limit(100);
  if(error) return NextResponse.json({error:'No se pudo cargar la bandeja'},{status:500});
  return NextResponse.json({proposals:data,holdedMutated:false});
}
export async function POST(request:NextRequest,{params}:RouteContext) {
  const {id} = await params; const ctx = await authorize(request,id);
  if(!ctx) return NextResponse.json({error:'Acceso denegado'},{status:403});
  const raw = await request.json().catch(()=>null);const parsed = input.safeParse(raw);
  if(!parsed.success) return NextResponse.json({error:'Formato de asiento inválido'},{status:400});
  const result = prepareKiaJournalProposal({companyId:id,...parsed.data});
  if(!result.ok) return NextResponse.json({error:result.errors.join(' ')},{status:422});
  const p = result.proposal;
  const fingerprint = createHash('sha256').update(JSON.stringify({companyId:id,date:p.date,reason:p.reason,evidenceRefs:p.evidenceRefs,lines:p.lines})).digest('hex');
  const {data,error} = await ctx.admin.from('kia_journal_proposals').insert({
    company_id:id,created_by:ctx.userId,entry_date:p.date,reason:p.reason,evidence_refs:p.evidenceRefs,
    lines:p.lines,total_debit_cents:p.totalDebitCents,total_credit_cents:p.totalCreditCents,fingerprint,
  }).select('id,status').single();
  if(error) return NextResponse.json({error:error.code==='23505'?'Propuesta duplicada':'No se pudo guardar la propuesta'},{status:error.code==='23505'?409:500});
  return NextResponse.json({proposal:data,holdedMutated:false},{status:201});
}
export async function PATCH(request:NextRequest,{params}:RouteContext) {
  const {id} = await params; const ctx = await authorize(request,id);
  if(!ctx) return NextResponse.json({error:'Acceso denegado'},{status:403});
  const parsed = decision.safeParse(await request.json().catch(()=>null));
  if(!parsed.success) return NextResponse.json({error:'Decisión inválida'},{status:400});
  const {data,error} = await ctx.admin.from('kia_journal_proposals').update({
    status:parsed.data.status,review_note:parsed.data.note,reviewed_by:ctx.userId,reviewed_at:new Date().toISOString(),
  }).eq('id',parsed.data.id).eq('company_id',id).eq('status','pending_review').select('id,status').maybeSingle();
  if(error) return NextResponse.json({error:'No se pudo registrar la revisión'},{status:500});
  if(!data) return NextResponse.json({error:'Propuesta inexistente o ya revisada'},{status:409});
  return NextResponse.json({proposal:data,holdedMutated:false});
}
