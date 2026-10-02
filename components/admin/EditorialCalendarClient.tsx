'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Plus, X } from 'lucide-react';

type ContentItem={id:string;title:string;pillar:string;status:string;consent_required:boolean;consent_status:string};
type Job={id:string;content_item_id:string;provider:string;channel:string;scheduled_at:string;status:string;channel_account_id:string|null;last_error_message:string|null};
type Account={id:string;provider:string;channel:string;display_name:string|null;status:string};

const CHANNEL_LABEL:Record<string,string>={
  facebook:'Facebook',instagram:'Instagram',meta_ads:'Meta Ads',
  linkedin_member:'LinkedIn perfil',linkedin_organization:'LinkedIn página',
  linkedin_ads:'LinkedIn Ads',google_ads:'Google Ads'
};

function monthStart(date:Date){return new Date(date.getFullYear(),date.getMonth(),1)}
function addMonths(date:Date,n:number){return new Date(date.getFullYear(),date.getMonth()+n,1)}
function key(date:Date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`}

export function EditorialCalendarClient({items,initialJobs,accounts}:{items:ContentItem[];initialJobs:Job[];accounts:Account[]}){
  const [month,setMonth]=useState(monthStart(new Date()));
  const [jobs,setJobs]=useState(initialJobs);
  const [selected,setSelected]=useState('');
  const [channel,setChannel]=useState('linkedin_member');
  const [dateTime,setDateTime]=useState('');
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);

  const approved=items.filter(i=>(i.status==='approved'||i.status==='scheduled')&&(!i.consent_required||i.consent_status==='granted'));
  const monthLabel=new Intl.DateTimeFormat('es-ES',{month:'long',year:'numeric'}).format(month);
  const first=monthStart(month);
  const mondayOffset=(first.getDay()+6)%7;
  const days=Array.from({length:42},(_,idx)=>new Date(first.getFullYear(),first.getMonth(),1-mondayOffset+idx));
  const jobsByDay=useMemo(()=>{
    const map=new Map<string,Job[]>();
    for(const job of jobs){
      if(job.status==='cancelled') continue;
      const d=new Date(job.scheduled_at);
      const k=key(d);
      const list=map.get(k)??[];
      list.push(job); map.set(k,list);
    }
    return map;
  },[jobs]);
  const itemMap=new Map(items.map(i=>[i.id,i]));
  const compatibleAccounts=accounts.filter(a=>a.channel===channel&&a.status==='connected');

  async function schedule(){
    if(!selected||!dateTime){setMessage('Selecciona contenido y fecha.');return}
    setBusy(true);setMessage('');
    const res=await fetch('/api/admin/editorial/calendar',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({
      content_item_id:selected,channel,scheduled_at:new Date(dateTime).toISOString(),
      channel_account_id:compatibleAccounts.length===1?compatibleAccounts[0].id:null,
    })});
    const data=await res.json().catch(()=>({}));
    setBusy(false);
    if(!res.ok){setMessage(data.error??'No se pudo programar.');return}
    setJobs(prev=>[...prev,data.job]);
    setMessage(compatibleAccounts.length===1?'Programado con cuenta conectada.':'Programado en EXPERT; faltará vincular la cuenta antes de publicar.');
    setSelected('');setDateTime('');
  }

  async function cancel(id:string){
    const res=await fetch('/api/admin/editorial/calendar',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({id,status:'cancelled'})});
    if(res.ok)setJobs(prev=>prev.map(j=>j.id===id?{...j,status:'cancelled'}:j));
  }

  return <section className="rounded-2xl border border-[#d8cbb5] bg-white p-5 shadow-sm">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c88b25]">Calendario multicanal</p>
        <h2 className="mt-1 font-serif text-2xl font-bold text-[#07111d]">Planificación de publicaciones</h2>
        <p className="mt-1 text-xs text-[#6f665b]">EXPERT controla la fecha canónica. La red social es el destino, no el calendario maestro.</p>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={()=>setMonth(addMonths(month,-1))} className="rounded-lg border border-[#d8cbb5] p-2"><ChevronLeft className="h-4 w-4"/></button>
        <span className="min-w-40 text-center text-sm font-bold capitalize">{monthLabel}</span>
        <button onClick={()=>setMonth(addMonths(month,1))} className="rounded-lg border border-[#d8cbb5] p-2"><ChevronRight className="h-4 w-4"/></button>
      </div>
    </div>

    <div className="mt-5 grid gap-3 rounded-xl border border-[#e7dece] bg-[#fffdf8] p-4 lg:grid-cols-[1.3fr_0.8fr_1fr_auto]">
      <select value={selected} onChange={e=>setSelected(e.target.value)} className="rounded-lg border border-[#d8cbb5] bg-white px-3 py-2 text-sm">
        <option value="">Contenido aprobado…</option>
        {approved.map(i=><option key={i.id} value={i.id}>{i.title}</option>)}
      </select>
      <select value={channel} onChange={e=>setChannel(e.target.value)} className="rounded-lg border border-[#d8cbb5] bg-white px-3 py-2 text-sm">
        {Object.entries(CHANNEL_LABEL).map(([v,l])=><option key={v} value={v}>{l}</option>)}
      </select>
      <input type="datetime-local" value={dateTime} onChange={e=>setDateTime(e.target.value)} className="rounded-lg border border-[#d8cbb5] bg-white px-3 py-2 text-sm"/>
      <button onClick={schedule} disabled={busy} className="inline-flex items-center justify-center gap-1 rounded-lg bg-[#07111d] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
        <Plus className="h-4 w-4"/> Programar
      </button>
    </div>
    {message&&<p className="mt-2 text-xs text-[#526171]">{message}</p>}

    <div className="mt-5 overflow-x-auto">
      <div className="min-w-[900px]">
        <div className="grid grid-cols-7 border-b border-[#e7dece] text-center text-[11px] font-bold uppercase tracking-wide text-[#7b6f62]">
          {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(d=><div key={d} className="py-2">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {days.map(day=>{
            const inMonth=day.getMonth()===month.getMonth();
            const list=jobsByDay.get(key(day))??[];
            return <div key={key(day)} className={`min-h-32 border-b border-r border-[#eee6d9] p-2 ${inMonth?'bg-white':'bg-[#faf8f3] text-slate-400'}`}>
              <div className="text-xs font-semibold">{day.getDate()}</div>
              <div className="mt-2 space-y-1.5">
                {list.map(job=>{
                  const item=itemMap.get(job.content_item_id);
                  const t=new Date(job.scheduled_at).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'});
                  return <div key={job.id} className="rounded-lg border border-[#e3d8c6] bg-[#fff9ed] p-2 text-[10px] text-[#29384a]">
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0">
                        <p className="font-bold">{t} · {CHANNEL_LABEL[job.channel]??job.channel}</p>
                        <p className="mt-0.5 line-clamp-2">{item?.title??'Contenido'}</p>
                        {!job.channel_account_id&&<p className="mt-1 text-amber-700">Cuenta pendiente</p>}
                      </div>
                      <button onClick={()=>cancel(job.id)} className="shrink-0 text-slate-400 hover:text-red-600" title="Cancelar"><X className="h-3 w-3"/></button>
                    </div>
                  </div>
                })}
              </div>
            </div>
          })}
        </div>
      </div>
    </div>
  </section>
}
