// ── Viability check definitions per service ──────────────────────────────────
// Used by: ViabilityModal (web), evaluateViability (AI), Kia PRECAL_FLOWS (WA)

export type QuestionType = 'boolean' | 'select' | 'text' | 'number';

export interface VOption {
  value: string;
  label: string;
  disqualifies?: boolean; // selecting this = NO VIABLE
  escalates?: boolean;    // selecting this = needs human review
}

export interface VQuestion {
  id: string;
  type: QuestionType;
  label: string;
  hint?: string;
  required: boolean;
  options?: VOption[];
  disqualifiesIfFalse?: boolean; // boolean: answering No = NO VIABLE
  disqualifiesIfTrue?: boolean;  // boolean: answering Sí = NO VIABLE
  escalatesIfTrue?: boolean;     // boolean: answering Sí = escalate
}

export interface VDoc {
  id: string;
  label: string;
  required: boolean;
  howToGet?: string;
}

export interface ViabilityCheck {
  serviceSlug: string;
  serviceName: string;
  intro: string;
  estimatedMinutes: number;
  questions: VQuestion[];
  docs: VDoc[];
  // Legal criteria fed to Claude for evaluation
  aiCriteria: string;
}

// ── IRPF — Declaración de la Renta ───────────────────────────────────────────

const irpf: ViabilityCheck = {
  serviceSlug: 'irpf',
  serviceName: 'Declaración de la Renta (IRPF)',
  intro: 'Comprueba en 2 minutos si tu caso es apto y qué documentación necesitas preparar.',
  estimatedMinutes: 3,
  questions: [
    {
      id: 'ejercicio',
      type: 'select',
      label: '¿Para qué ejercicio fiscal es la declaración?',
      required: true,
      options: [
        { value: '2025', label: 'Renta 2025 (campaña 2026)' },
        { value: '2024', label: 'Renta 2024' },
        { value: '2023', label: 'Renta 2023 o ejercicio anterior' },
      ],
    },
    {
      id: 'residente',
      type: 'boolean',
      label: '¿Resides habitualmente en España más de 183 días al año?',
      hint: 'Si resides menos de 183 días, tu declaración sería como no residente (IRNR), no IRPF.',
      required: true,
    },
    {
      id: 'situacion_laboral',
      type: 'select',
      label: '¿Cuál fue tu situación laboral principal durante el ejercicio?',
      required: true,
      options: [
        { value: 'empleado',    label: 'Empleado por cuenta ajena (con nómina)' },
        { value: 'autonomo',    label: 'Autónomo' },
        { value: 'pensionista', label: 'Pensionista o jubilado' },
        { value: 'desempleado', label: 'Desempleado / ERTE / prestación' },
        { value: 'mixto',       label: 'Varias fuentes de ingresos' },
        { value: 'estudiante',  label: 'Estudiante sin ingresos' },
      ],
    },
    {
      id: 'requerimiento',
      type: 'boolean',
      label: '¿Has recibido algún requerimiento o notificación de la Agencia Tributaria?',
      hint: 'Si tienes un requerimiento, la presentación es urgente y tiene plazos estrictos.',
      required: true,
      escalatesIfTrue: true,
    },
    {
      id: 'bienes_extranjero',
      type: 'boolean',
      label: '¿Tienes bienes, cuentas bancarias o rentas fuera de España?',
      hint: 'Cuentas en el extranjero, inmuebles, fondos de inversión, dividendos de empresas extranjeras, etc.',
      required: true,
      escalatesIfTrue: true,
    },
    {
      id: 'identificacion',
      type: 'select',
      label: '¿Con qué método de identificación cuentas para acceder a la Sede Electrónica de la AEAT?',
      required: true,
      options: [
        { value: 'certificado', label: 'Certificado digital (FNMT u otro)' },
        { value: 'clave',       label: 'Cl@ve PIN o Cl@ve permanente' },
        { value: 'referencia',  label: 'Número de referencia (de la renta anterior)' },
        { value: 'ninguno',     label: 'No tengo ninguno', escalates: true },
      ],
    },
  ],
  docs: [
    { id: 'dni', label: 'DNI / NIE en vigor', required: true },
    {
      id: 'identificacion_aeat',
      label: 'Referencia AEAT, Cl@ve PIN o certificado digital',
      required: false,
      howToGet: 'Puedes solicitar el número de referencia en https://sede.agenciatributaria.gob.es con tu IBAN bancario',
    },
    { id: 'cert_empresa', label: 'Certificado de ingresos de tu empresa (si eres empleado)', required: false },
    { id: 'extracto_banco', label: 'Extracto bancario (si tienes alquiler, inversiones o cuentas en el extranjero)', required: false },
  ],
  aiCriteria: `Eres un asesor fiscal experto en España. Evalúa si el caso del cliente es VIABLE para la declaración de IRPF.

NORMATIVA APLICABLE:
- Ley 35/2006 del IRPF y RD 439/2007 (Reglamento IRPF)
- Están OBLIGADOS a declarar quienes obtengan rendimientos del trabajo >22.000€ de un pagador (o >14.000€ con varios pagadores o si el segundo pagador supera 1.500€).
- También obligan: rendimientos de capital o ganancias patrimoniales >1.600€, imputaciones de renta, o cualquier cuantía si hay pérdidas patrimoniales >500€.
- Los NO residentes (menos de 183 días en España) tributan por IRNR, no por IRPF.
- Si hay bienes en el extranjero >50.000€, puede haber obligación de Modelo 720.
- Si hay requerimiento de Hacienda, la declaración es urgente y puede haber sanciones.

CRITERIOS DE VIABILIDAD:
- VIABLE: Residente en España, situación laboral clara, método de identificación disponible.
- PARCIAL: Sin método de identificación (podemos ayudar), ejercicio muy anterior (limitaciones).
- NO VIABLE: No residente en España (debe hacer IRNR, no IRPF).
- ESCALAR: Requerimiento de Hacienda, bienes en el extranjero, situaciones fiscales complejas.`,
};

// ── Arraigo Social ────────────────────────────────────────────────────────────

const arraigo_social: ViabilityCheck = {
  serviceSlug: 'arraigo-social',
  serviceName: 'Arraigo Social',
  intro: 'El arraigo social exige, con carácter general, 2 años de permanencia continuada en España y acreditar vínculos familiares + medios económicos o integración social. Verifica tu situación en 3 minutos.',
  estimatedMinutes: 3,
  questions: [
    {
      id: 'anios_permanencia',
      type: 'select',
      label: '¿Cuánto tiempo llevas en España de forma continuada?',
      hint: 'Para el arraigo social actual se exigen, con carácter general, al menos 2 años inmediatamente anteriores a la solicitud.',
      required: true,
      options: [
        { value: 'menos_de_2', label: 'Menos de 2 años', disqualifies: true },
        { value: 'dos_o_mas', label: '2 años o más' },
      ],
    },
    {
      id: 'ausencias',
      type: 'select',
      label: 'Durante esos 2 años, ¿cuánto tiempo has estado fuera de España?',
      required: true,
      options: [
        { value: 'hasta_90', label: '90 días o menos' },
        { value: 'mas_90', label: 'Más de 90 días', escalates: true },
      ],
    },
    {
      id: 'proteccion_internacional',
      type: 'boolean',
      label: '¿Has sido solicitante de protección internacional durante parte de ese periodo?',
      hint: 'Ese tiempo puede afectar al cómputo y debe revisarse antes de fijar la fecha de solicitud.',
      required: true,
      escalatesIfTrue: true,
    },
    {
      id: 'situacion_actual',
      type: 'select',
      label: '¿Cuál es tu situación migratoria actual en España?',
      required: true,
      options: [
        { value: 'sin_permiso', label: 'Sin autorización de estancia o residencia' },
        { value: 'otro_procedimiento', label: 'Tengo otro procedimiento de estancia/residencia en curso', escalates: true },
        { value: 'permiso_vigente', label: 'Tengo una autorización vigente', escalates: true },
      ],
    },
    {
      id: 'vinculos',
      type: 'boolean',
      label: '¿Tienes cónyuge, pareja registrada, ascendientes o descendientes de primer grado con residencia legal en España?',
      required: true,
    },
    {
      id: 'medios_economicos',
      type: 'boolean',
      label: 'Si tienes esos vínculos, ¿puedes acreditar medios económicos suficientes?',
      required: false,
    },
    {
      id: 'informe_integracion',
      type: 'select',
      label: 'Si no tienes esos vínculos, ¿tienes o puedes solicitar informe favorable de integración social?',
      required: false,
      options: [
        { value: 'si', label: 'Sí' },
        { value: 'en_tramite', label: 'Está en trámite' },
        { value: 'no', label: 'No / no lo sé', escalates: true },
      ],
    },
    {
      id: 'antecedentes',
      type: 'boolean',
      label: '¿Tienes antecedentes penales relevantes en España o en los países donde residiste antes de entrar en España?',
      required: true,
      escalatesIfTrue: true,
    },
  ],
  docs: [
    { id: 'pasaporte', label: 'Pasaporte en vigor (copia completa)', required: true },
    {
      id: 'permanencia',
      label: 'Pruebas de permanencia continuada durante al menos 2 años',
      required: true,
      howToGet: 'Prioriza certificados de empadronamiento histórico y otra documentación emitida o registrada por administraciones públicas.',
    },
    {
      id: 'vinculos_familiares',
      label: 'Documentación acreditativa de vínculos familiares (si aplica)',
      required: false,
    },
    {
      id: 'medios',
      label: 'Documentación de medios económicos suficientes (si aplica)',
      required: false,
    },
    {
      id: 'informe_integracion',
      label: 'Informe favorable de integración social (si aplica)',
      required: false,
    },
    {
      id: 'antecedentes_pais_origen',
      label: 'Certificado de antecedentes penales del país o países correspondientes, cuando proceda',
      required: true,
      howToGet: 'Debe cumplir los requisitos de apostilla/legalización y traducción jurada cuando correspondan.',
    },
  ],
  aiCriteria: `Eres un experto en extranjería española. Evalúa si el caso es VIABLE para el Arraigo Social conforme al régimen vigente.

NORMATIVA APLICABLE:
- Ley Orgánica 4/2000.
- Real Decreto 1155/2024.
- Requisitos clave:
  1. Permanencia continuada en España de al menos 2 años inmediatamente anteriores a la solicitud.
  2. Ausencias no superiores a 90 días durante ese periodo.
  3. Revisar periodos como solicitante de protección internacional antes de computarlos.
  4. No ser titular de autorización de estancia/residencia ni estar inmerso en otro procedimiento incompatible, salvo revisión profesional.
  5. Carecer de antecedentes penales en los términos legalmente exigibles.
  6. Acreditar vínculos familiares con personas extranjeras residentes + medios económicos suficientes, O informe favorable de integración social si no concurren esos vínculos.
  7. El contrato de trabajo NO es requisito específico del arraigo social; esa lógica corresponde al arraigo sociolaboral.

CRITERIOS DE VIABILIDAD:
- VIABLE: 2+ años, ausencias <=90 días, situación compatible, sin incidencias penales relevantes, y vía familiar+medios o integración social acreditable.
- PARCIAL: Cumple tiempo pero falta completar medios económicos o informe de integración.
- NO VIABLE: Menos de 2 años de permanencia acreditable.
- ESCALAR: Protección internacional previa, ausencias >90 días, antecedentes, otro procedimiento migratorio, dudas sobre cómputo o documentación.`,
};

// ── Arraigo Familiar ──────────────────────────────────────────────────────────

const arraigo_familiar: ViabilityCheck = {
  serviceSlug: 'arraigo-familiar',
  serviceName: 'Arraigo Familiar',
  intro: 'El arraigo familiar vigente se limita a supuestos específicos. Primero debemos identificar el vínculo y la nacionalidad/situación del familiar de referencia.',
  estimatedMinutes: 3,
  questions: [
    {
      id: 'familiar_tipo',
      type: 'select',
      label: '¿Cuál es el supuesto familiar que quieres acreditar?',
      required: true,
      options: [
        { value: 'progenitor_tutor_menor_ue', label: 'Padre/madre/tutor de menor nacional UE/EEE/Suiza' },
        { value: 'apoyo_discapacidad_ue', label: 'Familiar que presta apoyo a persona con discapacidad nacional UE/EEE/Suiza' },
        { value: 'familiar_espanol', label: 'Familiar de ciudadano español', escalates: true },
        { value: 'otro', label: 'Otro vínculo familiar', escalates: true },
      ],
    },
    {
      id: 'convivencia_cargo',
      type: 'boolean',
      label: '¿Puedes acreditar convivencia, cargo, tutela, apoyo u obligaciones familiares cuando el supuesto lo exige?',
      required: true,
      disqualifiesIfFalse: true,
    },
    {
      id: 'familiar_documentado',
      type: 'boolean',
      label: '¿Dispones de documentación que acredite la nacionalidad/situación del familiar y el vínculo?',
      required: true,
      disqualifiesIfFalse: true,
    },
    {
      id: 'antecedentes',
      type: 'boolean',
      label: '¿Tienes antecedentes penales relevantes?',
      required: true,
      escalatesIfTrue: true,
    },
  ],
  docs: [
    { id: 'pasaporte', label: 'Pasaporte completo o documento de viaje admitido', required: true },
    { id: 'doc_familiar', label: 'Documento de identidad/nacionalidad del familiar de referencia', required: true },
    { id: 'doc_vinculo', label: 'Documento acreditativo del vínculo familiar', required: true },
    { id: 'prueba_cargo', label: 'Prueba de convivencia, cargo, tutela, apoyo u obligaciones paternofiliales según el supuesto', required: true },
    { id: 'antecedentes', label: 'Certificado de antecedentes penales cuando proceda', required: false },
  ],
  aiCriteria: `Evalúa si el caso encaja en el arraigo familiar vigente conforme al RD 1155/2024 y la hoja informativa 31 actualizada en abril de 2026.
- NO tratarlo como vía genérica para familiares de españoles o residentes.
- VIABLE: supuesto legal vigente claramente identificado y vínculo/cargo/apoyo acreditable.
- PARCIAL: falta documentación pero el supuesto parece encajar.
- ESCALAR: familiar de ciudadano español, otro vínculo no previsto, dudas sobre régimen aplicable, antecedentes o situación migratoria compleja.
- NO VIABLE: el supuesto no pertenece al arraigo familiar vigente y corresponde otra autorización.`,
};

const nacionalidad: ViabilityCheck = {
  serviceSlug: 'nacionalidad-espanola',
  serviceName: 'Nacionalidad Española',
  intro: 'La nacionalidad española requiere tiempo de residencia legal, exámenes y documentación apostillada. Verifica tu situación en 4 minutos.',
  estimatedMinutes: 4,
  questions: [
    {
      id: 'via',
      type: 'select',
      label: '¿Por qué vía quieres solicitar la nacionalidad española?',
      required: true,
      options: [
        { value: '10_anos',          label: '10 años de residencia legal continuada (vía general)' },
        { value: '5_anos_asilo',     label: '5 años como refugiado o asilado en España' },
        { value: '2_anos_iberoam',   label: '2 años (ciudadanos de países iberoamericanos, Portugal, Filipinas, Guinea Ecuatorial, Andorra o Sefardíes)' },
        { value: '1_ano_casado',     label: '1 año (casado/a con español/a)' },
        { value: '1_ano_nacido',     label: '1 año (nacido/a en España)' },
        { value: 'no_se',            label: 'No sé cuál me corresponde', escalates: true },
      ],
    },
    {
      id: 'tiempo_residencia',
      type: 'boolean',
      label: '¿Llevas el tiempo de residencia legal requerido (según tu vía) sin interrupciones superiores a 90 días consecutivos?',
      required: true,
      disqualifiesIfFalse: true,
    },
    {
      id: 'tie_continuo',
      type: 'boolean',
      label: '¿Has mantenido el TIE (tarjeta de identificación de extranjero) vigente durante todo el período de residencia?',
      hint: 'Períodos sin TIE válido pueden no computar como residencia legal.',
      required: true,
      escalatesIfTrue: false,
    },
    {
      id: 'antecedentes',
      type: 'boolean',
      label: '¿Tienes antecedentes penales en España o en tu país de origen?',
      required: true,
      escalatesIfTrue: true,
    },
    {
      id: 'dele',
      type: 'select',
      label: '¿Tienes el certificado DELE A2 (o superior) de español?',
      hint: 'Obligatorio para ciudadanos de países no hispanohablantes. Los nacionales de países hispanohablantes están exentos.',
      required: true,
      options: [
        { value: 'tengo_dele',       label: 'Sí, tengo DELE A2 o superior' },
        { value: 'hispanohablante',  label: 'Soy de un país hispanohablante (exento)' },
        { value: 'en_proceso',       label: 'Estoy en proceso de obtenerlo', escalates: true },
        { value: 'ninguno',          label: 'No lo tengo aún', escalates: true },
      ],
    },
    {
      id: 'ccse',
      type: 'select',
      label: '¿Tienes el certificado CCSE (Conocimiento de la Constitución y Sociedad Española)?',
      required: true,
      options: [
        { value: 'tengo_ccse',  label: 'Sí, tengo el CCSE' },
        { value: 'en_proceso',  label: 'Estoy en proceso de obtenerlo', escalates: true },
        { value: 'ninguno',     label: 'No lo tengo aún', escalates: true },
      ],
    },
    {
      id: 'cert_nacimiento',
      type: 'boolean',
      label: '¿Tienes el certificado de nacimiento apostillado y traducido al español?',
      required: true,
    },
  ],
  docs: [
    { id: 'pasaporte', label: 'Pasaporte en vigor (todas las páginas)', required: true },
    { id: 'tie', label: 'TIE (Tarjeta de Identificación de Extranjero) vigente', required: true },
    {
      id: 'empadronamiento_historico',
      label: 'Empadronamiento histórico (desde el inicio de la residencia)',
      required: true,
      howToGet: 'Solicítalo en tu Ayuntamiento. Debe reflejar toda la residencia continuada.',
    },
    {
      id: 'antecedentes_origen',
      label: 'Certificado de antecedentes penales del país de origen (apostillado y traducido)',
      required: true,
      howToGet: 'Solicítalo en el consulado o ministerio de justicia de tu país de origen.',
    },
    {
      id: 'cert_nacimiento',
      label: 'Certificado de nacimiento (apostillado y traducido al español)',
      required: true,
      howToGet: 'Solicítalo en el registro civil de tu país. Debe llevar apostilla de La Haya y traducción jurada al español.',
    },
    { id: 'dele', label: 'Diploma DELE A2 o superior (Instituto Cervantes)', required: false },
    { id: 'ccse', label: 'Certificado CCSE (Instituto Cervantes)', required: false },
    { id: 'foto', label: 'Foto reciente en fondo blanco (tamaño carné)', required: true },
  ],
  aiCriteria: `Eres un experto en extranjería y nacionalidad española. Evalúa si el caso es VIABLE para adquirir la nacionalidad española.

NORMATIVA APLICABLE:
- Arts. 17-26 del Código Civil español (redacción vigente 2024).
- LO 4/2000 de Extranjería y su Reglamento (RD 557/2011).
- Ley 12/2015 (nacionalidad para sefardíes, ya cerrada).
- Instrucción DGRN de 26/07/2007 y circulares posteriores.

PLAZOS DE RESIDENCIA LEGAL REQUERIDOS:
- Regla general: 10 años de residencia legal continuada.
- 5 años: Refugiados y asilados.
- 2 años: Nacionales de países iberoamericanos (incluye Argentina, Bolivia, Brasil, Chile, Colombia, Costa Rica, Cuba, Ecuador, El Salvador, Guatemala, Honduras, México, Nicaragua, Panamá, Paraguay, Perú, República Dominicana, Uruguay, Venezuela), Portugal, Andorra, Filipinas, Guinea Ecuatorial, Sefardíes.
- 1 año: Nacido en España, casado/a con español/a (desde fecha boda), viudo/a de español/a sin separación legal, comprendido en el segundo grado de consanguinidad de originariamente español.

REQUISITOS ADICIONALES:
- Residencia legal y continuada (interrupciones >90 días seguidos pueden ser problemáticas).
- Buena conducta cívica (sin antecedentes penales relevantes en España ni en el país de origen).
- Suficiente integración en la sociedad española (DELE A2 + CCSE, salvo exenciones).
- Para no hispanohablantes: DELE A2 o superior obligatorio.
- CCSE obligatorio para todos salvo excepciones.

CRITERIOS DE VIABILIDAD:
- VIABLE: Cumple tiempo de residencia según su vía, sin antecedentes, tiene o está en proceso de DELE y CCSE.
- PARCIAL: Cumple tiempo pero faltan los certificados DELE/CCSE (podemos gestionar la tramitación mientras los obtiene).
- NO VIABLE: No cumple el tiempo mínimo de residencia requerido para su vía.
- ESCALAR: Antecedentes penales, períodos sin TIE, situaciones familiares complejas, dudas sobre la vía aplicable.`,
};

// ── Nacionalidad para menor nacido en España ──────────────────────────────────

const nacionalidad_menor: ViabilityCheck = {
  serviceSlug: 'nacionalidad-espanola-menor-nacido-en-espana',
  serviceName: 'Nacionalidad española para menor nacido en España',
  intro: 'Si el menor nació en España, la vía de nacionalidad por residencia puede aplicar tras 1 año de residencia legal, continuada e inmediatamente anterior. Verifica los datos clave en 3 minutos.',
  estimatedMinutes: 3,
  questions: [
    {
      id: 'nacido_espana',
      type: 'boolean',
      label: '¿El menor nació en España?',
      required: true,
      disqualifiesIfFalse: true,
    },
    {
      id: 'residencia_menor_12m',
      type: 'boolean',
      label: '¿El menor ha cumplido al menos 1 año de residencia legal, continuada e inmediatamente anterior a la solicitud?',
      required: true,
      disqualifiesIfFalse: true,
    },
    {
      id: 'edad_menor',
      type: 'select',
      label: '¿Qué edad tiene el menor?',
      required: true,
      options: [
        { value: 'menos_14', label: 'Menos de 14 años' },
        { value: '14_17', label: 'Entre 14 y 17 años' },
        { value: '18_o_mas', label: '18 años o más', disqualifies: true },
      ],
    },
    {
      id: 'acuerdo_representantes',
      type: 'select',
      label: '¿Existe acuerdo entre quienes ejercen la patria potestad o representación legal?',
      required: true,
      options: [
        { value: 'si', label: 'Sí, existe acuerdo' },
        { value: 'unico_representante', label: 'Solo actúa un representante y puedo acreditarlo', escalates: true },
        { value: 'desacuerdo', label: 'No existe acuerdo', escalates: true },
      ],
    },
    {
      id: 'apellidos_actuales',
      type: 'select',
      label: '¿Cómo figura actualmente el menor respecto a sus apellidos?',
      required: true,
      options: [
        { value: 'dos_o_mas', label: 'Ya figura con dos o más apellidos' },
        { value: 'uno', label: 'Figura con un solo apellido' },
        { value: 'no_seguro', label: 'No estoy seguro/a', escalates: true },
      ],
    },
    {
      id: 'cert_nacimiento',
      type: 'boolean',
      label: '¿Dispones del certificado literal de nacimiento del menor expedido por el Registro Civil español?',
      required: true,
    },
    {
      id: 'doc_menor',
      type: 'boolean',
      label: '¿El menor dispone de pasaporte y documentación de residencia legal vigente o acreditable?',
      required: true,
    },
  ],
  docs: [
    { id: 'cert_nacimiento_espana', label: 'Certificación literal de nacimiento del menor (Registro Civil español)', required: true },
    { id: 'pasaporte_menor', label: 'Pasaporte completo y en vigor del menor', required: true },
    { id: 'residencia_menor', label: 'TIE/NIE, resolución inicial y tarjetas anteriores que acrediten la residencia legal del menor', required: true },
    { id: 'pasaporte_padres', label: 'Pasaportes de los progenitores o representantes legales', required: true },
    { id: 'tie_padres', label: 'NIE/TIE de los progenitores o representantes, si procede', required: false },
    { id: 'empadronamiento', label: 'Empadronamiento familiar/colectivo actualizado', required: true },
    { id: 'centro_escolar', label: 'Certificado del centro escolar o educativo cuando corresponda por edad y escolarización', required: false },
    { id: 'apellido_materno', label: 'Documento que acredite el apellido personal/de nacimiento de la madre, solo si la familia desea utilizarlo como segundo apellido del menor', required: false },
  ],
  aiCriteria: `Eres un experto en extranjería y nacionalidad española. Evalúa la viabilidad de la nacionalidad española por residencia de un menor nacido en España.

CRITERIO CENTRAL:
- Art. 22 del Código Civil: para quien haya nacido en territorio español basta 1 año de residencia.
- En todo caso, la residencia debe ser legal, continuada e inmediatamente anterior a la petición.
- La residencia relevante es la del menor solicitante; la residencia de los padres no sustituye este requisito.

REPRESENTACIÓN:
- Menor de 14 años: actúa a través de sus representantes legales. Tras la Ley 8/2021, en el supuesto ordinario con acuerdo no se exige autorización previa del Encargado del Registro Civil.
- Entre 14 y 17 años: el menor formula la solicitud asistido por sus representantes legales.
- Si no existe acuerdo entre quienes ejercen la patria potestad, escalar para revisar la resolución de jurisdicción voluntaria necesaria.
- Si actúa un solo progenitor, revisar el título que acredita representación suficiente.

PRUEBAS:
- Menores de edad: exentos de CCSE.
- Menores de 18 años: exentos de DELE A2 para nacionalidad.
- Revisar documentación escolar/educativa cuando corresponda para acreditar integración.

APELLIDOS PARA REGISTRO CIVIL:
- Antes de preparar el formulario oficial, confirmar por escrito el nombre y los apellidos que se pretenden consignar tras la adquisición de la nacionalidad.
- Si el menor usa un solo apellido, esta circunstancia no hace inviable el expediente: puede documentarse la duplicación del apellido actual o, si la familia lo prefiere, el apellido personal/de nacimiento de la madre cuando pueda acreditarse.
- No pedir el certificado de nacimiento de la madre por defecto. Solo es un documento condicional si la familia elige utilizar un apellido materno distinto.
- No presentar como libre elección la posibilidad de usar cualquier apellido ajeno a la filiación.

CRITERIOS DE VIABILIDAD:
- VIABLE: nacido en España + 1 año de residencia legal/continuada/inmediatamente anterior + documentación esencial + representación clara.
- PARCIAL: cumple el año pero falta documentación subsanable, acreditación escolar/representativa o todavía no se han cerrado los apellidos registrales.
- NO VIABLE: no ha cumplido el año de residencia legal o ya no es menor para este servicio específico.
- ESCALAR: desacuerdo entre progenitores, representación dudosa, interrupciones de residencia, filiación o apellidos complejos, posible nacionalidad de origen o apatridia.`,
};

// ── Permiso Inicial de Residencia ────────────────────────────────────────────

const permiso_residencia: ViabilityCheck = {
  serviceSlug: 'permiso-residencia-inicial',
  serviceName: 'Permiso Inicial de Residencia',
  intro: 'El primer permiso de residencia puede solicitarse por varias vías (arraigo, trabajo, familiar, etc.). Identifica la más adecuada para tu caso en 3 minutos.',
  estimatedMinutes: 3,
  questions: [
    {
      id: 'motivo',
      type: 'select',
      label: '¿Cuál es tu principal motivo para solicitar el permiso de residencia?',
      required: true,
      options: [
        { value: 'trabajo',    label: 'Tengo una oferta de trabajo en España' },
        { value: 'familia',    label: 'Reagrupación familiar (familiar con residencia legal)' },
        { value: 'arraigo',    label: 'Llevo varios años en España (posible arraigo)' },
        { value: 'estudios',   label: 'Por estudios o formación' },
        { value: 'otros',      label: 'Otro motivo', escalates: true },
      ],
    },
    {
      id: 'tiempo_espana',
      type: 'select',
      label: '¿Cuánto tiempo llevas viviendo en España?',
      required: true,
      options: [
        { value: 'menos_1',   label: 'Menos de 1 año' },
        { value: '1_a_3',     label: 'Entre 1 y 3 años' },
        { value: 'mas_3',     label: 'Más de 3 años' },
      ],
    },
    {
      id: 'antecedentes',
      type: 'boolean',
      label: '¿Tienes antecedentes penales en España o en tu país de origen?',
      required: true,
      escalatesIfTrue: true,
    },
  ],
  docs: [
    { id: 'pasaporte', label: 'Pasaporte en vigor', required: true },
    { id: 'empadronamiento', label: 'Empadronamiento actualizado', required: true },
    { id: 'contrato_trabajo', label: 'Contrato u oferta de trabajo (si aplica)', required: false },
    { id: 'antecedentes_origen', label: 'Certificado de antecedentes penales (apostillado)', required: false },
  ],
  aiCriteria: `Eres un experto en extranjería española. Evalúa qué vía de residencia es más adecuada para el caso del cliente.

NORMATIVA: LO 4/2000 y RD 557/2011. Las vías principales son:
- Arraigo social vigente: 2 años de permanencia continuada + vínculos familiares y medios económicos o informe favorable de integración social.
- Arraigo familiar (art. 125): vínculo familiar con español o residente legal.
- Arraigo laboral (art. 123): 2 años + relación laboral irregular acreditable.
- Residencia por trabajo (art. 36-46): oferta de trabajo, cupo o situación nacional de empleo favorable.
- Residencia familiar (art. 52-60): reagrupación con familiar residente legal.

Indica la vía más adecuada según las respuestas y si el caso es viable, parcial o necesita consulta.`,
};

// ── Generic fallback (all other services) ────────────────────────────────────

const generic: ViabilityCheck = {
  serviceSlug: '_generic',
  serviceName: 'Servicio',
  intro: 'Cuéntanos brevemente tu situación para que podamos evaluar si tu caso es apto para este servicio.',
  estimatedMinutes: 2,
  questions: [
    {
      id: 'tiene_dni',
      type: 'boolean',
      label: '¿Tienes tu DNI o NIE en vigor?',
      required: true,
    },
    {
      id: 'situacion',
      type: 'text',
      label: 'Describe brevemente tu situación y lo que necesitas (2-3 frases):',
      hint: 'Por ejemplo: "Llevo 4 años en España, quiero regularizarme" o "Quiero dar de alta mi actividad de autónomo".',
      required: true,
    },
    {
      id: 'urgencia',
      type: 'select',
      label: '¿Tienes algún plazo o urgencia?',
      required: false,
      options: [
        { value: 'urgente',    label: 'Sí, es urgente (hay un plazo próximo)', escalates: true },
        { value: 'pronto',     label: 'Querría resolverlo pronto (próximo mes)' },
        { value: 'sin_prisa',  label: 'Sin urgencia especial' },
      ],
    },
  ],
  docs: [
    { id: 'dni_nie', label: 'DNI / NIE / Pasaporte en vigor', required: true },
  ],
  aiCriteria: `Eres un asesor fiscal y legal de EXPERT, asesoría española especializada en extranjería, fiscalidad y derecho mercantil. Evalúa si el caso descrito por el cliente es viable para el servicio solicitado. Usa criterios de viabilidad general: documentación básica disponible, situación legal regularizable, ausencia de impedimentos legales evidentes. Si el caso es complejo o requiere análisis profundo, recomienda una consulta con el equipo de EXPERT.`,
};

// ── Arraigo Laboral ───────────────────────────────────────────────────────────

const arraigo_laboral: ViabilityCheck = {
  serviceSlug: 'arraigo-laboral',
  serviceName: 'Arraigo Sociolaboral',
  intro: 'El arraigo sociolaboral exige, con carácter general, 2 años de permanencia y uno o varios contratos que sumen al menos 20 horas semanales.',
  estimatedMinutes: 3,
  questions: [
    {
      id: 'tiempo_espana',
      type: 'boolean',
      label: '¿Puedes acreditar al menos 2 años de permanencia continuada en España?',
      required: true,
      disqualifiesIfFalse: true,
    },
    {
      id: 'proteccion_internacional',
      type: 'boolean',
      label: '¿Has sido solicitante de protección internacional durante parte de ese periodo?',
      required: true,
      escalatesIfTrue: true,
    },
    {
      id: 'contratos',
      type: 'boolean',
      label: '¿Tienes uno o varios contratos de trabajo firmados?',
      required: true,
      disqualifiesIfFalse: true,
    },
    {
      id: 'horas',
      type: 'select',
      label: '¿Cuántas horas semanales suman todos los contratos?',
      required: true,
      options: [
        { value: 'menos_20', label: 'Menos de 20 horas', disqualifies: true },
        { value: '20_o_mas', label: '20 horas o más' },
      ],
    },
    {
      id: 'salario',
      type: 'boolean',
      label: '¿El salario respeta el SMI o convenio aplicable en proporción a la jornada?',
      required: true,
      disqualifiesIfFalse: true,
    },
    {
      id: 'empleador_solvente',
      type: 'boolean',
      label: '¿El empleador o empleadores están al corriente y pueden acreditar solvencia suficiente?',
      required: true,
      escalatesIfTrue: false,
    },
    {
      id: 'antecedentes',
      type: 'boolean',
      label: '¿Tienes antecedentes penales relevantes?',
      required: true,
      escalatesIfTrue: true,
    },
  ],
  docs: [
    { id: 'pasaporte', label: 'Pasaporte completo', required: true },
    { id: 'permanencia', label: 'Pruebas de permanencia continuada durante al menos 2 años', required: true },
    { id: 'contratos', label: 'Contrato o contratos de trabajo firmados', required: true },
    { id: 'empleador_docs', label: 'NIF y documentación societaria/representación del empleador cuando proceda', required: true },
    { id: 'solvencia', label: 'IRPF/IVA/Impuesto sobre Sociedades/VILE u otra prueba de solvencia según proceda', required: true },
    { id: 'antecedentes', label: 'Certificado de antecedentes penales extranjero cuando proceda', required: true },
    { id: 'cualificacion', label: 'Titulación/homologación cuando la profesión sea regulada', required: false },
  ],
  aiCriteria: `Evalúa conforme al arraigo sociolaboral vigente (RD 1155/2024; hoja 29 actualizada en abril de 2026).
REQUISITOS CLAVE:
- 2 años de permanencia continuada.
- Uno o varios contratos de trabajo.
- Jornada semanal global no inferior a 20 horas.
- Salario conforme SMI o convenio aplicable, proporcional a la jornada.
- Empleador/es al corriente de obligaciones y con solvencia suficiente.
- No aplicar como regla actual el antiguo arraigo laboral basado en acta ITSS/sentencia.
VIABLE: cumple los requisitos anteriores.
PARCIAL/ESCALAR: protección internacional previa, dudas de cómputo, salario, solvencia o profesión regulada.
NO VIABLE: menos de 2 años o contratos que no alcanzan la jornada mínima.`,
};

const reagrupacion_familiar: ViabilityCheck = {
  serviceSlug: 'reagrupacion-familiar',
  serviceName: 'Reagrupación Familiar',
  intro: 'La reagrupación familiar exige residencia legal, ingresos suficientes y vivienda adecuada. Verifica si cumples los requisitos en 3 minutos.',
  estimatedMinutes: 3,
  questions: [
    {
      id: 'residencia_reagrupante',
      type: 'select',
      label: '¿Cuánto tiempo llevas con permiso de residencia legal en España?',
      required: true,
      options: [
        { value: 'menos_1', label: 'Menos de 1 año', disqualifies: true },
        { value: '1_a_2',   label: 'Entre 1 y 2 años' },
        { value: 'mas_2',   label: 'Más de 2 años' },
      ],
    },
    {
      id: 'parentesco',
      type: 'select',
      label: '¿Qué familiar quieres reagrupar?',
      required: true,
      options: [
        { value: 'conyuge',    label: 'Cónyuge o pareja de hecho inscrita' },
        { value: 'hijo_menor', label: 'Hijo/a menor de 18 años' },
        { value: 'ascendiente', label: 'Padre o madre dependiente económicamente' },
        { value: 'otro',       label: 'Otro familiar', escalates: true },
      ],
    },
    {
      id: 'ingresos',
      type: 'select',
      label: '¿Cuáles son tus ingresos netos mensuales aproximados?',
      required: true,
      hint: 'Necesitas al menos 150 % del IPREM mensual (~1.200 €) por el primer familiar.',
      options: [
        { value: 'menos_1200', label: 'Menos de 1.200 € al mes', disqualifies: true },
        { value: '1200_1800',  label: 'Entre 1.200 € y 1.800 € al mes' },
        { value: 'mas_1800',   label: 'Más de 1.800 € al mes' },
      ],
    },
    {
      id: 'vivienda',
      type: 'boolean',
      label: '¿Tienes una vivienda con habitabilidad suficiente para el familiar que quieres reagrupar?',
      hint: 'El Ayuntamiento emite un informe de habitabilidad según el número de ocupantes y m².',
      required: true,
    },
  ],
  docs: [
    { id: 'tie_reagrupante', label: 'TIE del reagrupante en vigor', required: true },
    { id: 'pasaporte_reagrupante', label: 'Pasaporte del reagrupante', required: true },
    { id: 'nominas', label: 'Últimas 3–6 nóminas o justificantes de ingresos', required: true },
    { id: 'informe_vivienda', label: 'Informe de habitabilidad de la vivienda (Ayuntamiento)', required: true, howToGet: 'Solicítalo en el Ayuntamiento donde resides.' },
    { id: 'doc_parentesco', label: 'Certificado de matrimonio, libro de familia o acta de pareja de hecho (apostillado y traducido si es extranjero)', required: true },
    { id: 'pasaporte_familiar', label: 'Pasaporte del familiar a reagrupar', required: true },
  ],
  aiCriteria: `Evalúa si el caso es VIABLE para la Reagrupación Familiar (arts. 52-60 LO 4/2000, RD 557/2011).
REQUISITOS DEL REAGRUPANTE: ≥1 año de residencia legal, renovable al menos otro año. Ingresos ≥150 % IPREM por el primer familiar (~1.200 €/mes en 2025) + 50 % adicional por cada extra. Vivienda con informe de habitabilidad. FAMILIARES REAGRUPABLES: cónyuge/pareja, hijos <18, ascendientes dependientes.
VIABLE: cumple ingresos, vivienda y residencia. PARCIAL: ingresos limítrofes o vivienda pendiente de informe. NO VIABLE: <1 año de residencia o ingresos claramente insuficientes.`,
};

// ── Renovación de Residencia ──────────────────────────────────────────────────

const renovacion_residencia: ViabilityCheck = {
  serviceSlug: 'renovacion-residencia',
  serviceName: 'Renovación de Residencia',
  intro: 'Verifica si tu situación es apta para renovar tu permiso de residencia y qué documentación necesitas.',
  estimatedMinutes: 2,
  questions: [
    {
      id: 'tipo_permiso',
      type: 'select',
      label: '¿Qué tipo de autorización de residencia tienes actualmente?',
      required: true,
      options: [
        { value: 'arraigo',      label: 'Arraigo (social, familiar o laboral)' },
        { value: 'trabajo',      label: 'Residencia y trabajo por cuenta ajena' },
        { value: 'reagrupacion', label: 'Residencia por reagrupación familiar' },
        { value: 'otras',        label: 'Otra (circunstancias excepcionales, estudiante…)', escalates: true },
      ],
    },
    {
      id: 'caducidad',
      type: 'select',
      label: '¿En qué situación está tu autorización actual?',
      required: true,
      options: [
        { value: 'vigente',       label: 'Vigente — caduca en menos de 60 días' },
        { value: 'muy_vigente',   label: 'Vigente — caduca en más de 60 días' },
        { value: 'recien_caducada', label: 'Caducada hace menos de 90 días' },
        { value: 'mas_90',        label: 'Caducada hace más de 90 días', escalates: true },
      ],
    },
    {
      id: 'mantiene_requisitos',
      type: 'boolean',
      label: '¿Sigues manteniendo los requisitos que motivaron el permiso inicial (contrato, ingresos, vínculo familiar…)?',
      required: true,
      escalatesIfTrue: false,
    },
  ],
  docs: [
    { id: 'tie', label: 'TIE actual (por ambas caras)', required: true },
    { id: 'pasaporte', label: 'Pasaporte en vigor', required: true },
    { id: 'empadronamiento', label: 'Certificado de empadronamiento actualizado (máx. 3 meses)', required: true },
    { id: 'justificante_ingresos', label: 'Nóminas, contrato o justificante de ingresos (según tipo de permiso)', required: false },
  ],
  aiCriteria: `Evalúa si el caso es VIABLE para la Renovación de Residencia. VIABLE si tiene permiso vigente o caducado hace <90 días y mantiene requisitos. PARCIAL si mantiene requisitos pero está al límite del plazo o tiene algún cambio de circunstancias. ESCALAR si caducó hace >90 días (puede requerir nuevo expediente) o si cambió radicalmente su situación laboral/familiar.`,
};

// ── Registry ──────────────────────────────────────────────────────────────────

const VIABILITY_CHECKS: Record<string, ViabilityCheck> = {
  'irpf':                                          irpf,
  'arraigo-social':                                arraigo_social,
  'arraigo-familiar':                              arraigo_familiar,
  'arraigo-laboral':                               arraigo_laboral,
  'reagrupacion-familiar':                         reagrupacion_familiar,
  'renovacion-residencia':                         renovacion_residencia,
  'nacionalidad-espanola':                         nacionalidad,
  'nacionalidad-espanola-menor-nacido-en-espana':  nacionalidad_menor,
  'permiso-residencia-inicial':                    permiso_residencia,
};

export function getViabilityCheck(serviceSlug: string): ViabilityCheck {
  return VIABILITY_CHECKS[serviceSlug] ?? { ...generic, serviceSlug, serviceName: serviceSlug };
}

export function hasSpecificViabilityCheck(serviceSlug: string): boolean {
  return serviceSlug in VIABILITY_CHECKS;
}

export { VIABILITY_CHECKS };
