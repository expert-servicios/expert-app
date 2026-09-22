import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findKiaRelevantServices, searchKiaKnowledgeResources } from '@/lib/ai/kia/kia-knowledge-discovery';
import { generateKiaContextToken, hashKiaContextToken } from '@/lib/ai/kia/kia-context-token';
import { getKiaToolPolicy } from '@/lib/ai/kia/kia-tool-registry';

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('KIA contextual conversations foundation', () => {
  it('creates opaque context tokens and stores only hashes by design', () => {
    const token = generateKiaContextToken();
    expect(token.length).toBeGreaterThanOrEqual(32);
    expect(hashKiaContextToken(token)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashKiaContextToken(token)).not.toContain(token);
  });

  it('defines canonical multichannel conversation and context-token tables', () => {
    const migration = source('supabase/migrations/20260922201500_kia_contextual_conversations.sql');
    expect(migration).toContain('create table if not exists public.kia_conversations');
    expect(migration).toContain('create table if not exists public.kia_conversation_messages');
    expect(migration).toContain('create table if not exists public.kia_context_tokens');
    expect(migration).toContain('token_hash text not null unique');
    expect(migration).not.toContain('token_plain');
    expect(migration).toContain('create table if not exists public.kia_telegram_updates');
  });

  it('finds related EXPERT knowledge without inventing URLs', () => {
    const rows = searchKiaKnowledgeResources({
      query: 'nacionalidad menor nacido España residencia',
      type: 'all',
      limit: 5,
    });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.some((row) => String(row.url).startsWith('/docs/') || String(row.url).startsWith('/blog/'))).toBe(true);
    expect(rows.some((row) => String(row.title).toLowerCase().includes('nacionalidad'))).toBe(true);
  });

  it('finds relevant services only from the canonical catalog', () => {
    const rows = findKiaRelevantServices({
      query: 'quiero solicitar nacionalidad para mi hijo nacido en España',
      limit: 2,
    });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.some((row) => row.slug === 'nacionalidad-espanola-menor-nacido-en-espana')).toBe(true);
    expect(rows.every((row) => row.url.startsWith('/servicios/'))).toBe(true);
  });

  it('keeps knowledge/source/service discovery autonomous and read-only', () => {
    for (const name of ['search_knowledge_resources','get_official_sources','find_relevant_services']) {
      const policy = getKiaToolPolicy(name);
      expect(policy?.effect).toBe('read');
      expect(policy?.requiresHumanApproval).toBe(false);
      expect(['R0','R1']).toContain(policy?.riskTier);
    }
  });

  it('documents the no-spam service recommendation policy', () => {
    const prompt = source('lib/ai/kia/kia-system-prompt.ts');
    expect(prompt).toContain('primero resuelve la consulta');
    expect(prompt).toContain('Nunca inventes una URL oficial');
    expect(prompt).toContain('Normalmente ofrece 1 servicio y como máximo 2');
  });

  it('registers payment subscription and case operational tools as autonomous reads', () => {
    for (const name of [
      'get_user_orders',
      'get_user_subscriptions',
      'get_case_tasks',
      'get_case_documents',
      'get_case_timeline',
    ]) {
      const policy = getKiaToolPolicy(name);
      expect(policy?.effect).toBe('read');
      expect(policy?.requiresHumanApproval).toBe(false);
      expect(['R0','R1']).toContain(policy?.riskTier);
    }
  });

  it('requires case ownership in operational read tools', () => {
    const executor = source('lib/ai/kia/kia-tool-executor.ts');
    expect(executor).toContain(".eq('id', caseId).eq('client_id', clientId)");
    expect(executor).toContain("'Expediente no autorizado.'");
    expect(executor).toContain(".eq('profile_id', clientId)");
  });

});
