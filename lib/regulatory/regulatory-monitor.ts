import { createHash } from 'node:crypto';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';

export type RegulatoryRunType = 'daily_pulse' | 'monthly_audit' | 'manual';

export type RegulatorySourceRow = {
  id: string;
  source_key: string;
  authority: string;
  title: string;
  url: string;
  fetch_url: string;
  fetch_strategy: 'html' | 'rss' | 'json' | 'xml' | 'boe_daily';
  check_frequency: 'daily' | 'monthly' | 'manual';
  last_fingerprint: string | null;
};

const ALLOWED_HOSTS = new Set([
  'www.boe.es',
  'boe.es',
  'sede.agenciatributaria.gob.es',
  'www.seg-social.es',
  'seg-social.es',
  'www.ine.es',
  'ine.es',
  'servicios.ine.es',
  'www.bde.es',
  'bde.es',
  'www.inclusion.gob.es',
  'inclusion.gob.es',
  'sede.inclusion.gob.es',
  'www.sepe.es',
  'sepe.es',
  'www.dgt.es',
  'sede.dgt.gob.es',
  'www.mjusticia.gob.es',
  'sede.mjusticia.gob.es',
]);

const MAX_SOURCE_BYTES = 2_000_000;
const MAX_EXCERPT_CHARS = 24_000;
const EVIDENCE_SLICE_CHARS = 8_000;

function buildEvidenceExcerpt(normalized: string) {
  if (normalized.length <= MAX_EXCERPT_CHARS) return normalized;
  const middleStart = Math.max(0, Math.floor(normalized.length / 2) - Math.floor(EVIDENCE_SLICE_CHARS / 2));
  const tailStart = Math.max(0, normalized.length - EVIDENCE_SLICE_CHARS);
  return [
    '[BEGIN]',
    normalized.slice(0, EVIDENCE_SLICE_CHARS),
    '[MIDDLE]',
    normalized.slice(middleStart, middleStart + EVIDENCE_SLICE_CHARS),
    '[END]',
    normalized.slice(tailStart),
  ].join('\n');
}

function formatBoeDate(date = new Date()) {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

function resolveFetchUrl(source: RegulatorySourceRow): string {
  const resolved = source.fetch_strategy === 'boe_daily'
    ? source.fetch_url.replace('{date}', formatBoeDate())
    : source.fetch_url;

  const url = new URL(resolved);
  if (url.protocol !== 'https:' || !ALLOWED_HOSTS.has(url.hostname)) {
    throw new Error(`Regulatory source host not allowed: ${url.hostname}`);
  }
  return url.toString();
}

function decodeEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function normalizePayload(raw: string, strategy: RegulatorySourceRow['fetch_strategy']) {
  let value = raw;

  if (strategy === 'rss' || strategy === 'xml') {
    value = value
      .replace(/<lastBuildDate\b[^>]*>[\s\S]*?<\/lastBuildDate>/gi, ' ')
      .replace(/<generator\b[^>]*>[\s\S]*?<\/generator>/gi, ' ')
      .replace(/<atom:link\b[^>]*\/>/gi, ' ');
  }

  if (strategy === 'html' || strategy === 'rss' || strategy === 'xml') {
    value = value
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<!--([\s\S]*?)-->/g, ' ')
      .replace(/<[^>]+>/g, ' ');
  }

  value = decodeEntities(value)
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return value;
}

async function fetchWithLimits(url: string): Promise<{ text: string; contentType: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(url, {
      headers: {
        accept: 'application/json, application/xml, text/xml, text/html;q=0.9, */*;q=0.5',
        'user-agent': 'EXPERT-KIA-Regulatory-Monitor/1.0 (+https://expertconsulting.es)',
      },
      cache: 'no-store',
      redirect: 'follow',
      signal: controller.signal,
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const finalUrl = new URL(response.url || url);
    if (finalUrl.protocol !== 'https:' || !ALLOWED_HOSTS.has(finalUrl.hostname)) {
      throw new Error(`Regulatory redirect host not allowed: ${finalUrl.hostname}`);
    }

    const contentLength = Number(response.headers.get('content-length') ?? '0');
    if (contentLength > MAX_SOURCE_BYTES) {
      throw new Error(`Regulatory payload too large: ${contentLength}`);
    }

    const text = await response.text();
    if (Buffer.byteLength(text, 'utf8') > MAX_SOURCE_BYTES) {
      throw new Error('Regulatory payload exceeds maximum size');
    }

    return {
      text,
      contentType: response.headers.get('content-type') ?? '',
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchRegulatorySource(source: RegulatorySourceRow) {
  const fetchUrl = resolveFetchUrl(source);
  const { text, contentType } = await fetchWithLimits(fetchUrl);
  const normalized = normalizePayload(text, source.fetch_strategy);
  if (!normalized) throw new Error('Official source returned empty content');

  const fingerprint = createHash('sha256').update(normalized, 'utf8').digest('hex');

  return {
    fetchUrl,
    fingerprint,
    excerpt: buildEvidenceExcerpt(normalized),
    contentType,
    normalizedLength: normalized.length,
  };
}

export async function runRegulatoryPulse(params: {
  runType: RegulatoryRunType;
  forceAll?: boolean;
  sourceKey?: string;
  authority?: string;
}) {
  const admin = getSupabaseAdmin();
  const { data: run, error: runError } = await admin
    .from('regulatory_review_runs')
    .insert({
      run_type: params.runType,
      triggered_by: params.runType === 'manual' ? 'admin' : 'cron',
      scope: {
        forceAll: Boolean(params.forceAll),
        sourceKey: params.sourceKey ?? null,
        authority: params.authority ?? null,
      },
    })
    .select('id')
    .single();

  if (runError || !run) throw new Error(runError?.message ?? 'Cannot create regulatory run');

  let query = admin
    .from('regulatory_sources')
    .select('id,source_key,authority,title,url,fetch_url,fetch_strategy,check_frequency,last_fingerprint')
    .eq('active', true);

  if (!params.forceAll && params.runType === 'daily_pulse') {
    query = query.eq('check_frequency', 'daily');
  }
  if (params.sourceKey) query = query.eq('source_key', params.sourceKey);
  if (params.authority) query = query.ilike('authority', params.authority);

  const { data: sources, error: sourceError } = await query.order('priority', { ascending: false });
  if (sourceError) {
    await admin.from('regulatory_review_runs').update({
      status: 'failed',
      errors: [{ source: 'registry', error: sourceError.message }],
      finished_at: new Date().toISOString(),
    }).eq('id', run.id);
    throw new Error(sourceError.message);
  }

  let checked = 0;
  let changed = 0;
  const errors: Array<{ sourceKey: string; error: string }> = [];

  for (const source of (sources ?? []) as RegulatorySourceRow[]) {
    checked += 1;
    const checkedAt = new Date().toISOString();

    try {
      const fetched = await fetchRegulatorySource(source);
      const hasBaseline = Boolean(source.last_fingerprint);
      const isChanged = hasBaseline && source.last_fingerprint !== fetched.fingerprint;

      const { data: snapshot, error: snapshotError } = await admin
        .from('regulatory_snapshots')
        .upsert({
          source_id: source.id,
          fingerprint: fetched.fingerprint,
          title: source.title,
          normalized_excerpt: fetched.excerpt,
          metadata: {
            fetchedUrl: fetched.fetchUrl,
            contentType: fetched.contentType,
            normalizedLength: fetched.normalizedLength,
            evidenceMode: fetched.normalizedLength > MAX_EXCERPT_CHARS ? 'head_middle_tail' : 'full',
          },
        }, { onConflict: 'source_id,fingerprint' })
        .select('id')
        .single();

      if (snapshotError || !snapshot) throw new Error(snapshotError?.message ?? 'Snapshot write failed');

      if (isChanged) {
        const { data: previous } = await admin
          .from('regulatory_snapshots')
          .select('id')
          .eq('source_id', source.id)
          .eq('fingerprint', source.last_fingerprint)
          .maybeSingle();

        const { data: insertedChange, error: changeError } = await admin
          .from('regulatory_changes')
          .upsert({
            source_id: source.id,
            previous_snapshot_id: previous?.id ?? null,
            current_snapshot_id: snapshot.id,
            status: 'detected',
            requires_human_review: true,
          }, { onConflict: 'current_snapshot_id', ignoreDuplicates: true })
          .select('id')
          .maybeSingle();
        if (changeError) throw new Error(changeError.message);
        if (insertedChange) changed += 1;
      }

      const { error: sourceUpdateError } = await admin.from('regulatory_sources').update({
        last_checked_at: checkedAt,
        last_success_at: checkedAt,
        last_error: null,
        last_fingerprint: fetched.fingerprint,
        ...(isChanged ? { last_changed_at: checkedAt } : {}),
      }).eq('id', source.id);
      if (sourceUpdateError) throw new Error(`Source state update failed: ${sourceUpdateError.message}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown regulatory fetch error';
      errors.push({ sourceKey: source.source_key, error: message.slice(0, 500) });
      const { error: errorStateUpdateError } = await admin.from('regulatory_sources').update({
        last_checked_at: checkedAt,
        last_error: message.slice(0, 1000),
      }).eq('id', source.id);
      if (errorStateUpdateError) {
        console.error('[Regulatory monitor] could not persist source error state:', errorStateUpdateError.message);
      }
    }
  }

  await admin.from('regulatory_review_runs').update({
    status: errors.length === 0 ? 'succeeded' : checked > errors.length ? 'partial' : 'failed',
    sources_checked: checked,
    sources_changed: changed,
    errors,
    finished_at: new Date().toISOString(),
  }).eq('id', run.id);

  return {
    runId: run.id,
    sourcesChecked: checked,
    sourcesChanged: changed,
    errors,
  };
}
