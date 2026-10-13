export type OpportunitySignal = {
  sourceKey: string;
  headline: string;
  evidenceUrl?: string | null;
  observedCount?: number | null;
  verified?: boolean;
  effectiveDate?: string | null;
  category?: string;
};
export type OpportunityKind = 'new_service' | 'service_update' | 'article' | 'knowledge_update' | 'needs_review';
export type OpportunityProposal = {
  key: string;
  kind: OpportunityKind;
  headline: string;
  status: 'draft' | 'needs_review';
  reason: string;
  evidenceUrl: string | null;
  priority: number;
  locales: readonly ['es', 'ru'];
};
function normalize(input: string) {
  return input.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es')
    .replace(/[^a-z0-9а-яё]+/gi, '-').replace(/^-|-$/g, '').slice(0, 95);
}
/**
 * Pure pre-triage only. Does NOT claim a legal novelty, publish content, infer
 * client consent or change services. Reviews can enrich proposals later.
 */
export function detectEditorialOpportunities(
  signals: OpportunitySignal[],
  existingServiceTitles: string[],
  existingContentTitles: string[],
): OpportunityProposal[] {
  const services = new Set(existingServiceTitles.map(normalize));
  const contents = new Set(existingContentTitles.map(normalize));
  const seen = new Set<string>();
  const proposals: OpportunityProposal[] = [];
  for (const signal of signals) {
    const topic = normalize(signal.headline);
    const source = normalize(signal.sourceKey);
    if (!topic || !source) continue;
    const key = source + ':' + topic;
    if (seen.has(key)) continue;
    seen.add(key);
    const hasService = services.has(topic);
    const hasArticle = contents.has(topic);
    if (hasArticle && hasService) continue;
    const regulatory = Boolean(signal.evidenceUrl && /^https:\/\//.test(signal.evidenceUrl));
    const verified = signal.verified === true && regulatory;
    const frequency = Number.isInteger(signal.observedCount) && Number(signal.observedCount) > 0
      ? Math.min(Number(signal.observedCount), 10) : 0;
    const isRequest = /^request[:/]|^client[:/]|^lead[:/]/i.test(signal.sourceKey);
    const kind: OpportunityKind = !verified && !isRequest
      ? 'needs_review'
      : hasService ? (verified ? 'service_update' : 'knowledge_update')
        : isRequest ? 'new_service' : 'article';
    proposals.push({
      key, kind, headline: signal.headline.trim(),
      status: verified ? 'draft' : 'needs_review',
      reason: hasService ? 'Existing service: do not create a duplicate'
        : hasArticle ? 'Existing content: review update, not duplicate'
        : verified ? 'Verified primary source candidate; editorial/legal review still required'
        : 'Human source/legal review required before editorial or commercial action',
      evidenceUrl: signal.evidenceUrl ?? null,
      priority: Math.min(100, (verified ? 45 : 10) + frequency * 4 + (hasService ? 10 : 0)),
      locales: ['es', 'ru'],
    });
  }
  return proposals.sort((a,b) => b.priority-a.priority || a.key.localeCompare(b.key));
}
