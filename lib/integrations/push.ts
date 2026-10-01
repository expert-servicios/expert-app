import webpush from 'web-push';
import { getSupabaseAdmin } from './supabase';
import { notifyAdminsTelegram } from './telegram';
import { absoluteAppUrl } from '@/lib/utils/app-url';

export interface PushPayload {
  title: string;
  body:  string;
  url?:  string;
  tag?:  string;
}

let vapidReady = false;
function ensureVapid(): boolean {
  if (vapidReady) return true;
  const subject    = process.env.VAPID_SUBJECT;
  const publicKey  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!subject || !publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidReady = true;
  return true;
}

async function sendToSubscriptions(
  admin: ReturnType<typeof getSupabaseAdmin>,
  userIds: string[],
  payload: PushPayload,
): Promise<{ attempted: number; delivered: number; dead: number; errors: number; lookupError: boolean; cleanupError: boolean }> {
  const { data: subs, error: lookupError } = await admin
    .from('push_subscriptions')
    .select('endpoint,p256dh,auth,user_id')
    .in('user_id', userIds);

  if (lookupError) {
    return { attempted: 0, delivered: 0, dead: 0, errors: 1, lookupError: true, cleanupError: false };
  }
  if (!subs?.length) return { attempted: 0, delivered: 0, dead: 0, errors: 0, lookupError: false, cleanupError: false };

  const dead: string[] = [];
  let delivered = 0;
  let errors = 0;

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
        );
        delivered++;
      } catch (err: unknown) {
        errors++;
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) dead.push(sub.endpoint);
      }
    })
  );

  let cleanupError = false;
  let removedDead = 0;
  if (dead.length) {
    const { error: deleteError } = await admin.from('push_subscriptions').delete().in('endpoint', dead);
    if (deleteError) {
      cleanupError = true;
      errors++;
      console.error('[push] expired subscription cleanup failed:', deleteError.message);
    } else {
      removedDead = dead.length;
    }
  }

  return { attempted: subs.length, delivered, dead: removedDead, errors, lookupError: false, cleanupError };
}

async function persistAdminPushHealth(
  admin: ReturnType<typeof getSupabaseAdmin>,
  value: Record<string, unknown>,
): Promise<boolean> {
  const { error } = await admin.from('system_kv').upsert({
    key: 'admin_push_health',
    value,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'key' });
  if (error) {
    console.error('[push] admin_push_health persistence failed:', error.message);
    return false;
  }
  return true;
}

// Send push to all admin + owner users
export async function notifyAdmins(payload: PushPayload): Promise<void> {
  const link = payload.url ? absoluteAppUrl(payload.url) : null;
  const telegramText = `<b>${escapeHtml(payload.title)}</b>\n${escapeHtml(payload.body)}${link ? `\n${link}` : ''}`;
  notifyAdminsTelegram(telegramText).catch(() => {});

  const admin = getSupabaseAdmin();
  if (!ensureVapid()) {
    await persistAdminPushHealth(admin, {
      status: 'misconfigured',
      reason: 'missing_vapid',
      checked_at: new Date().toISOString(),
    });
    return;
  }

  const { data: profiles, error: profileLookupError } = await admin
    .from('profiles')
    .select('id')
    .in('role', ['admin', 'owner']);

  if (profileLookupError) {
    await persistAdminPushHealth(admin, {
      status: 'degraded',
      reason: 'admin_profile_lookup_failed',
      checked_at: new Date().toISOString(),
    });
    return;
  }

  if (!profiles?.length) {
    await persistAdminPushHealth(admin, {
      status: 'degraded',
      reason: 'no_admin_profiles',
      checked_at: new Date().toISOString(),
    });
    return;
  }

  const delivery = await sendToSubscriptions(admin, profiles.map((p) => p.id as string), payload);
  await persistAdminPushHealth(admin, {
    status: delivery.lookupError || delivery.cleanupError
      ? 'degraded'
      : delivery.attempted === 0
        ? 'no_subscription'
        : delivery.errors === 0 && delivery.delivered === delivery.attempted
          ? 'ok'
          : 'degraded',
    reason: delivery.lookupError
      ? 'subscription_lookup_failed'
      : delivery.cleanupError
        ? 'subscription_cleanup_failed'
        : null,
    attempted: delivery.attempted,
    delivered: delivery.delivered,
    dead: delivery.dead,
    errors: delivery.errors,
    checked_at: new Date().toISOString(),
  });
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Send push to a specific client user
export async function notifyClient(clientId: string, payload: PushPayload): Promise<void> {
  if (!ensureVapid()) return;
  const admin = getSupabaseAdmin();
  await sendToSubscriptions(admin, [clientId], payload);
}
