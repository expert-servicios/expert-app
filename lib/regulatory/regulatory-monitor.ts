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
  'www3.agenciatributaria.gob.es',
  'atv.gva.es',
  'www.gva.es',
  'sede.gva.es',
  'www.paeelectronico.es',
  'paeelectronico.es',
  'revista.dgt.es',
  'sede.transportes.gob.es',
]);

const MAX_SOURCE_BYTES = 2_000_000;
const MAX_EXCERPT_CHARS = 24_000;
const EVIDENCE_SLICE_CHARS = 7_900;

const BOE_RELEVANCE_KEYWORDS = [
  'agencia estatal de administracion tributaria',
  'tribut',
  'impuesto',
  'hacienda',
  'factur',
  'iva',
  'irpf',
  'sociedades',
  'seguridad social',
  'cotiz',
  'laboral',
  'trabajo',
  'salario minimo',
  'autonom',
  'empleo',
  'extranjer',
  'migraci',
  'residencia',
  'nacionalidad',
  'registro mercantil',
  'sociedad',
  'mercantil',
  'interes',
  'demora',
  'morosidad',
  'arrendamiento',
  'vivienda',
  'alquiler',
  'proteccion de datos',
  'firma electronica',
  'servicios de confianza',
  'certificado electronico',
];

type BoeDailyItem = {
  id: string;
  title: string;
  order: number;
  score: number;
};

function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function normalizeBoeDailyPayload(raw: string) {
  try {
    const parsed = JSON.parse(raw) as unknown;
    const items: BoeDailyItem[] = [];
    const seen = new Set<string>();
    let order = 0;

    const visit = (value: unknown) => {
      if (Array.isArray(value)) {
        value.forEach(visit);
        return;
      }
      if (!value || typeof value !== 'object') return;

      const row = value as Record<string, unknown>;
      const id = typeof row.identificador === 'string' ? row.identificador.trim() : '';
      const title = typeof row.titulo === 'string'
        ? row.titulo.replace(/\s+/g, ' ').trim()
        : '';

      if (/^BOE-A-\d{4}-\d+$/.test(id) && title && !seen.has(id)) {
        const searchable = normalizeSearchText(title);
        const score = BOE_RELEVANCE_KEYWORDS.reduce(
          (total, keyword) => total + (searchable.includes(keyword) ? 1 : 0),
          0,
        );
        items.push({ id, title: title.slice(0, 600), order, score });
        seen.add(id);
        order += 1;
      }

      Object.values(row).forEach(visit);
    };

    visit(parsed);
    if (items.length === 0) return raw;

    const candidates = items
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.order - b.order);
    const others = items.filter((item) => item.score === 0);

    return [
      '[BOE_DAILY_COMPACT]',
      'items=' + items.length + '; candidates=' + candidates.length,
      '[EXPERT_CANDIDATES]',
      ...candidates.map((item) => item.id + ' | ' + item.title),
      '[OTHER_BOE_ITEMS]',
      ...others.map((item) => item.id + ' | ' + item.title),
    ].join('\n');
  } catch {
    return raw;
  }
}

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
  let value = strategy === 'boe_daily' ? normalizeBoeDailyPayload(raw) : raw;

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

async function fetchWithLimits(
  url: string,
  allowNotFound = false,
): Promise<{ text: string; contentType: string; status: number }> {
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

    if (response.status === 404 && allowNotFound) {
      return {
        text: '',
        contentType: response.headers.get('content-type') ?? '',
        status: response.status,
      };
    }
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
      status: response.status,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchRegulatorySource(source: RegulatorySourceRow) {
  const fetchUrl = resolveFetchUrl(source);
  const { text, contentType, status } = await fetchWithLimits(
    fetchUrl,
    source.fetch_strategy === 'boe_daily',
  );
  if (source.fetch_strategy === 'boe_daily' && status === 404) {
    return {
      fetchUrl,
      fingerprint: null,
      excerpt: '',
      contentType,
      normalizedLength: 0,
      noPublication: true as const,
    };
  }

  const normalized = normalizePayload(text, source.fetch_strategy);
  if (!normalized) throw new Error('Official source returned empty content');

  const fingerprint = createHash('sha256').update(normalized, 'utf8').digest('hex');

  return {
    fetchUrl,
    fingerprint,
    excerpt: buildEvidenceExcerpt(normalized),
    contentType,
    normalizedLength: normalized.length,
    noPublication: false as const,
  };
}

export async function runRegulatoryPulse(params: {
  runType: RegulatoryRunType;
  forceAll?: boolean;
  sourceKey?: string;
  authority?: string;
  topic?: string;
  serviceKey?: string;
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
        topic: params.topic ?? null,
        serviceKey: params.serviceKey ?? null,
      },
    })
    .select('id')
    .single();

  if (runError || !run) throw new Error(runError?.message ?? 'Cannot create regulatory run');

  let serviceSourceIds: string[] | null = null;
  if (params.serviceKey) {
    const { data: serviceDeps, error: serviceDepsError } = await admin
      .from('regulatory_dependencies')
      .select('source_id')
      .eq('active', true)
      .eq('dependency_key', params.serviceKey)
      .in('dependency_type', ['service', 'operational_blueprint', 'viability']);
    if (serviceDepsError) throw new Error(serviceDepsError.message);
    serviceSourceIds = Array.from(new Set((serviceDeps ?? []).map((row) => row.source_id).filter(Boolean))) as string[];
    if (serviceSourceIds.length === 0) {
      await admin.from('regulatory_review_runs').update({
        status: 'succeeded',
        sources_checked: 0,
        sources_changed: 0,
        finished_at: new Date().toISOString(),
      }).eq('id', run.id);
      return { runId: run.id, sourcesChecked: 0, sourcesChanged: 0, errors: [] };
    }
  }

  let query = admin
    .from('regulatory_sources')
    .select('id,source_key,authority,title,url,fetch_url,fetch_strategy,check_frequency,last_fingerprint')
    .eq('active', true);

  if (!params.forceAll && params.runType === 'daily_pulse') {
    query = query.or('check_frequency.eq.daily,last_fingerprint.is.null');
  }
  if (params.sourceKey) query = query.eq('source_key', params.sourceKey);
  if (params.authority) query = query.ilike('authority', params.authority);
  if (params.topic) query = query.contains('topics', [params.topic]);
  if (serviceSourceIds) query = query.in('id', serviceSourceIds);

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
      if (fetched.noPublication) {
        const { error: sourceUpdateError } = await admin.from('regulatory_sources').update({
          last_checked_at: checkedAt,
          last_success_at: checkedAt,
          last_error: null,
        }).eq('id', source.id);
        if (sourceUpdateError) throw new Error(`Source state update failed: ${sourceUpdateError.message}`);
        continue;
      }

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
