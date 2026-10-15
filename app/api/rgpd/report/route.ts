import { NextRequest,NextResponse } from 'next/server';
import { z } from 'zod';
import { pdf } from '@react-pdf/renderer';
import { createElement } from 'react';
import { RgpdReportPdf, type RgpdReportTopic } from '@/components/tools/RgpdReportPdf';
import { AEPD_TOOLS, recommendAepdTools } from '@/lib/rgpd/aepd-tool-recommendation';
import { RGPD_MODULE_TOPICS } from '@/lib/rgpd/plain-language-review-topics';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { ensureInboundLead } from '@/lib/leads/ensure-inbound-lead';
import { sendEmail } from '@/lib/email/send';
import { getClientIp,checkRateLimit,checkSpam } from '@/lib/utils/spam-guard';
import { verifyRecaptchaToken } from '@/lib/utils/recaptcha';
const dataSchema=z.object({
 name:z.string().trim().min(2).max(80),
 email:z.email().max(160),
 locale:z.enum(['es','ru']),
 method:z.enum(['download','email']),
 marketingConsent:z.boolean().default(false),
 informed:z.literal(true),
 recaptchaToken:z.string().max(4096),
 hp_url:z.string().max(500).optional(),
 answers:z.record(z.string().max(32),z.union([z.boolean(),z.enum(['none','basic','advanced','ordinary','startup','multiple','unknown'])])).refine(v=>Object.keys(v).length<=20)
}).strict();

export async function POST(request:NextRequest){
 try{
  if(!checkRateLimit(getClientIp(request.headers)))return NextResponse.json({error:'rate_limited'},{status:429});
  const raw=await request.text();
  if(raw.length>10000)return NextResponse.json({error:'payload_too_large'},{status:413});
  const input=dataSchema.safeParse(JSON.parse(raw));
  if(!input.success)return NextResponse.json({error:'invalid_input'},{status:400});
  const d=input.data;
  if(d.hp_url)return NextResponse.json({error:'invalid_input'},{status:400});
  const captcha=await verifyRecaptchaToken({token:d.recaptchaToken,action:'rgpd_report'});
  if(!captcha.ok)return NextResponse.json({error:'verification_failed'},{status:400});
  if(checkSpam({name:d.name,email:d.email,message:'RGPD report'}).isSpam)return NextResponse.json({error:'verification_failed'},{status:400});
  // The server recalculates all recommendations. Client text, score, URLs and claims are never trusted.
  const rec=recommendAepdTools(d.answers);
  const ids=['rat','privacy',...(d.answers.processors===true||d.answers.international===true?['processors']:[]),'security','rights','breaches','retention',...(d.answers.website===true||d.answers.cookies==='basic'||d.answers.cookies==='advanced'?['web']:[])];
  const topics:RgpdReportTopic[]=ids.slice(0,8).map(id=>{const t=RGPD_MODULE_TOPICS[id];return {title:t.title,why:t.why,action:t.action,guideUrl:'https://expertconsulting.es'+t.guide};});
  // Russian font embedding is a QA gate: until a supported Cyrillic font is bundled, prevent corrupt PDF output.
  if(d.locale==='ru')return NextResponse.json({error:'russian_pdf_pending_font_qa'},{status:503});
  const issuedOn=new Date().toLocaleDateString('es-ES',{timeZone:'Europe/Madrid'});
  const document=createElement(RgpdReportPdf,{data:{name:d.name,locale:d.locale,date:issuedOn,primary:rec.primary,toolTitle:AEPD_TOOLS[rec.primary].title,toolUrl:AEPD_TOOLS[rec.primary].url,topics,extraReview:rec.needsProfessionalReview}}) as unknown as Parameters<typeof pdf>[0];
  const blob=await pdf(document).toBlob();
  const bytes=Buffer.from(await blob.arrayBuffer());
  if(!bytes||bytes.length<200)return NextResponse.json({error:'render_failed'},{status:500});
  // Only contact and provenance are stored, never questionnaire responses or health-risk flags.
  const lead=await ensureInboundLead({
   admin:getSupabaseAdmin(),name:d.name,email:d.email.trim().toLowerCase(),source:'website',sourceKey:`rgpd-report:${crypto.randomUUID()}`,
   category:'Recurso gratuito',service:'rgpd-informe-gratuito',message:'Solicitó guía RGPD personalizada (sin venta ni presupuesto).',
   channel:'rgpd_report',origin:'herramienta-rgpd',metadata:{report_requested_at:new Date().toISOString(),delivery_method:d.method,language:d.locale,marketing_consent:d.marketingConsent,marketing_consent_origin:d.marketingConsent?'rgpd_report_form':null},
  });
  if(d.method==='email'){
    await sendEmail({
      to:d.email.toLowerCase(),eventType:'rgpd.report.delivered',subject:'Tu guía RGPD personalizada · EXPERT',
      html:`<p>Hola, ${d.name.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')}:</p><p>Adjuntamos tu guía inicial RGPD solicitada. Incluye temas para revisar y enlaces oficiales de la AEPD. No es un certificado de cumplimiento.</p><p>Si quieres aprender a utilizar estas herramientas, puedes consultar la <a href="https://expertconsulting.es/servicios/empresas-autonomos/formacion-rgpd-aepd">formación de dos horas por 180 € + IVA</a>.</p><p>EXPERT Consulting</p>`,
      attachments:[{filename:'guia-rgpd-expert.pdf',content:Buffer.from(bytes).toString('base64'),type:'application/pdf'}],
      metadata:{lead_id:lead.leadId,source:'herramienta-rgpd'}
    });
    return NextResponse.json({ok:true,delivery:'email'});
  }
  return new NextResponse(new Uint8Array(bytes),{status:200,headers:{'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="guia-rgpd-expert.pdf"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 }catch(e){console.error('[rgpd-report] failed',e instanceof Error?e.message:'unknown');return NextResponse.json({error:'generation_failed'},{status:500});}
}
