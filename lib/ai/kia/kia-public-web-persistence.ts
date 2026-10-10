import { createHmac } from 'node:crypto';
import { randomUUID } from 'node:crypto';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { issuePublicKiaSession, verifyPublicKiaSession } from '@/lib/ai/kia/kia-public-session';

type Admin = ReturnType<typeof getSupabaseAdmin>;
type SessionRow = { id: string; state: string; expires_at: string };
export type PublicWebTurn = {
  id: string;
  role: 'user' | 'assistant';
  body: string;
  created_at: string;
  client_message_id: string;
  response_payload?: Record<string, unknown> | null;
};

/**
 * Server-only storage. A browser session is not an identity, a lead or an
 * authorization to access any client workspace. Disabled unless explicitly
 * enabled after security review.
 */
export function publicWebPersistenceEnabled() {
  return process.env.KIA_PUBLIC_WEB_PERSISTENCE_ENABLED === 'true';
}

function sessionTokenHash(randomSessionId: string) {
  const key = process.env.KIA_PUBLIC_SESSION_SECRET;
  if (!key || key.length < 32) throw new Error('kia_web_secret_missing');
  return createHmac('sha256', key)
    .update('kia-public-web-session-v1:')
    .update(randomSessionId)
    .digest('hex');
}

async function findSession(admin: Admin, token: string | undefined | null): Promise<SessionRow | null> {
  const randomId = verifyPublicKiaSession(token);
  if (!randomId) return null;
  const { data, error } = await admin
    .from('kia_public_web_sessions')
    .select('id,state,expires_at')
    .eq('token_hash', sessionTokenHash(randomId))
    .eq('state', 'active')
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  if (error) throw error;
  return data as SessionRow | null;
}

/** Resolve a signed cookie to an active database session; never trust client session IDs. */
export async function resolvePublicWebSession(
  admin: Admin,
  token: string | undefined | null,
): Promise<string | null> {
  return (await findSession(admin, token))?.id ?? null;
}

/** Recover an existing assistant response for a retried turn without invoking AI twice. */
export async function readPublicWebReply(
  admin: Admin,
  sessionId: string,
  messageId: string,
): Promise<string | null> {
  const { data, error } = await admin.from('kia_public_web_messages')
    .select('body')
    .eq('session_id', sessionId)
    .eq('client_message_id', messageId)
    .eq('role', 'assistant')
    .maybeSingle();
  if (error) throw error;
  return data?.body ?? null;
}

/** Only the server may create the session and return the signed HttpOnly cookie. */
export async function ensurePublicWebSession(
  admin: Admin,
  presentedToken: string | undefined | null,
): Promise<{ sessionId: string; setCookie: string | null; cookieMaxAge: number }> {
  const current = await findSession(admin, presentedToken);
  if (current) return { sessionId: current.id, setCookie: null, cookieMaxAge: 0 };

  // Do not reuse an expired, revoked or otherwise unrecognized signed cookie.
  const fresh = issuePublicKiaSession();
  const now = Date.now();
  const { data, error } = await admin
    .from('kia_public_web_sessions')
    .insert({
      token_hash: sessionTokenHash(fresh.id),
      state: 'active',
      expires_at: new Date(now + fresh.maxAge * 1000).toISOString(),
    })
    .select('id')
    .single();
  if (error || !data) throw error ?? new Error('kia_web_session_insert_failed');
  return { sessionId: data.id as string, setCookie: fresh.token, cookieMaxAge: fresh.maxAge };
}

/** Existing verified sessions only. Invalid or expired tokens never yield data. */
export async function readPublicWebHistory(admin: Admin, token: string | undefined | null): Promise<PublicWebTurn[]> {
  const session = await findSession(admin, token);
  if (!session) return [];
  const { data, error } = await admin
    .from('kia_public_web_messages')
    .select('id,role,body,created_at,client_message_id,response_payload')
    .eq('session_id', session.id)
    .order('created_at', { ascending: false })
    .limit(60);
  if (error) throw error;
  return ((data ?? []) as PublicWebTurn[]).reverse();
}

/**
 * Atomic uniqueness is enforced by the database. Conflicting retries never
 * overwrite the original message. Returns inserted=false for an identical
 * existing turn so callers can avoid a second AI/provider operation.
 */
export async function appendPublicWebTurn(
  admin: Admin,
  input: { sessionId: string; messageId: string; role: 'user' | 'assistant'; body: string },
): Promise<{ inserted: boolean; body: string }> {
  const body = input.body.trim();
  if (body.length < 1 || body.length > 4000) throw new Error('kia_web_invalid_message_length');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.messageId)) {
    throw new Error('kia_web_invalid_message_id');
  }
  const { data: session, error: sessionError } = await admin
    .from('kia_public_web_sessions')
    .select('id')
    .eq('id', input.sessionId)
    .eq('state', 'active')
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  if (sessionError || !session) throw sessionError ?? new Error('kia_web_session_inactive');

  const { error } = await admin.from('kia_public_web_messages').insert({
    session_id: session.id,
    client_message_id: input.messageId,
    role: input.role,
    body,
    delivery_state: input.role === 'assistant' ? 'sent' : 'received',
  });
  if (!error) return { inserted: true, body };
  if (error.code !== '23505') throw error;

  const { data: existing, error: existingError } = await admin
    .from('kia_public_web_messages')
    .select('body')
    .eq('session_id', session.id)
    .eq('client_message_id', input.messageId)
    .eq('role', input.role)
    .maybeSingle();
  if (existingError || !existing) throw existingError ?? new Error('kia_web_conflict_without_turn');
  if (existing.body !== body) throw new Error('kia_web_reused_message_id_different_body');
  return { inserted: false, body };
}

export function newPublicWebMessageId() {
  return randomUUID();
}


export async function claimPublicWebTurn(admin: Admin, input: {sessionId:string; messageId:string; body:string; claim:string}) {
  const {data,error}=await admin.rpc('kia_web_claim_turn',{p_session_id:input.sessionId,p_message_id:input.messageId,p_body:input.body,p_claim:input.claim});
  if(error)throw error;
  return data as {outcome:'acquired'|'replay'|'busy'|'mismatch'|'invalid'|'invalid_session';reply?:string;payload?:Record<string,unknown>};
}
export async function completePublicWebTurn(admin: Admin,input:{sessionId:string;messageId:string;claim:string;reply:string;payload:Record<string,unknown>}) {
  const {data,error}=await admin.rpc('kia_web_complete_turn',{p_session_id:input.sessionId,p_message_id:input.messageId,p_claim:input.claim,p_reply:input.reply,p_payload:input.payload});
  if(error)throw error;
  return data as {outcome:string;reply?:string;payload?:Record<string,unknown>};
}
export async function failPublicWebTurn(admin:Admin,input:{sessionId:string;messageId:string;claim:string}) {
  const {error}=await admin.rpc('kia_web_fail_turn',{p_session_id:input.sessionId,p_message_id:input.messageId,p_claim:input.claim});
  if(error)throw error;
}
export async function renewPublicWebTurn(admin:Admin,input:{sessionId:string;messageId:string;claim:string}) {
  const {data,error}=await admin.rpc('kia_web_renew_turn',{p_session_id:input.sessionId,p_message_id:input.messageId,p_claim:input.claim});
  if(error)throw error;
  return data===true;
}
