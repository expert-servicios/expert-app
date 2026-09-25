import type { WabaAiMessage } from "@/lib/integrations/waba-ai";
import { getConfiguredWabaAiProviders } from "@/lib/integrations/waba-ai";
import type { KiaTaskType } from "./kia-output-schema";
import type { KiaToolCall, KiaToolDefinition } from "./kia-tool-definitions";
import { extractJsonObject } from "./kia-output-schema";
import { redactJson, safeErrorMessage } from "./kia-redaction";

export type KiaAiProvider = "anthropic" | "openai" | "google";
export type KiaEffort = "low" | "medium" | "high" | "xhigh";

export interface KiaProviderRequest {
  taskType: KiaTaskType;
  systemPrompt: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  responseSchema?: unknown;
  tools?: KiaToolDefinition[];
  effort?: KiaEffort;
  maxTokens?: number;
  temperature?: number;
  modelOverride?: string;
}

const SONNET = "claude-sonnet-4-6";
const HAIKU = "claude-haiku-4-5-20251001";
const AI_GATEWAY_CHAT_URL = "https://ai-gateway.vercel.sh/v1/chat/completions";
const GEMINI_OPENAI_COMPAT_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const GATEWAY_DEFAULT_MODEL = "openai/gpt-5.4";
const GATEWAY_REASONING_MODEL = "openai/gpt-5.6-sol";
const GEMINI_CHAT_MODEL = "google/gemini-3.6-flash";
const GEMINI_DIRECT_DEFAULT_MODEL = "gemini-3.8-flash";
const GEMINI_REASONING_MODEL = "google/gemini-3.1-pro-preview";
const GATEWAY_ANTHROPIC_FALLBACK_MODEL = "anthropic/claude-sonnet-5";

const SONNET_TASKS: KiaTaskType[] = [
  "viability_reasoning",
  "readiness_reasoning",
  "checkout_decision",
  "company_status_summary",
  "next_best_action",
  "lead_client_decision",
  "accounting_anomaly_review",
  "admin_ai_compose",
  "document_classification",
  "document_extraction",
  "review_moderation",
  "regulatory_review",
];

export function modelForTask(
  taskType: KiaTaskType,
  allowTools?: boolean,
): string {
  if (SONNET_TASKS.includes(taskType)) return SONNET;
  if (taskType === "waba_reply" && allowTools) return SONNET;
  return HAIKU;
}

export function gatewayModelForTask(taskType: KiaTaskType): string {
  if (taskType === "chat_reply" || taskType === "waba_reply") return GEMINI_CHAT_MODEL;
  return SONNET_TASKS.includes(taskType) ? GATEWAY_REASONING_MODEL : GATEWAY_DEFAULT_MODEL;
}

export function gatewayFallbackModelsForTask(taskType: KiaTaskType): string[] {
  if (taskType === "chat_reply" || taskType === "waba_reply") {
    return [GATEWAY_DEFAULT_MODEL, GATEWAY_ANTHROPIC_FALLBACK_MODEL];
  }
  if (SONNET_TASKS.includes(taskType)) {
    return [GEMINI_REASONING_MODEL, GATEWAY_ANTHROPIC_FALLBACK_MODEL];
  }
  return [GEMINI_CHAT_MODEL, GATEWAY_ANTHROPIC_FALLBACK_MODEL];
}

function gatewayProviderFromModel(model: string): KiaAiProvider {
  if (model.startsWith("google/")) return "google";
  if (model.startsWith("anthropic/")) return "anthropic";
  return "openai";
}

function getKiaGatewayToken(): string | null {
  return process.env.VERCEL_OIDC_TOKEN?.trim()
    || process.env.AI_GATEWAY_API_KEY?.trim()
    || null;
}

export function isKiaGatewayConfigured(): boolean {
  return Boolean(getKiaGatewayToken());
}

export interface KiaProviderResult {
  provider: KiaAiProvider;
  model: string;
  rawText?: string;
  parsedJson?: unknown;
  toolCalls?: KiaToolCall[];
  usage?: unknown;
  error?: string;
}

interface ProviderConfig {
  provider: KiaAiProvider;
  apiKey: string;
  model: string;
}

interface AnthropicContentPart {
  type?: string;
  text?: string;
  id?: string;
  name?: string;
  input?: unknown;
}

interface AnthropicResponseData {
  content?: AnthropicContentPart[];
  usage?: unknown;
  error?: unknown;
}

type KiaProviderRouteKey = "gateway" | KiaAiProvider;
const providerCooldownUntil = new Map<KiaProviderRouteKey, number>();

function providerCooldownMs(error: string): number {
  if (/HTTP\s+(401|403)\b/i.test(error)) return 5 * 60_000;
  if (/HTTP\s+429\b/i.test(error)) return 60_000;
  if (/HTTP\s+5\d\d\b|timeout|timed out|ECONNRESET|fetch failed/i.test(error)) return 30_000;
  return 0;
}

function providerCoolingDown(provider: KiaProviderRouteKey): boolean {
  const until = providerCooldownUntil.get(provider) ?? 0;
  if (until <= Date.now()) {
    providerCooldownUntil.delete(provider);
    return false;
  }
  return true;
}

function markProviderFailure(provider: KiaProviderRouteKey, error: string): void {
  const cooldownMs = providerCooldownMs(error);
  if (cooldownMs > 0) providerCooldownUntil.set(provider, Date.now() + cooldownMs);
}

function clearProviderFailure(provider: KiaProviderRouteKey): void {
  providerCooldownUntil.delete(provider);
}

export function getKiaProviderOrder(): ProviderConfig[] {
  const providers: ProviderConfig[] = getConfiguredWabaAiProviders().map((provider) => ({
    provider: provider.provider,
    apiKey: provider.apiKey,
    model: provider.model,
  }));

  const geminiKey = process.env.GEMINI_API_KEY?.trim()
    || process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
  if (geminiKey) {
    providers.push({
      provider: "google",
      apiKey: geminiKey,
      model: process.env.GEMINI_MODEL?.trim() || GEMINI_DIRECT_DEFAULT_MODEL,
    });
  }

  const requestedOrder = (process.env.KIA_DIRECT_PROVIDER_ORDER || "google,anthropic,openai")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter((value): value is KiaAiProvider =>
      value === "google" || value === "anthropic" || value === "openai",
    );
  const priority = new Map(requestedOrder.map((provider, index) => [provider, index]));

  return providers.sort((a, b) =>
    (priority.get(a.provider) ?? 99) - (priority.get(b.provider) ?? 99),
  );
}

export function defaultEffortForTask(taskType: KiaTaskType): KiaEffort {
  if (taskType === "waba_reply") return "low";
  if (taskType === "admin_ai_compose") return "medium";
  if (
    [
      "document_classification",
      "document_extraction",
      "viability_reasoning",
      "readiness_reasoning",
      "next_best_action",
      "checkout_decision",
      "review_moderation",
      "regulatory_review",
    ].includes(taskType)
  )
    return "high";
  return "xhigh";
}

export async function runKiaProviderRequest(
  request: KiaProviderRequest,
): Promise<KiaProviderResult> {
  const gatewayToken = getKiaGatewayToken();
  let lastError = "";
  let lastFailedProvider: ProviderConfig | null = null;

  if (gatewayToken && !providerCoolingDown("gateway")) {
    try {
      const result = await callGateway(gatewayToken, request);
      clearProviderFailure("gateway");
      return result;
    } catch (error) {
      lastError = safeErrorMessage(error);
      markProviderFailure("gateway", lastError);
      console.error(
        "[Kia provider router] provider failed",
        redactJson({
          provider: "vercel-ai-gateway",
          model: gatewayModelForTask(request.taskType),
          taskType: request.taskType,
          error: lastError,
        }),
      );
    }
  }

  const providers = getKiaProviderOrder();
  if (providers.length === 0) {
    return {
      provider: "openai",
      model: gatewayToken ? gatewayModelForTask(request.taskType) : "none",
      error: lastError || "No AI provider configured",
    };
  }
  for (const provider of providers) {
    if (providerCoolingDown(provider.provider)) continue;
    try {
      const result =
        provider.provider === "anthropic"
          ? await callAnthropic(provider, request)
          : provider.provider === "google"
            ? await callGoogle(provider, request)
            : await callOpenAi(provider, request);
      clearProviderFailure(provider.provider);
      return result;
    } catch (error) {
      lastError = safeErrorMessage(error);
      lastFailedProvider = provider;
      markProviderFailure(provider.provider, lastError);
      console.error(
        "[Kia provider router] provider failed",
        redactJson({
          provider: provider.provider,
          model: provider.model,
          taskType: request.taskType,
          error: lastError,
        }),
      );
    }
  }

  const failedProvider = lastFailedProvider ?? providers[providers.length - 1] ?? providers[0];
  return {
    provider: failedProvider.provider,
    model: failedProvider.model,
    error: lastError || "All providers failed",
  };
}

function parseMaybeJson(text: string): unknown | undefined {
  if (!text.trim()) return undefined;
  try {
    return extractJsonObject(text);
  } catch {
    return undefined;
  }
}

async function callAnthropic(
  provider: ProviderConfig,
  request: KiaProviderRequest,
): Promise<KiaProviderResult> {
  let { response, data } = await postAnthropic(
    provider,
    buildAnthropicBody(request, true),
    request.modelOverride,
  );

  if (!response.ok) {
    const error = extractApiError(data, response.status);
    if (
      request.tools?.some((tool) => tool.strict === true) &&
      /strict|tool/i.test(error)
    ) {
      console.warn(
        "[Kia provider router] Anthropic strict tools unsupported; retrying compatible schema",
        redactJson({
          provider: provider.provider,
          model: request.modelOverride ?? provider.model,
          taskType: request.taskType,
          error,
        }),
      );
      ({ response, data } = await postAnthropic(
        provider,
        buildAnthropicBody(request, false),
        request.modelOverride,
      ));
    }
  }

  if (!response.ok) throw new Error(extractApiError(data, response.status));

  const toolCalls: KiaToolCall[] = [];
  const textParts: string[] = [];
  for (const part of Array.isArray(data?.content) ? data.content : []) {
    if (part?.type === "text" && typeof part.text === "string")
      textParts.push(part.text);
    if (part?.type === "tool_use" && typeof part.name === "string") {
      toolCalls.push({
        id: part.id,
        name: part.name,
        arguments: (part.input ?? {}) as Record<string, unknown>,
      });
    }
  }

  const rawText = textParts.join("\n").trim();
  return {
    provider: "anthropic",
    model: request.modelOverride ?? provider.model,
    rawText,
    parsedJson: parseMaybeJson(rawText),
    toolCalls,
    usage: data?.usage,
  };
}

function buildAnthropicBody(
  request: KiaProviderRequest,
  includeStrict: boolean,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    max_tokens: request.maxTokens ?? 900,
    temperature: request.temperature ?? 0.2,
    system: [
      request.systemPrompt,
      buildAnthropicJsonSchemaInstruction(request.responseSchema),
    ]
      .filter(Boolean)
      .join("\n\n"),
    messages: request.messages,
  };

  if (request.tools?.length) {
    body.tools = request.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.input_schema,
      ...(includeStrict && tool.strict === true ? { strict: true } : {}),
    }));
  }

  return body;
}

function buildAnthropicJsonSchemaInstruction(schema: unknown): string {
  if (!schema) return "";

  const properties =
    typeof schema === 'object' && schema !== null && 'properties' in schema
      ? (schema as { properties?: Record<string, unknown> }).properties
      : undefined;
  const expectsVersion = Boolean(properties?.version);

  return [
    "<strict_json_schema>",
    JSON.stringify(schema),
    "</strict_json_schema>",
    "Devuelve exactamente un objeto JSON que cumpla este schema.",
    "Incluye todos los campos required, aunque sean arrays u objetos vacios.",
    "No uses markdown, bloques ```json, texto antes/despues, ni campos fuera del schema.",
    ...(expectsVersion ? ['version debe ser el string "1.0".'] : []),
  ].join("\n");
}

async function postAnthropic(
  provider: ProviderConfig,
  body: Record<string, unknown>,
  modelOverride?: string,
): Promise<{ response: Response; data: AnthropicResponseData }> {
  body.model = modelOverride ?? provider.model;
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": provider.apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as AnthropicResponseData;
  return { response, data };
}

async function callGateway(
  token: string,
  request: KiaProviderRequest,
): Promise<KiaProviderResult> {
  const messages: Array<{
    role: "system" | WabaAiMessage["role"];
    content: string;
  }> = [{ role: "system", content: request.systemPrompt }, ...request.messages];

  // modelOverride is legacy direct-provider routing unless it is already a
  // fully-qualified AI Gateway model id. This prevents old Claude defaults
  // from forcing Gateway traffic back to Anthropic.
  const override = request.modelOverride?.trim();
  const model = override?.includes("/")
    ? override
    : gatewayModelForTask(request.taskType);

  const body: Record<string, unknown> = {
    model,
    models: gatewayFallbackModelsForTask(request.taskType),
    max_tokens: request.maxTokens ?? 900,
    temperature: request.temperature ?? 0.2,
    messages,
  };

  if (request.responseSchema) {
    body.response_format = {
      type: "json_schema",
      json_schema: {
        name: "kia_decision",
        strict: true,
        schema: request.responseSchema,
      },
    };
  }

  if (request.tools?.length) {
    body.tools = request.tools.map((tool) => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.input_schema,
        strict: tool.strict === true,
      },
    }));
  }

  const response = await fetch(AI_GATEWAY_CHAT_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(extractApiError(data, response.status));

  const message = data?.choices?.[0]?.message;
  const rawText =
    typeof message?.content === "string" ? message.content.trim() : "";
  const toolCalls: KiaToolCall[] = Array.isArray(message?.tool_calls)
    ? message.tool_calls
        .filter(
          (call: { function?: { name?: string } }) =>
            typeof call?.function?.name === "string",
        )
        .map(
          (call: {
            id?: string;
            function: { name: string; arguments?: string };
          }) => ({
            id: call.id,
            name: call.function.name,
            arguments: parseToolArguments(call.function.arguments),
          }),
        )
    : [];

  const parsedJson = parseMaybeJson(rawText);
  if (!rawText && !parsedJson && toolCalls.length === 0) {
    throw new Error("AI Gateway returned an empty response");
  }

  const resolvedModel = typeof data?.model === "string" ? data.model : model;
  return {
    provider: gatewayProviderFromModel(resolvedModel),
    model: resolvedModel,
    rawText,
    parsedJson,
    toolCalls,
    usage: data?.usage,
  };
}

async function callGoogle(
  provider: ProviderConfig,
  request: KiaProviderRequest,
): Promise<KiaProviderResult> {
  return callOpenAiCompatible(provider, request, GEMINI_OPENAI_COMPAT_URL, "google");
}

async function callOpenAi(
  provider: ProviderConfig,
  request: KiaProviderRequest,
): Promise<KiaProviderResult> {
  return callOpenAiCompatible(provider, request, "https://api.openai.com/v1/chat/completions", "openai");
}

async function callOpenAiCompatible(
  provider: ProviderConfig,
  request: KiaProviderRequest,
  endpoint: string,
  providerName: "google" | "openai",
): Promise<KiaProviderResult> {
  const messages: Array<{
    role: "system" | WabaAiMessage["role"];
    content: string;
  }> = [{ role: "system", content: request.systemPrompt }, ...request.messages];

  const body: Record<string, unknown> = {
    model: provider.model,
    max_tokens: request.maxTokens ?? 900,
    temperature: request.temperature ?? 0.2,
    messages,
  };

  if (request.responseSchema) {
    body.response_format = {
      type: "json_schema",
      json_schema: {
        name: "kia_decision",
        strict: true,
        schema: request.responseSchema,
      },
    };
  }

  if (request.tools?.length) {
    body.tools = request.tools.map((tool) => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.input_schema,
        ...(providerName === "openai" && tool.strict === true ? { strict: true } : {}),
      },
    }));
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      authorization: `Bearer ${provider.apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(extractApiError(data, response.status));

  const message = data?.choices?.[0]?.message;
  const rawText =
    typeof message?.content === "string" ? message.content.trim() : "";
  const toolCalls: KiaToolCall[] = Array.isArray(message?.tool_calls)
    ? message.tool_calls
        .filter(
          (call: { function?: { name?: string } }) =>
            typeof call?.function?.name === "string",
        )
        .map(
          (call: {
            id?: string;
            function: { name: string; arguments?: string };
          }) => ({
            id: call.id,
            name: call.function.name,
            arguments: parseToolArguments(call.function.arguments),
          }),
        )
    : [];

  if (!rawText && toolCalls.length === 0) {
    throw new Error(`${providerName} returned an empty response`);
  }

  return {
    provider: providerName,
    model: typeof data?.model === "string" ? data.model : provider.model,
    rawText,
    parsedJson: parseMaybeJson(rawText),
    toolCalls,
    usage: data?.usage,
  };
}

function parseToolArguments(
  value: string | undefined,
): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function extractApiError(data: unknown, status: number): string {
  if (typeof data === "object" && data && "error" in data) {
    const error = (data as { error?: { message?: string } }).error;
    if (typeof error?.message === "string")
      return `HTTP ${status}: ${error.message}`;
  }
  return `HTTP ${status}`;
}

/**
 * Streams plain-text response from Anthropic (no structured JSON).
 * Yields text chunks as they arrive; used by the copilot SSE endpoint.
 */
export async function* streamAnthropicText(
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  opts: { maxTokens?: number; temperature?: number } = {},
): AsyncGenerator<string> {
  const providers = getKiaProviderOrder();
  const anthropic = providers.find((p) => p.provider === "anthropic");
  if (!anthropic?.apiKey) return;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": anthropic.apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: anthropic.model ?? SONNET,
      max_tokens: opts.maxTokens ?? 600,
      temperature: opts.temperature ?? 0.3,
      stream: true,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok || !response.body) return;

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  type StreamEvent = { type?: string; delta?: { type?: string; text?: string } };

  try {
    outer: while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (!raw) continue;
        let ev: StreamEvent;
        try { ev = JSON.parse(raw) as StreamEvent; } catch { continue; }
        if (ev.type === "message_stop") break outer;
        if (
          ev.type === "content_block_delta" &&
          ev.delta?.type === "text_delta" &&
          ev.delta.text
        ) {
          yield ev.delta.text;
        }
      }
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
}
