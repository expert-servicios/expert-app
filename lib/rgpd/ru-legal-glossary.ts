/**
 * Bilingual legal vocabulary for the EXPERT RGPD user journey.
 * Spanish labels follow standard RGPD / LOPDGDD terminology.
 * Russian explanations are interpretative translations, not separate legal categories.
 */
import { RU_ES_LEGAL_TERMS } from '@/lib/i18n/ru-es-legal-glossary';

const RGPD_TERM_KEYS = [
  { id: 'personal-data', key: 'datos personales' },
  { id: 'processing', key: 'tratamiento de datos personales' },
  { id: 'controller', key: 'responsable del tratamiento' },
  { id: 'processor', key: 'encargado del tratamiento' },
  { id: 'rat', key: 'RAT' },
  { id: 'legal-basis', key: 'base jurídica del tratamiento' },
  { id: 'consent', key: 'consentimiento' },
  { id: 'privacy-policy', key: 'política de privacidad' },
  { id: 'information-duty', key: 'deber de información' },
  { id: 'special', key: 'categorías especiales de datos personales' },
  { id: 'profiling', key: 'elaboración de perfiles' },
  { id: 'automated', key: 'decisiones individuales automatizadas' },
  { id: 'eipd', key: 'EIPD' },
  { id: 'security', key: 'medidas de seguridad' },
  { id: 'breach', key: 'violación de seguridad de los datos personales' },
  { id: 'retention', key: 'plazo de conservación' },
  { id: 'rights', key: 'derechos de los interesados' },
  { id: 'transfer', key: 'transferencia internacional de datos' },
  { id: 'dpo', key: 'DPD' },
  { id: 'autonomo', key: 'autónomo' },
  { id: 'sl', key: 'sociedad limitada' },
] as const;
export const RGPD_RU_GLOSSARY = RGPD_TERM_KEYS.map(({id,key}) => {
  const entry = RU_ES_LEGAL_TERMS.find(term => term.key === key);
  if (!entry) throw new Error('Missing master legal term: ' + key);
  return {id,ru:entry.ru,es:entry.es,hint:entry.note};
});

export function rgpdRuWithEs(id: typeof RGPD_TERM_KEYS[number]['id']): string {
  const entry = RGPD_RU_GLOSSARY.find((item) => item.id === id);
  return entry ? `${entry.ru} (${entry.es})` : id;
}

/** Unified terminology supplied to both public KIA and internal Copilot. */
export const RGPD_RU_KIA_GLOSSARY = RU_ES_LEGAL_TERMS
  .filter(term => 'domain' in term && term.domain === 'rgpd')
  .map(term => `- ${term.ru} (${term.es}): ${term.note}`)
  .join('\n');
