import { NextResponse } from 'next/server';

const BASE = 'https://api.holded.com';
const TARGET = 'diseno global meridiano';

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function containsTarget(value: unknown): boolean {
  try {
    return normalize(JSON.stringify(value ?? null)).includes(TARGET);
  } catch {
    return false;
  }
}

function arrayFromPayload(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];
  const obj = value as Record<string, unknown>;
  for (const key of ['items', 'data', 'results']) {
    if (Array.isArray(obj[key])) return obj[key] as unknown[];
  }
  return [];
}

function safeHeaders(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of headers.entries()) {
    const lower = key.toLowerCase();
    if (['company', 'account', 'workspace', 'tenant', 'organization', 'user'].some((part) => lower.includes(part))) {
      out[key] = value.slice(0, 200);
    }
  }
  return out;
}

async function probe(path: string, token: string) {
  try {
    const response = await fetch(`${BASE}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });

    let payload: unknown = null;
    const text = await response.text();
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { nonJson: true };
      }
    }

    const items = arrayFromPayload(payload);
    const keys = payload && typeof payload === 'object' && !Array.isArray(payload)
      ? Object.keys(payload as Record<string, unknown>).slice(0, 20)
      : [];

    return {
      path,
      status: response.status,
      ok: response.ok,
      itemCount: items.length,
      topLevelKeys: keys,
      containsDisenoGlobalMeridiano: containsTarget(payload),
      contextHeaders: safeHeaders(response.headers),
    };
  } catch (error) {
    return {
      path,
      status: null,
      ok: false,
      itemCount: 0,
      topLevelKeys: [],
      containsDisenoGlobalMeridiano: false,
      contextHeaders: {},
      error: error instanceof Error ? error.message.slice(0, 200) : 'probe_failed',
    };
  }
}

export async function GET() {
  if (process.env.VERCEL_ENV !== 'preview') {
    return new NextResponse(null, { status: 404 });
  }

  const token = process.env.HOLDED_ADVISOR_API_TOKEN?.trim();
  if (!token) {
    return NextResponse.json({
      ok: false,
      configured: false,
      message: 'HOLDED_ADVISOR_API_TOKEN is not available in this Preview deployment.',
    });
  }

  const probes = await Promise.all([
    probe('/api/v2/usage', token),
    probe('/api/v2/invoices?limit=10', token),
    probe('/api/v2/contacts?limit=25', token),
    probe('/api/v2/accounting-accounts?limit=10', token),
    probe('/api/v2/treasuries?limit=10', token),
  ]);

  return NextResponse.json({
    ok: probes.some((item) => item.ok),
    configured: true,
    target: 'Diseño Global Meridiano',
    targetFoundAnywhere: probes.some((item) => item.containsDisenoGlobalMeridiano),
    probes,
  });
}
