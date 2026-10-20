import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { encryptSecret, decryptSecret, keyLast4 } from '@/lib/security/encryption';
import { isEncryptionConfigured } from '@/lib/integrations/holded/holded-client';
import { createHoldedV2ClientFromRawKey } from '@/lib/integrations/holded/holded-v2-client';

const provider = 'holded_migration';
const requestSchema = z.object({
  apiKey: z.string().trim().min(8).max(256),
  consentConfirmed: z.literal(true),
}).strict();

async function requireAdmin(request: NextRequest, companyId: string) {
  if (!z.string().uuid().safeParse(companyId).success) return null;
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role,status').eq('id', user.id).maybeSingle();
  if (!profile || profile.status === 'inactive' || !['admin','owner'].includes(profile.role)) return null;
  const { data: company } = await admin.from('companies').select('id,razon_social,cif_nif').eq('id',companyId).maybeSingle();
  if (!company) return null;
  return { admin, company, actorId: user.id };
}

export async function GET(request: NextRequest,{params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  const auth=await requireAdmin(request,id);
  if (!auth) return NextResponse.json({error:'No autorizado'},{status:403});
  const {data,error}=await auth.admin.from('client_integrations').select('id,status,api_key_last4,last_success_at')
    .eq('company_id',id).eq('provider',provider).eq('status','active').maybeSingle();
  if(error) return NextResponse.json({error:'No se pudo consultar el destino'},{status:500});
  return NextResponse.json({connected:Boolean(data),last4:data?.api_key_last4??null,
    verifiedAt:data?.last_success_at??null,cutoverPerformed:false},
    {headers:{'Cache-Control':'no-store'}});
}

export async function POST(request: NextRequest,{params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  const auth=await requireAdmin(request,id);
  if (!auth) return NextResponse.json({error:'No autorizado'},{status:403});
  if (!isEncryptionConfigured()) return NextResponse.json({error:'Cifrado no configurado'},{status:503});
  const origin=request.headers.get('origin');
  if(!origin || new URL(origin).origin!==new URL(request.url).origin) {
    return NextResponse.json({error:'Origen no autorizado'},{status:403});
  }
  const parsed=requestSchema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success) return NextResponse.json({error:'Datos inválidos'},{status:400});
  const {admin,actorId}=auth;
  const {data:source}=await admin.from('client_integrations').select('id,status,api_version')
    .eq('company_id',id).eq('provider','holded').eq('status','active').maybeSingle();
  if(!source || source.api_version!=='v2') return NextResponse.json({error:'Falta el origen Holded V2'},{status:409});
  const {data:sourceSecret}=await admin.from('client_integration_secrets')
    .select('encrypted_api_key').eq('integration_id',source.id).maybeSingle();
  if(!sourceSecret?.encrypted_api_key) return NextResponse.json({error:'Secreto origen no disponible'},{status:409});
  const raw=parsed.data.apiKey;
  try { if(decryptSecret(sourceSecret.encrypted_api_key)===raw) return NextResponse.json({error:'Destino coincide con origen'},{status:409}); }
  catch { return NextResponse.json({error:'No se pudo verificar secreto origen'},{status:409}); }
  try {
    const client=createHoldedV2ClientFromRawKey(raw);
    await Promise.all([client.listLedgerEntries({limit:1}),client.listAccountingAccounts({limit:1})]);
  } catch { return NextResponse.json({error:'El token destino no permite las lecturas contables requeridas'},{status:422}); }
  const {data:existing}=await admin.from('client_integrations').select('id')
    .eq('company_id',id).eq('provider',provider).eq('status','active').maybeSingle();
  if(existing) return NextResponse.json({error:'Ya existe destino; no se permite sobrescribirlo durante la migración'},{status:409});
  const now=new Date().toISOString();
  const {error:auditError}=await admin.from('audit_logs').insert({actor_id:actorId,action:'holded.migration_destination_stage_requested',entity:'companies',entity_id:id,metadata:{source_integration_id:source.id,read_only:true}});
  if(auditError) return NextResponse.json({error:'No se pudo registrar auditoría'},{status:503});
  const {data:row,error:createError}=await admin.from('client_integrations').insert({
    company_id:id,client_id:null,provider,mode:'advisor_managed',api_version:'v2',
    api_key_last4:keyLast4(raw),status:'pending',sync_mode:'read_only',
    permissions_detected:{accountingEntries:true,accountingAccounts:true},
    permissions_enabled:{accountingEntries:true,accountingAccounts:true},
    last_success_at:now,connected_by:actorId,consent_at:now,consent_version:'admin-migration-staging-v1',
    channel:'admin_migration_staging',created_at:now,updated_at:now
  }).select('id').single();
  if(createError || !row) return NextResponse.json({error:'No se pudo registrar el destino'},{status:500});
  const {error:secretError}=await admin.from('client_integration_secrets').insert({
    integration_id:row.id,encrypted_api_key:encryptSecret(raw),updated_at:now
  });
  if(secretError){
    await admin.from('client_integrations').delete().eq('id',row.id).eq('provider',provider);
    return NextResponse.json({error:'No se pudo almacenar el destino cifrado'},{status:500});
  }
  const {error:activateError}=await admin.from('client_integrations').update({status:'active'}).eq('id',row.id).eq('company_id',id).eq('provider',provider);
  if(activateError) return NextResponse.json({error:'Token cifrado registrado, pero la activación está pendiente de revisión'},{status:503});
  await admin.from('audit_logs').insert({actor_id:actorId,action:'holded.migration_destination_staged',
    entity:'companies',entity_id:id,metadata:{destination_integration_id:row.id,read_only:true,source_preserved:true}});
  return NextResponse.json({ok:true,last4:keyLast4(raw),sourcePreserved:true,cutoverPerformed:false},
    {headers:{'Cache-Control':'no-store'}});
}
