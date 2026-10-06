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
  const clientId = context.contact.clientId;
  if (!clientId) return null;
  const { data, error } = await admin
    .from('cases')
    .select('id,client_id,company_id,tenant_id')
    .eq('id', caseId)
    .eq('client_id', clientId)
    .maybeSingle();
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

  const idempotencyKey = [
    'signature',
    input.caseId,
    input.documentId,
    input.signatureLevel,
    ...normalizedSigners.map((signer) => signer.email ?? signer.name.toLowerCase()),
  ].join(':');

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
          status: ['pending', 'signed', 'declined'].includes(String(signer.status))
            ? String(signer.status)
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
