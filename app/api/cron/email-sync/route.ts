import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { listGmailMailsSA, hasGmailSA, getGmailUnreadCountSA, listGmailMails } from '@/lib/integrations/gmail';
import type { GmailTokens, GmailSummary } from '@/lib/integrations/gmail';
import { notifyAdmins } from '@/lib/integrations/push';
import { verifyCronRequest } from '@/lib/security/cron';

// Vercel Cron: operational Gmail inbox sync.
// Prefers the EXPERT service account when healthy, but falls back to the admin OAuth
// connection if Domain-Wide Delegation is unavailable. It never uses client/company
// productivity tokens for the EXPERT operational mailbox.
// Fetches recent Gmail inbox for info@expertconsulting.es and caches results
// Also updates system_kv.email_unread_count for sidebar badge
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const cronAuth = verifyCronRequest(request.headers, 'cron/email-sync');
  if (!cronAuth.ok) {
    return NextResponse.json({ error: cronAuth.error }, { status: cronAuth.status });
  }

  console.log(JSON.stringify({ cron: 'email-sync', event: 'start', at: new Date().toISOString() }));

  const admin = getSupabaseAdmin();

  async function loadAdminOAuth(): Promise<{ tokens: GmailTokens; email: string | null } | null> {
    const { data, error } = await admin.from('gmail_tokens').select('*').eq('id', 'admin').maybeSingle();
    if (error || !data) return null;
    return {
      tokens: {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expiry_date: Number(data.expiry_date),
        email: data.email ?? null,
      },
      email: data.email ?? null,
    };
  }

  async function saveRefresh(refreshed: GmailTokens | null) {
    if (!refreshed) return;
    await admin.from('gmail_tokens').update({
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token,
      expiry_date: refreshed.expiry_date,
      updated_at: new Date().toISOString(),
    }).eq('id', 'admin');
  }

  async function fetchOperationalInbox(): Promise<{ mails: GmailSummary[]; unread: number; authMode: 'service_account' | 'oauth' }> {
    if (hasGmailSA()) {
      try {
        const [mails, unread] = await Promise.all([
          listGmailMailsSA({ maxResults: 50 }),
          getGmailUnreadCountSA(),
        ]);
        return { mails, unread, authMode: 'service_account' };
      } catch (error) {
        console.warn('[email-sync cron] Gmail service account unavailable, trying admin OAuth', error);
      }
    }

    const oauth = await loadAdminOAuth();
    if (!oauth) throw new Error('Gmail operational auth unavailable: configure Domain-Wide Delegation or connect admin Gmail OAuth');
    const { mails, refreshed } = await listGmailMails(oauth.tokens, { maxResults: 50 });
    await saveRefresh(refreshed);
    const unread = mails.filter((mail) => mail.unread).length;
    return { mails, unread, authMode: 'oauth' };
  }

  try {
    const inbox = await fetchOperationalInbox();
    const mails = inbox.mails;

    if (mails.length > 0) {
      const rows = mails.map((m) => ({
        thread_id:      m.conversationId,
        provider:       'gmail',
        subject:        m.subject,
        from_name:      m.from,
        from_email:     m.fromEmail,
        snippet:        m.snippet,
        date:           m.date,
        unread:         m.unread,
        has_attachment: m.hasAttachment,
        synced_at:      new Date().toISOString(),
      }));

      await admin
        .from('email_inbox_cache')
        .upsert(rows, { onConflict: 'thread_id' });
    }

    // Evict threads older than 30 days that are no longer in the inbox
    const activeIds = mails.map((m) => m.conversationId);
    if (activeIds.length > 0) {
      await admin
        .from('email_inbox_cache')
        .delete()
        .eq('provider', 'gmail')
        .lt('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .not('thread_id', 'in', `(${activeIds.map((id) => `"${id}"`).join(',')})`);
    }

    // Update unread count via dedicated function (uses resultSizeEstimate for speed)
    const { data: prevKv } = await admin
      .from('system_kv')
      .select('value')
      .eq('key', 'email_unread_count')
      .maybeSingle();
    const prevUnread = Number(prevKv?.value ?? 0);

    const unreadCount = inbox.unread;
    await admin
      .from('system_kv')
      .upsert(
        { key: 'email_unread_count', value: unreadCount, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );

    // Keep linked operational threads current. This is the bridge KIA uses later:
    // provider thread -> EXPERT case. No client/company OAuth token is involved here.
    const threadIds = mails.map((mail) => mail.conversationId).filter(Boolean);
    if (threadIds.length > 0) {
      const { data: linkedRows, error: linkedError } = await admin
        .from('email_threads')
        .select('thread_id,case_id,last_message_at')
        .in('thread_id', threadIds);
      if (linkedError) throw linkedError;

      const linked = new Map((linkedRows ?? []).map((row) => [row.thread_id, row]));
      for (const mail of mails) {
        const link = linked.get(mail.conversationId);
        if (!link?.case_id) continue;

        await admin.from('email_inbox_cache').update({ case_id: link.case_id }).eq('thread_id', mail.conversationId);
        await admin.from('email_threads').update({
          subject: mail.subject,
          client_email: mail.fromEmail,
          snippet: mail.snippet,
          last_message_at: mail.date,
          unread: mail.unread,
        }).eq('thread_id', mail.conversationId);
      }
    }

    // Push notification to admins when new unread emails arrive
    if (unreadCount > prevUnread) {
      const newCount = unreadCount - prevUnread;
      notifyAdmins({
        title: `📧 ${newCount} correo${newCount !== 1 ? 's' : ''} nuevo${newCount !== 1 ? 's' : ''}`,
        body : 'Nuevos mensajes en la bandeja de entrada',
        url  : '/admin/correo',
        tag  : 'email-unread',
      }).catch(() => {});
    }

    return NextResponse.json({
      ok: true,
      synced: mails.length,
      unread: unreadCount,
      authMode: inbox.authMode,
      linkedSync: true,
    });
  } catch (err) {
    console.error('[email-sync cron]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
