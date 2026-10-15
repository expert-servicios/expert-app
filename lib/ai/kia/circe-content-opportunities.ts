/** Offline, non-persistent content opportunity detection for CIRCE/PAE.
 * Accepts a single short, already-redacted query; returns fixed labels only.
 * No user input, contact IDs or case evidence is returned or stored.
 */
export type CirceOpportunity = {
  topic: 'notary_fees'|'registry_fees'|'circe_deadlines'|'electronic_copy'|'fee_appeal'|'company_formation';
  formats: readonly ('faq'|'guide'|'article'|'checklist'|'training')[]; 
  sourceUrls: readonly string[];
  reviewRequired: true;
  publicationStatus: 'proposal_only';
};
const signal: ReadonlyArray<{match:RegExp; topic:CirceOpportunity['topic'];formats:CirceOpportunity['formats'];sourceUrls:string[]}> = [
 {match:/\b(notar[ií]a|notario|arancel notarial|escritura car[ao]|минут.*нотари|нотариус)\b/i,topic:'notary_fees',formats:['faq','guide','article'],sourceUrls:['https://www.boe.es/buscar/act.php?id=BOE-A-1989-28111']},
 {match:/\b(registro mercantil|registrador|arancel registral|inscripci[oó]n cara|торгов.*реестр)\b/i,topic:'registry_fees',formats:['faq','guide'],sourceUrls:['https://www.boe.es/buscar/act.php?id=BOE-A-1973-561']},
 {match:/\b(plazo|demora|retraso|horas h[aá]biles|cu[aá]nto tardan|срок|задержк)\b/i,topic:'circe_deadlines',formats:['faq','checklist','article'],sourceUrls:['https://www.boe.es/eli/es/l/2013/09/27/14/con']},
 {match:/\b(csv|copia electr[oó]nica|escritura digital|papel timbrado|verificar copia|электронн.*копи)\b/i,topic:'electronic_copy',formats:['faq','guide','checklist'],sourceUrls:['https://www.boe.es/buscar/act.php?id=BOE-A-1862-4073']},
 {match:/\b(reclama|recurr|impugn|queja|cobro excesivo|devoluci[oó]n arancel|жалоб|обжалован)\b/i,topic:'fee_appeal',formats:['faq','guide','article'],sourceUrls:['https://www.mjusticia.gob.es/es/ciudadania/tramites/recurso-contra-minutas']},
 {match:/\b(circe|creaci[oó]n.*sl|constituci[oó]n.*sociedad|crear.*empresa|учредить.*компан)\b/i,topic:'company_formation',formats:['guide','checklist','training'],sourceUrls:['https://www.boe.es/eli/es/l/2013/09/27/14/con']},
];
export function proposeCirceContentOpportunities(redactedQuestion:string):CirceOpportunity[] {
 if(typeof redactedQuestion!=='string'||redactedQuestion.length>3000)return [];
 return signal.filter(entry=>entry.match.test(redactedQuestion))
   .map(({topic,formats,sourceUrls})=>({topic,formats,sourceUrls,reviewRequired:true as const,publicationStatus:'proposal_only' as const}));
}
