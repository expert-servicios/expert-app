import { describe, expect, it, vi } from 'vitest';
import {
  buildAnthropicMessagesBody,
  parseAnthropicMessagesResult,
  runAnthropicMessagesRequest,
} from '@/lib/ai/kia/runtime/anthropic-messages-adapter';
import type { KiaProviderRequest } from '@/lib/ai/kia/kia-provider-router';

const schema = {
  type: 'object',
  properties: {
    version: { type: 'string' },
    userMessage: { type: 'string' },
  },
  required: ['version', 'userMessage'],
  additionalProperties: false,
};

const request: KiaProviderRequest = {
  taskType: 'next_best_action',
  systemPrompt: 'You are KIA.',
  messages: [{ role: 'user', content: 'What should I do next?' }],
  responseSchema: schema,
  maxTokens: 500,
  temperature: 0.2,
};

describe('Anthropic Messages runtime adapter', () => {
  it('forces the synthetic structured-output tool when there are no operational tools', () => {
    const body = buildAnthropicMessagesBody(request, 'claude-sonnet-5');
    expect(body.model).toBe('claude-sonnet-5');
    expect(body.tool_choice).toEqual({ type: 'tool', name: 'emit_kia_decision' });
    expect(body.disable_parallel_tool_use).toBe(true);
    expect(body.tools).toEqual([
      expect.objectContaining({ name: 'emit_kia_decision', input_schema: schema }),
    ]);
  });

  it('keeps operational tools available and does not force the output tool', () => {
    const body = buildAnthropicMessagesBody({
      ...request,
      tools: [{
        name: 'get_user_expedientes',
        description: 'Read own cases',
        input_schema: { type: 'object', properties: {}, additionalProperties: false },
        strict: true,
      }],
    }, 'claude-sonnet-5');

    expect(body.tool_choice).toBeUndefined();
    expect(body.tools).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'get_user_expedientes' }),
      expect.objectContaining({ name: 'emit_kia_decision', input_schema: schema }),
    ]));
  });

  it('parses emit_kia_decision as structured output, never as an executable tool call', () => {
    const result = parseAnthropicMessagesResult({
      model: 'claude-sonnet-5',
      content: [
        {
          type: 'tool_use',
          id: 'toolu_output',
          name: 'emit_kia_decision',
          input: { version: '1.0', userMessage: 'Revisa tus expedientes.' },
        },
      ],
      usage: { input_tokens: 100, output_tokens: 20 },
    }, 'claude-sonnet-5');

    expect(result.parsedJson).toEqual({ version: '1.0', userMessage: 'Revisa tus expedientes.' });
    expect(result.toolCalls).toEqual([]);
    expect(result.usage).toEqual({ input_tokens: 100, output_tokens: 20 });
  });

  it('preserves real Anthropic tool_use blocks as provider-neutral tool calls', () => {
    const result = parseAnthropicMessagesResult({
      content: [{
        type: 'tool_use',
        id: 'toolu_1',
        name: 'get_user_expedientes',
        input: { companyId: 'company-1' },
      }],
    }, 'claude-sonnet-5');

    expect(result.toolCalls).toEqual([{
      id: 'toolu_1',
      name: 'get_user_expedientes',
      arguments: { companyId: 'company-1' },
    }]);
  });

  it('fails closed without an API key', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    const result = await runAnthropicMessagesRequest(request, { apiKey: '' });
    expect(result.provider).toBe('anthropic');
    expect(result.error).toContain('ANTHROPIC_API_KEY');
    vi.unstubAllEnvs();
  });

  it('uses the native Messages endpoint and current Anthropic headers', async () => {
    const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      expect(init?.headers).toEqual(expect.objectContaining({
        'x-api-key': 'test-key',
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      }));
      return new Response(JSON.stringify({
        model: 'claude-sonnet-5',
        content: [{
          type: 'tool_use',
          name: 'emit_kia_decision',
          input: { version: '1.0', userMessage: 'OK' },
        }],
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    });
    const fetchImpl = fetchMock as unknown as typeof fetch;

    const result = await runAnthropicMessagesRequest(request, {
      apiKey: 'test-key',
      model: 'claude-sonnet-5',
      fetchImpl,
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe('https://api.anthropic.com/v1/messages');
    expect(result.parsedJson).toEqual({ version: '1.0', userMessage: 'OK' });
  });
});
