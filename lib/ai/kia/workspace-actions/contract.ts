import { z } from 'zod';

/**
 * EXPERT Workspace / KIA Work: phase-0 action proposal contract.
 *
 * This module classifies requests; it DOES NOT execute writes or grant permissions.
 * The AI model may propose an action, never supply actor identity, tenant authority,
 * an approval token, credentials, or a write authorization.
 */
export const workspaceActionCodes = [
  'profile.contact.update',
  'task.create',
  'case.internal_note.add',
  'inbox.reply.send',
  'appointment.reschedule',
  'integration.oauth.request',
  'billing.invoice.issue',
] as const;

export const workspaceActionProposalSchema = z.object({
  action: z.enum(workspaceActionCodes),
  target: z.object({
    kind: z.enum(['profile', 'company', 'case', 'inbox_thread', 'appointment', 'integration', 'invoice']),
    id: z.string().uuid(),
  }).strict(),
  companyId: z.string().uuid().nullable(),
  // Minimal proposed fields only. Validate with the service-specific schema again
  // AFTER server-side membership and record-level authorization.
  changes: z.record(z.string().min(1).max(80), z.unknown()),
  expectedVersion: z.string().max(100).nullable(),
  summary: z.string().min(3).max(500),
  origin: z.object({
    surface: z.enum(['admin', 'admin_support', 'client']),
    inboxItemId: z.string().max(200).nullable(),
  }).strict(),
}).strict();

export type WorkspaceActionProposal = z.infer<typeof workspaceActionProposalSchema>;

export const workspaceActionStates = [
  'proposed',
  'validating',
  'waiting_approval',
  'approved',
  'queued',
  'running',
  'completed',
  'partially_completed',
  'failed',
  'denied',
  'cancelled',
] as const;

export const workspaceActionStateSchema = z.enum(workspaceActionStates);
export type WorkspaceActionState = z.infer<typeof workspaceActionStateSchema>;

export type WorkspaceActionRisk = 'R1' | 'R2' | 'R3' | 'R4';
export type WorkspaceActionApproval = 'confirm_in_chat' | 'explicit_external' | 'professional';
export type WorkspaceSurface = WorkspaceActionProposal['origin']['surface'];

export type WorkspaceActionDefinition = {
  readonly allowedSurfaces: readonly WorkspaceSurface[];
  readonly risk: WorkspaceActionRisk;
  readonly approval: WorkspaceActionApproval;
  readonly targetKind: WorkspaceActionProposal['target']['kind'];
  readonly enabled: boolean;
};

export const WORKSPACE_ACTION_CATALOG = {
  'profile.contact.update': {
    allowedSurfaces: ['client', 'admin_support'],
    risk: 'R1', approval: 'confirm_in_chat', targetKind: 'profile', enabled: false,
  },
  'task.create': {
    allowedSurfaces: ['admin', 'admin_support'],
    risk: 'R1', approval: 'confirm_in_chat', targetKind: 'case', enabled: false,
  },
  'case.internal_note.add': {
    allowedSurfaces: ['admin', 'admin_support'],
    risk: 'R2', approval: 'confirm_in_chat', targetKind: 'case', enabled: false,
  },
  'inbox.reply.send': {
    allowedSurfaces: ['admin'],
    risk: 'R3', approval: 'explicit_external', targetKind: 'inbox_thread', enabled: false,
  },
  'appointment.reschedule': {
    allowedSurfaces: ['client', 'admin_support'],
    risk: 'R3', approval: 'explicit_external', targetKind: 'appointment', enabled: false,
  },
  'integration.oauth.request': {
    allowedSurfaces: ['client', 'admin_support'],
    risk: 'R3', approval: 'explicit_external', targetKind: 'integration', enabled: false,
  },
  'billing.invoice.issue': {
    allowedSurfaces: ['admin'],
    risk: 'R4', approval: 'professional', targetKind: 'invoice', enabled: false,
  },
} as const satisfies Record<(typeof workspaceActionCodes)[number], WorkspaceActionDefinition>;

export type WorkspaceActionCatalogCode = keyof typeof WORKSPACE_ACTION_CATALOG;

/**
 * UI/preflight classifier only. A positive classification NEVER authorizes
 * execution. The authenticated server must still verify actor, tenant, object,
 * company membership, explicit approval, idempotency, version and consent.
 */
export function classifyWorkspaceAction(input: unknown) {
  const parsed = workspaceActionProposalSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, reason: 'invalid_proposal' as const };
  const proposal = parsed.data;
  const definition: WorkspaceActionDefinition = WORKSPACE_ACTION_CATALOG[proposal.action];
  if (proposal.target.kind !== definition.targetKind) {
    return { ok: false as const, reason: 'target_kind_mismatch' as const };
  }
  if (!definition.allowedSurfaces.includes(proposal.origin.surface)) {
    return { ok: false as const, reason: 'surface_not_allowed' as const };
  }
  return {
    ok: true as const,
    proposal,
    risk: definition.risk,
    approval: definition.approval,
    // Fail closed during phase 0: no action executor is wired.
    executionEnabled: definition.enabled,
  };
}
