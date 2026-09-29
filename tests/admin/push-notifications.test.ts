import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('Admin push reliability', () => {
  const button = source('components/admin/PushSubscribeButton.tsx');
  const push = source('lib/integrations/push.ts');
  const subscribe = source('app/api/push/subscribe/route.ts');

  it('re-registers an existing browser subscription with the server on admin load', () => {
    expect(button).toContain('reg.pushManager.getSubscription()');
    expect(button).toContain("fetch('/api/push/subscribe'");
    expect(button).toContain("method: 'POST'");
    expect(button).toContain("setState(res?.ok ? 'subscribed' : 'unsubscribed')");
  });

  it('records admin push delivery health without storing subscription secrets', () => {
    expect(push).toContain("key: 'admin_push_health'");
    expect(push).toContain("reason: 'missing_vapid'");
    expect(push).toContain("delivery.cleanupError");
    expect(push).toContain("'subscription_cleanup_failed'");
    expect(push).toContain("delivery.errors === 0 && delivery.delivered === delivery.attempted");
    expect(push).toContain('attempted: delivery.attempted');
    expect(push).toContain('delivered: delivery.delivered');
    expect(push).toContain('dead: delivery.dead');
    expect(push).toContain('errors: delivery.errors');
    expect(push).toContain('lookupError: true');
    expect(push).toContain('cleanupError: true');
    expect(push).toContain('persistAdminPushHealth');
    expect(push).toContain("reason: 'admin_profile_lookup_failed'");
    expect(push).toContain("reason: 'no_admin_profiles'");
    expect(push).not.toContain('p256dh: delivery');
    expect(push).not.toContain('auth: delivery');
  });

  it('fails the subscription API when persistence fails', () => {
    expect(subscribe).toContain('persistError');
    expect(subscribe).toContain("status: 503");
    expect(subscribe).toContain('deleteError');
  });

  it('removes expired browser endpoints after 404/410 responses and surfaces cleanup failure', () => {
    expect(push).toContain('status === 404 || status === 410');
    expect(push).toContain("from('push_subscriptions').delete().in('endpoint', dead)");
    expect(push).toContain('cleanupError = true');
    expect(push).toContain("expired subscription cleanup failed");
  });

  it('reverts the local browser subscription when server persistence fails', () => {
    expect(button).toContain('if (!persist.ok)');
    expect(button).toContain('await sub.unsubscribe()');
    expect(button).toContain("throw new Error('push_subscription_persistence_failed')");
  });
});
