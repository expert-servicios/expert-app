import { afterEach, describe, expect, it } from 'vitest';
import {
  buildOpenAiResponsesBody,
  parseOpenAiResponsesResult,
  runOpenAiResponsesRequest,
} from '@/lib/ai/kia/runtime/openai-responses-adapter';
import { isKiaResponsesShadowEnabled, runKiaResponsesShadow } from '@/lib/ai/kia/runtime/kia-shadow-eval';
import type { KiaProviderRequest } from '@/lib/ai/kia/kia-provider-router';

const baseRequest: KiaProviderRequest = {
  taskType: 'admin_ai_compose',
  systemPrompt: 'Eres KIA.',
  messages: [{ role: 'user', content: 'Resume este expediente.' }],
  responseSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['summary'],
    properties: { summary: { type: 'string' } },
  },
  tools: [{
    name: 'get_case_status',
    description: 'Consulta estado del expediente',
    strict: true,
    input_schema: {
      type: 'object',
      additionalProperties: false,
      required: ['caseId'],
      properties: { caseId: { type: 'string' } },
    },
  }],
  effort: 'high',
  maxTokens: 500,
};

afterEach(() => {
  delete process.env.KIA_OPENAI_RESPONSES_SHADOW_ENABLED;
});

describe('OpenAI Responses adapter', () => {
  it('builds a privacy-minimized structured Responses payload', () => {
    const body = buildOpenAiResponsesBody(baseRequest, 'gpt-test');

    expect(body).toMatchObject({
      model: 'gpt-test',
      instructions: 'Eres KIA.',
      max_output_tokens: 500,
      store: false,
      reasoning: { effort: 'high' },
      parallel_tool_calls: true,
    });
    expect(body.input).toEqual([{ role: 'user', content: 'Resume este expediente.' }]);
    expect(body.text).toEqual({
      format: expect.objectContaining({ type: 'json_schema', name: 'kia_decision', strict: true }),
    });
    expect(body.tools).toEqual([
      expect.objectContaining({ type: 'function', name: 'get_case_status', strict: true }),
    ]);
  });

  it('normalizes message text and function calls from Responses output', () => {
    const result = parseOpenAiResponsesResult({
      model: 'gpt-test',
      output: [
        {
          type: 'message',
          content: [{ type: 'output_text', text: '{"summary":"ok"}' }],
        },
        {
          type: 'function_call',
          call_id: 'call_1',
          name: 'get_case_status',
          arguments: '{"caseId":"abc"}',
        },
      ],
      usage: { input_tokens: 10, output_tokens: 5 },
    }, 'gpt-test');

    expect(result.provider).toBe('openai');
    expect(result.model).toBe('gpt-test');
    expect(result.parsedJson).toEqual({ summary: 'ok' });
    expect(result.toolCalls).toEqual([
      { id: 'call_1', name: 'get_case_status', arguments: { caseId: 'abc' } },
    ]);
  });

  it('fails closed without an API key and does not make a request', async () => {
    const result = await runOpenAiResponsesRequest(baseRequest, {
      apiKey: '',
      model: 'gpt-test',
      fetchImpl: (() => { throw new Error('must not be called'); }) as typeof fetch,
    });

    expect(result.error).toContain('OPENAI_API_KEY');
  });
});

describe('Responses shadow mode', () => {
  it('is disabled unless explicitly enabled', async () => {
    expect(isKiaResponsesShadowEnabled()).toBe(false);
    const result = await runKiaResponsesShadow(baseRequest);
    expect(result.enabled).toBe(false);
    expect(result.inputHash).toHaveLength(64);
  });

  it('requires exact true flag', () => {
    process.env.KIA_OPENAI_RESPONSES_SHADOW_ENABLED = 'TRUE';
    expect(isKiaResponsesShadowEnabled()).toBe(true);
  });
});
