'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, FileText, Plus, Trash2 } from 'lucide-react';

type CompanyProfile = {
  legalName: string;
  taxId: string;
  activity: string;
  contactEmail: string;
  employees: string;
};

type TreatmentTemplate = {
  id: string;
  name: string;
  purpose: string;
  legalBasis: string;
  dataCategories: string;
  dataSubjects: string;
  recipients: string;
  retention: string;
};

const DEFAULT_TREATMENTS: TreatmentTemplate[] = [
  {
    id: 'clients',
    name: 'Clientes y prestación de servicios',
    purpose: 'Gestionar la relación contractual, prestar servicios, atender consultas y hacer seguimiento.',
    legalBasis: 'Ejecución de contrato y obligaciones legales aplicables.',
    dataCategories: 'Identificación, contacto, facturación y datos necesarios para el servicio.',
    dataSubjects: 'Clientes, representantes y personas vinculadas al servicio.',
    recipients: 'Administraciones públicas y proveedores necesarios cuando proceda.',
    retention: 'Durante la relación y los plazos legales aplicables.',
  },
  {
    id: 'suppliers',
    name: 'Proveedores',
    purpose: 'Gestionar compras, contratación, pagos y relación con proveedores.',
    legalBasis: 'Ejecución de contrato y obligaciones legales.',
    dataCategories: 'Identificación, contacto, facturación y datos bancarios.',
    dataSubjects: 'Proveedores y personas de contacto.',
    recipients: 'Entidades financieras, administración tributaria y proveedores tecnológicos cuando proceda.',
    retention: 'Durante la relación y los plazos legales aplicables.',
  },
  {
    id: 'employees',
    name: 'Personal y recursos humanos',
    purpose: 'Gestionar contratos, nóminas, jornada, prevención y obligaciones laborales.',
    legalBasis: 'Ejecución de contrato y obligaciones legales.',
    dataCategories: 'Identificación, contacto, laborales, nómina, bancarios y Seguridad Social.',
    dataSubjects: 'Empleados, candidatos y colaboradores.',
    recipients: 'TGSS, AEAT, mutua, prevención y otros destinatarios legalmente previstos.',
    retention: 'Según obligaciones laborales, fiscales y de Seguridad Social.',
  },
  {
    id: 'leads',
    name: 'Contacto, leads y presupuestos',
    purpose: 'Atender solicitudes, preparar presupuestos y concertar reuniones.',
    legalBasis: 'Medidas precontractuales y consentimiento cuando corresponda.',
    dataCategories: 'Nombre, email, teléfono, empresa y contenido de la consulta.',
    dataSubjects: 'Potenciales clientes.',
    recipients: 'Proveedores tecnológicos necesarios para formularios, correo y agenda.',
    retention: 'Definir plazo para leads no convertidos.',
  },
  {
    id: 'marketing',
    name: 'Marketing y comunicaciones comerciales',
    purpose: 'Enviar comunicaciones comerciales y gestionar preferencias.',
    legalBasis: 'Consentimiento o base jurídica aplicable documentada.',
    dataCategories: 'Nombre, email, preferencias e interacción con campañas.',
    dataSubjects: 'Suscriptores, clientes y leads.',
    recipients: 'Proveedor de email marketing y otros encargados necesarios.',
    retention: 'Hasta retirada del consentimiento u oposición, sin perjuicio de listas de supresión.',
  },
  {
    id: 'website',
    name: 'Web, formularios y analítica',
    purpose: 'Prestar funcionalidades web, seguridad, medición y analítica consentida.',
    legalBasis: 'Interés legítimo para seguridad/técnicas necesarias y consentimiento para tecnologías opcionales.',
    dataCategories: 'Identificadores online, cookies, datos técnicos, navegación y datos de formularios.',
    dataSubjects: 'Visitantes y usuarios web.',
    recipients: 'Hosting, analítica, seguridad y otros proveedores web.',
    retention: 'Según cookie/servicio y política de conservación.',
  },
];

const PROFILE_KEY = 'expert-rgpd-company-profile-v1';
const TREATMENTS_KEY = 'expert-rgpd-treatments-v1';

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function RgpdWorkspace() {
  const [profile, setProfile] = useState<CompanyProfile>({
    legalName: '',
    taxId: '',
    activity: '',
    contactEmail: '',
    employees: '',
  });
  const [selectedIds, setSelectedIds] = useState<string[]>(['clients', 'suppliers', 'leads']);
  const [customTreatments, setCustomTreatments] = useState<TreatmentTemplate[]>([]);

  useEffect(() => {
    try {
      const p = window.localStorage.getItem(PROFILE_KEY);
      const t = window.localStorage.getItem(TREATMENTS_KEY);
      if (p) setProfile(JSON.parse(p));
      if (t) {
        const parsed = JSON.parse(t);
        setSelectedIds(parsed.selectedIds ?? []);
        setCustomTreatments(parsed.customTreatments ?? []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      window.localStorage.setItem(TREATMENTS_KEY, JSON.stringify({ selectedIds, customTreatments }));
    } catch {}
  }, [profile, selectedIds, customTreatments]);

  const treatments = useMemo(
    () => [...DEFAULT_TREATMENTS.filter((t) => selectedIds.includes(t.id)), ...customTreatments],
    [selectedIds, customTreatments]
  );

  const toggleTreatment = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const addCustomTreatment = () => {
    const id = 'custom-' + Date.now();
    setCustomTreatments((prev) => [...prev, {
      id,
      name: 'Nuevo tratamiento',
      purpose: '',
      legalBasis: '',
      dataCategories: '',
      dataSubjects: '',
      recipients: '',
      retention: '',
    }]);
  };

  const updateCustom = (id: string, field: keyof TreatmentTemplate, value: string) => {
    setCustomTreatments((prev) => prev.map((t) => t.id === id ? { ...t, [field]: value } : t));
  };

  const removeCustom = (id: string) => {
    setCustomTreatments((prev) => prev.filter((t) => t.id !== id));
  };

  const exportRat = () => {
    const title = profile.legalName || 'Empresa';
    const lines = [
      '# Registro de Actividades de Tratamiento (borrador) — ' + title,
      '',
      'Fecha de generación: ' + new Date().toLocaleDateString('es-ES'),
      '',
      '## Datos de la organización',
      '- Razón social: ' + (profile.legalName || '[pendiente]'),
      '- NIF/CIF: ' + (profile.taxId || '[pendiente]'),
      '- Actividad: ' + (profile.activity || '[pendiente]'),
      '- Email de privacidad/contacto: ' + (profile.contactEmail || '[pendiente]'),
      '- Empleados/colaboradores: ' + (profile.employees || '[pendiente]'),
      '',
      '> Borrador generado por la herramienta gratuita EXPERT. Debe revisarse y validarse antes de considerarlo documentación de cumplimiento.',
      '',
    ];

    treatments.forEach((t, i) => {
      lines.push(
        '## RAT-' + String(i + 1).padStart(2, '0') + ' — ' + t.name,
        '- Finalidad: ' + (t.purpose || '[pendiente]'),
        '- Base jurídica: ' + (t.legalBasis || '[pendiente]'),
        '- Categorías de datos: ' + (t.dataCategories || '[pendiente]'),
        '- Interesados: ' + (t.dataSubjects || '[pendiente]'),
        '- Destinatarios: ' + (t.recipients || '[pendiente]'),
        '- Conservación: ' + (t.retention || '[pendiente]'),
        '- Transferencias internacionales: [revisar]',
        '- Medidas de seguridad: [revisar]',
        ''
      );
    });

    downloadText('RAT-borrador-EXPERT.md', lines.join('\n'));
  };

  return (
    <section className="mt-8 border border-[#D4A017]/25 bg-white p-5 md:p-6">
      <div className="flex items-start gap-3">
        <FileText className="mt-1 h-6 w-6 shrink-0 text-[#D4A017]" />
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#D4A017]">Fase 3 · Expediente RGPD local</p>
          <h3 className="mt-1 font-serif text-2xl font-bold">Perfil de empresa + borrador de RAT</h3>
          <p className="mt-2 text-sm leading-6 text-[#23364D]">
            Los datos se guardan únicamente en este navegador. No se envían a EXPERT al completar esta fase.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {[
          ['legalName', 'Razón social'],
          ['taxId', 'NIF/CIF'],
          ['activity', 'Actividad principal'],
          ['contactEmail', 'Email de privacidad/contacto'],
          ['employees', 'Nº empleados/colaboradores'],
        ].map(([field, label]) => (
          <label key={field} className="text-sm font-semibold">
            {label}
            <input
              value={profile[field as keyof CompanyProfile]}
              onChange={(e) => setProfile((p) => ({ ...p, [field]: e.target.value }))}
              className="mt-2 min-h-11 w-full border border-[#D4A017]/30 bg-[#F8F6F1] px-3 font-normal outline-none focus:border-[#D4A017]"
            />
          </label>
        ))}
      </div>

      <div className="mt-8">
        <h4 className="font-bold">Selecciona tus tratamientos habituales</h4>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {DEFAULT_TREATMENTS.map((t) => {
            const active = selectedIds.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTreatment(t.id)}
                className={'border px-4 py-3 text-left text-sm transition ' + (active ? 'border-[#D4A017] bg-[#D4A017]/10' : 'border-[#D4A017]/20')}
              >
                <span className="font-semibold">{active ? '✓ ' : ''}{t.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <h4 className="font-bold">Tratamientos personalizados</h4>
          <button type="button" onClick={addCustomTreatment} className="inline-flex min-h-10 items-center gap-2 border border-[#D4A017]/30 px-3 text-sm font-semibold">
            <Plus className="h-4 w-4" /> Añadir
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {customTreatments.map((t) => (
            <div key={t.id} className="border border-[#D4A017]/20 bg-[#F8F6F1] p-4">
              <div className="flex items-center gap-3">
                <input
                  value={t.name}
                  onChange={(e) => updateCustom(t.id, 'name', e.target.value)}
                  className="min-h-10 flex-1 border border-[#D4A017]/25 bg-white px-3 font-semibold"
                />
                <button type="button" onClick={() => removeCustom(t.id)} aria-label="Eliminar tratamiento">
                  <Trash2 className="h-5 w-5 text-[#6B7280]" />
                </button>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {[
                  ['purpose', 'Finalidad'],
                  ['legalBasis', 'Base jurídica'],
                  ['dataCategories', 'Categorías de datos'],
                  ['dataSubjects', 'Interesados'],
                  ['recipients', 'Destinatarios'],
                  ['retention', 'Conservación'],
                ].map(([field, label]) => (
                  <label key={field} className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">
                    {label}
                    <textarea
                      value={t[field as keyof TreatmentTemplate]}
                      onChange={(e) => updateCustom(t.id, field as keyof TreatmentTemplate, e.target.value)}
                      rows={2}
                      className="mt-1 w-full border border-[#D4A017]/20 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-[#23364D]"
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={exportRat}
          disabled={!treatments.length}
          className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#D4A017] px-5 text-sm font-bold text-[#0D1B2A] disabled:opacity-40"
        >
          <Download className="h-4 w-4" /> Descargar borrador RAT
        </button>
        <p className="text-xs leading-5 text-[#6B7280] sm:max-w-xl">
          El documento exportado es un borrador editable. Transferencias, medidas de seguridad, plazos y bases jurídicas deben revisarse antes de validarlo.
        </p>
      </div>
    </section>
  );
}
