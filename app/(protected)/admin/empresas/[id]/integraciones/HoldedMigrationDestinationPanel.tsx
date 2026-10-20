'use client';

import { useEffect, useState } from 'react';

export function HoldedMigrationDestinationPanel({companyId}:{companyId:string}){
  const [token,setToken]=useState('');
  const [consent,setConsent]=useState(false);
  const [busy,setBusy]=useState(false);
  const [status,setStatus]=useState<{connected:boolean;last4:string|null}|null>(null);
  const [message,setMessage]=useState('');
  const endpoint=`/api/admin/empresas/${companyId}/holded-migration`;
  async function refresh(){
    try { const response=await fetch(endpoint,{cache:'no-store'});const data=await response.json();
      if(!response.ok)throw new Error(data.error??'No disponible');
      setStatus(data);
    } catch(e) { setMessage(e instanceof Error?e.message:'Error consultando conexión'); }
  }
  useEffect(()=>{void refresh();},[companyId]);
  async function stage(){
    if(!consent||!token.trim()||busy)return;
    setBusy(true);setMessage('');
    try{
      const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({apiKey:token.trim(),consentConfirmed:true})});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error??'No se pudo guardar el destino');
      setToken('');setConsent(false);
      setMessage('Destino guardado de forma cifrada. Origen conservado. Todavía NO se ha migrado nada.');
      await refresh();
    }catch(e){setMessage(e instanceof Error?e.message:'Error de conexión');}
    finally{setBusy(false);}
  }
  return <section className="rounded-2xl border border-amber-300 bg-white p-6 shadow-sm">
    <h2 className="font-serif text-xl font-bold text-[#07111d]">Migración Holded · cuenta destino</h2>
    <p className="mt-2 text-sm text-[#52606d]">Utiliza este campo solamente para el token de la nueva cuenta de asesoría. No sustituye ni desconecta la cuenta de origen. Preparación en solo lectura.</p>
    {status?.connected?(
      <p className="mt-3 rounded-xl bg-green-50 p-3 text-sm text-green-800">
        Destino cifrado configurado: ••••{status.last4}. Pendiente de inventario y conciliación; sin migración.
      </p>
    ):(
      <div className="mt-4 space-y-3">
        <label htmlFor="holded-migration-token" className="block text-sm font-semibold">Token API V2 de la nueva cuenta de asesoría</label>
        <input id="holded-migration-token" type="password" autoComplete="off"
          spellCheck={false} value={token} onChange={e=>setToken(e.target.value)}
          className="w-full rounded-xl border border-[#d8cbb5] px-3 py-3 text-sm"
          placeholder="Pega aquí el token nuevo" />
        <label className="flex gap-2 text-xs text-[#29384a]">
          <input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>
          Confirmo que este token corresponde al destino y autorizo únicamente las comprobaciones de lectura.
        </label>
        <button type="button" onClick={()=>void stage()} disabled={!token.trim()||!consent||busy}
          className="rounded-xl bg-[#07111d] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
          {busy?'Verificando…':'Verificar y guardar destino cifrado'}
        </button>
      </div>
    )}
    {message&&<p role="status" className="mt-3 text-sm text-[#52606d]">{message}</p>}
  </section>;
}
