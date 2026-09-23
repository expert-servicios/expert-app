import { absoluteAppUrl } from '@/lib/utils/app-url';

const AUTH_BASE = 'https://login.microsoftonline.com/common/oauth2/v2.0';
const GRAPH_BASE = 'https://graph.microsoft.com/v1.0/me';

const SCOPES = [
  'openid',
  'profile',
  'email',
  'offline_access',
  'Mail.Read',
  'Mail.Send',
  'Calendars.ReadWrite',
  'Files.ReadWrite',
].join(' ');

function getRedirectUri() {
  return absoluteAppUrl('/api/auth/ms365/callback');
}

export function getMs365AuthUrl(state?: string) {
  const params = new URLSearchParams({
    client_id: process.env.MS365_CLIENT_ID!,
    response_type: 'code',
    redirect_uri: getRedirectUri(),
    scope: SCOPES,
    response_mode: 'query',
    prompt: 'consent',
  });
  if (state) params.set('state', state);
  return `${AUTH_BASE}/authorize?${params}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export type Ms365StoredTokens = { access_token: string; refresh_token: string; expires_at: number };

async function fetchToken(body: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(`${AUTH_BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.MS365_CLIENT_ID!,
      client_secret: process.env.MS365_CLIENT_SECRET!,
      redirect_uri: getRedirectUri(),
      ...body,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error_description ?? 'MS365 token error');
  }
  return res.json();
}

export async function exchangeMs365Code(code: string) {
  const tokens = await fetchToken({ grant_type: 'authorization_code', code });
  const email = await getMs365UserEmail(tokens.access_token);
  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: Date.now() + tokens.expires_in * 1000,
    email,
  };
}

async function ensureFreshToken(stored: Ms365StoredTokens) {
  if (Date.now() < stored.expires_at - 60_000) {
    return { access_token: stored.access_token, refreshed: null };
  }
  // Do not request new scopes during refresh. Existing Mail-only connections
  // must keep refreshing successfully until the admin explicitly reconnects
  // and consents to any newly-added Calendar/Files scopes.
  const tokens = await fetchToken({ grant_type: 'refresh_token', refresh_token: stored.refresh_token });
  const refreshed = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? stored.refresh_token,
    expires_at: Date.now() + tokens.expires_in * 1000,
  };
  return { access_token: refreshed.access_token, refreshed };
}

export async function prepareMs365StoredTokens(
  stored: Ms365StoredTokens
): Promise<{ stored: Ms365StoredTokens; refreshed: Ms365StoredTokens | null }> {
  const { refreshed } = await ensureFreshToken(stored);
  return {
    stored: refreshed ? { ...stored, ...refreshed } : stored,
    refreshed: refreshed ? { ...stored, ...refreshed } : null,
  };
}

async function graphGet(accessToken: string, path: string) {
  const res = await fetch(`${GRAPH_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Graph GET ${path} failed: ${res.status}`);
  return res.json();
}

async function readOptionalGraphJson(res: Response) {
  const text = await res.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function graphPatch(accessToken: string, path: string, body: object) {
  const res = await fetch(`${GRAPH_BASE}${path}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `Graph PATCH ${path} failed: ${res.status}`);
  }
  return readOptionalGraphJson(res);
}

async function graphPost(accessToken: string, path: string, body: object, headers?: Record<string, string>) {
  const res = await fetch(`${GRAPH_BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `Graph POST ${path} failed: ${res.status}`);
  }
  return readOptionalGraphJson(res);
}

async function graphDelete(accessToken: string, path: string) {
  const res = await fetch(`${GRAPH_BASE}${path}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (res.status === 404 || res.status === 410) return;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `Graph DELETE ${path} failed: ${res.status}`);
  }
}

async function getMs365UserEmail(accessToken: string): Promise<string> {
  const data = await fetch(`${GRAPH_BASE}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  }).then((r) => r.json());
  return data.mail ?? data.userPrincipalName ?? '';
}

export interface MailSummary {
  id: string;
  conversationId: string;
  subject: string;
  from: string;
  fromEmail: string;
  snippet: string;
  date: string;
  unread: boolean;
  hasAttachment: boolean;
}

export interface MailAttachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  inline: boolean;
}

export interface MailAttachmentData extends MailAttachment {
  data: Buffer;
}

export interface MailMessage {
  id: string;
  conversationId: string;
  subject: string;
  from: string;
  fromEmail: string;
  to: string;
  date: string;
  body: string;
  bodyType: 'html' | 'text';
  unread: boolean;
  attachments: MailAttachment[];
}

export async function listMails(
  stored: Ms365StoredTokens,
  opts: { query?: string; maxResults?: number } = {}
): Promise<{ mails: MailSummary[]; refreshed: Ms365StoredTokens | null }> {
  const { access_token, refreshed } = await ensureFreshToken(stored);

  const select = 'id,conversationId,subject,from,isRead,receivedDateTime,bodyPreview,hasAttachments';
  const top = opts.maxResults ?? 25;

  let url = `${GRAPH_BASE}/mailFolders/inbox/messages?$top=${top}&$orderby=receivedDateTime desc&$select=${select}`;
  if (opts.query) {
    url = `${GRAPH_BASE}/messages?$top=${top}&$orderby=receivedDateTime desc&$select=${select}&$search="${encodeURIComponent(opts.query)}"`;
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!res.ok) throw new Error(`listMails failed: ${res.status}`);
  const data = await res.json();

  const mails: MailSummary[] = (data.value ?? []).map((m: Record<string, unknown>) => {
    const fromObj = m.from as { emailAddress: { name: string; address: string } };
    return {
      id: m.id as string,
      conversationId: m.conversationId as string,
      subject: (m.subject as string) || '(sin asunto)',
      from: fromObj?.emailAddress?.name || fromObj?.emailAddress?.address || '',
      fromEmail: fromObj?.emailAddress?.address || '',
      snippet: (m.bodyPreview as string) || '',
      date: m.receivedDateTime as string,
      unread: !(m.isRead as boolean),
      hasAttachment: m.hasAttachments as boolean,
    };
  });

  return { mails, refreshed: refreshed ? { ...stored, ...refreshed } : null };
}

async function listMessageAttachments(accessToken: string, messageId: string): Promise<MailAttachment[]> {
  const data = await graphGet(
    accessToken,
    `/messages/${encodeURIComponent(messageId)}/attachments?$select=id,name,contentType,size,isInline`
  );
  return (data.value ?? []).map((attachment: Record<string, unknown>) => ({
    id: String(attachment.id ?? ''),
    name: String(attachment.name ?? 'adjunto'),
    mimeType: String(attachment.contentType ?? 'application/octet-stream'),
    size: Number(attachment.size ?? 0),
    inline: Boolean(attachment.isInline),
  })).filter((attachment: MailAttachment) => attachment.id && attachment.name);
}

export async function getConversation(
  stored: Ms365StoredTokens,
  conversationId: string
): Promise<{ messages: MailMessage[]; refreshed: Ms365StoredTokens | null }> {
  const { access_token, refreshed } = await ensureFreshToken(stored);

  const select = 'id,conversationId,subject,from,toRecipients,body,isRead,receivedDateTime,hasAttachments';
  const filter = `conversationId eq '${conversationId.replace(/'/g, "''")}'`;
  const data = await graphGet(
    access_token,
    `/messages?$filter=${encodeURIComponent(filter)}&$orderby=receivedDateTime asc&$select=${select}`
  );

  for (const m of data.value ?? []) {
    if (!m.isRead) {
      await graphPatch(access_token, `/messages/${encodeURIComponent(m.id)}`, { isRead: true }).catch(() => null);
    }
  }

  const messages: MailMessage[] = await Promise.all((data.value ?? []).map(async (m: Record<string, unknown>) => {
    const fromObj = m.from as { emailAddress: { name: string; address: string } };
    const toArr = m.toRecipients as { emailAddress: { name: string; address: string } }[];
    const bodyObj = m.body as { contentType: string; content: string };
    const attachments = m.hasAttachments ? await listMessageAttachments(access_token, String(m.id)) : [];
    return {
      id: m.id as string,
      conversationId: m.conversationId as string,
      subject: (m.subject as string) || '(sin asunto)',
      from: fromObj?.emailAddress?.name || fromObj?.emailAddress?.address || '',
      fromEmail: fromObj?.emailAddress?.address || '',
      to: toArr?.map((r) => r.emailAddress?.address).join(', ') || '',
      date: m.receivedDateTime as string,
      body: bodyObj?.content || '',
      bodyType: (bodyObj?.contentType?.toLowerCase() === 'html' ? 'html' : 'text') as 'html' | 'text',
      unread: !(m.isRead as boolean),
      attachments,
    };
  }));

  return { messages, refreshed: refreshed ? { ...stored, ...refreshed } : null };
}

export async function getMailAttachment(
  stored: Ms365StoredTokens,
  messageId: string,
  attachmentId: string
): Promise<{ attachment: MailAttachmentData; refreshed: Ms365StoredTokens | null }> {
  const { access_token, refreshed } = await ensureFreshToken(stored);
  const attachment = await graphGet(
    access_token,
    `/messages/${encodeURIComponent(messageId)}/attachments/${encodeURIComponent(attachmentId)}`
  );
  if (!attachment.contentBytes) throw new Error('MS365 attachment has no downloadable content');
  return {
    attachment: {
      id: String(attachment.id ?? attachmentId),
      name: String(attachment.name ?? 'adjunto'),
      mimeType: String(attachment.contentType ?? 'application/octet-stream'),
      size: Number(attachment.size ?? 0),
      inline: Boolean(attachment.isInline),
      data: Buffer.from(String(attachment.contentBytes), 'base64'),
    },
    refreshed: refreshed ? { ...stored, ...refreshed } : null,
  };
}

export async function sendReply(
  stored: Ms365StoredTokens,
  opts: { messageId: string; comment: string }
): Promise<{ refreshed: Ms365StoredTokens | null }> {
  const { access_token, refreshed } = await ensureFreshToken(stored);
  await graphPost(access_token, `/messages/${encodeURIComponent(opts.messageId)}/reply`, { comment: opts.comment });
  return { refreshed: refreshed ? { ...stored, ...refreshed } : null };
}

export async function sendNewMail(
  stored: Ms365StoredTokens,
  opts: { to: string; subject: string; body: string; bodyHtml?: boolean }
): Promise<{ refreshed: Ms365StoredTokens | null }> {
  const { access_token, refreshed } = await ensureFreshToken(stored);
  await graphPost(access_token, '/sendMail', {
    message: {
      subject: opts.subject,
      body: {
        contentType: opts.bodyHtml ? 'HTML' : 'Text',
        content: opts.body,
      },
      toRecipients: [{ emailAddress: { address: opts.to } }],
    },
    saveToSentItems: true,
  });
  return { refreshed: refreshed ? { ...stored, ...refreshed } : null };
}


export interface Ms365CalendarBusyWindow {
  start: string;
  end: string;
}

export interface Ms365MeetingInput {
  summary: string;
  description?: string;
  start: string;
  end: string;
  attendeeEmail: string;
  timezone?: string;
  reminderMinutesBefore?: number[];
}

export interface Ms365MeetingResult {
  eventId: string;
  meetingUrl: string | null;
  refreshed: Ms365StoredTokens | null;
}

function graphDateTime(value: string): { dateTime: string; timeZone: string } {
  return {
    dateTime: new Date(value).toISOString().replace(/Z$/, ''),
    timeZone: 'UTC',
  };
}

export async function listMs365CalendarBusyWindows(
  stored: Ms365StoredTokens,
  timeMin: string,
  timeMax: string
): Promise<{ windows: Ms365CalendarBusyWindow[]; refreshed: Ms365StoredTokens | null }> {
  const { access_token, refreshed } = await ensureFreshToken(stored);
  const params = new URLSearchParams({
    startDateTime: new Date(timeMin).toISOString(),
    endDateTime: new Date(timeMax).toISOString(),
    '$select': 'start,end,showAs,isCancelled',
    '$orderby': 'start/dateTime',
    '$top': '1000',
  });
  const data = await graphGet(access_token, `/calendarView?${params.toString()}`);

  const windows = (data.value ?? [])
    .filter((event: Record<string, unknown>) =>
      !event.isCancelled &&
      !['free', 'workingElsewhere'].includes(String(event.showAs ?? '').toLowerCase())
    )
    .map((event: Record<string, unknown>) => {
      const start = event.start as { dateTime?: string; timeZone?: string } | undefined;
      const end = event.end as { dateTime?: string; timeZone?: string } | undefined;
      return {
        start: start?.dateTime ? new Date(`${start.dateTime}Z`).toISOString() : '',
        end: end?.dateTime ? new Date(`${end.dateTime}Z`).toISOString() : '',
      };
    })
    .filter((window: Ms365CalendarBusyWindow) => Boolean(window.start && window.end));

  return {
    windows,
    refreshed: refreshed ? { ...stored, ...refreshed } : null,
  };
}

export async function createMs365TeamsMeeting(
  stored: Ms365StoredTokens,
  input: Ms365MeetingInput
): Promise<Ms365MeetingResult> {
  const { access_token, refreshed } = await ensureFreshToken(stored);
  const reminder = Math.min(...(input.reminderMinutesBefore ?? [60]));

  const data = await graphPost(access_token, '/events', {
    subject: input.summary,
    body: {
      contentType: 'HTML',
      content: input.description ?? '',
    },
    start: graphDateTime(input.start),
    end: graphDateTime(input.end),
    attendees: [{
      emailAddress: { address: input.attendeeEmail },
      type: 'required',
    }],
    isOnlineMeeting: true,
    onlineMeetingProvider: 'teamsForBusiness',
    isReminderOn: true,
    reminderMinutesBeforeStart: reminder,
  });

  const eventId = String(data?.id ?? '');
  if (!eventId) throw new Error('Microsoft Graph did not return an event id');

  let meetingUrl = data?.onlineMeeting?.joinUrl ?? null;
  if (!meetingUrl) {
    // Graph normally returns onlineMeeting immediately, but allow a short
    // propagation window before the provider-level compensation deletes the event.
    for (let attempt = 0; attempt < 6 && !meetingUrl; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, attempt === 0 ? 250 : 500));
      try {
        const refreshedEvent = await graphGet(
          access_token,
          `/events/${encodeURIComponent(eventId)}?$select=id,onlineMeeting`
        );
        meetingUrl = refreshedEvent?.onlineMeeting?.joinUrl ?? null;
      } catch {
        // A transient read failure should not lose the known event id.
      }
    }
  }

  return {
    eventId,
    meetingUrl,
    refreshed: refreshed ? { ...stored, ...refreshed } : null,
  };
}

export async function getMs365TeamsMeetingUrl(
  stored: Ms365StoredTokens,
  eventId: string
): Promise<{ meetingUrl: string | null; refreshed: Ms365StoredTokens | null }> {
  const { access_token, refreshed } = await ensureFreshToken(stored);
  const data = await graphGet(
    access_token,
    `/events/${encodeURIComponent(eventId)}?$select=id,onlineMeeting`
  );

  return {
    meetingUrl: data?.onlineMeeting?.joinUrl ?? null,
    refreshed: refreshed ? { ...stored, ...refreshed } : null,
  };
}

export async function updateMs365TeamsMeeting(
  stored: Ms365StoredTokens,
  eventId: string,
  input: {
    summary?: string;
    description?: string;
    start?: string;
    end?: string;
    timezone?: string;
    reminderMinutesBefore?: number[];
  }
): Promise<{ eventId: string; refreshed: Ms365StoredTokens | null }> {
  const { access_token, refreshed } = await ensureFreshToken(stored);
  const body: Record<string, unknown> = {};

  if (input.summary !== undefined) body.subject = input.summary;
  // Do not replace the body of an existing Teams event. Microsoft documents
  // that removing the online-meeting blob from body content can disable the
  // online meeting. EXPERT updates subject/time/reminders only.
  if (input.start) body.start = graphDateTime(input.start);
  if (input.end) body.end = graphDateTime(input.end);
  if (input.reminderMinutesBefore?.length) {
    body.isReminderOn = true;
    body.reminderMinutesBeforeStart = Math.min(...input.reminderMinutesBefore);
  }

  const data = await graphPatch(
    access_token,
    `/events/${encodeURIComponent(eventId)}`,
    body
  );

  return {
    eventId: String(data?.id ?? eventId),
    refreshed: refreshed ? { ...stored, ...refreshed } : null,
  };
}

export async function deleteMs365CalendarEvent(
  stored: Ms365StoredTokens,
  eventId: string
): Promise<{ refreshed: Ms365StoredTokens | null }> {
  const { access_token, refreshed } = await ensureFreshToken(stored);
  await graphDelete(access_token, `/events/${encodeURIComponent(eventId)}`);
  return {
    refreshed: refreshed ? { ...stored, ...refreshed } : null,
  };
}


export type Ms365FilesTarget = 'onedrive' | 'sharepoint';

export interface Ms365FileSyncResult {
  fileId: string;
  webUrl: string | null;
  refreshed: Ms365StoredTokens | null;
}

function ms365FilesDriveBase(target: Ms365FilesTarget): string {
  if (target === 'sharepoint') {
    const driveId = process.env.MS365_SHAREPOINT_DRIVE_ID?.trim();
    if (!driveId) {
      throw new Error('MS365_SHAREPOINT_DRIVE_ID is required for SharePoint file mirroring');
    }
    return `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(driveId)}`;
  }
  return 'https://graph.microsoft.com/v1.0/me/drive';
}

async function graphAbsoluteJson(
  accessToken: string,
  url: string,
  init?: RequestInit
) {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `Microsoft Graph request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

function safeMs365ItemName(name: string): string {
  return name
    .replace(/[\\/:*?"<>|#%]/g, '_')
    .trim()
    .slice(0, 120) || 'documento';
}

async function listMs365ChildItems(
  accessToken: string,
  base: string,
  parentId: string | null
): Promise<Array<{ id: string; name: string; folder?: unknown; webUrl?: string }>> {
  const parentPath = parentId
    ? `/items/${encodeURIComponent(parentId)}/children`
    : '/root/children';
  const params = new URLSearchParams({
    '$select': 'id,name,folder,webUrl',
    '$top': '200',
  });

  const items: Array<{ id: string; name: string; folder?: unknown; webUrl?: string }> = [];
  let nextUrl: string | null = `${base}${parentPath}?${params.toString()}`;
  let pageCount = 0;

  while (nextUrl && pageCount < 50) {
    const data = await graphAbsoluteJson(accessToken, nextUrl);
    items.push(...((data?.value ?? []) as Array<{ id: string; name: string; folder?: unknown; webUrl?: string }>));
    nextUrl = typeof data?.['@odata.nextLink'] === 'string'
      ? data['@odata.nextLink']
      : null;
    pageCount += 1;
  }

  if (nextUrl) {
    throw new Error('Microsoft Graph folder listing exceeded pagination safety limit');
  }

  return items;
}

async function findOrCreateMs365Folder(
  accessToken: string,
  base: string,
  parentId: string | null,
  folderName: string
): Promise<string> {
  const safeName = safeMs365ItemName(folderName);
  const findExisting = async () => {
    const children = await listMs365ChildItems(accessToken, base, parentId);
    return children.find(
      (item) => item.folder && item.name.toLocaleLowerCase() === safeName.toLocaleLowerCase()
    )?.id ?? null;
  };

  const existing = await findExisting();
  if (existing) return existing;

  const parentPath = parentId
    ? `/items/${encodeURIComponent(parentId)}/children`
    : '/root/children';

  try {
    const created = await graphAbsoluteJson(accessToken, `${base}${parentPath}`, {
      method: 'POST',
      body: JSON.stringify({
        name: safeName,
        folder: {},
        '@microsoft.graph.conflictBehavior': 'fail',
      }),
    });
    const id = String(created?.id ?? '');
    if (!id) throw new Error('Microsoft Graph did not return a folder id');
    return id;
  } catch (error) {
    // Concurrent uploads may create the same client/service folder. Re-read
    // before surfacing the failure.
    const raced = await findExisting();
    if (raced) return raced;
    throw error;
  }
}

async function uploadMs365FileContent(
  accessToken: string,
  base: string,
  parentId: string,
  fileName: string,
  mimeType: string,
  fileBuffer: Buffer
): Promise<{ id: string; webUrl: string | null }> {
  const safeName = safeMs365ItemName(fileName);
  const url = `${base}/items/${encodeURIComponent(parentId)}:/${encodeURIComponent(safeName)}:/content?@microsoft.graph.conflictBehavior=rename`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': mimeType || 'application/octet-stream',
    },
    body: new Uint8Array(fileBuffer),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `Microsoft Graph file upload failed: ${res.status}`);
  }
  const data = await res.json();
  const id = String(data?.id ?? '');
  if (!id) throw new Error('Microsoft Graph did not return an uploaded file id');
  return { id, webUrl: data?.webUrl ?? null };
}

export async function syncDocumentToMs365Files(
  stored: Ms365StoredTokens,
  input: {
    target: Ms365FilesTarget;
    rootFolderId?: string | null;
    fileBuffer: Buffer;
    fileName: string;
    mimeType: string;
    clientName: string;
    serviceName: string;
  }
): Promise<Ms365FileSyncResult> {
  const { access_token, refreshed } = await ensureFreshToken(stored);
  const base = ms365FilesDriveBase(input.target);

  const clientFolderId = await findOrCreateMs365Folder(
    access_token,
    base,
    input.rootFolderId?.trim() || null,
    input.clientName
  );
  const serviceFolderId = await findOrCreateMs365Folder(
    access_token,
    base,
    clientFolderId,
    input.serviceName
  );
  const uploaded = await uploadMs365FileContent(
    access_token,
    base,
    serviceFolderId,
    input.fileName,
    input.mimeType,
    input.fileBuffer
  );

  return {
    fileId: uploaded.id,
    webUrl: uploaded.webUrl,
    refreshed: refreshed ? { ...stored, ...refreshed } : null,
  };
}
