'use client';
import { useState } from 'react';

type Line = { account: string; debitCents: number; creditCents: number; explanation?: string };
type Draft = { date: string; reason: string; evidenceRefs: string[]; lines: Line[] };

function parseDraft(text: string): Draft {
 const value: unknown = JSON.parse(text);
 if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Debe ser un objeto JSON.');
 const draft=value as Record<string,unknown>;
 // Accept a copied KIA tool result or its inner proposal; companyId is never taken from the draft.
 const v=((draft.proposal && typeof draft.proposal==='object' && !Array.isArray(draft.proposal))?draft.proposal:draft) as Record<string,unknown>;
 if(typeof v.date!=='string'||typeof v.reason!=='string'||!Array.isArray(v.evidenceRefs)||!Array.isArray(v.lines)) throw new Error('Faltan fecha, motivo, justificantes o líneas.');
 const lines=v.lines as Line[];
 if(lines.length<2||lines.length>100||lines.some(l=>!l||typeof l.account!=='string'||!/^\d{3,12}$/.test(l.account)||!Number.isSafeInteger(l.debitCents)||!Number.isSafeInteger(l.creditCents)||l.debitCents<0||l.creditCents<0||((l.debitCents>0)===(l.creditCents>0)))) throw new Error('Las líneas deben tener cuentas válidas y solo Debe o Haber.');
 const refs=v.evidenceRefs as unknown[];
 if(refs.length===0||refs.some(ref=>typeof ref!=='string'||!ref.trim())) throw new Error('Los justificantes son obligatorios.');
 const debit=lines.reduce((sum,l)=>sum+l.debitCents,0),credit=lines.reduce((sum,l)=>sum+l.creditCents,0);
 if(!Number.isSafeInteger(debit)||debit<=0||debit!==credit) throw new Error('El asiento no está equilibrado.');
 return {date:v.date,reason:v.reason,evidenceRefs:refs as string[],lines};
}
const fmt=(n:number)=>(n/100).toLocaleString('es-ES',{style:'currency',currency:'EUR'});

export function JournalProposalSaveForm({companyId,onSaved}:{companyId:string;onSaved:()=>Promise<void>}) {
 const [raw,setRaw]=useState('');
 const [draft,setDraft]=useState<Draft|null>(null);
 const [error,setError]=useState('');
 const [saving,setSaving]=useState(false);
 const [notice,setNotice]=useState('');
 function preview(){
  try{ const parsed=parseDraft(raw);setDraft(parsed);setError('');setNotice(''); }
  catch(e){setDraft(null);setError(e instanceof Error?e.message:'Propuesta inválida');}
 }
 async function save(){
  if(!draft||saving)return;
  // Two-step explicit human review. No AI tool may invoke this HTTP POST.
  const confirmed=window.confirm('Confirmas guardar esta propuesta en la bandeja interna de la empresa seleccionada? No se contabilizara en Holded.');
  if(!confirmed)return;
  setSaving(true);setError('');
  try{
   const response=await fetch(`/api/admin/empresas/${companyId}/propuestas-contables`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(draft)});
   const json=await response.json();
   if(!response.ok)throw new Error(json.error??'No se pudo guardar');
   setNotice(json.alreadyExists?'La propuesta ya estaba registrada; no se duplicó.':'Propuesta registrada y pendiente de revisión.');
   setRaw('');setDraft(null);await onSaved();
  }catch(e){setError(e instanceof Error?e.message:'Error de guardado');}
  finally{setSaving(false);}
 }
 return <div className="mb-4 rounded-lg border border-slate-200 p-3">
  <h3 className="mb-2 text-sm font-semibold">Guardar una propuesta preparada por KIA</h3>
  <p className="mb-2 text-xs text-slate-600">Pega el JSON de la propuesta. La empresa procede de esta ficha, nunca del contenido pegado. Solo se almacena para revisión interna.</p>
  <label htmlFor="journal-proposal-json" className="mb-1 block text-sm">Propuesta JSON</label>
  <textarea id="journal-proposal-json" value={raw} onChange={e=>{setRaw(e.target.value);setDraft(null);setNotice('');}} rows={6} className="w-full rounded border p-2 font-mono text-xs" placeholder='{"date":"2026-01-01","reason":"...","evidenceRefs":["..."],"lines":[{"account":"57200000","debitCents":10000,"creditCents":0},{"account":"43000000","debitCents":0,"creditCents":10000}]}' />
  <button type="button" onClick={preview} disabled={!raw.trim()||saving} className="mt-2 rounded border px-3 py-1 text-sm disabled:opacity-50">Validar y previsualizar</button>
  {draft&&<div className="mt-3 rounded border p-3 text-sm">
   <p><strong>Empresa:</strong> la empresa de esta ficha</p>
   <p><strong>Fecha:</strong> {draft.date} — <strong>Motivo:</strong> {draft.reason}</p>
   <p><strong>Justificantes:</strong> {draft.evidenceRefs.join(' | ')}</p>
   <div className="mt-2 overflow-x-auto"><table className="w-full"><thead><tr><th className="text-left">Cuenta</th><th className="text-right">Debe</th><th className="text-right">Haber</th></tr></thead><tbody>{draft.lines.map((l,i)=><tr key={i}><td>{l.account}</td><td className="text-right">{fmt(l.debitCents)}</td><td className="text-right">{fmt(l.creditCents)}</td></tr>)}</tbody></table></div>
   <p className="mt-2 text-xs font-semibold">Pendiente de aprobación profesional. No genera un asiento en Holded.</p>
   <button type="button" disabled={saving} onClick={()=>void save()} className="mt-2 rounded border border-slate-400 px-3 py-2 text-sm font-semibold disabled:opacity-50">{saving?'Guardando...':'Confirmar guardado interno'}</button>
  </div>}
  {error&&<p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
  {notice&&<p role="status" className="mt-2 text-sm">{notice}</p>}
 </div>;
}
