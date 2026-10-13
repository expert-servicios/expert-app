/** Only explicitly confirmed links can become operational regulatory impacts. */
export type RegulatoryImpactHint = {
  type: string;
  key: string;
  reason: string;
  impacted: boolean;
};

export type RegulatoryDependencyIdentity = {
  dependency_type: string;
  dependency_key: string;
};

export function selectConfirmedRegulatoryImpacts<T extends RegulatoryDependencyIdentity>(
  known: T[],
  hints: RegulatoryImpactHint[],
  relevant: boolean,
): T[] {
  if (!relevant) return [];

  const confirmed = new Set(
    hints.filter((hint) => hint.impacted === true)
      .map((hint) => `${hint.type}::${hint.key}`),
  );
  // Generic BOE feeds and "service_specific" sources use the same explicit
  // evidence gate. Merely being related to the source never implies impact.
  return known.filter((row) =>
    confirmed.has(`${row.dependency_type}::${row.dependency_key}`),
  );
}

export function requiresRegulatoryHumanReview(input: {
  authority: string;
  relevant: boolean;
  severity: string;
  changeType: string;
  modelRequestsReview: boolean;
}): boolean {
  if (input.modelRequestsReview || input.severity === 'critical') return true;
  // BOE publications involving legal, operational or editorial changes are
  // never accepted solely on a model's optional approval flag.
  return input.relevant
    && input.authority === 'BOE'
    && input.severity !== 'info'
    && input.changeType !== 'irrelevant'
    && input.changeType !== 'informational';
}
