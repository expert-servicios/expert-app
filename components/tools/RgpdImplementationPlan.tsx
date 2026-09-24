'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle } from 'lucide-react';

type ModuleId = 'rat' | 'privacy' | 'processors' | 'security' | 'rights' | 'breaches' | 'retention' | 'web';

const MODULES: Record<ModuleId, {
  title: string;
  description: string;
  href: string;
  tasks: string[];
}> = {
  rat: {
    title: 'Registro de Actividades de Tratamiento',
    description: 'Identifica y documenta los tratamientos reales de tu negocio.',
    href: '/docs/registro-actividades-tratamiento-rat-pymes',
    tasks: ['Identificar tratamientos', 'Definir finalidades y bases jurídicas', 'Documentar destinatarios, plazos y transferencias'],
  },
  privacy: {
    title: 'Información y cláusulas de privacidad',
    description: 'Alinea formularios, contratos y puntos de recogida con el tratamiento real.',
    href: '/docs/checklist-rgpd-autonomos-pymes',
    tasks: ['Revisar puntos de recogida', 'Preparar primera capa informativa', 'Separar finalidades y consentimientos'],
  },
  processors: {
    title: 'Encargados y proveedores',
    description: 'Revisa gestoría, CRM, cloud, email, soporte e IA.',
    href: '/blog/proveedores-cloud-ia-rgpd-encargados-tratamiento',
    tasks: ['Inventariar proveedores', 'Revisar contratos del artículo 28', 'Comprobar subencargados y transferencias'],
  },
  security: {
    title: 'Medidas de seguridad',
    description: 'Aplica medidas técnicas y organizativas proporcionadas al riesgo.',
    href: '/docs/checklist-rgpd-autonomos-pymes',
    tasks: ['Revisar accesos y MFA', 'Copias de seguridad y actualizaciones', 'Altas/bajas de usuarios y formación'],
  },
  rights: {
    title: 'Ejercicio de derechos',
    description: 'Define quién recibe y cómo se atienden las solicitudes.',
    href: '/docs/checklist-rgpd-autonomos-pymes',
    tasks: ['Definir canal de recepción', 'Preparar procedimiento interno', 'Controlar plazo general de un mes'],
  },
  breaches: {
    title: 'Brechas de datos',
    description: 'Ten preparado un protocolo antes de que ocurra un incidente.',
    href: '/docs/protocolo-brechas-datos-personales-72-horas',
    tasks: ['Crear registro de incidentes', 'Definir escalado interno', 'Preparar evaluación de riesgo y notificación'],
  },
  retention: {
    title: 'Conservación y supresión',
    description: 'Evita conservar información indefinidamente sin justificación.',
    href: '/docs/checklist-rgpd-autonomos-pymes',
    tasks: ['Definir plazos por tratamiento', 'Documentar bloqueo cuando proceda', 'Preparar borrado o anonimización'],
  },
  web: {
    title: 'Web, formularios y cookies',
    description: 'Comprueba la parte jurídica y también el comportamiento técnico real.',
    href: '/docs/privacidad-formularios-cookies-web',
    tasks: ['Auditar formularios', 'Revisar cookies y scripts', 'Separar marketing y consentimiento'],
  },
};

const STORAGE_KEY = 'expert-rgpd-implementation-progress-v1';

export function RgpdImplementationPlan({ moduleIds }: { moduleIds: string[] }) {
  const safeIds = useMemo(
    () => moduleIds.filter((id): id is ModuleId => id in MODULES),
    [moduleIds]
  );
  const [done, setDone] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setDone(JSON.parse(raw));
    } catch {
      // Progress persistence is optional.
    }
  }, []);

  const toggle = (key: string) => {
    setDone((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Keep in-memory progress if storage is unavailable.
      }
      return next;
    });
  };

  const allTasks = safeIds.flatMap((id) => MODULES[id].tasks.map((_, i) => `${id}:${i}`));
  const completed = allTasks.filter((key) => done[key]).length;
  const percent = allTasks.length ? Math.round((completed / allTasks.length) * 100) : 0;

  return (
    <section className="mt-8 border border-[#D4A017]/25 bg-[#F8F6F1] p-5 md:p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#D4A017]">Fase 2 · Autoimplantación</p>
          <h3 className="mt-1 font-serif text-2xl font-bold">Tu plan de trabajo</h3>
          <p className="mt-2 text-sm leading-6 text-[#23364D]">
            Marca cada tarea a medida que la completes. El progreso se guarda únicamente en este navegador.
          </p>
        </div>
        <p className="shrink-0 text-sm font-bold">{percent}%</p>
      </div>

      <div className="mt-4 h-2 overflow-hidden bg-white">
        <div className="h-full bg-[#D4A017] transition-all" style={{ width: `${percent}%` }} />
      </div>

      <div className="mt-6 space-y-5">
        {safeIds.map((id) => {
          const planModule = MODULES[id];
          return (
            <div key={id} className="border border-[#D4A017]/20 bg-white p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h4 className="font-bold">{planModule.title}</h4>
                  <p className="mt-1 text-sm text-[#23364D]">{planModule.description}</p>
                </div>
                <Link href={planModule.href} className="text-sm font-bold text-[#8A6710] hover:underline">
                  Abrir guía →
                </Link>
              </div>

              <div className="mt-4 space-y-2">
                {planModule.tasks.map((task, index) => {
                  const key = `${id}:${index}`;
                  const checked = Boolean(done[key]);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggle(key)}
                      className="flex w-full items-start gap-3 text-left text-sm leading-6 text-[#23364D]"
                    >
                      {checked
                        ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#D4A017]" />
                        : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-[#9CA3AF]" />}
                      <span className={checked ? 'line-through opacity-60' : ''}>{task}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-5 text-xs leading-5 text-[#6B7280]">
        Marcar tareas no acredita cumplimiento. Utiliza las guías como apoyo y revisa profesionalmente los puntos que dependan de riesgo, transferencias, EIPD o interpretación jurídica.
      </p>
    </section>
  );
}
