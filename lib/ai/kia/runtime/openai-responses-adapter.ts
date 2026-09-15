import { extractJsonObject } from '../kia-output-schema';
import type { KiaProviderRequest, KiaProviderResult } from '../kia-provider-router';
import type { KiaToolCall } from '../kia-tool-definitions';
import { safeErrorMessage } from '../kia-redaction';

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const DEFAULT_OPENAI_RESPONSES_MODEL = 'gpt-5.6-terra';

interface OpenAiResponsesOutputText {
  type?: string;
  text?: string;
}

interface OpenAiResponsesOutputItem {
  type?: string;
  call_id?: string;
  name?: string;
  arguments?: string;
  content?: OpenAiResponsesOutputText[];
}

export interface OpenAiResponsesData {
  id?: string;
  status?: string;
  model?: string;
  output_text?: string;
  output?: OpenAiResponsesOutputItem[];
  usage?: unknown;
  error?: { message?: string } | null;
}

export interface OpenAiResponsesOptions {
  apiKey?: string;
  model?: string;
  fetchImpl?: typeof fetch;
}

function normalizeEffort(effort: KiaProviderRequest['effort']): 'low' | 'medium' | 'high' | 'xhigh' | undefined {
  if (!effort) return undefined;
  return effort;
}

export function buildOpenAiResponsesBody(
  request: KiaProviderRequest,
  model = process.env.OPENAI_RESPONSES_MODEL?.trim() || DEFAULT_OPENAI_RESPONSES_MODEL,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model,
    instructions: request.systemPrompt,
    input: request.messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
    max_output_tokens: request.maxTokens ?? 900,
    store: false,
  };

  const effort = normalizeEffort(request.effort);
  if (effort) body.reasoning = { effort };

  if (request.responseSchema) {
    body.text = {
      format: {
        type: 'json_schema',
        name: 'kia_decision',
        strict: true,
        schema: request.responseSchema,
      },
    };
  }

  if (request.tools?.length) {
    body.tools = request.tools.map((tool) => ({
      type: 'function',
      name: tool.name,
      description: tool.description,
      parameters: tool.input_schema,
      strict: tool.strict === true,
    }));
    body.parallel_tool_calls = true;
  }

  return body;
}

export function parseOpenAiResponsesResult(
  data: OpenAiResponsesData,
  requestedModel: string,
): KiaProviderResult {
  const toolCalls: KiaToolCall[] = [];
  const textParts: string[] = [];

  for (const item of Array.isArray(data.output) ? data.output : []) {
    if (item?.type === 'function_call' && typeof item.name === 'string') {
      toolCalls.push({
        id: item.call_id,
        name: item.name,
        arguments: parseToolArguments(item.arguments),
      });
      continue;
    }

    if (item?.type === 'message' && Array.isArray(item.content)) {
      for (const content of item.content) {
        if (content?.type === 'output_text' && typeof content.text === 'string') {
          textParts.push(content.text);
        }
      }
    }
  }

  const rawText = (
    typeof data.output_text === 'string' && data.output_text.trim()
      ? data.output_text
      : textParts.join('\n')
  ).trim();

  let parsedJson: unknown;
  if (rawText) {
    try {
      parsedJson = extractJsonObject(rawText);
    } catch {
      parsedJson = undefined;
    }
  }

  return {
    provider: 'openai',
    model: data.model ?? requestedModel,
    rawText,
    parsedJson,
    toolCalls,
    usage: data.usage,
    ...(data.error?.message ? { error: data.error.message } : {}),
  };
}

export async function runOpenAiResponsesRequest(
  request: KiaProviderRequest,
  options: OpenAiResponsesOptions = {},
): Promise<KiaProviderResult> {
  const apiKey = options.apiKey?.trim() || process.env.OPENAI_API_KEY?.trim();
  const model = options.model?.trim()
    || process.env.OPENAI_RESPONSES_MODEL?.trim()
    || DEFAULT_OPENAI_RESPONSES_MODEL;

  if (!apiKey) {
    return {
      provider: 'openai',
      model,
      error: 'OPENAI_API_KEY is not configured',
    };
  }

  const fetchImpl = options.fetchImpl ?? fetch;

  try {
    const response = await fetchImpl(OPENAI_RESPONSES_URL, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(buildOpenAiResponsesBody(request, model)),
    });

    const data = await response.json() as OpenAiResponsesData;
    if (!response.ok) {
      const message = data.error?.message || `HTTP ${response.status}`;
      throw new Error(message);
    }

    return parseOpenAiResponsesResult(data, model);
  } catch (error) {
    return {
      provider: 'openai',
      model,
      error: safeErrorMessage(error),
    };
  }
}

function parseToolArguments(value: string | undefined): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}
