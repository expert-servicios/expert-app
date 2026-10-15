/**
 * Routing guidance for public AEPD tools. This is not a legal risk assessment,
 * compliance verdict or EIPD determination. Only coarse answer categories are
 * processed, entirely in the browser. Nothing is sent to EXPERT.
 */
export type RgpdToolAnswer = boolean | 'none' | 'basic' | 'advanced' | 'unknown'
  | 'ordinary' | 'startup' | 'multiple';
export type RgpdToolAnswers = Record<string, RgpdToolAnswer | undefined>;

export type AepdToolId = 'facilita-rgpd' | 'facilita-emprende' | 'gestiona-rgpd';
export interface AepdToolRecommendation {
  primary: AepdToolId;
  complementary: AepdToolId[];
  rationale: string;
  cautions: string[];
  needsProfessionalReview: boolean;
}

export const AEPD_TOOLS: Record<AepdToolId, { title: string; url: string; purpose: string }> = {
  'facilita-rgpd': {
    title: 'Facilita RGPD',
    url: 'https://www.aepd.es/guias-y-herramientas/herramientas/facilita-rgpd',
    purpose: 'Documentación inicial de tratamientos habituales y de bajo riesgo.',
  },
  'facilita-emprende': {
    title: 'Facilita EMPRENDE',
    url: 'https://www.aepd.es/guias-y-herramientas/herramientas/facilita-emprende',
    purpose: 'Primer recorrido para startups y servicios innovadores.',
  },
  'gestiona-rgpd': {
    title: 'Gestiona RGPD',
    url: 'https://www.aepd.es/guias-y-herramientas/herramientas/gestiona2',
    purpose: 'Inventario, RAT y apoyo a la identificación y gestión del riesgo.',
  },
};

const RISK_SIGNALS = [
  'special', 'minors', 'profiling', 'location', 'largeScale', 'innovative', 'breach',
] as const;
const UNSURE_SIGNALS = [
  'special', 'minors', 'profiling', 'location', 'largeScale', 'innovative',
  'international',
] as const;

/** Never return "compliant", "safe" or "EIPD not needed" from questionnaire answers. */
export function recommendAepdTools(answers: RgpdToolAnswers): AepdToolRecommendation {
  const businessType = answers.businessType;
  const innovation = businessType === 'startup' || answers.innovative === true;
  const riskSignals = RISK_SIGNALS.filter(key => answers[key] === true);
  const unknownRisk = UNSURE_SIGNALS.some(key => answers[key] === 'unknown');
  const complex = businessType === 'multiple' || riskSignals.length > 0;
  const cautions: string[] = [];
  if (riskSignals.length) {
    cautions.push('Hay indicadores que exigen estudiar el riesgo real y valorar si procede una EIPD. No se puede deducir la obligación únicamente de este cuestionario.');
  }
  if (unknownRisk || businessType === 'unknown' || businessType === undefined) {
    cautions.push('Faltan datos generales o hay respuestas desconocidas; confirma los tratamientos antes de elegir una ruta definitiva.');
  }
  if (answers.breach === true) {
    cautions.push('Si existe una brecha sin resolver, debe evaluarse de inmediato su documentación y posibles obligaciones de notificación. No esperes a una sesión formativa.');
  }
  const needsProfessionalReview = complex || unknownRisk || businessType === 'unknown' || businessType === undefined;

  if (innovation) {
    return {
      primary: 'facilita-emprende',
      complementary: complex ? ['gestiona-rgpd'] : [],
      rationale: 'Tu actividad se aproxima a una startup o servicio innovador. Facilita EMPRENDE es un punto de partida; Gestiona RGPD ayuda a profundizar cuando se han detectado factores de riesgo o varios tratamientos.',
      cautions,
      needsProfessionalReview,
    };
  }
  if (complex || businessType === 'unknown' || businessType === undefined || unknownRisk) {
    return {
      primary: 'gestiona-rgpd',
      complementary: [],
      rationale: 'La diversidad de tratamientos o las señales de incertidumbre aconsejan organizar el inventario y examinar riesgos con Gestiona RGPD antes de concluir que el caso es de bajo riesgo.',
      cautions,
      needsProfessionalReview: true,
    };
  }
  return {
    primary: 'facilita-rgpd',
    complementary: [],
    rationale: 'Por tus respuestas, puedes comenzar con Facilita RGPD para tratamientos habituales, siempre que al comprobarlos se confirme que son de bajo riesgo.',
    cautions,
    needsProfessionalReview: false,
  };
}
