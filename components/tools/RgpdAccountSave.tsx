'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CloudDownload, CloudUpload, History, Trash2 } from 'lucide-react';

type SavedProject = {
  id: string;
  version: number;
  status: string;
  created_at: string;
  updated_at: string;
};

function readJson(key: string) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function buildPayload() {
  return {
    profile: readJson('expert-rgpd-company-profile-v1'),
    treatments: readJson('expert-rgpd-treatments-v1'),
    providers: readJson('expert-rgpd-provider-inventory-v1'),
    retention: readJson('expert-rgpd-retention-matrix-v1'),
    progress: readJson('expert-rgpd-implementation-progress-v1'),
    source: 'rgpd-self-implementation',
    schemaVersion: 1,
  };
}

export function RgpdAccountSave() {
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [authRequired, setAuthRequired] = useState(false);
  const [requestingReviewId, setRequestingReviewId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadProjects = async () => {
    try {
      const res = await fetch('/api/rgpd/projects', { method: 'GET' });
      if (res.status === 401) {
        setAuthRequired(true);
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      setProjects(data.projects ?? []);
      setAuthRequired(false);
    } catch {
      // Saving remains optional; do not block local-first use.
    }
  };

  useEffect(() => {
    void loadProjects();
  }, []);

  const save = async () => {
    if (!consent || saving) return;
    setSaving(true);
    setMessage('');

    try {
      const res = await fetch('/api/rgpd/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consent: true, payload: buildPayload() }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        setAuthRequired(true);
        setMessage('Para guardar el expediente debes iniciar sesión en tu cuenta EXPERT.');
        return;
      }

      if (!res.ok) {
        setMessage('No se pudo guardar el expediente. Tu copia local no se ha modificado.');
        return;
      }

      setMessage('Versión ' + data.project.version + ' guardada en tu cuenta EXPERT.');
      await loadProjects();
    } catch {
      setMessage('No se pudo conectar con el servidor. Tu copia local sigue intacta.');
    } finally {
      setSaving(false);
    }
  };

  const restore = async (project: SavedProject) => {
    if (restoringId) return;

    const confirmed = window.confirm(
      'Cargar la versión ' + project.version + ' reemplazará el trabajo RGPD guardado actualmente en este navegador. ¿Continuar?'
    );
    if (!confirmed) return;

    setRestoringId(project.id);
    setMessage('');

    try {
      const res = await fetch('/api/rgpd/projects/' + project.id, { method: 'GET' });
      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        setAuthRequired(true);
        setMessage('Para recuperar una versión debes iniciar sesión.');
        return;
      }

      if (!res.ok || !data.project?.payload) {
        setMessage('No se pudo recuperar esta versión.');
        return;
      }

      const payload = data.project.payload;
      const mappings: Array<[string, unknown]> = [
        ['expert-rgpd-company-profile-v1', payload.profile],
        ['expert-rgpd-treatments-v1', payload.treatments],
        ['expert-rgpd-provider-inventory-v1', payload.providers],
        ['expert-rgpd-retention-matrix-v1', payload.retention],
        ['expert-rgpd-implementation-progress-v1', payload.progress],
      ];

      for (const [key, value] of mappings) {
        if (value === null || value === undefined) {
          window.localStorage.removeItem(key);
        } else {
          window.localStorage.setItem(key, JSON.stringify(value));
        }
      }

      setMessage('Versión ' + project.version + ' cargada. Actualizando la herramienta…');
      window.location.reload();
    } catch {
      setMessage('No se pudo recuperar esta versión.');
    } finally {
      setRestoringId(null);
    }
  };

  const removeSavedDraft = async (project: SavedProject) => {
    if (deletingId || project.status !== 'draft') return;
    if (!window.confirm('¿Eliminar definitivamente la versión ' + project.version + ' guardada en tu cuenta EXPERT? Tu copia local no se borrará.')) return;

    setDeletingId(project.id);
    setMessage('');

    try {
      const res = await fetch('/api/rgpd/projects/' + project.id, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        setAuthRequired(true);
        setMessage('Para eliminar una versión debes iniciar sesión.');
        return;
      }

      if (res.status === 409) {
        setMessage('Esta versión ya forma parte de una revisión profesional y no puede eliminarse desde autoservicio.');
        return;
      }

      if (!res.ok) {
        setMessage(data.error ?? 'No se pudo eliminar esta versión.');
        return;
      }

      setMessage('Versión ' + project.version + ' eliminada de tu cuenta. La copia local no se ha modificado.');
      await loadProjects();
    } catch {
      setMessage('No se pudo eliminar esta versión.');
    } finally {
      setDeletingId(null);
    }
  };

  const requestReview = async (project: SavedProject) => {
    if (requestingReviewId) return;
    setRequestingReviewId(project.id);
    setMessage('');

    try {
      const res = await fetch('/api/rgpd/projects/' + project.id + '/request-review', {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        setAuthRequired(true);
        setMessage('Para solicitar revisión debes iniciar sesión.');
        return;
      }

      if (!res.ok || !data.quote_url) {
        setMessage('No se pudo iniciar la solicitud de revisión.');
        return;
      }

      window.location.assign(data.quote_url);
    } catch {
      setMessage('No se pudo iniciar la solicitud de revisión.');
    } finally {
      setRequestingReviewId(null);
    }
  };

  return (
    <section className="mt-8 border border-[#D4A017]/25 bg-white p-5 md:p-6">
      <div className="flex items-start gap-3">
        <CloudUpload className="mt-1 h-6 w-6 shrink-0 text-[#D4A017]" />
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#D4A017]">Fase 7 · Guardado voluntario</p>
          <h3 className="mt-1 font-serif text-2xl font-bold">Guardar una versión en tu cuenta EXPERT</h3>
          <p className="mt-2 text-sm leading-6 text-[#23364D]">
            El expediente permanece local por defecto. Solo se enviará a EXPERT si marcas el consentimiento y pulsas guardar.
          </p>
        </div>
      </div>

      <label className="mt-5 flex items-start gap-3 border border-[#D4A017]/20 bg-[#F8F6F1] p-4 text-sm leading-6 text-[#23364D]">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1"
        />
        <span>
          Consiento guardar una copia del expediente RGPD en mi cuenta EXPERT para poder recuperarla y, si lo decido más adelante, solicitar revisión profesional.
        </span>
      </label>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={save}
          disabled={!consent || saving}
          className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#D4A017] px-5 text-sm font-bold text-[#0D1B2A] disabled:opacity-40"
        >
          <CloudUpload className="h-4 w-4" />
          {saving ? 'Guardando…' : 'Guardar nueva versión'}
        </button>

        {authRequired && (
          <Link href="/auth/login" className="text-sm font-bold text-[#8A6710] underline underline-offset-4">
            Iniciar sesión
          </Link>
        )}
      </div>

      {message && <p className="mt-3 text-sm text-[#23364D]">{message}</p>}

      {projects.length > 0 && (
        <div className="mt-6 border-t border-[#D4A017]/20 pt-5">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-[#D4A017]" />
            <h4 className="font-bold">Versiones guardadas</h4>
          </div>
          <div className="mt-3 space-y-2 text-sm text-[#23364D]">
            {projects.map((project) => (
              <div key={project.id} className="flex flex-wrap items-center justify-between gap-3 border border-[#D4A017]/15 bg-[#F8F6F1] px-3 py-2">
                <div>
                  <span>Versión {project.version} · {project.status}</span>
                  <span className="ml-2 text-xs text-[#6B7280]">
                    {new Date(project.created_at).toLocaleString('es-ES')}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => restore(project)}
                    disabled={restoringId === project.id}
                    className="inline-flex min-h-9 items-center gap-1.5 border border-[#D4A017]/30 px-3 text-xs font-bold disabled:opacity-50"
                  >
                    <CloudDownload className="h-3.5 w-3.5" />
                    {restoringId === project.id ? 'Cargando…' : 'Cargar versión'}
                  </button>
                  <button
                    type="button"
                    onClick={() => requestReview(project)}
                    disabled={requestingReviewId === project.id || project.status !== 'draft'}
                    className="min-h-9 border border-[#D4A017]/30 px-3 text-xs font-bold disabled:opacity-50"
                  >
                    {project.status !== 'draft'
                      ? 'Revisión bloqueada'
                      : requestingReviewId === project.id
                        ? 'Preparando…'
                        : 'Solicitar revisión'}
                  </button>
                  {project.status === 'draft' && (
                    <button
                      type="button"
                      onClick={() => removeSavedDraft(project)}
                      disabled={deletingId === project.id}
                      aria-label={'Eliminar versión ' + project.version}
                      className="inline-flex min-h-9 items-center gap-1.5 border border-red-200 px-3 text-xs font-bold text-red-700 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {deletingId === project.id ? 'Eliminando…' : 'Eliminar'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="mt-5 text-xs leading-5 text-[#6B7280]">
        Guardar una versión no implica que EXPERT la haya revisado ni validado. El usuario conserva el control sobre cuándo solicita revisión profesional.
      </p>
    </section>
  );
}
