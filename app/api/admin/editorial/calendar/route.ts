import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/auth/require-admin';

const CHANNEL_PROVIDER: Record<string,'meta'|'linkedin'|'google_ads'> = {
  facebook:'meta',
  instagram:'meta',
  meta_ads:'meta',
  linkedin_member:'linkedin',
  linkedin_organization:'linkedin',
  linkedin_ads:'linkedin',
  google_ads:'google_ads',
};

function clean(value: unknown, max=500) {
  return typeof value === 'string' ? value.trim().slice(0,max) : '';
}

export async function GET(request: NextRequest) {
  try {
    const admin=await requireAdminClient(request);
    if(!admin) return NextResponse.json({error:'No autorizado'},{status:403});

    const url=new URL(request.url);
    const from=clean(url.searchParams.get('from'),80);
    const to=clean(url.searchParams.get('to'),80);

    let jobs=admin
      .from('social_publication_jobs')
      .select('id,content_item_id,channel_account_id,provider,channel,scheduled_at,status,external_object_id,external_url,attempt_count,last_error_code,last_error_message,published_at,metadata,created_at')
      .order('scheduled_at',{ascending:true});
    if(from) jobs=jobs.gte('scheduled_at',from);
    if(to) jobs=jobs.lt('scheduled_at',to);

    const [{data:jobRows,error:jobsError},{data:accounts,error:accountsError}]=await Promise.all([
      jobs.limit(500),
      admin.from('social_channel_accounts')
        .select('id,provider,channel,external_account_id,display_name,status,auth_mode,scopes,last_verified_at,metadata')
        .order('provider',{ascending:true}),
    ]);
    if(jobsError) throw jobsError;
    if(accountsError) throw accountsError;

    const ids=Array.from(new Set((jobRows??[]).map(j=>j.content_item_id)));
    let content:Record<string,unknown>[]=[];
    if(ids.length){
      const {data,error}=await admin.from('social_content_items')
        .select('id,title,pillar,status,consent_required,consent_status,linkedin_copy,facebook_copy,instagram_copy,cta_url,asset_type')
        .in('id',ids);
      if(error) throw error;
      content=data??[];
    }

    return NextResponse.json({jobs:jobRows??[],accounts:accounts??[],content});
  } catch(error){
    console.error('[admin/editorial/calendar] GET error:',error);
    return NextResponse.json({error:'Error interno'},{status:500});
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin=await requireAdminClient(request);
    if(!admin) return NextResponse.json({error:'No autorizado'},{status:403});
    const body=await request.json().catch(()=>null);
    if(!body||typeof body!=='object') return NextResponse.json({error:'Solicitud no válida'},{status:400});

    const contentItemId=clean(body.content_item_id,80);
    const channel=clean(body.channel,40);
    const scheduledAt=clean(body.scheduled_at,80);
    const channelAccountId=clean(body.channel_account_id,80)||null;
    const provider=CHANNEL_PROVIDER[channel];
    if(!contentItemId||!provider||!scheduledAt) return NextResponse.json({error:'Contenido, canal y fecha son obligatorios'},{status:400});

    const date=new Date(scheduledAt);
    if(Number.isNaN(date.getTime())) return NextResponse.json({error:'Fecha no válida'},{status:400});

    const {data:item,error:itemError}=await admin.from('social_content_items')
      .select('id,status,consent_required,consent_status,title')
      .eq('id',contentItemId).maybeSingle();
    if(itemError) throw itemError;
    if(!item) return NextResponse.json({error:'Contenido no encontrado'},{status:404});
    if(item.status!=='approved'&&item.status!=='scheduled'){
      return NextResponse.json({error:'El contenido debe estar aprobado antes de programarlo.'},{status:409});
    }
    if(item.consent_required&&item.consent_status!=='granted'){
      return NextResponse.json({error:'No se puede programar sin consentimiento.'},{status:409});
    }

    if(channelAccountId){
      const {data:account,error:accountError}=await admin.from('social_channel_accounts')
        .select('id,provider,channel,status').eq('id',channelAccountId).maybeSingle();
      if(accountError) throw accountError;
      if(!account) return NextResponse.json({error:'Cuenta de canal no encontrada'},{status:404});
      if(account.provider!==provider||account.channel!==channel){
        return NextResponse.json({error:'La cuenta no corresponde al canal seleccionado.'},{status:409});
      }
    }

    const {data,error}=await admin.from('social_publication_jobs')
      .insert({
        content_item_id:contentItemId,
        channel_account_id:channelAccountId,
        provider,
        channel,
        scheduled_at:date.toISOString(),
        status:'scheduled',
        metadata:{account_connection_required:!channelAccountId},
      })
      .select('*').single();
    if(error) throw error;

    await admin.from('social_content_items')
      .update({status:'scheduled',scheduled_at:date.toISOString(),updated_at:new Date().toISOString()})
      .eq('id',contentItemId);

    return NextResponse.json({ok:true,job:data});
  } catch(error){
    console.error('[admin/editorial/calendar] POST error:',error);
    return NextResponse.json({error:'Error interno'},{status:500});
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin=await requireAdminClient(request);
    if(!admin) return NextResponse.json({error:'No autorizado'},{status:403});
    const body=await request.json().catch(()=>null);
    if(!body||typeof body!=='object') return NextResponse.json({error:'Solicitud no válida'},{status:400});
    const id=clean(body.id,80);
    if(!id) return NextResponse.json({error:'ID requerido'},{status:400});

    const patch:Record<string,unknown>={updated_at:new Date().toISOString()};
    if(typeof body.scheduled_at==='string'){
      const date=new Date(body.scheduled_at);
      if(Number.isNaN(date.getTime())) return NextResponse.json({error:'Fecha no válida'},{status:400});
      patch.scheduled_at=date.toISOString();
    }
    if(body.status==='cancelled') patch.status='cancelled';

    const {data,error}=await admin.from('social_publication_jobs').update(patch).eq('id',id).select('*').maybeSingle();
    if(error) throw error;
    if(!data) return NextResponse.json({error:'Programación no encontrada'},{status:404});
    return NextResponse.json({ok:true,job:data});
  } catch(error){
    console.error('[admin/editorial/calendar] PATCH error:',error);
    return NextResponse.json({error:'Error interno'},{status:500});
  }
}
