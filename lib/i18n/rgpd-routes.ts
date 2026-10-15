/** Exact bilingual RGPD route pairs; do not invent unavailable translations. */
export const RGPD_PAIRED_PATHS = [
 ['/herramientas/rgpd','/ru/instrumenty/rgpd'],
 ['/servicios/empresas-autonomos/formacion-rgpd-aepd','/ru/uslugi/obuchenie-rgpd'],
 ['/blog/facilita-rgpd-facilita-emprende-gestiona-rgpd-diferencias','/ru/blog/instrumenty-aepd-rgpd-sravnenie'],
 ['/blog/rgpd-marketplaces-candidatos-datos-sensibles-responsabilidad','/ru/blog/rgpd-platformy-kandidaty'],
 ['/docs/formacion-rgpd-criterios-cumplimiento-y-evidencias','/ru/docs/rgpd-dokazatelstva-sootvetstviya'],
 ['/docs/rgpd-aepd-ruta-decisiones-para-startups','/ru/docs/rgpd-vybor-aepd']
] as const;
export function resolveRgpdPairedPath(path:string,locale:'es'|'ru'|'en'):string|null {
 if(locale==='en')return null;
 const pair=RGPD_PAIRED_PATHS.find(([es,ru])=>path===es||path===ru);
 return pair?(locale==='es'?pair[0]:pair[1]):null;
}
