import { articles } from '@/lib/utils/blog';
import { docs } from '@/lib/utils/docs';
import { services } from '@/lib/utils/catalog';
import type { getSupabaseAdmin } from '@/lib/integrations/supabase';
import type { KiaToolResult } from './kia-tool-definitions';

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

function norm(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function scoreText(query: string, haystack: string): number {
  const q = norm(query).split(/\s+/).filter((x) => x.length >= 3);
  const h = norm(haystack);
  if (!q.length) return 0;
  return q.reduce((score, token) => score + (h.includes(token) ? 1 : 0), 0);
}

export function searchKiaKnowledgeResources(input: {
  query: string;
  type?: 'blog' | 'doc' | 'all';
  category?: string;
  serviceSlug?: string;
  limit?: number;
}) {
  const limit = Math.min(Math.max(input.limit ?? 5, 1), 10);
  const type = input.type ?? 'all';
  const rows: Array<Record<string, unknown> & { score: number }> = [];

  if (type === 'all' || type === 'blog') {
    for (const item of articles) {
      if (input.category && item.category !== input.category) continue;
      if (input.serviceSlug && !item.relatedServiceSlugs?.includes(input.serviceSlug)) continue;
      const score = scoreText(input.query, [item.title,item.excerpt,item.tags.join(' '),item.body.slice(0,3000)].join(' '));
      if (score > 0 || input.serviceSlug) rows.push({
        score,
        type: 'blog',
        slug: item.slug,
        title: item.title,
        excerpt: item.excerpt,
        url: `/blog/${item.slug}`,
        tags: item.tags,
        relatedServiceSlugs: item.relatedServiceSlugs ?? [],
        updatedAt: item.date,
      });
    }
  }

  if (type === 'all' || type === 'doc') {
    for (const item of docs) {
      if (input.category && item.category !== input.category) continue;
      if (input.serviceSlug && !item.relatedServiceSlugs?.includes(input.serviceSlug)) continue;
      const score = scoreText(input.query, [item.title,item.excerpt,item.tags.join(' '),item.body.slice(0,3000)].join(' '));
      if (score > 0 || input.serviceSlug) rows.push({
        score,
        type: 'doc',
        slug: item.slug,
        title: item.title,
        excerpt: item.excerpt,
        url: `/docs/${item.slug}`,
        tags: item.tags,
        relatedServiceSlugs: item.relatedServiceSlugs ?? [],
        updatedAt: item.updatedAt,
      });
    }
  }

  return rows.sort((a,b) => b.score - a.score || String(a.title).localeCompare(String(b.title))).slice(0, limit)
    .map(({ score, ...row }) => row);
}


const KIA_KNOWLEDGE_SILENT_INTENTS = new Set([
  'greeting',
  'case_status',
  'checkout',
  'book_call',
  'complete_profile',
  'connect_holded',
  'send_documents',
  'report_request',
  'export_report',
]);

export function buildAutomaticKiaKnowledgeResult(input: {
  message: string;
  intent: string;
  serviceSlug?: string;
  existingToolResults: KiaToolResult[];
}): KiaToolResult | null {
  if (input.message.trim().length < 8) return null;
  if (KIA_KNOWLEDGE_SILENT_INTENTS.has(input.intent)) return null;
  if (input.existingToolResults.some((item) => item.toolName === 'search_knowledge_resources')) return null;

  const resources = searchKiaKnowledgeResources({
    query: input.message,
    type: 'all',
    serviceSlug: input.serviceSlug,
    limit: 3,
  });
  if (!resources.length) return null;

  return {
    toolName: 'search_knowledge_resources',
    ok: true,
    result: { resources },
  };
}

export function findKiaRelevantServices(input: {
  query: string;
  category?: string;
  limit?: number;
}) {
  const limit = Math.min(Math.max(input.limit ?? 2, 1), 3);
  return services
    .filter((service) => !input.category || service.categoria === input.category)
    .map((service) => ({
      service,
      score: scoreText(input.query, [
        service.name,
        service.shortDescription,
        service.description,
        ...(service.audience ?? []),
        ...(service.requirements ?? []),
        ...(service.reviewBeforeHiring ?? []),
      ].join(' ')),
    }))
    .filter((row) => row.score > 0)
    .sort((a,b) => b.score - a.score || a.service.name.localeCompare(b.service.name))
    .slice(0, limit)
    .map(({ service }) => ({
      slug: service.slug,
      name: service.name,
      category: service.categoria,
      price: service.price ?? null,
      hasCheckout: Boolean(service.stripePriceId),
      url: `/servicios/${service.categoria}/${service.slug}`,
      shortDescription: service.shortDescription,
    }));
}

export async function getKiaOfficialSources(input: {
  admin: AdminClient;
  serviceSlug?: string;
  topic?: string;
  limit?: number;
}) {
  const limit = Math.min(Math.max(input.limit ?? 5, 1), 10);
  let sourceIds: string[] | null = null;

  if (input.serviceSlug) {
    const { data: deps, error } = await input.admin
      .from('regulatory_dependencies')
      .select('source_id')
      .eq('active', true)
      .in('dependency_type', ['service','operational_blueprint','viability'])
      .eq('dependency_key', input.serviceSlug);
    if (error) throw error;
    sourceIds = [...new Set((deps ?? []).map((row) => row.source_id).filter(Boolean))] as string[];
    if (!sourceIds.length) return [];
  }

  let query = input.admin
    .from('regulatory_sources')
    .select('id,source_key,authority,title,url,topics,last_checked_at,last_success_at,last_error')
    .eq('active', true);

  if (sourceIds) query = query.in('id', sourceIds);
  if (input.topic) query = query.contains('topics', [input.topic]);

  const { data, error } = await query.order('priority', { ascending: false }).limit(limit);
  if (error) throw error;

  return (data ?? []).map((row) => ({
    sourceKey: row.source_key,
    authority: row.authority,
    title: row.title,
    url: row.url,
    topics: row.topics ?? [],
    lastCheckedAt: row.last_checked_at,
    lastSuccessAt: row.last_success_at,
    status: row.last_error ? 'warning' : 'ok',
  }));
}
