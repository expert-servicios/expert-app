import { describe, expect, it } from 'vitest';
import { KIA_DECISION_JSON_SCHEMA } from '@/lib/ai/kia/kia-output-schema';
import {
  isStrictOpenAiSchema,
  useStrictOpenAiTool,
  openAiChatResponseFormat,
  openAiResponsesTextFormat,
} from '@/lib/ai/kia/kia-openai-schema-compat';
import { buildOpenAiResponsesBody } from '@/lib/ai/kia/runtime/openai-responses-adapter';

const closed = (properties: Record<string, unknown>) => ({
  type: 'object', properties, required: Object.keys(properties), additionalProperties: false,
});

describe('KIA OpenAI wire-level schema compatibility', () => {
  it('retains strict mode for a fully required and closed tool schema', () => {
    const schema = closed({ number: { type: 'integer' } });
    expect(isStrictOpenAiSchema(schema)).toBe(true);
    expect(useStrictOpenAiTool({ strict: true, input_schema: schema })).toBe(true);
    expect(openAiChatResponseFormat(schema)?.type).toBe('json_schema');
  });

  it('does not use strict mode for optional phone as in resolve_contact_context', () => {
    const schema = {
      type: 'object', properties: { phone: { type: 'string' } }, required: [],
      additionalProperties: false,
    };
    expect(isStrictOpenAiSchema(schema)).toBe(false);
    expect(useStrictOpenAiTool({ strict: true, input_schema: schema })).toBe(false);
  });

  it('uses JSON object mode for current KIA decision schema with const and free-form fields', () => {
    expect(isStrictOpenAiSchema(KIA_DECISION_JSON_SCHEMA)).toBe(false);
    expect(openAiChatResponseFormat(KIA_DECISION_JSON_SCHEMA)).toEqual({ type: 'json_object' });
    expect(openAiResponsesTextFormat(KIA_DECISION_JSON_SCHEMA)).toEqual({ type: 'json_object' });
  });

  it('fails closed for open-ended or unsupported nested schemas', () => {
    expect(isStrictOpenAiSchema(closed({ args: { type: 'object' } }))).toBe(false);
    expect(isStrictOpenAiSchema({ $ref: '#/$defs/X' })).toBe(false);
    expect(isStrictOpenAiSchema(null)).toBe(false);
  });

  it('does not override tools explicitly marked non-strict', () => {
    expect(useStrictOpenAiTool({ strict: false, input_schema: closed({}) })).toBe(false);
  });

  it('omits a response format when no schema was requested', () => {
    expect(openAiChatResponseFormat(null)).toBeUndefined();
    expect(openAiResponsesTextFormat(undefined)).toBeUndefined();
  });

  it('emits a valid Responses API JSON mode payload and non-strict optional tool', () => {
    const body = buildOpenAiResponsesBody({
      taskType: 'chat_reply',
      systemPrompt: 'Contesta en español.',
      messages: [{ role: 'user', content: 'Buenos días' }],
      responseSchema: KIA_DECISION_JSON_SCHEMA,
      tools: [{
        name: 'resolve_contact_context',
        description: 'Lookup',
        input_schema: {
          type: 'object', additionalProperties: false,
          properties: { phone: { type: 'string' } }, required: [],
        },
        strict: true,
      }],
    }, 'gpt-4.1-mini');
    expect(body.text).toEqual({ format: { type: 'json_object' } });
    expect(body.tools).toEqual([expect.objectContaining({ strict: false })]);
    expect(body.instructions).toContain('objeto JSON válido');
  });

  it('keeps the Responses API strict for fully closed schemas', () => {
    const body = buildOpenAiResponsesBody({
      taskType: 'chat_reply', systemPrompt: 'Return JSON',
      messages: [], responseSchema: closed({ value: { type: 'number' } }),
    }, 'gpt-4.1-mini');
    expect(body.text).toEqual({
      format: { type: 'json_schema', name: 'kia_decision', strict: true, schema: closed({ value: { type: 'number' } }) },
    });
  });
});
