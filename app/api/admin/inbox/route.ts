import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/auth/require-admin';
import { loadOperations360Inbox } from '@/lib/admin/operations-360-inbox';

const VALID_CHANNELS = new Set(['all', 'email', 'telegram', 'web', 'kia', 'meta', 'google', 'linkedin']);
const VALID_STATUSES = new Set(['all', 'needs_action', 'waiting_client', 'kia_working', 'resolved']);

function limitedSearch(value: string | null) {
  return (value ?? '')
    .replace(/[^\p{L}\p{N}\s@._+\-:/]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminClient(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const url = new URL(request.url);
    const q = limitedSearch(url.searchParams.get('q'));
    const channelRaw = (url.searchParams.get('channel') ?? 'all').toLowerCase();
    const statusRaw = (url.searchParams.get('status') ?? 'all').toLowerCase();
    const limit = Math.max(20, Math.min(Number(url.searchParams.get('limit')) || 120, 200));

    const channel = VALID_CHANNELS.has(channelRaw) ? channelRaw : 'all';
    const status = VALID_STATUSES.has(statusRaw) ? statusRaw : 'all';

    const result = await loadOperations360Inbox(admin, { q, channel, status, limit });

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[admin/inbox] read model failed', error);
    return NextResponse.json({ error: 'No se pudo cargar Operations 360 Inbox' }, { status: 500 });
  }
}
