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


describe('Targeted regulatory data repair', () => {
  it('only retracts the two documented negative immigration links', async () => {
    const { readFileSync } = await import('node:fs');
    const sql = readFileSync('supabase/migrations/20261013180000_regulatory_positive_impact_qa_cleanup.sql', 'utf8');
    expect(sql).toContain('17e6667f-9c87-47c9-ba50-dff5046bec71');
    expect(sql).toContain('2b86f3d0-eadd-4598-8e17-b97ce1df9fa6');
    expect(sql).toContain('8f5637c4-f894-4ae5-b904-083c6f05ed7d');
    expect(sql).toContain("source.source_key = 'boe_daily_sumario'");
    expect(sql).toContain("impact.impact_reason ILIKE '%no immigration%'");
    expect(sql).toContain("status = 'needs_review'");
    expect(sql).not.toMatch(/DELETE\s+FROM\s+public\.regulatory_changes|TRUNCATE|DROP\s+TABLE|cron\.schedule/i);
  });

  it('requires an explicit impacted boolean in the KIA model contract', async () => {
    const { readFileSync } = await import('node:fs');
    const worker = readFileSync('lib/regulatory/regulatory-review.ts', 'utf8');
    expect(worker).toContain("required: ['type','key','reason','impacted']");
    expect(worker).toContain('selectConfirmedRegulatoryImpacts(');
    expect(worker).toContain('requiresRegulatoryHumanReview(');
  });
});

describe('Human legal approval enforcement', () => {
  it('requires snapshot-specific approval before applying canonical regulatory values', async () => {
    const {readFileSync} = await import('node:fs');
    const values = readFileSync('lib/regulatory/regulatory-values.ts','utf8');
    const route = readFileSync('app/api/admin/regulatory/route.ts','utf8');
    const panel = readFileSync('app/(protected)/admin/regulatory/page.tsx','utf8');
    expect(values).toContain('approveRegulatoryLegalReview');
    expect(values).toContain("approval?.status !== 'approved'");
    expect(values).toContain("approval.reviewed_snapshot_id !== change.current_snapshot_id");
    expect(values).toContain("approvedSnapshot?.fingerprint !== approval.reviewed_fingerprint");
    expect(route).toContain("body.action === 'approve_legal'");
    expect(panel).toContain("Registrar aprobación jurídica");
  });

  it('prevents review PR creation from silently clearing needs_review status', async () => {
    const {readFileSync} = await import('node:fs');
    const worker = readFileSync('lib/regulatory/regulatory-review.ts','utf8');
    expect(worker).toContain("status: humanReviewRequired ? 'needs_review' : 'proposal_ready'");
    expect(worker).not.toContain('notifyAdminsTelegram');
    expect(worker).toContain('notifyDevOpsRegulatoryHumanReview');
  });
});
