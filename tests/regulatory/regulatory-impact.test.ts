import { describe, expect, it } from 'vitest';
import {
  selectConfirmedRegulatoryImpacts,
  requiresRegulatoryHumanReview,
} from '@/lib/regulatory/regulatory-impact';

const dependencies = [
  { id: 'immigration', dependency_type: 'kia_prompt', dependency_key: 'immigration' },
  { id: 'labor', dependency_type: 'course', dependency_key: 'gestion-laboral' },
];

describe('Regulatory impact QA', () => {
  it('does not infer impact from a negative explanation even when the topic matches', () => {
    expect(selectConfirmedRegulatoryImpacts(dependencies, [
      { type: 'kia_prompt', key: 'immigration', reason: 'No immigration changes identified', impacted: false },
    ], true)).toEqual([]);
  });

  it('links only explicitly affected known dependencies', () => {
    const hints = [
      { type: 'kia_prompt', key: 'immigration', reason: 'No legal changes in immigration', impacted: false },
      { type: 'course', key: 'gestion-laboral', reason: 'New official labor calendar affects course', impacted: true },
      { type: 'service', key: 'invented', reason: 'Unregistered', impacted: true },
    ];
    expect(selectConfirmedRegulatoryImpacts(dependencies, hints, true)).toEqual([dependencies[1]]);
  });

  it('never creates dependency impacts for irrelevant source changes', () => {
    expect(selectConfirmedRegulatoryImpacts(dependencies, [
      { type: 'course', key: 'gestion-laboral', reason: 'Incorrect positive', impacted: true },
    ], false)).toEqual([]);
  });

  it('requires human review of relevant BOE content changes even when model says no', () => {
    expect(requiresRegulatoryHumanReview({
      authority: 'BOE', relevant: true, severity: 'medium',
      changeType: 'content_update', modelRequestsReview: false,
    })).toBe(true);
    expect(requiresRegulatoryHumanReview({
      authority: 'BOE', relevant: true, severity: 'info',
      changeType: 'informational', modelRequestsReview: false,
    })).toBe(false);
  });

  it('always reviews critical changes or explicit human-review requests', () => {
    expect(requiresRegulatoryHumanReview({
      authority: 'AEAT', relevant: true, severity: 'critical',
      changeType: 'critical_legal_change', modelRequestsReview: false,
    })).toBe(true);
    expect(requiresRegulatoryHumanReview({
      authority: 'INE', relevant: true, severity: 'low',
      changeType: 'informational', modelRequestsReview: true,
    })).toBe(true);
  });
});
