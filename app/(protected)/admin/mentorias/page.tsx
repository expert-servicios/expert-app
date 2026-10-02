import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpenCheck, ShieldCheck, UsersRound } from 'lucide-react';
import { fetchWithCookies } from '@/lib/utils/server-fetch';
import { MentoringWorkspaceClient } from '@/components/admin/MentoringWorkspaceClient';

type Engagement = {
  id: string;
  lead_id: string | null;
  program: string;
  project_name: string;
  mentee_name: string;
  mentee_email: string | null;
  country: string | null;
  engagement_type: 'speed' | 'intensive' | 'longitudinal';
  status: string;
  started_at: string | null;
  ended_at: string | null;
  source_label: string | null;
  current_focus: string | null;
  next_action: string | null;
  publication_status: string;
};

type Session = {
  id: string;
  engagement_id: string;
  occurred_at: string;
  summary: string | null;
  decisions: string | null;
  next_actions: string | null;
  evidence: string | null;
};

type Publication = {
  id: string;
  engagement_id: string;
  publication_type: string;
  title: string;
  status: string;
  summary: string | null;
};

type Artifact = {
  id: string;
  engagement_id: string;
  artifact_type: string;
  title: string;
  external_url: string | null;
  storage_path: string | null;
  notes: string | null;
  public_allowed: boolean;
  created_at: string;
};

type ApiResponse = {
  engagements: Engagement[];
  sessions: Session[];
  publications: Publication[];
  artifacts: Artifact[];
  stats: {
    total: number;
    active: number;
    completed: number;
    consent_pending: number;
    mentor_tips_contacts: number;
  };
};

const typeLabels = {
  speed: 'Speed Mentoring',
  intensive: 'Acompañamiento intensivo',
  longitudinal: 'Mentoría longitudinal',
} as const;

const publicationLabels: Record<string, string> = {
  private: 'Privado',
  consent_pending: 'Consentimiento pendiente',
  publishable: 'Publicable',
  published: 'Publicado',
};

export default async function AdminMentoriasPage() {
  const data = await fetchWithCookies<ApiResponse>('/api/admin/mentoring');
  const engagements = data?.engagements ?? [];
  const sessions = data?.sessions ?? [];
  const publications = data?.publications ?? [];
  const artifacts = data?.artifacts ?? [];
  const stats = data?.stats ?? { total: 0, active: 0, completed: 0, consent_pending: 0, mentor_tips_contacts: 0 };

  return (
    <main className="min-h-screen bg-[#f8f4eb]">
      <div className="border-b border-[#d8cbb5] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-7 lg:px-8">
          <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-semibold text-[#29384a] hover:text-[#07111d]">
            <ArrowLeft className="h-3.5 w-3.5" /> Panel admin
          </Link>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c88b25]">Mentoring Hub</p>
              <h1 className="mt-1 font-serif text-3xl font-bold text-[#07111d]">Mentorías</h1>
              <p className="mt-1 max-w-2xl text-sm text-[#526171]">
                Seguimiento privado de proyectos, sesiones, evidencia, decisiones y contenidos candidatos a publicación.
              </p>
            </div>
            <Link href="/admin/leads?segment=mentorday-projects" className="inline-flex items-center gap-2 rounded-xl bg-[#07111d] px-4 py-2.5 text-sm font-bold text-white">
              <UsersRound className="h-4 w-4 text-[#d7a33a]" /> Contactos MentorDay ({stats.mentor_tips_contacts})
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-5 py-6 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ['Mentorías', stats.total, 'Registradas en el workspace'],
            ['Activas', stats.active, 'Seguimiento en curso'],
            ['Completadas', stats.completed, 'Ciclos cerrados'],
            ['Consentimiento', stats.consent_pending, 'Pendiente para uso público'],
            ['Contactos', stats.mentor_tips_contacts, 'Proyectos Mentor Tips 2026'],
          ].map(([label, value, note]) => (
            <div key={String(label)} className="rounded-xl border border-[#e0d5c3] bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[#8c6a22]">{label}</p>
              <p className="mt-1 font-serif text-2xl font-bold text-[#07111d]">{value}</p>
              <p className="mt-1 text-xs text-[#6f665b]">{note}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <p className="text-sm font-bold text-amber-950">Separación estricta entre trabajo interno y publicación</p>
              <p className="mt-1 text-xs leading-5 text-amber-900">
                Notas privadas, hipótesis internas y datos de contacto nunca se exponen en la web. Un caso solo pasa a publicable cuando existe revisión y consentimiento registrado.
              </p>
            </div>
          </div>
        </div>

        <MentoringWorkspaceClient engagements={engagements.map(({ id, project_name, mentee_name }) => ({ id, project_name, mentee_name }))} />

        <section>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c88b25]">Cartera</p>
              <h2 className="font-serif text-2xl font-bold text-[#07111d]">Proyectos en seguimiento</h2>
            </div>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {engagements.map((item) => {
              const latestSession = sessions.find((session) => session.engagement_id === item.id);
              return (
                <article key={item.id} className="rounded-2xl border border-[#d8cbb5] bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-[#8a6111]">{item.program}</p>
                      <h3 className="mt-1 font-serif text-xl font-bold text-[#07111d]">{item.project_name}</h3>
                      <p className="mt-1 text-sm text-[#526171]">{item.mentee_name}{item.country ? ` · ${item.country}` : ''}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="rounded-full border border-[#d8cbb5] bg-[#fffdf8] px-2.5 py-1 text-[11px] font-semibold text-[#29384a]">
                        {typeLabels[item.engagement_type]}
                      </span>
                      <span className="rounded-full border border-[#dbcaa9] bg-[#fff8e8] px-2.5 py-1 text-[11px] font-semibold text-[#8a6111]">
                        {publicationLabels[item.publication_status] ?? item.publication_status}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-[#f8f4eb] p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[#8c6a22]">Foco actual</p>
                      <p className="mt-1 text-sm leading-6 text-[#29384a]">{item.current_focus || 'Pendiente de definir'}</p>
                    </div>
                    <div className="rounded-xl bg-[#f8f4eb] p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[#8c6a22]">Siguiente acción</p>
                      <p className="mt-1 text-sm leading-6 text-[#29384a]">{item.next_action || 'Pendiente de definir'}</p>
                    </div>
                  </div>

                  {latestSession && (
                    <div className="mt-3 border-t border-[#eee6d9] pt-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[#8c6a22]">Última sesión documentada</p>
                      <p className="mt-1 text-xs text-[#526171]">{new Date(latestSession.occurred_at).toLocaleDateString('es-ES')}</p>
                      {latestSession.summary && <p className="mt-1 text-sm leading-6 text-[#29384a]">{latestSession.summary}</p>}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold">
                    {item.mentee_email && (
                      <Link href={`/admin/leads?q=${encodeURIComponent(item.mentee_email)}`} className="text-[#8a6111] hover:underline">
                        Ver contacto CRM →
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-[#d8cbb5] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c88b25]">Archivo de trabajo</p>
              <h2 className="font-serif text-xl font-bold text-[#07111d]">Recursos y evidencias</h2>
            </div>
            <span className="rounded-full bg-[#f8f4eb] px-3 py-1 text-xs font-semibold text-[#526171]">{artifacts.length} recursos</span>
          </div>
          {artifacts.length === 0 ? (
            <p className="mt-4 text-sm text-[#6f665b]">Todavía no hay recursos enlazados.</p>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {artifacts.map((item) => {
                const engagement = engagements.find((engagement) => engagement.id === item.engagement_id);
                return (
                  <div key={item.id} className="rounded-xl border border-[#eee6d9] bg-[#fffdf8] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#8c6a22]">{item.artifact_type}</p>
                        <p className="mt-1 text-sm font-semibold text-[#07111d]">{item.title}</p>
                        <p className="mt-1 text-xs text-[#6f665b]">{engagement?.project_name ?? 'Mentoría'}</p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${item.public_allowed ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                        {item.public_allowed ? 'Referencia pública' : 'Interno'}
                      </span>
                    </div>
                    {item.notes && <p className="mt-2 text-xs leading-5 text-[#526171]">{item.notes}</p>}
                    {item.external_url && (
                      <a href={item.external_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex text-xs font-semibold text-[#8a6111] hover:underline">
                        Abrir recurso →
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-[#d8cbb5] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <BookOpenCheck className="h-5 w-5 text-[#c88b25]" />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c88b25]">Pipeline editorial</p>
              <h2 className="font-serif text-xl font-bold text-[#07111d]">Ideas derivadas de mentorías</h2>
            </div>
          </div>
          {publications.length === 0 ? (
            <p className="mt-4 text-sm text-[#6f665b]">Todavía no hay ideas editoriales registradas. Usa el formulario superior cuando aparezca un aprendizaje publicable.</p>
          ) : (
            <div className="mt-4 divide-y divide-[#eee6d9]">
              {publications.map((item) => {
                const engagement = engagements.find((engagement) => engagement.id === item.engagement_id);
                return (
                  <div key={item.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#07111d]">{item.title}</p>
                      <p className="text-xs text-[#6f665b]">{engagement?.project_name ?? 'Mentoría'} · {item.publication_type}</p>
                    </div>
                    <span className="w-fit rounded-full border border-[#d8cbb5] bg-[#fffdf8] px-2.5 py-1 text-[11px] font-semibold">{item.status}</span>
                  </div>
                );
              })}
            </div>
          )}
          <Link href="/mentorias" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#8a6111] hover:underline">
            Ver landing pública <ArrowRight className="h-3 w-3" />
          </Link>
        </section>
      </div>
    </main>
  );
}
