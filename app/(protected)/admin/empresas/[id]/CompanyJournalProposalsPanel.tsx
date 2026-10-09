'use client';
import { useCallback, useEffect, useState } from 'react';
import { JournalProposalSaveForm } from './JournalProposalSaveForm';

type Proposal = {
 id:string;entry_date:string;reason:string;evidence_refs:string[];lines:Array<{account:string;debitCents:number;creditCents:number;explanation?:string}>;
 total_debit_cents:number;total_credit_cents:number;status:string;created_at:string;review_note:string|null;
};
export function CompanyJournalProposalsPanel({companyId}:{companyId:string}) {
 const [items,setItems]=useState<Proposal[]>([]);const [error,setError]=useState('');const [loading,setLoading]=useState(false);const [busy,setBusy]=useState<string|null>(null);
 const load=useCallback(async()=>{
  setLoading(true);try{
   const res=await fetch(`/api/admin/empresas/${companyId}/propuestas-contables`,{cache:'no-store'});
   const body=await res.json();if(!res.ok)throw new Error(body.error??'No se pudo consultar');
   setItems(body.proposals??[]);setError('');
  }catch(e){setError(e instanceof Error?e.message:'Error inesperado');}finally{setLoading(false);}
 },[companyId]);
 useEffect(()=>{void load();},[load]);
 async function decide(id:string,status:'approved'|'rejected'){
   const note=window.prompt(status==='approved'?'Motivo de aprobación (no contabiliza en Holded)':'Motivo de rechazo');
   if(!note||note.trim().length<3)return;
   setBusy(id);
   try{
    const res=await fetch(`/api/admin/empresas/${companyId}/propuestas-contables`,{
     method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,status,note:note.trim()})
    });
    const body=await res.json();if(!res.ok)throw new Error(body.error??'No se pudo registrar');
    await load();
   }catch(e){setError(e instanceof Error?e.message:'Error inesperado');}finally{setBusy(null);}
 }
 const fmt=(n:number)=>(n/100).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2})+' €';
 return <section className="rounded-xl border border-slate-200 bg-white p-4" aria-label="Propuestas contables">
  <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">Propuestas contables KIA</h2><button type="button" onClick={()=>void load()} className="rounded border px-3 py-1 text-sm">Actualizar</button></div>
  <p className="mb-4 text-xs text-slate-600">Bandeja de revisión interna. Aprobar una propuesta NO crea un asiento en Holded.</p>
  <JournalProposalSaveForm companyId={companyId} onSaved={load} />
  {error&&<p role="alert" className="mb-3 text-sm text-red-700">{error}</p>}
  {loading?<p className="text-sm">Cargando…</p>:items.length===0?<p className="text-sm text-slate-500">No hay propuestas contables registradas.</p>:<div className="space-y-3">
   {items.map(p=><article key={p.id} className="rounded-lg border p-3 text-sm">
    <div className="flex flex-wrap items-center justify-between gap-2"><strong>{p.entry_date} — {p.reason}</strong><span>{p.status==='pending_review'?'Pendiente':p.status==='approved'?'Aprobada internamente':'Rechazada'}</span></div>
    <div className="mt-2 overflow-auto"><table className="w-full text-left"><thead><tr><th>Cuenta</th><th>Debe</th><th>Haber</th></tr></thead><tbody>{p.lines.map((l,i)=><tr key={i}><td>{l.account}</td><td>{fmt(l.debitCents)}</td><td>{fmt(l.creditCents)}</td></tr>)}</tbody><tfoot><tr className="font-semibold"><td>Total</td><td>{fmt(p.total_debit_cents)}</td><td>{fmt(p.total_credit_cents)}</td></tr></tfoot></table></div>
    <div className="mt-2 text-xs text-slate-600">Justificantes: {p.evidence_refs.map((ref,i)=><span key={i} className="mr-2 break-all">{ref}</span>)}</div>
    {p.review_note&&<p className="mt-2 text-xs">Revisión: {p.review_note}</p>}
    {p.status==='pending_review'&&<div className="mt-3 flex gap-2"><button type="button" disabled={busy===p.id} onClick={()=>void decide(p.id,'approved')} className="rounded border border-slate-300 px-3 py-1">Aprobar propuesta</button><button type="button" disabled={busy===p.id} onClick={()=>void decide(p.id,'rejected')} className="rounded border px-3 py-1">Rechazar</button></div>}
   </article>)}
  </div>}
 </section>;
}
