import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireActiveActor } from '@/lib/auth/active-actor';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';

const saveSchema = z.object({
 appointmentId:z.string().uuid(), companyId:z.string().uuid(), subjectId:z.string().uuid(),
 fileId:z.string().regex(/^[A-Za-z0-9_-]{15,128}$/),
 notesVersion:z.string().min(1).max(120),
 sourceUrl:z.string().url().startsWith('https://docs.google.com/document/d/'),
 items:z.array(z.object({
  sourceKey:z.string().min(10).max(600), title:z.string().min(3).max(300),
  kind:z.enum(['fact','question','proposed_action','legal_or_tax_opinion','census_attribute'])
 }).strict()).min(1).max(40)
}).strict();
const decisionSchema=z.object({
 itemId:z.string().uuid(), version:z.number().int().positive(),
 decision:z.enum(['investigate','confirmed','dismissed']), note:z.string().trim().min(3).max(2000)
}).strict();
const respond=(body:object,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
async function access(request:NextRequest){return requireActiveActor(request,['admin','owner']);}

export async function GET(request:NextRequest){
 if(!await access(request)) return respond({error:'No autorizado'},403);
 const admin=getSupabaseAdmin();
 const {data,error}=await admin.from('kia_meeting_review_items')
 .select('id,source_key,appointment_id,company_id,subject_id,file_id,source_url,notes_version,title,kind,status,review_note,version,created_at,reviewed_at')
 .order('created_at',{ascending:false}).limit(100);
 if(error) return respond({error:'No se pudo cargar la bandeja'},503);
 return respond({items:data??[],count:data?.length??0});
}

export async function POST(request:NextRequest){
 if(!await access(request)) return respond({error:'No autorizado'},403);
 const body=saveSchema.safeParse(await request.json().catch(()=>null));
 if(!body.success) return respond({error:'Solicitud inválida'},400);
 const input=body.data, admin=getSupabaseAdmin();
 const {data:appointment,error:e}=await admin.from('appointments')
 .select('id,company_id,google_event_id,booking_provider,appointment_end,status')
 .eq('id',input.appointmentId).maybeSingle();
 if(e||!appointment||appointment.company_id!==input.companyId||
 appointment.booking_provider!=='google_native'||!appointment.google_event_id||
 appointment.status==='cancelled'||Date.parse(appointment.appointment_end??'')>Date.now()||
 !Number.isFinite(Date.parse(appointment.appointment_end??''))) return respond({error:'Cita no verificada'},409);
 const {data:subject,error:s}=await admin.from('client_registry_subjects')
 .select('id,company_id,merged_into_subject_id').eq('id',input.subjectId).maybeSingle();
 if(s||!subject||subject.company_id!==input.companyId||subject.merged_into_subject_id) return respond({error:'Entidad incorrecta'},409);
 const {discoverCalendarMeetingNoteCandidates}=await import('@/lib/integrations/google-meeting-notes');
 const discovery=await discoverCalendarMeetingNoteCandidates(appointment.google_event_id);
 const attachment=discovery.candidates.find(x=>x.fileId===input.fileId&&x.sourceUrl===input.sourceUrl);
 if(!attachment) return respond({error:'Documento no vinculado'},403);
 // Re-fetch the exact Google Doc: client-provided titles or approvals are NEVER saved.
 const email=process.env.GOOGLE_GMAIL_SA_EMAIL,key=process.env.GOOGLE_GMAIL_SA_PRIVATE_KEY;
 if(!email||!key)return respond({error:'Credenciales Google no disponibles'},503);
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const {google}=(await import('googleapis')) as any;
 const auth=new google.auth.JWT({email,key:key.replace(/\\n/g,'\n'),
   scopes:['https://www.googleapis.com/auth/drive.readonly'],subject:'info@expertconsulting.es'});
 const drive=google.drive({version:'v3',auth});
 const file=await drive.files.get({fileId:input.fileId,fields:'id,mimeType,modifiedTime,trashed'});
 if(file.data.id!==input.fileId||file.data.mimeType!=='application/vnd.google-apps.document'||file.data.trashed)
   return respond({error:'Documento inválido'},409);
 if(file.data.modifiedTime!==input.notesVersion)return respond({error:'Las notas han cambiado; vuelve a extraerlas'},409);
 const doc=await drive.files.export({fileId:input.fileId,mimeType:'text/plain'},{responseType:'text'});
 if(typeof doc.data!=='string'||doc.data.length>96000)return respond({error:'Contenido inválido'},413);
 const {extractMeetingReviewCandidates}=await import('@/lib/ai/kia/kia-meeting-notes-extract');
 const {reviewMeetingStatements}=await import('@/lib/ai/kia/kia-meeting-note-review');
 const derived=reviewMeetingStatements(extractMeetingReviewCandidates(doc.data).map(c=>({
   ...c,meetingId:discovery.eventId,notesVersion:input.notesVersion,
   subjectId:subject.id,companyId:input.companyId,legalEntityScope:'legal_entity' as const,
   meetingNotesRef:attachment.sourceUrl,
   evidence:[{ref:attachment.sourceUrl,kind:'meeting_notes' as const,verified:false}],
   authorityDecisions:[]
 })));
 const derivedKeys=new Set(derived.map(x=>x.sourceKey));
 if(derived.length!==input.items.length||input.items.some(x=>!derivedKeys.has(x.sourceKey)))
   return respond({error:'Las cuestiones ya no coinciden con las notas verificadas'},409);
 const rows=derived.map(x=>({
  source_key:x.sourceKey,appointment_id:input.appointmentId,company_id:input.companyId,
  subject_id:subject.id,file_id:input.fileId,source_url:attachment.sourceUrl,
  notes_version:input.notesVersion,title:x.title,
  kind:input.items.find(y=>y.sourceKey===x.sourceKey)?.kind??'question',
  status:'pending_review'
 }));
 const {error:insertError}=await admin.from('kia_meeting_review_items')
   .upsert(rows,{onConflict:'source_key',ignoreDuplicates:true});
 if(insertError)return respond({error:'No se pudieron almacenar las cuestiones'},503);
 const {data:saved,error:readError}=await admin.from('kia_meeting_review_items')
   .select('id,source_key,status,version').in('source_key',rows.map(x=>x.source_key));
 if(readError)return respond({error:'No se pudo verificar el almacenamiento'},503);
 return respond({ok:true,stored:saved?.length??0,items:saved??[],externalActions:false});
}

export async function PATCH(request:NextRequest){
 const actor=await access(request);
 if(!actor) return respond({error:'No autorizado'},403);
 const input=decisionSchema.safeParse(await request.json().catch(()=>null));
 if(!input.success) return respond({error:'Decisión inválida'},400);
 const admin=getSupabaseAdmin(),v=input.data;
 const {data,error}=await admin.from('kia_meeting_review_items').update({
  status:v.decision,review_note:v.note,reviewed_by:actor.userId,
  reviewed_at:new Date().toISOString(),version:v.version+1
 }).eq('id',v.itemId).eq('status','pending_review').eq('version',v.version)
 .select('id,status,version').maybeSingle();
 if(error) return respond({error:'Error al guardar decisión'},503);
 if(!data) return respond({error:'La revisión ya ha cambiado; actualiza la bandeja'},409);
 return respond({item:data,writesPerformed:'review_decision_only',externalActions:false});
}
