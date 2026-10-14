'use client';
import { useCallback, useEffect, useState } from 'react';

type ReviewItem={
 id:string; title:string; kind:string; status:string; company_id:string;
 source_url:string; reviewed_at:string|null; review_note:string|null; version:number;
};
type Decision='investigate'|'confirmed'|'dismissed';
const labels:Record<Decision,string>={investigate:'Investigar',confirmed:'Confirmar revisión',dismissed:'Descartar'};
export default function AdminMeetingReviewsPage(){
 const [items,setItems]=useState<ReviewItem[]>([]);
 const [busy,setBusy]=useState('');
 const [error,setError]=useState('');
 const [notes,setNotes]=useState<Record<string,string>>({});
 const [loaded,setLoaded]=useState(false);
 const load=useCallback(async()=>{
  try{
   const res=await fetch('/api/admin/kia/meeting-notes/inbox',{cache:'no-store'});
   const data=await res.json();
   if(!res.ok)throw new Error(data.error||'No se pudo cargar');
   setItems(data.items||[]);setError('');
  }catch(e){setError(e instanceof Error?e.message:'Error de lectura')}
  finally{setLoaded(true)}
 },[]);
 useEffect(()=>{void load()},[load]);
 const decide=async(item:ReviewItem,decision:Decision)=>{
  const note=(notes[item.id]||'').trim();
  if(note.length<3){setError('Explica brevemente la decisión antes de guardarla.');return}
  setBusy(item.id);setError('');
  try{
   const res=await fetch('/api/admin/kia/meeting-notes/inbox',{
    method:'PATCH',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({itemId:item.id,version:item.version,decision,note})
   });
   const data=await res.json();
   if(!res.ok)throw new Error(data.error||'No se pudo guardar');
   await load();
  }catch(e){setError(e instanceof Error?e.message:'Error al revisar')}
  finally{setBusy('')}
 };
 return <main className="mx-auto max-w-6xl space-y-5 p-6 text-[#07111d]">
  <header><p className="text-xs font-semibold uppercase tracking-widest text-amber-700">KIA · QA</p>
   <h1 className="mt-1 text-2xl font-bold">Revisión postreunión</h1>
   <p className="mt-2 text-sm text-slate-600">Cuestiones extraídas de Google Meet pendientes de revisión profesional. Las decisiones se guardan con auditoría; no crean tareas ni envían correos.</p>
  </header>
  <button type="button" onClick={()=>void load()} className="rounded-lg border px-3 py-2 text-sm">Actualizar bandeja</button>
  {error&&<p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3">{error}</p>}
  {!loaded&&<p>Consultando revisiones…</p>}
  {loaded&&items.length===0&&!error&&<p className="rounded-xl border p-6">No hay cuestiones registradas. Las notas deben importarse desde una cita Google Meet autorizada.</p>}
  {items.map(item=><article key={item.id} className="space-y-3 rounded-xl border bg-white p-5">
   <div className="flex flex-wrap items-center gap-2">
    <strong className="flex-1">{item.title}</strong>
    <span className="rounded bg-amber-50 px-2 py-1 text-xs">{item.status}</span>
   </div>
   <div className="text-xs text-slate-600">Entidad: {item.company_id} · Tipo: {item.kind} · Versión: {item.version}</div>
   <a className="text-sm underline" href={item.source_url} target="_blank" rel="noreferrer">Consultar documento de reunión</a>
   {item.reviewed_at?
    <p className="text-sm">Decisión registrada: {item.review_note}</p>:
    <div className="space-y-2">
     <label className="block text-sm">Justificación obligatoria
      <textarea className="mt-1 w-full rounded border p-2" rows={2} maxLength={2000}
       value={notes[item.id]||''} onChange={e=>setNotes(v=>({...v,[item.id]:e.target.value}))}/>
     </label>
     <div className="flex flex-wrap gap-2">
      {(Object.keys(labels) as Decision[]).map(decision=>
       <button type="button" key={decision} disabled={busy===item.id}
        onClick={()=>void decide(item,decision)}
        className="rounded border border-slate-300 px-3 py-2 text-sm disabled:opacity-50">
        {labels[decision]}</button>)}
     </div>
    </div>}
  </article>)}
 </main>;
}