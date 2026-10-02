'use client';

import { useMemo, useState } from 'react';
import { Check, Clock3, Copy, ExternalLink, Save, ShieldAlert } from 'lucide-react';

type Item = {
  id: string;
  source_kind: string;
  source_ref: string | null;
  source_url: string | null;
  pillar: string;
  title: string;
  status: string;
  priority: number;
  target_platforms: string[];
  hook: string | null;
  master_copy: string | null;
  linkedin_copy: string | null;
  facebook_copy: string | null;
  instagram_copy: string | null;
  cta_label: string | null;
  cta_url: string | null;
  asset_type: string | null;
  asset_brief: string | null;
  consent_required: boolean;
  consent_status: string;
  scheduled_at: string | null;
};

const STATUS_LABELS: Record<string,string> = {
  idea:'Idea',draft:'Borrador',review:'Revisión',approved:'Aprobado',
  scheduled:'Programado',published:'Publicado',rejected:'Descartado'
};

function copy(text: string | null) {
  if (!text) return;
  navigator.clipboard.writeText(text).catch(() => {});
}

export function EditorialHubClient({ initialItems }: { initialItems: Item[] }) {
  const [items,setItems] = useState(initialItems);
  const [status,setStatus] = useState('all');
  const [pillar,setPillar] = useState('all');
  const [platform,setPlatform] = useState<'linkedin'|'facebook'|'instagram'>('linkedin');
  const [saving,setSaving] = useState<string|null>(null);
  const [message,setMessage] = useState('');

  const pillars = useMemo(() => Array.from(new Set(items.map(i=>i.pillar))).sort(),[items]);
  const filtered = items.filter(i => (status==='all'||i.status===status) && (pillar==='all'||i.pillar===pillar));

  async function patch(id:string, body:Record<string,unknown>) {
    setSaving(id); setMessage('');
    const res = await fetch('/api/admin/editorial',{
      method:'PATCH',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({id,...body}),
    });
    const data = await res.json().catch(()=>({}));
    setSaving(null);
    if(!res.ok){ setMessage(data.error ?? 'No se pudo actualizar.'); return; }
    setItems(prev => prev.map(item => item.id===id ? data.item : item));
    setMessage('Actualizado.');
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <select value={status} onChange={e=>setStatus(e.target.value)} className="rounded-xl border border-[#d8cbb5] bg-white px-3 py-2 text-sm">
          <option value="all">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([v,l])=><option key={v} value={v}>{l}</option>)}
        </select>
        <select value={pillar} onChange={e=>setPillar(e.target.value)} className="rounded-xl border border-[#d8cbb5] bg-white px-3 py-2 text-sm">
          <option value="all">Todos los pilares</option>
          {pillars.map(p=><option key={p} value={p}>{p}</option>)}
        </select>
        <div className="ml-auto flex rounded-xl border border-[#d8cbb5] bg-white p-1">
          {(['linkedin','facebook','instagram'] as const).map(p=>(
            <button key={p} onClick={()=>setPlatform(p)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${platform===p?'bg-[#07111d] text-white':'text-[#526171]'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {message && <p className="rounded-xl border border-[#d8cbb5] bg-white px-4 py-2 text-xs text-[#526171]">{message}</p>}

      <div className="grid gap-4 xl:grid-cols-2">
        {filtered.map(item => {
          const platformCopy = platform==='linkedin' ? item.linkedin_copy : platform==='facebook' ? item.facebook_copy : item.instagram_copy;
          const blocked = item.consent_required && item.consent_status !== 'granted';
          return (
            <article key={item.id} className="rounded-2xl border border-[#d8cbb5] bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-[#f8f4eb] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#8a6111]">{item.pillar}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-700">{STATUS_LABELS[item.status] ?? item.status}</span>
                    <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] text-slate-500">P{item.priority}</span>
                  </div>
                  <h2 className="mt-3 font-serif text-xl font-bold text-[#07111d]">{item.title}</h2>
                  {item.hook && <p className="mt-2 text-sm font-semibold leading-6 text-[#29384a]">{item.hook}</p>}
                </div>
                {item.source_url && (
                  <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-lg border border-[#e6dccb] p-2 text-[#8a6111]" title="Abrir fuente">
                    <ExternalLink className="h-4 w-4"/>
                  </a>
                )}
              </div>

              {blocked && (
                <div className="mt-4 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700"/>
                  <p className="text-xs leading-5 text-amber-900">Bloqueado para aprobación/publicación hasta registrar consentimiento.</p>
                </div>
              )}

              <div className="mt-4 rounded-xl bg-[#f8f4eb] p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#8a6111]">{platform}</p>
                  <button onClick={()=>copy(platformCopy)} className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#526171]">
                    <Copy className="h-3.5 w-3.5"/> Copiar
                  </button>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#29384a]">{platformCopy || 'Sin adaptación todavía.'}</p>
              </div>

              {item.asset_brief && (
                <div className="mt-3 border-l-2 border-[#d7a33a] pl-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#8a6111]">Brief visual · {item.asset_type ?? 'sin definir'}</p>
                  <p className="mt-1 text-xs leading-5 text-[#526171]">{item.asset_brief}</p>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {item.status !== 'approved' && item.status !== 'published' && (
                  <button
                    disabled={blocked || saving===item.id}
                    onClick={()=>patch(item.id,{status:'approved'})}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#07111d] px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
                  >
                    <Check className="h-3.5 w-3.5"/> Aprobar
                  </button>
                )}
                {item.status !== 'review' && item.status !== 'published' && (
                  <button
                    disabled={saving===item.id}
                    onClick={()=>patch(item.id,{status:'review'})}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8cbb5] px-3 py-2 text-xs font-semibold text-[#29384a]"
                  >
                    <Save className="h-3.5 w-3.5"/> A revisión
                  </button>
                )}
                {item.status==='approved' && (
                  <button
                    disabled={saving===item.id}
                    onClick={()=>patch(item.id,{status:'scheduled'})}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#d7a33a] bg-[#fff8e8] px-3 py-2 text-xs font-semibold text-[#8a6111]"
                  >
                    <Clock3 className="h-3.5 w-3.5"/> Marcar programado
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
