import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  resolve(process.cwd(), 'lib/integrations/official-sources.ts'),
  'utf8',
);

const envExample = readFileSync(
  resolve(process.cwd(), '.env.example'),
  'utf8',
);

describe('KIA Gemini Google Search grounding', () => {
  it('prefers Gemini Google Search before OpenAI web search', () => {
    const gemini = source.indexOf('searchOfficialSourcesWithGemini(query, geminiKey)');
    const openai = source.indexOf('searchOfficialSourcesWithOpenAi(query, openAiKey)');
    expect(gemini).toBeGreaterThan(-1);
    expect(openai).toBeGreaterThan(gemini);
  });

  it('uses the native Gemini Interactions google_search tool', () => {
    expect(source).toContain('https://generativelanguage.googleapis.com/v1beta/interactions');
    expect(source).toContain("tools: [{ type: 'google_search' }]");
    expect(source).toContain("'x-goog-api-key': apiKey");
  });

  it('accepts only fully official citation sets and falls back otherwise', () => {
    expect(source).toContain('officialSources.length === 0 || officialSources.length !== citations.length');
    expect(source).toContain('isAllowedOfficialUrl(source.url)');
    expect(source).toContain('const fallback = getFallbackSources(query)');
  });

  it('documents independent Gemini Search rollout controls', () => {
    expect(envExample).toContain('OFFICIAL_GOOGLE_SEARCH_ENABLED=true');
    expect(envExample).toContain('OFFICIAL_GOOGLE_SEARCH_MODEL=gemini-3.8-flash');
    expect(envExample).toContain('OFFICIAL_SEARCH_TIMEOUT_MS=12000');
  });
});
