import { cookies } from 'next/headers';
import Link from 'next/link';
import { ArrowLeft, BookOpenText, CheckCircle2, Clock3, FilePenLine, ShieldAlert } from 'lucide-react';
import { absoluteAppUrl } from '@/lib/utils/app-url';
import { EditorialHubClient } from '@/components/admin/EditorialHubClient';
import { EditorialCalendarClient } from '@/components/admin/EditorialCalendarClient';

type Item = {
  id:string;source_kind:string;source_ref:string|null;source_url:string|null;pillar:string;title:string;status:string;
  priority:number;target_platforms:string[];hook:string|null;master_copy:string|null;linkedin_copy:string|null;
  facebook_copy:string|null;instagram_copy:string|null;cta_label:string|null;cta_url:string|null;asset_type:string|null;
  asset_brief:string|null;consent_required:boolean;consent_status:string;scheduled_at:string|null;
};
type Payload = { items:Item[]; pillars:string[]; stats:{total:number;draft:number;review:number;approved:number;scheduled:number;published:number;consent_pending:number}};
type CalendarPayload = {
  jobs:Array<{id:string;content_item_id:string;provider:string;channel:string;scheduled_at:string;status:string;channel_account_id:string|null;last_error_message:string|null}>;
  accounts:Array<{id:string;provider:string;channel:string;display_name:string|null;status:string}>;
  content:Array<{id:string;title:string;pillar:string;status:string;consent_required:boolean;consent_status:string}>;
};

async function load():Promise<{editorial:Payload;calendar:CalendarPayload}>{
  const cs=await cookies();
  const cookie=cs.getAll().map(c=>`${c.name}=${c.value}`).join('; ');
  const [editorialRes,calendarRes]=await Promise.all([
    fetch(absoluteAppUrl('/api/admin/editorial'),{headers:{cookie},cache:'no-store'}),
    fetch(absoluteAppUrl('/api/admin/editorial/calendar'),{headers:{cookie},cache:'no-store'}),
  ]);
  const editorial:Payload=editorialRes.ok
    ? await editorialRes.json()
    : {items:[],pillars:[],stats:{total:0,draft:0,review:0,approved:0,scheduled:0,published:0,consent_pending:0}};
  const calendar:CalendarPayload=calendarRes.ok
    ? await calendarRes.json()
    : {jobs:[],accounts:[],content:[]};
  return {editorial,calendar};
}

export default async function EditorialPage(){
  const {editorial:data,calendar}=await load();
  const cards=[
    ['Borradores',data.stats.draft,FilePenLine],
    ['En revisión',data.stats.review,BookOpenText],
    ['Aprobados',data.stats.approved,CheckCircle2],
    ['Programados',data.stats.scheduled,Clock3],
    ['Consentimiento pendiente',data.stats.consent_pending,ShieldAlert],
  ] as const;

  return (
    <main className="min-h-screen bg-[#f8f4eb]">
      <div className="border-b border-[#d8cbb5] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-7 lg:px-8">
          <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-semibold text-[#29384a]"><ArrowLeft className="h-3.5 w-3.5"/>Panel admin</Link>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-[#c88b25]">Contenido</p>
          <h1 className="mt-1 font-serif text-3xl font-bold text-[#07111d]">Editorial Hub</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#526171]">Una cola única para convertir mentorías, artículos, servicios, producto y conocimiento de EXPERT en contenido revisable para LinkedIn, Facebook e Instagram.</p>
        </div>
      </div>
      <div className="mx-auto max-w-7xl space-y-6 px-5 py-6 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {cards.map(([label,value,Icon])=>(
            <div key={label} className="rounded-xl border border-[#d8cbb5] bg-white p-4">
              <Icon className="h-4 w-4 text-[#c88b25]"/>
              <p className="mt-3 font-serif text-2xl font-bold text-[#07111d]">{value}</p>
              <p className="text-xs text-[#526171]">{label}</p>
            </div>
          ))}
        </div>
        <EditorialCalendarClient
          items={data.items.map(({id,title,pillar,status,consent_required,consent_status})=>({id,title,pillar,status,consent_required,consent_status}))}
          initialJobs={calendar.jobs}
          accounts={calendar.accounts}
        />
        <EditorialHubClient initialItems={data.items}/>
      </div>
    </main>
  );
}
