const BASE = 'https://api.holded.com';
const EXPECTED_BRANCH = 'chore/holded-advisor-probe';
const TARGET = 'diseno global meridiano';

function normalize(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function containsTarget(value) {
  try {
    return normalize(JSON.stringify(value ?? null)).includes(TARGET);
  } catch {
    return false;
  }
}

function arrayFromPayload(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];
  for (const key of ['items', 'data', 'results']) {
    if (Array.isArray(value[key])) return value[key];
  }
  return [];
}

function contextHeaders(headers) {
  const out = {};
  for (const [key, value] of headers.entries()) {
    const lower = key.toLowerCase();
    if (['company', 'account', 'workspace', 'tenant', 'organization', 'user'].some((part) => lower.includes(part))) {
      out[key] = value.slice(0, 120);
    }
  }
  return out;
}

async function probe(path, token) {
  try {
    const response = await fetch(BASE + path, {
      headers: {
        Authorization: 'Bearer ' + token,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    });
    const text = await response.text();
    let payload = null;
    if (text) {
      try { payload = JSON.parse(text); } catch { payload = { nonJson: true }; }
    }
    const items = arrayFromPayload(payload);
    const keys = payload && typeof payload === 'object' && !Array.isArray(payload)
      ? Object.keys(payload).slice(0, 20)
      : [];
    return {
      path,
      status: response.status,
      ok: response.ok,
      itemCount: items.length,
      topLevelKeys: keys,
      containsDisenoGlobalMeridiano: containsTarget(payload),
      contextHeaders: contextHeaders(response.headers),
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
      error: error instanceof Error ? error.message.slice(0, 160) : 'probe_failed',
    };
  }
}

if (process.env.VERCEL_ENV !== 'preview' || process.env.VERCEL_GIT_COMMIT_REF !== EXPECTED_BRANCH) {
  process.exit(0);
}

const token = process.env.HOLDED_ADVISOR_API_TOKEN?.trim();
if (!token) {
  console.log('[holded-advisor-probe] ' + JSON.stringify({
    configured: false,
    message: 'HOLDED_ADVISOR_API_TOKEN missing in Preview environment',
  }));
  process.exit(0);
}

const probes = await Promise.all([
  probe('/api/v2/usage', token),
  probe('/api/v2/invoices?limit=10', token),
  probe('/api/v2/contacts?limit=25', token),
  probe('/api/v2/contacts/search?name=Diseno%20Global%20Meridiano&limit=10', token),
  probe('/api/v2/accounting-accounts?limit=10', token),
  probe('/api/v2/treasuries?limit=10', token),
]);

console.log('[holded-advisor-probe] ' + JSON.stringify({
  configured: true,
  anySuccessfulRead: probes.some((item) => item.ok),
  target: 'Diseño Global Meridiano',
  targetFoundAnywhere: probes.some((item) => item.containsDisenoGlobalMeridiano),
  probes,
}));
