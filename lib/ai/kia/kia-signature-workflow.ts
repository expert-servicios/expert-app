import type { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { absoluteAppUrl } from '@/lib/utils/app-url';
import type { KiaContext } from './kia-context-builder';
import {
  createKiaAdministrativeAction,
  transitionKiaAdministrativeAction,
} from './kia-administrative-action-service';

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

export const KIA_SIGNATURE_CAPABILITY = 'documents.signature';
export const KIA_SIGNATURE_ACTION_TYPE = 'google_esignature';

type SignatureSigner = {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  status: 'pending' | 'signed' | 'declined';
};

type SignatureActionRow = {
  id: string;
  tenant_id: string;
  company_id: string | null;
  case_id: string | null;
  requested_by: string;
  assigned_professional_id: string | null;
  capability: string;
  organism: string;
  action_type: string;
  state: string;
  risk: 'R0' | 'R1' | 'R2' | 'R3' | 'R4' | 'R5';
  effect: 'read' | 'draft' | 'write' | 'external_action';
  requires_user_auth: boolean;
  requires_final_approval: boolean;
  action_snapshot: Record<string, unknown>;
  action_snapshot_hash: string;
  row_version: number;
  created_at: string;
  updated_at: string;
};

function fail(error: string) {
  return { ok: false as const, error };
}

async function loadAuthorizedCase(admin: AdminClient, context: KiaContext, caseId: string) {
  let query = admin
    .from('cases')
    .select('id,client_id,company_id,tenant_id')
    .eq('id', caseId);

  if (context.actor?.isStaff) {
    if (!context.actor.tenantId) return null;
    query = query.eq('tenant_id', context.actor.tenantId);
  } else {
    const clientId = context.contact.clientId;
    if (!clientId) return null;
    query = query.eq('client_id', clientId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data;
}

export async function prepareKiaSignatureRequest(
  admin: AdminClient,
  context: KiaContext,
  input: {
    caseId: string;
    documentId: string;
    signatureLevel: 'simple' | 'advanced' | 'qualified';
    signers: Array<{ name: string; email?: string | null }>;
  },
) {
  if (!context.actor?.isStaff || !context.actor.userId || !context.actor.tenantId) {
    return fail('La preparación de firma está reservada a Admin/Owner autenticado.');
  }
  const ownedCase = await loadAuthorizedCase(admin, context, input.caseId);
  if (!ownedCase) return fail('Expediente no autorizado.');

  const { data: document, error: documentError } = await admin
    .from('documents')
    .select('id,case_id,client_id,company_id,state,replaced_by,file_path,drive_file_id,original_name')
    .eq('id', input.documentId)
    .eq('case_id', input.caseId)
    .eq('client_id', ownedCase.client_id)
    .maybeSingle();
  if (documentError) throw documentError;
  if (!document) return fail('Documento no autorizado.');
  if (document.replaced_by || document.state === 'rechazado') {
    return fail('El documento indicado no es la versión vigente.');
  }
  if (!document.file_path && !document.drive_file_id) {
    return fail('El documento no tiene una copia accesible para iniciar la firma.');
  }

  const normalizedSigners = input.signers
    .map((signer) => ({ name: signer.name.trim(), email: signer.email?.trim().toLowerCase() || null }))
    .filter((signer) => signer.name);
  if (normalizedSigners.length === 0) return fail('Debe indicarse al menos un firmante.');

  const requestIdentity = [
    input.documentId,
    input.signatureLevel,
    ...normalizedSigners.map((signer) => signer.email ?? signer.name.toLowerCase()),
  ].join('|');

  const { data: previousActions, error: previousActionError } = await admin
    .from('administrative_actions')
    .select('id,state,action_snapshot,created_at')
    .eq('case_id', input.caseId)
    .eq('capability', KIA_SIGNATURE_CAPABILITY)
    .eq('action_type', KIA_SIGNATURE_ACTION_TYPE)
    .order('created_at', { ascending: false })
    .limit(50);
  if (previousActionError) throw previousActionError;

  const matching = (previousActions ?? []).filter((row) => {
    const snapshot = (row.action_snapshot ?? {}) as Record<string, unknown>;
    const existingSigners = Array.isArray(snapshot.signers)
      ? snapshot.signers.map((value) => {
          const signer = value as Record<string, unknown>;
          return String(signer.email ?? signer.name ?? '').trim().toLowerCase();
        })
      : [];
    const existingIdentity = [
      String(snapshot.sourceDocumentId ?? ''),
      String(snapshot.signatureLevel ?? ''),
      ...existingSigners,
    ].join('|');
    return existingIdentity === requestIdentity;
  });

  const activeExisting = matching.find((row) =>
    !['completed', 'cancelled', 'failed_safe', 'expired'].includes(String(row.state))
  );
  if (activeExisting) {
    return {
      ok: true as const,
      actionId: activeExisting.id,
      state: activeExisting.state,
      provider: 'google_esignature',
      sourceDocumentId: input.documentId,
      sourceDocumentUrl: absoluteAppUrl(`/api/documents/${encodeURIComponent(input.documentId)}/download?redirect=1`),
      requiresHumanLaunch: true,
      alreadyPrepared: true,
    };
  }

  const retryOrdinal = matching.filter((row) =>
    ['cancelled', 'failed_safe', 'expired'].includes(String(row.state))
  ).length;
  const idempotencyKey = ['signature', input.caseId, requestIdentity, 'attempt', retryOrdinal + 1].join(':');

  const created = await createKiaAdministrativeAction({
    supabase: admin,
    tenantId: context.actor.tenantId,
    companyId: ownedCase.company_id,
    caseId: input.caseId,
    requestedBy: context.actor.userId,
    capability: KIA_SIGNATURE_CAPABILITY,
    organism: 'google_workspace',
    actionType: KIA_SIGNATURE_ACTION_TYPE,
    risk: 'R2',
    effect: 'external_action',
    requiresUserAuth: false,
    requiresFinalApproval: false,
    actionSnapshot: {
      provider: 'google_esignature',
      sourceDocumentId: input.documentId,
      sourceDocumentName: document.original_name ?? null,
      signatureLevel: input.signatureLevel,
      signers: normalizedSigners.map((signer) => ({ ...signer, status: 'pending' })),
    },
    idempotencyKey,
    actorType: 'professional',
    actorId: context.actor.userId,
  });

  let action = created;
  if (action.state === 'draft') {
    action = await transitionKiaAdministrativeAction({
      supabase: admin,
      current: action,
      toState: 'prepared',
      actorType: 'professional',
      actorId: context.actor.userId,
      eventType: 'signature.prepared',
      payload: { sourceDocumentId: input.documentId },
    });
  }
  if (action.state === 'prepared') {
    action = await transitionKiaAdministrativeAction({
      supabase: admin,
      current: action,
      toState: 'needs_review',
      actorType: 'professional',
      actorId: context.actor.userId,
      eventType: 'signature.review_required',
      payload: { provider: 'google_esignature' },
    });
  }

  return {
    ok: true as const,
    actionId: action.id,
    state: action.state,
    provider: 'google_esignature',
    sourceDocumentId: input.documentId,
    sourceDocumentUrl: absoluteAppUrl(`/api/documents/${encodeURIComponent(input.documentId)}/download?redirect=1`),
    requiresHumanLaunch: true,
  };
}

export async function getKiaCaseSignatureStatus(
  admin: AdminClient,
  context: KiaContext,
  caseId: string,
) {
  const ownedCase = await loadAuthorizedCase(admin, context, caseId);
  if (!ownedCase) return fail('Expediente no autorizado.');

  const { data: actions, error: actionError } = await admin
    .from('administrative_actions')
    .select('id,state,action_snapshot,created_at,updated_at')
    .eq('case_id', caseId)
    .eq('capability', KIA_SIGNATURE_CAPABILITY)
    .eq('action_type', KIA_SIGNATURE_ACTION_TYPE)
    .order('created_at', { ascending: false })
    .limit(50);
  if (actionError) throw actionError;

  const actionIds = (actions ?? []).map((row) => row.id);
  const eventsByAction = new Map<string, Array<Record<string, unknown>>>();
  if (actionIds.length) {
    const { data: events, error: eventError } = await admin
      .from('administrative_action_events')
      .select('action_id,event_type,new_state,payload,created_at')
      .in('action_id', actionIds)
      .order('created_at', { ascending: true });
    if (eventError) throw eventError;
    for (const event of events ?? []) {
      const list = eventsByAction.get(event.action_id) ?? [];
      list.push(event as Record<string, unknown>);
      eventsByAction.set(event.action_id, list);
    }
  }

  const projected = [];
  for (const action of actions ?? []) {
    const events = eventsByAction.get(action.id) ?? [];
    const latestLifecycle = [...events]
      .reverse()
      .find((event) => String(event.event_type ?? '').startsWith('signature.'));
    const lifecyclePayload = (latestLifecycle?.payload ?? {}) as Record<string, unknown>;
    const completedEvent = [...events]
      .reverse()
      .find((event) => event.event_type === 'signature.completed');
    const completedPayload = (completedEvent?.payload ?? {}) as Record<string, unknown>;
    const finalDocumentId = typeof completedPayload.finalDocumentId === 'string'
      ? completedPayload.finalDocumentId
      : null;

    let signedDocument: Record<string, unknown> | null = null;
    if (action.state === 'completed' && finalDocumentId) {
      const { data: finalDoc, error: finalDocError } = await admin
        .from('documents')
        .select('id,original_name,state,replaced_by,file_path,drive_file_id,created_at')
        .eq('id', finalDocumentId)
        .eq('case_id', caseId)
        .eq('client_id', ownedCase.client_id)
        .is('replaced_by', null)
        .neq('state', 'rechazado')
        .maybeSingle();
      if (finalDocError) throw finalDocError;
      if (finalDoc && (finalDoc.file_path || finalDoc.drive_file_id)) {
        signedDocument = {
          id: finalDoc.id,
          name: finalDoc.original_name,
          url: absoluteAppUrl(`/api/documents/${encodeURIComponent(finalDoc.id)}/download?redirect=1`),
          createdAt: finalDoc.created_at,
        };
      }
    }

    const snapshot = (action.action_snapshot ?? {}) as Record<string, unknown>;
    const snapshotSigners = Array.isArray(snapshot.signers) ? snapshot.signers : [];
    const lifecycleSigners = Array.isArray(lifecyclePayload.signers) ? lifecyclePayload.signers : [];
    const signers = (lifecycleSigners.length ? lifecycleSigners : snapshotSigners)
      .map((value) => {
        const signer = value as Record<string, unknown>;
        return {
          name: typeof signer.name === 'string' ? signer.name : null,
          email: typeof signer.email === 'string' ? signer.email : null,
          status: signer.status === 'signed'
            ? 'signed'
            : signer.status === 'declined'
              ? 'declined'
              : 'pending',
        } satisfies SignatureSigner;
      });

    projected.push({
      actionId: action.id,
      actionState: action.state,
      signatureStatus: typeof lifecyclePayload.signatureStatus === 'string'
        ? lifecyclePayload.signatureStatus
        : action.state === 'completed' ? 'completed' : 'prepared',
      provider: snapshot.provider ?? 'google_esignature',
      sourceDocumentId: snapshot.sourceDocumentId ?? null,
      signatureLevel: snapshot.signatureLevel ?? null,
      signers,
      signedDocument,
      updatedAt: action.updated_at,
    });
  }

  return { ok: true as const, requests: projected };
}


function actionSnapshotFromRow(row: SignatureActionRow) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    companyId: row.company_id,
    caseId: row.case_id,
    requestedBy: row.requested_by,
    assignedProfessionalId: row.assigned_professional_id,
    capability: row.capability,
    organism: row.organism,
    actionType: row.action_type,
    state: row.state as import('./kia-administrative-action').KiaAdministrativeActionState,
    risk: row.risk,
    effect: row.effect,
    requiresUserAuth: row.requires_user_auth,
    requiresFinalApproval: row.requires_final_approval,
    actionSnapshotHash: row.action_snapshot_hash,
    approvalTokenExpiresAt: null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    rowVersion: row.row_version,
  };
}

async function appendSignatureEvent(
  admin: AdminClient,
  row: SignatureActionRow,
  eventType: string,
  actorId: string,
  payload: Record<string, unknown>,
) {
  const { error } = await admin.from('administrative_action_events').insert({
    action_id: row.id,
    tenant_id: row.tenant_id,
    event_type: eventType,
    previous_state: row.state,
    new_state: row.state,
    actor_type: 'professional',
    actor_id: actorId,
    payload,
  });
  if (error) throw error;
}

async function transitionSignature(
  admin: AdminClient,
  row: SignatureActionRow,
  toState: import('./kia-administrative-action').KiaAdministrativeActionState,
  actorId: string,
  eventType: string,
  payload: Record<string, unknown> = {},
): Promise<SignatureActionRow> {
  const next = await transitionKiaAdministrativeAction({
    supabase: admin,
    current: actionSnapshotFromRow(row),
    toState,
    actorType: 'professional',
    actorId,
    eventType,
    payload,
  });
  const refreshed = await loadSignatureActionForAdmin(admin, next.id);
  if (!refreshed) throw new Error('signature_action_disappeared');
  return refreshed;
}

export async function recordKiaSignatureLifecycle(
  admin: AdminClient,
  input: {
    actionId: string;
    caseId: string;
    actorId: string;
    lifecycle: 'requested' | 'partially_signed' | 'completed' | 'cancelled';
    signers?: SignatureSigner[];
    finalDocumentId?: string | null;
  },
) {
  let action = await loadSignatureActionForAdmin(admin, input.actionId);
  if (!action || action.case_id !== input.caseId) return fail('Solicitud de firma no encontrada en el expediente.');

  const payload: Record<string, unknown> = {
    signatureStatus: input.lifecycle,
    signers: input.signers ?? [],
  };

  if (input.lifecycle === 'cancelled') {
    if (action.state === 'verifying' || action.state === 'completed') {
      return fail('La firma ya está en verificación/finalizada y no puede cancelarse desde este flujo.');
    }
    if (action.state === 'cancelled') return { ok: true as const, actionId: action.id, state: action.state };
    action = await transitionSignature(admin, action, 'cancelled', input.actorId, 'signature.cancelled', payload);
    return { ok: true as const, actionId: action.id, state: action.state };
  }

  if (input.lifecycle === 'requested') {
    const path = [
      ['needs_review', 'approved', 'signature.approved'],
      ['approved', 'queued', 'signature.queued'],
      ['queued', 'claimed', 'signature.claimed'],
      ['claimed', 'running', 'signature.requested'],
    ] as const;

    if (action.state === 'running') {
      await appendSignatureEvent(admin, action, 'signature.requested', input.actorId, payload);
      return { ok: true as const, actionId: action.id, state: action.state };
    }

    const startIndex = path.findIndex(([from]) => from === action.state);
    if (startIndex < 0) {
      return fail(`No se puede registrar envío a firma desde el estado ${action.state}.`);
    }
    for (let index = startIndex; index < path.length; index++) {
      const [, state, eventType] = path[index];
      action = await transitionSignature(admin, action, state, input.actorId, eventType, payload);
    }
    return { ok: true as const, actionId: action.id, state: action.state };
  }

  if (action.state !== 'running') {
    return fail('La solicitud debe estar enviada y en curso antes de registrar firmas.');
  }

  if (input.lifecycle === 'partially_signed') {
    await appendSignatureEvent(admin, action, 'signature.partially_signed', input.actorId, payload);
    return { ok: true as const, actionId: action.id, state: action.state };
  }

  const finalDocumentId = input.finalDocumentId?.trim();
  if (!finalDocumentId) return fail('La finalización exige el documento firmado final.');

  const { data: finalDocument, error: finalDocumentError } = await admin
    .from('documents')
    .select('id,case_id,client_id,state,replaced_by,file_path,drive_file_id')
    .eq('id', finalDocumentId)
    .eq('case_id', input.caseId)
    .is('replaced_by', null)
    .neq('state', 'rechazado')
    .maybeSingle();
  if (finalDocumentError) throw finalDocumentError;
  if (!finalDocument || (!finalDocument.file_path && !finalDocument.drive_file_id)) {
    return fail('El documento final no existe, no está vigente o no es accesible.');
  }

  action = await transitionSignature(
    admin,
    action,
    'verifying',
    input.actorId,
    'signature.verifying',
    { ...payload, finalDocumentId },
  );
  action = await transitionSignature(
    admin,
    action,
    'completed',
    input.actorId,
    'signature.completed',
    { ...payload, finalDocumentId, signatureStatus: 'completed' },
  );
  return {
    ok: true as const,
    actionId: action.id,
    state: action.state,
    finalDocumentId,
    finalDocumentUrl: absoluteAppUrl(`/api/documents/${encodeURIComponent(finalDocumentId)}/download?redirect=1`),
  };
}

export async function loadSignatureActionForAdmin(admin: AdminClient, actionId: string) {
  const { data, error } = await admin
    .from('administrative_actions')
    .select('*')
    .eq('id', actionId)
    .eq('capability', KIA_SIGNATURE_CAPABILITY)
    .eq('action_type', KIA_SIGNATURE_ACTION_TYPE)
    .maybeSingle();
  if (error) throw error;
  return data as SignatureActionRow | null;
}
