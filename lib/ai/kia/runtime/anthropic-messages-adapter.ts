import { extractJsonObject } from '../kia-output-schema';
import type { KiaProviderRequest, KiaProviderResult } from '../kia-provider-router';
import type { KiaToolCall, KiaToolDefinition } from '../kia-tool-definitions';
import { safeErrorMessage } from '../kia-redaction';

const ANTHROPIC_MESSAGES_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const DEFAULT_ANTHROPIC_MESSAGES_MODEL = 'claude-sonnet-5';
const STRUCTURED_OUTPUT_TOOL = 'emit_kia_decision';

interface AnthropicTextBlock {
  type?: 'text';
  text?: string;
}

interface AnthropicToolUseBlock {
  type?: 'tool_use';
  id?: string;
  name?: string;
  input?: unknown;
}

type AnthropicContentBlock = AnthropicTextBlock | AnthropicToolUseBlock | Record<string, unknown>;

export interface AnthropicMessagesData {
  id?: string;
  type?: string;
  role?: string;
  model?: string;
  content?: AnthropicContentBlock[];
  stop_reason?: string | null;
  usage?: unknown;
  error?: { message?: string } | null;
}

export interface AnthropicMessagesOptions {
  apiKey?: string;
  model?: string;
  fetchImpl?: typeof fetch;
}

export function buildAnthropicMessagesBody(
  request: KiaProviderRequest,
  model = process.env.ANTHROPIC_MESSAGES_MODEL?.trim() || DEFAULT_ANTHROPIC_MESSAGES_MODEL,
): Record<string, unknown> {
  const tools = buildTools(request.tools ?? [], request.responseSchema);
  const body: Record<string, unknown> = {
    model,
    max_tokens: request.maxTokens ?? 900,
    system: buildSystemPrompt(request),
    messages: request.messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  };

  // Sonnet 5 rejects non-default sampling parameters. KIA's provider-neutral
  // temperature is intentionally ignored here; model behaviour is controlled
  // through instructions and Anthropic's current adaptive-thinking defaults.

  if (tools.length > 0) {
    body.tools = tools;
    if (request.responseSchema && !(request.tools?.length)) {
      body.tool_choice = { type: 'tool', name: STRUCTURED_OUTPUT_TOOL };
      body.disable_parallel_tool_use = true;
    }
  }

  return body;
}

export function parseAnthropicMessagesResult(
  data: AnthropicMessagesData,
  requestedModel: string,
): KiaProviderResult {
  const toolCalls: KiaToolCall[] = [];
  const textParts: string[] = [];
  let parsedJson: unknown;

  for (const block of Array.isArray(data.content) ? data.content : []) {
    if (block?.type === 'text' && typeof block.text === 'string') {
      textParts.push(block.text);
      continue;
    }

    if (block?.type === 'tool_use' && typeof block.name === 'string') {
      const args = asRecord(block.input);
      if (block.name === STRUCTURED_OUTPUT_TOOL) {
        parsedJson = args;
        continue;
      }
      toolCalls.push({
        id: typeof block.id === 'string' ? block.id : undefined,
        name: block.name,
        arguments: args,
      });
    }
  }

  const rawText = textParts.join('\n').trim();
  if (parsedJson == null && rawText) {
    try {
      parsedJson = extractJsonObject(rawText);
    } catch {
      parsedJson = undefined;
    }
  }

  return {
    provider: 'anthropic',
    model: data.model ?? requestedModel,
    rawText,
    parsedJson,
    toolCalls,
    usage: data.usage,
    ...(data.error?.message ? { error: data.error.message } : {}),
  };
}

export async function runAnthropicMessagesRequest(
  request: KiaProviderRequest,
  options: AnthropicMessagesOptions = {},
): Promise<KiaProviderResult> {
  const apiKey = options.apiKey?.trim() || process.env.ANTHROPIC_API_KEY?.trim();
  const model = options.model?.trim()
    || process.env.ANTHROPIC_MESSAGES_MODEL?.trim()
    || DEFAULT_ANTHROPIC_MESSAGES_MODEL;

  if (!apiKey) {
    return {
      provider: 'anthropic',
      model,
      error: 'ANTHROPIC_API_KEY is not configured',
    };
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  try {
    const response = await fetchImpl(ANTHROPIC_MESSAGES_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'content-type': 'application/json',
      },
      body: JSON.stringify(buildAnthropicMessagesBody(request, model)),
    });

    const data = await response.json() as AnthropicMessagesData;
    if (!response.ok) {
      throw new Error(data.error?.message || `HTTP ${response.status}`);
    }
    return parseAnthropicMessagesResult(data, model);
  } catch (error) {
    return {
      provider: 'anthropic',
      model,
      error: safeErrorMessage(error),
    };
  }
}

function buildTools(tools: KiaToolDefinition[], responseSchema: unknown): Array<Record<string, unknown>> {
  const result = tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.input_schema,
  }));

  if (responseSchema && isRecord(responseSchema)) {
    result.push({
      name: STRUCTURED_OUTPUT_TOOL,
      description: 'Return the final KIA decision as structured JSON. This is an output contract, not an executable action.',
      input_schema: responseSchema,
    });
  }
  return result;
}

function buildSystemPrompt(request: KiaProviderRequest): string {
  if (!request.responseSchema) return request.systemPrompt;
  return [
    request.systemPrompt,
    `When you have enough information for a final answer, use ${STRUCTURED_OUTPUT_TOOL} to emit the final structured KIA decision.`,
    `Never describe ${STRUCTURED_OUTPUT_TOOL} to the user and never treat it as an external action.`,
  ].join('\n\n');
}

function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
