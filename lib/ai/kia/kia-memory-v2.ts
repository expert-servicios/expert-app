export const KIA_MEMORY_SCOPES = [
  'working',
  'user',
  'company',
  'case',
  'professional',
  'knowledge',
] as const;

export type KiaMemoryScope = (typeof KIA_MEMORY_SCOPES)[number];

export const KIA_MEMORY_SOURCE_TYPES = [
  'conversation',
  'document',
  'integration',
  'professional',
  'system',
  'derived',
] as const;

export type KiaMemorySourceType = (typeof KIA_MEMORY_SOURCE_TYPES)[number];

export const KIA_MEMORY_RETENTION_POLICIES = [
  'session',
  'short',
  'standard',
  'long',
  'legal',
  'permanent',
] as const;

export type KiaMemoryRetentionPolicy = (typeof KIA_MEMORY_RETENTION_POLICIES)[number];

export interface KiaMemoryAnchors {
  clientId?: string | null;
  leadId?: string | null;
  phone?: string | null;
  tenantId?: string | null;
  companyId?: string | null;
  caseId?: string | null;
  professionalId?: string | null;
  sessionId?: string | null;
}

export interface KiaMemoryProvenance {
  sourceType: KiaMemorySourceType;
  sourceRef?: string | null;
  sourceTimestamp?: string | null;
  confidence: number;
}

export interface KiaMemoryPermissions {
  read: string[];
  write: string[];
}

export interface KiaMemoryV2Descriptor extends KiaMemoryAnchors {
  scope: KiaMemoryScope;
  retentionPolicy: KiaMemoryRetentionPolicy;
  provenance: KiaMemoryProvenance;
  permissions: KiaMemoryPermissions;
  version: number;
  supersedesId?: string | null;
  expiresAt?: string | null;
}

export function validateKiaMemoryDescriptor(memory: KiaMemoryV2Descriptor): string[] {
  const errors: string[] = [];

  if (!hasRequiredScopeAnchor(memory)) errors.push(`missing_scope_anchor:${memory.scope}`);
  if (!Number.isFinite(memory.provenance.confidence) || memory.provenance.confidence < 0 || memory.provenance.confidence > 1) {
    errors.push('invalid_confidence');
  }
  if (!Number.isInteger(memory.version) || memory.version < 1) errors.push('invalid_version');
  if (!Array.isArray(memory.permissions.read) || !Array.isArray(memory.permissions.write)) {
    errors.push('invalid_permissions');
  }
  if (memory.expiresAt && !isValidFutureOrAbsoluteTimestamp(memory.expiresAt)) errors.push('invalid_expiry');

  return errors;
}

export function hasRequiredScopeAnchor(memory: Pick<KiaMemoryV2Descriptor, KiaMemoryScopeAnchorKeys>): boolean {
  switch (memory.scope) {
    case 'working':
      return Boolean(memory.sessionId);
    case 'user':
      return Boolean(memory.clientId || memory.leadId || memory.phone);
    case 'company':
      return Boolean(memory.companyId);
    case 'case':
      return Boolean(memory.caseId);
    case 'professional':
      return Boolean(memory.professionalId);
    case 'knowledge':
      return true;
  }
}

type KiaMemoryScopeAnchorKeys =
  | 'scope'
  | 'clientId'
  | 'leadId'
  | 'phone'
  | 'companyId'
  | 'caseId'
  | 'professionalId'
  | 'sessionId';

function isValidFutureOrAbsoluteTimestamp(value: string): boolean {
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
}
