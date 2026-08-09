import * as vscode from 'vscode';
import { ApiProtocol, ModelKind, PlanConfig, PlanModel, QuotaSnapshot, QuotaWindow } from './types';
import type { PlanStore } from './store';

interface ChatResult {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

const modelDefaults = (id: string): PlanModel => ({
  id,
  name: id,
  maxInputTokens: 120000,
  maxOutputTokens: 8192,
  toolCalling: true,
  vision: true,
});

type ModelPayload = Record<string, unknown> & { id?: string; model?: string; model_name?: string; name?: string; display_name?: string };

const functionUuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function modelIdFromPayload(item: ModelPayload, nvidiaNim: boolean): string {
  const id = String(item.id ?? '').trim();
  if (!nvidiaNim || !functionUuidPattern.test(id)) return id || String(item.name ?? '').trim();
  const publicId = [item.model, item.model_name, item.name, item.display_name]
    .find((value) => typeof value === 'string' && value.trim() && !functionUuidPattern.test(value.trim()));
  return typeof publicId === 'string' ? publicId.trim() : '';
}

type ModelKnowledge = Pick<PlanModel, 'contextLength' | 'supportsTools' | 'supportsVision' | 'supportsWebSearch'> & { features?: string[] };

const modelKnowledge: Array<{ provider: RegExp; model: RegExp; metadata: Partial<ModelKnowledge> }> = [
  { provider: /minimax/i, model: /m3/i, metadata: { contextLength: 1_000_000, supportsTools: true, supportsVision: true, supportsWebSearch: false, features: ['原生多模态', 'Agent'] } },
  { provider: /minimax/i, model: /m2-her/i, metadata: { contextLength: 65_536, supportsTools: false, supportsVision: false, supportsWebSearch: false } },
  { provider: /minimax/i, model: /m2(?:\.7|\.5|\.1)?(?:-|$)/i, metadata: { contextLength: 204_800, supportsTools: true, supportsVision: false, supportsWebSearch: false, features: ['Agent'] } },
  { provider: /openai|openrouter|azure/i, model: /gpt-(?:4o|4\.1|5)|o[134](?:-|$)/i, metadata: { contextLength: 128_000, supportsTools: true, supportsVision: true, supportsWebSearch: false } },
  { provider: /anthropic|openrouter/i, model: /claude-(?:3|sonnet|opus|haiku)/i, metadata: { contextLength: 200_000, supportsTools: true, supportsVision: true, supportsWebSearch: false } },
  { provider: /google|gemini|openrouter/i, model: /gemini-(?:1\.5|2|2\.5|3)/i, metadata: { contextLength: 1_000_000, supportsTools: true, supportsVision: true, supportsWebSearch: false } },
  { provider: /deepseek|openrouter|siliconflow/i, model: /deepseek-(?:chat|reasoner|v3|r1)/i, metadata: { contextLength: 128_000, supportsTools: true, supportsVision: false, supportsWebSearch: false } },
  { provider: /qwen|dashscope|openrouter|siliconflow/i, model: /qwen.*(?:vl|omni)/i, metadata: { contextLength: 131_072, supportsTools: true, supportsVision: true, supportsWebSearch: false } },
  { provider: /qwen|dashscope|openrouter|siliconflow/i, model: /qwen/i, metadata: { contextLength: 131_072, supportsTools: true, supportsVision: false, supportsWebSearch: false } },
  { provider: /moonshot|kimi|openrouter/i, model: /kimi.*vision|moonshot-v1-(?:8k|32k|128k)-vision/i, metadata: { contextLength: 131_072, supportsTools: true, supportsVision: true, supportsWebSearch: false } },
  { provider: /moonshot|kimi|openrouter/i, model: /kimi|moonshot/i, metadata: { contextLength: 131_072, supportsTools: true, supportsVision: false, supportsWebSearch: false } },
  { provider: /zhipu|bigmodel|openrouter/i, model: /glm-4(?:\.5|\.6|\.7)?v/i, metadata: { contextLength: 131_072, supportsTools: true, supportsVision: true, supportsWebSearch: false } },
  { provider: /zhipu|bigmodel|openrouter/i, model: /glm/i, metadata: { contextLength: 131_072, supportsTools: true, supportsVision: false, supportsWebSearch: false } },
  { provider: /mistral|openrouter/i, model: /mistral|mixtral|codestral/i, metadata: { contextLength: 128_000, supportsTools: true, supportsVision: false, supportsWebSearch: false } },
  { provider: /xai|openrouter/i, model: /grok.*vision/i, metadata: { contextLength: 131_072, supportsTools: true, supportsVision: true, supportsWebSearch: false } },
  { provider: /xai|openrouter/i, model: /grok/i, metadata: { contextLength: 131_072, supportsTools: true, supportsVision: false, supportsWebSearch: false } },
];

function knownModel(provider: string, id: string): Partial<ModelKnowledge> {
  return modelKnowledge.find((entry) => entry.provider.test(provider) && entry.model.test(id))?.metadata ?? {};
}

function numberField(item: ModelPayload, names: string[]): number | undefined {
  for (const name of names) {
    const value = item[name];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  }
  return undefined;
}

function featureNames(item: ModelPayload): string[] {
  const values = [item.capabilities, item.supported_features, item.features, item.input_modalities, item.modalities];
  const names = values.flatMap((value) => {
    if (Array.isArray(value)) return value.map(String);
    if (value && typeof value === 'object') return Object.entries(value).filter(([, enabled]) => enabled === true).map(([name]) => name);
    return [];
  });
  return [...new Set(names.map((name) => name.trim()).filter(Boolean))];
}

function booleanCapability(item: ModelPayload, features: string[], fieldNames: string[], pattern: RegExp): boolean | undefined {
  for (const name of fieldNames) if (typeof item[name] === 'boolean') return item[name] as boolean;
  if (features.some((feature) => pattern.test(feature))) return true;
  return undefined;
}

/* 根据模型 ID / 名字 / 上报的能力自动判断用途分类。
   优先级：明确的 modality / output_modalities 字段 > 名称里的关键字 > 默认 chat。 */
function kindForModel(id: string, name: string, features: string[]): ModelKind {
  const text = `${id} ${name} ${features.join(' ')}`.toLowerCase();
  const has = (pattern: RegExp): boolean => pattern.test(text);
  if (has(/\bembed(ding)?s?\b|encoder\b|text-embedding/)) return 'embed';
  if (has(/dall[- ]?e|stable[- ]?diffusion|sd\d|sdxl|flux|midjourney|imagen[- ]?\d|kandinsky|playground[- ]?v|recraft|text[-_]to[-_]image|t2i\b|image[-_]generation|imagegen\b/)) return 'image';
  if (has(/video|t2v\b|i2v\b|text[-_]to[-_]video|image[-_]to[-_]video|runway|sora|veo|kling|hailuo|pika|luma/)) return 'video';
  if (has(/\btts\b|text[-_]to[-_]speech|speech[-_]synth|whisper|transcri|audio|tts-?\d|stt\b/)) return 'audio';
  if (has(/vision[-_]?(only|image)|image[-_]input|image[-_]to[-_]text/)) return 'chat';
  return 'chat';
}

function modelFromPayload(item: ModelPayload, provider: string, nvidiaNim = false): PlanModel {
  const id = modelIdFromPayload(item, nvidiaNim);
  const known = knownModel(provider, String(id));
  const features = featureNames(item);
  const contextLength = numberField(item, ['context_length', 'context_window', 'max_context_length', 'max_input_tokens', 'input_token_limit']) ?? known.contextLength;
  const maxOutputTokens = numberField(item, ['max_output_tokens', 'output_token_limit', 'max_tokens']);
  const supportsTools = booleanCapability(item, features, ['tool_calling', 'supports_tools', 'supports_tool_calling'], /tool|function.?call/i) ?? known.supportsTools;
  const supportsVision = booleanCapability(item, features, ['vision', 'supports_vision', 'image_input'], /vision|image/i) ?? known.supportsVision;
  const supportsWebSearch = booleanCapability(item, features, ['web_search', 'supports_web_search', 'internet_access'], /web.?search|internet|联网/i) ?? known.supportsWebSearch;
  const free = nvidiaNim ? isNvidiaFreeModel(String(id)) : undefined;
  const name = String(item.display_name ?? item.name ?? item.id ?? '');
  const kind = kindForModel(String(id), name, features);
  return {
    ...modelDefaults(String(id)),
    name,
    kind,
    maxInputTokens: contextLength ?? 120000,
    maxOutputTokens: maxOutputTokens ?? 8192,
    toolCalling: supportsTools ?? true,
    vision: supportsVision ?? true,
    contextLength,
    supportsTools,
    supportsVision,
    supportsWebSearch,
    features: [...new Set([...(known.features ?? []), ...features])],
    free,
  };
}

/* NVIDIA NIM 公开的免费档位标识。仅匹配有据可查的免费模型 ID，避免误判。
   /v1/models 响应本身不携带 tier 字段，因此走保守白名单。 */
const nvidiaFreePrefixes = [
  /^meta\/(llama|llama3|llama-?2|llama-?3)/i,
  /^nvidia\/nemotron/i,
  /^mistralai\/(mistral|mixtral)/i,
  /^google\/gemma/i,
  /^microsoft\/phi/i,
  /^ibm\/granite/i,
  /^speakleash/i,
  /^yandex\/yandexgpt/i,
  /^rakuten\/(?:llm-)?7b/i,
  /^bigcode\//i,
  /^stabilityai\//i,
  /^snowflake\/arctic/i,
  /^databricks\/dbrx/i,
];
const nvidiaFreeExact = new Set([
  '01-ai/yi-large',  /* 历史为免费档，最终以控制台为准 */
]);
function isNvidiaFreeModel(id: string): boolean {
  const lowered = id.toLowerCase();
  if (nvidiaFreeExact.has(lowered)) return true;
  return nvidiaFreePrefixes.some((pattern) => pattern.test(id));
}

const knownEndpoints = ['/chat/completions', '/responses', '/messages', '/models'];

export function endpointCandidates(baseUrl: string, suffix: string): string[] {
  const parsed = new URL(baseUrl.trim());
  let path = parsed.pathname.replace(/\/+$/, '');
  for (const endpointPath of knownEndpoints) {
    if (path.endsWith(endpointPath)) {
      path = path.slice(0, -endpointPath.length);
      break;
    }
  }
  const paths = path.endsWith('/v1') ? [`${path}${suffix}`] : [`${path}/v1${suffix}`, `${path}${suffix}`];
  return [...new Set(paths.map((candidate) => {
    const url = new URL(parsed.toString());
    url.pathname = candidate.replace(/\/{2,}/g, '/');
    url.search = '';
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  }))];
}

async function request(url: string, apiKey: string, protocol: ApiProtocol, init?: RequestInit): Promise<Response> {
  const credential = apiKey.trim().replace(/^Bearer\s+/i, '').trim();
  if (!credential) throw new Error('API Key 为空，请在 Plan 中重新填写。');
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (protocol === 'anthropic') {
    headers['x-api-key'] = credential;
    headers['anthropic-version'] = '2023-06-01';
  } else {
    headers.authorization = `Bearer ${credential}`;
  }
  const response = await fetch(url, { ...init, headers: { ...headers, ...init?.headers } });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 600);
    throw new Error(`HTTP ${response.status}: ${detail || response.statusText}`);
  }
  return response;
}

export async function discoverModels(plan: PlanConfig, apiKey: string): Promise<PlanModel[]> {
  const errors: string[] = [];
  const isNvidiaNim = (() => { try { return new URL(plan.baseUrl).host.toLowerCase().includes('integrate.api.nvidia.com'); } catch { return false; } })();
  for (const url of endpointCandidates(plan.baseUrl, '/models')) {
    try {
      const response = await request(url, apiKey, plan.protocol);
      const payload = await response.json() as { data?: ModelPayload[]; models?: ModelPayload[] };
      const items = payload.data ?? payload.models ?? [];
      const provider = `${plan.provider} ${plan.baseUrl}`;
      const models = items
        .map((item) => modelFromPayload(item, provider, isNvidiaNim))
        .filter((model) => model.id);
      if (models.length) return models.sort((a, b) => a.name.localeCompare(b.name));
      errors.push(`${url}: 没有返回模型`);
    } catch (error) {
      errors.push(`${url}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  throw new Error(`无法发现模型。已尝试：\n${errors.join('\n')}`);
}

export interface PlanConnection {
  protocol: ApiProtocol;
  models: PlanModel[];
}

function probeModels(models: PlanModel[]): PlanModel[] {
  /* 仅在找不到任何 chat 模型时退回 image/video/embed；
     embed 与 audio 通常用专有端点，留给调用方各自探针处理，这里仍允许它们出现在列表里。 */
  const unsuitable = /\bmoderation\b|\brerank\b/i;
  const preferred = models.filter((model) => !unsuitable.test(model.id) && (model.kind ?? 'chat') !== 'embed' && (model.kind ?? 'chat') !== 'audio');
  return (preferred.length ? preferred : models).slice(0, 3);
}

async function probeProtocol(plan: PlanConfig, model: PlanModel, apiKey: string): Promise<void> {
  const kind = model.kind ?? 'chat';
  if (kind === 'image') {
    /* OpenAI Images API 兼容端点，prompt 用模型 ID 派生一个短字符串避免触犯内容策略。 */
    await requestFirst(plan, apiKey, '/images/generations', {
      method: 'POST',
      body: JSON.stringify({ model: model.id, prompt: 'ping', size: '256x256', n: 1 }),
    });
    return;
  }
  if (kind === 'video') {
    /* OpenAI `/v1/videos` 兼容端点（部分供应商如 OpenAI Sora、Veo、Kling 等）。
       不同供应商字段差异较大，只发最稳的最小 payload 探测。 */
    await requestFirst(plan, apiKey, '/videos', {
      method: 'POST',
      body: JSON.stringify({ model: model.id, prompt: 'ping', duration_seconds: 1 }),
    });
    return;
  }
  if (kind === 'embed') {
    await requestFirst(plan, apiKey, '/embeddings', {
      method: 'POST',
      body: JSON.stringify({ model: model.id, input: 'ping' }),
    });
    return;
  }
  if (kind === 'audio') {
    await requestFirst(plan, apiKey, '/audio/speech', {
      method: 'POST',
      body: JSON.stringify({ model: model.id, input: 'ping', voice: 'alloy' }),
    });
    return;
  }
  if (plan.protocol === 'responses') {
    await requestFirst(plan, apiKey, '/responses', { method: 'POST', body: JSON.stringify({ model: model.id, input: 'Hi', max_output_tokens: 16, stream: false }) });
    return;
  }
  if (plan.protocol === 'anthropic') {
    await requestFirst(plan, apiKey, '/messages', { method: 'POST', body: JSON.stringify({ model: model.id, max_tokens: 1, messages: [{ role: 'user', content: 'Hi' }], stream: false }) });
    return;
  }
  await requestFirst(plan, apiKey, '/chat/completions', { method: 'POST', body: JSON.stringify({ model: model.id, messages: [{ role: 'user', content: 'Hi' }], max_tokens: 1, stream: false }) });
}

export async function connectPlan(plan: PlanConfig, apiKey: string): Promise<PlanConnection> {
  const models = await discoverModels(plan, apiKey);
  const isNvidiaNim = (() => { try { return new URL(plan.baseUrl).host.toLowerCase().includes('integrate.api.nvidia.com'); } catch { return false; } })();
  const isKiloGateway = (() => { try { return new URL(plan.baseUrl).host.toLowerCase().includes('api.kilo.ai'); } catch { return false; } })();

  /* Providers like NVIDIA NIM and Kilo Gateway expose the entire model catalog
     in /v1/models regardless of whether the account can actually use them. Probe
     every returned model concurrently, drop the ones that return 402/404/403/429,
     and only surface the models that the current account can call. */
  if (isNvidiaNim || isKiloGateway) {
    const concurrency = isKiloGateway ? 1 : 6;
    const verified: PlanModel[] = [];
    let index = 0;
    const workers = Array.from({ length: Math.min(concurrency, models.length) }, async () => {
      while (index < models.length) {
        const model = models[index++];
        try {
          await probeProtocol(plan, model, apiKey);
          verified.push(model);
        } catch (error) {
          /* Treat 402/403/404/429 as "this model is unavailable to my account
             right now". 429 in particular is common on free/shared tiers with
             rpm limits (e.g. cohere/north-mini-code:free 15 req/min) and should
             not surface as a protocol-mismatch error.
             Anything else (network, malformed payload, protocol mismatch)
             bubbles up so the user sees the real problem. */
          const meta = error && typeof error === 'object' ? error as { modelUnavailable?: boolean; rateLimited?: boolean } : undefined;
          if (meta?.modelUnavailable || meta?.rateLimited) continue;
          throw error;
        }
      }
    });
    await Promise.all(workers);
    if (verified.length) {
      verified.sort((a, b) => a.name.localeCompare(b.name));
      return { protocol: plan.protocol, models: verified };
    }
    const providerLabel = isNvidiaNim ? 'NVIDIA NIM' : 'Kilo Gateway';
    const consoleUrl = isNvidiaNim ? 'build.nvidia.com → Models' : 'app.kilo.ai/profile';
    throw new Error(
      `${providerLabel} 账户没有可用的模型。/v1/models 返回了 ${models.length} 个模型，但探测全部失败。\n` +
      `请在 ${consoleUrl} 控制台确认账户至少启用了 / 有一个免费模型，然后再重新连接。`
    );
  }

  const attempts: string[] = [];
  for (const model of probeModels(models)) {
    try {
      await probeProtocol(plan, model, apiKey);
      return { protocol: plan.protocol, models };
    } catch (error) {
      attempts.push(`${model.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  throw new Error(`所选 API 协议连接失败。请确认协议类型和 Base URL 匹配。\n${attempts.join('\n') || '没有可测试的模型。'}`);
}

async function requestFirst(plan: PlanConfig, apiKey: string, suffix: string, init: RequestInit): Promise<Response> {
  const candidates = endpointCandidates(plan.baseUrl, suffix);
  const errors: string[] = [];
  for (const url of candidates) {
    try {
      return await request(url, apiKey, plan.protocol, init);
    } catch (error) {
      errors.push(`${url}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  const lastMessage = errors[errors.length - 1] ?? '';
  const guidance = guidanceFor(plan.baseUrl, suffix);
  const modelMissing = /HTTP 404|: Not found for account|'.*': Not found|model_not_found/i.test(lastMessage);
  const paramRejected = /Unsupported parameter|HTTP 400/i.test(lastMessage);
  const paidRequired = /HTTP 402|Paid Model|Credits Required|insufficient[_ ]credits|usage_limit_exceeded|balance/i.test(lastMessage);
  const rateLimited = /HTTP 429|Rate limit exceeded|Too Many Requests|rate_limit/i.test(lastMessage);
  const reason = lastMessage.replace(/^https?:\/\/\S+:\s*/, '');
  const headline = rateLimited
    ? `共享档位被限速（HTTP 429）`
    : paidRequired
      ? `模型需要付费或账户余额不足`
      : modelMissing
        ? `模型 ID 不存在或未分配给此账户`
        : paramRejected
          ? `供应商拒绝了请求参数`
          : `没有可用的 ${suffix} 端点`;
  const error = new Error(`${headline}：${reason}${guidance ? `\n${guidance}` : ''}`) as Error & { modelUnavailable?: boolean; rateLimited?: boolean };
  error.modelUnavailable = paidRequired || modelMissing;
  error.rateLimited = rateLimited;
  throw error;
}

function guidanceFor(baseUrl: string, suffix: string): string {
  const host = (() => { try { return new URL(baseUrl).host.toLowerCase(); } catch { return ''; } })();
  if (host.includes('integrate.api.nvidia.com')) {
    if (suffix === '/chat/completions') return 'NVIDIA NIM：请在 build.nvidia.com 控制台确认该模型 ID 已在 Models 页面启用且分配给了当前账户；免费 Token 只能转发 /v1/chat/completions，不会改写 model 字段。';
    if (suffix === '/responses') return 'NVIDIA NIM 不提供 OpenAI Responses API，请改用 Chat Completions 协议。';
  }
  return '';
}

function textOf(parts: readonly unknown[]): string {
  return parts.map((part) => part instanceof vscode.LanguageModelTextPart ? part.value : '').join('');
}

function openAiMessages(messages: readonly vscode.LanguageModelChatRequestMessage[]): unknown[] {
  return messages.flatMap((message) => {
    const role = message.role === vscode.LanguageModelChatMessageRole.Assistant ? 'assistant' : 'user';
    const toolCalls = message.content.filter((part) => part instanceof vscode.LanguageModelToolCallPart);
    const toolResults = message.content.filter((part) => part instanceof vscode.LanguageModelToolResultPart);
    const result: unknown[] = [];
    if (toolCalls.length) result.push({ role, content: textOf(message.content), tool_calls: toolCalls.map((part) => ({ id: part.callId, type: 'function', function: { name: part.name, arguments: JSON.stringify(part.input) } })) });
    else if (textOf(message.content)) result.push({ role, content: textOf(message.content) });
    for (const part of toolResults) result.push({ role: 'tool', tool_call_id: part.callId, content: textOf(part.content) });
    return result;
  });
}

function toolSchema(inputSchema: unknown): Record<string, unknown> {
  if (!inputSchema || typeof inputSchema !== 'object' || Array.isArray(inputSchema) || !Object.keys(inputSchema).length) {
    return { type: 'object', properties: {}, additionalProperties: false };
  }
  return inputSchema as Record<string, unknown>;
}

function toolsOf(options: vscode.ProvideLanguageModelChatResponseOptions): unknown[] | undefined {
  const tools = options.tools?.map((tool) => ({ type: 'function', function: { name: tool.name, description: tool.description, parameters: toolSchema(tool.inputSchema) } }));
  return tools && tools.length ? tools : undefined;
}

async function streamOpenAi(plan: PlanConfig, model: PlanModel, apiKey: string, messages: readonly vscode.LanguageModelChatRequestMessage[], options: vscode.ProvideLanguageModelChatResponseOptions, progress: vscode.Progress<vscode.LanguageModelResponsePart>, token: vscode.CancellationToken): Promise<ChatResult> {
  const controller = new AbortController();
  token.onCancellationRequested(() => controller.abort());
  const tools = toolsOf(options);
  const modelOptions = options.modelOptions as Record<string, unknown> | undefined;
  const safeOptions = modelOptions
    ? Object.fromEntries(Object.entries(modelOptions).filter(([key]) => !key.startsWith('_')))
    : {};
  const body: Record<string, unknown> = {
    model: model.id,
    messages: openAiMessages(messages),
    stream: true,
    ...safeOptions,
  };
  if (tools) body.tools = tools;
  const response = await requestFirst(plan, apiKey, '/chat/completions', {
    method: 'POST',
    signal: controller.signal,
    body: JSON.stringify(body),
    headers: { accept: 'text/event-stream' },
  });
  let usage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
  const toolCalls = new Map<number, { id: string; name: string; args: string }>();
  await readSse(response, (data) => {
    const chunk = JSON.parse(data) as any;
    const delta = chunk.choices?.[0]?.delta;
    if (delta?.content) progress.report(new vscode.LanguageModelTextPart(delta.content));
    for (const call of delta?.tool_calls ?? []) {
      const current = toolCalls.get(call.index) ?? { id: call.id ?? crypto.randomUUID(), name: call.function?.name ?? '', args: '' };
      current.id = call.id ?? current.id; current.name = call.function?.name ?? current.name; current.args += call.function?.arguments ?? '';
      toolCalls.set(call.index, current);
    }
    if (chunk.usage) {
      const inputTokens = chunk.usage.prompt_tokens ?? 0;
      const outputTokens = chunk.usage.completion_tokens ?? 0;
      usage = { inputTokens, outputTokens, totalTokens: chunk.usage.total_tokens ?? inputTokens + outputTokens };
    }
  });
  for (const call of toolCalls.values()) progress.report(new vscode.LanguageModelToolCallPart(call.id, call.name, JSON.parse(call.args || '{}')));
  return usage;
}

async function readSse(response: Response, consume: (data: string) => void): Promise<void> {
  if (!response.body) throw new Error('端点没有返回响应流。');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split(/\r?\n\r?\n/); buffer = events.pop() ?? '';
    for (const event of events) for (const line of event.split(/\r?\n/)) if (line.startsWith('data: ')) { const data = line.slice(6); if (data !== '[DONE]') consume(data); }
  }
}

async function streamAnthropic(plan: PlanConfig, model: PlanModel, apiKey: string, messages: readonly vscode.LanguageModelChatRequestMessage[], options: vscode.ProvideLanguageModelChatResponseOptions, progress: vscode.Progress<vscode.LanguageModelResponsePart>, token: vscode.CancellationToken): Promise<ChatResult> {
  const controller = new AbortController(); token.onCancellationRequested(() => controller.abort());
  const converted = openAiMessages(messages).filter((item: any) => item.role !== 'tool').map((item: any) => ({ role: item.role, content: item.content || '' }));
  const tools = options.tools?.map((tool) => ({ name: tool.name, description: tool.description, input_schema: toolSchema(tool.inputSchema) }));
  const modelOptions = options.modelOptions as Record<string, unknown> | undefined;
  const safeOptions = modelOptions
    ? Object.fromEntries(Object.entries(modelOptions).filter(([key]) => !key.startsWith('_')))
    : {};
  const body: Record<string, unknown> = {
    model: model.id,
    max_tokens: model.maxOutputTokens,
    messages: converted,
    stream: true,
    ...safeOptions,
  };
  if (tools && tools.length) body.tools = tools;
  const response = await requestFirst(plan, apiKey, '/messages', {
    method: 'POST',
    signal: controller.signal,
    body: JSON.stringify(body),
    headers: { accept: 'text/event-stream' },
  });
  let inputTokens = 0; let outputTokens = 0; const calls = new Map<number, { id: string; name: string; json: string }>();
  await readSse(response, (data) => {
    const event = JSON.parse(data) as any;
    if (event.type === 'message_start') inputTokens = event.message?.usage?.input_tokens ?? 0;
    if (event.type === 'content_block_start' && event.content_block?.type === 'tool_use') calls.set(event.index, { id: event.content_block.id, name: event.content_block.name, json: '' });
    if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') progress.report(new vscode.LanguageModelTextPart(event.delta.text));
    if (event.type === 'content_block_delta' && event.delta?.type === 'input_json_delta') { const call = calls.get(event.index); if (call) call.json += event.delta.partial_json; }
    if (event.type === 'message_delta') outputTokens = event.usage?.output_tokens ?? outputTokens;
  });
  for (const call of calls.values()) progress.report(new vscode.LanguageModelToolCallPart(call.id, call.name, JSON.parse(call.json || '{}')));
  return { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens };
}

function responsesInput(messages: readonly vscode.LanguageModelChatRequestMessage[]): unknown[] {
  return openAiMessages(messages).flatMap((message: any) => {
    if (message.role === 'tool') return [{ type: 'function_call_output', call_id: message.tool_call_id, output: message.content }];
    const result: unknown[] = [{ type: 'message', role: message.role, content: message.content || '' }];
    for (const call of message.tool_calls ?? []) result.push({ type: 'function_call', call_id: call.id, name: call.function.name, arguments: call.function.arguments });
    return result;
  });
}

async function streamResponses(plan: PlanConfig, model: PlanModel, apiKey: string, messages: readonly vscode.LanguageModelChatRequestMessage[], options: vscode.ProvideLanguageModelChatResponseOptions, progress: vscode.Progress<vscode.LanguageModelResponsePart>, token: vscode.CancellationToken): Promise<ChatResult> {
  const controller = new AbortController(); token.onCancellationRequested(() => controller.abort());
  const tools = options.tools?.map((tool) => ({ type: 'function', name: tool.name, description: tool.description, parameters: toolSchema(tool.inputSchema) }));
  const body: Record<string, unknown> = {
    model: model.id,
    input: responsesInput(messages),
    stream: true,
    ...options.modelOptions,
  };
  if (tools && tools.length) body.tools = tools;
  const response = await requestFirst(plan, apiKey, '/responses', {
    method: 'POST',
    signal: controller.signal,
    body: JSON.stringify(body),
    headers: { accept: 'text/event-stream' },
  });
  let usage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
  const calls = new Map<string, { id: string; name: string; args: string }>();
  await readSse(response, (data) => {
    const event = JSON.parse(data) as any;
    if (event.type === 'response.output_text.delta' && event.delta) progress.report(new vscode.LanguageModelTextPart(event.delta));
    if (event.type === 'response.output_item.added' && event.item?.type === 'function_call') {
      calls.set(event.item.id ?? event.item.call_id, { id: event.item.call_id ?? event.item.id, name: event.item.name ?? '', args: event.item.arguments ?? '' });
    }
    if (event.type === 'response.function_call_arguments.delta') {
      const call = calls.get(event.item_id ?? event.call_id);
      if (call) call.args += event.delta ?? '';
    }
    if (event.type === 'response.output_item.done' && event.item?.type === 'function_call') {
      calls.set(event.item.id ?? event.item.call_id, { id: event.item.call_id ?? event.item.id, name: event.item.name ?? '', args: event.item.arguments ?? '' });
    }
    const rawUsage = event.response?.usage;
    if (rawUsage) {
      const inputTokens = rawUsage.input_tokens ?? 0;
      const outputTokens = rawUsage.output_tokens ?? 0;
      usage = { inputTokens, outputTokens, totalTokens: rawUsage.total_tokens ?? inputTokens + outputTokens };
    }
  });
  for (const call of calls.values()) progress.report(new vscode.LanguageModelToolCallPart(call.id, call.name, JSON.parse(call.args || '{}')));
  return usage;
}

function numberAt(value: unknown): number | undefined {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return undefined;
}

function findValue(value: unknown, names: string[]): unknown {
  if (!value || typeof value !== 'object') return undefined;
  if (Array.isArray(value)) {
    for (const child of value) {
      const found = findValue(child, names);
      if (found !== undefined) return found;
    }
    return undefined;
  }
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) if (names.includes(key.toLowerCase())) return child;
  for (const child of Object.values(value as Record<string, unknown>)) {
    const found = findValue(child, names);
    if (found !== undefined) return found;
  }
  return undefined;
}

function quotaWindow(payload: unknown, id: string, label: string, aliases: string[]): QuotaWindow | undefined {
  const container = findValue(payload, aliases);
  if (!container || typeof container !== 'object') return undefined;
  return quotaWindowFromContainer(container, id, label);
}

function quotaWindowFromContainer(container: unknown, id: string, label: string): QuotaWindow | undefined {
  if (!container || typeof container !== 'object') return undefined;
  const used = numberAt(findValue(container, ['used', 'usage', 'consumed', 'used_amount', 'used_count', 'usage_count', 'current_usage', 'current_interval_usage_count']));
  const limit = numberAt(findValue(container, ['limit', 'total', 'quota', 'total_amount', 'total_count', 'usage_limit', 'current_interval_total_count']));
  const remaining = numberAt(findValue(container, ['remaining', 'remain', 'remains', 'left', 'remaining_amount', 'remaining_count', 'available']));
  const percentRaw = numberAt(findValue(container, ['percent', 'percentage', 'used_percent', 'usage_percent', 'usage_rate']));
  const percentUsed = percentRaw !== undefined ? (percentRaw <= 1 ? percentRaw * 100 : percentRaw) : (used !== undefined && limit ? used / limit * 100 : (remaining !== undefined && limit ? (limit - remaining) / limit * 100 : undefined));
  const resetRaw = findValue(container, ['reset_at', 'resetat', 'reset_time', 'next_reset_time', 'end_time', 'expires_at', 'expiration_time']);
  const resetNumber = numberAt(resetRaw);
  const resetAt = resetNumber ? (resetNumber < 1e12 ? resetNumber * 1000 : resetNumber) : (typeof resetRaw === 'string' ? Date.parse(resetRaw) : undefined);
  if ([used, limit, remaining, percentUsed, resetAt].every((item) => item === undefined || Number.isNaN(item))) return undefined;
  return { id, label, used, limit, remaining, percentUsed, resetAt, unit: 'quota' };
}

function quotaRecords(value: unknown, path = 'quota'): Array<{ path: string; value: Record<string, unknown> }> {
  if (Array.isArray(value)) return value.flatMap((child, index) => quotaRecords(child, `${path}-${index + 1}`));
  if (!value || typeof value !== 'object') return [];
  const record = value as Record<string, unknown>;
  const hasQuotaField = Object.keys(record).some((key) => /used|usage|consum|limit|total|quota|remain|left|available|reset|expire/i.test(key));
  const children = Object.entries(record).flatMap(([key, child]) => quotaRecords(child, key));
  return children.length ? children : (hasQuotaField ? [{ path, value: record }] : []);
}

function readableWindowName(record: Record<string, unknown>, fallback: string): string {
  const raw = findValue(record, ['name', 'label', 'title', 'type', 'window', 'period', 'model_name']);
  return typeof raw === 'string' && raw.trim() ? raw.trim() : fallback;
}

function payloadShape(value: unknown, depth = 0): string {
  if (depth > 2) return '...';
  if (Array.isArray(value)) return `[${value.slice(0, 2).map((item) => payloadShape(item, depth + 1)).join(', ')}]`;
  if (!value || typeof value !== 'object') return typeof value;
  return `{${Object.entries(value as Record<string, unknown>).slice(0, 12).map(([key, child]) => `${key}:${payloadShape(child, depth + 1)}`).join(', ')}}`;
}

function minimaxQuotaWindows(payload: unknown): QuotaWindow[] {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return [];
  const models = (payload as Record<string, unknown>).model_remains;
  if (!Array.isArray(models)) return [];
  return models.flatMap((value, index) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
    const model = value as Record<string, unknown>;
    // 过滤掉视频额度，仅保留通用文本额度（按 track / model_name 判断）
    const trackRaw = typeof model.track === 'string' ? model.track : (typeof model.usage_type === 'string' ? model.usage_type : '');
    const track = trackRaw.trim().toLowerCase();
    const modelNameRaw = typeof model.model_name === 'string' ? model.model_name : '';
    if (/video|视频|vision|image|t2v|i2v|t2i|图生|文生/i.test(`${track} ${modelNameRaw}`)) return [];
    const modelName = modelNameRaw.trim() || `模型 ${index + 1}`;
    const createWindow = (id: string, label: string, weekly: boolean): QuotaWindow | undefined => {
      const field = (suffix: string): string => weekly ? `current_weekly_${suffix}` : `current_interval_${suffix}`;
      const used = numberAt(model[field('usage_count')]);
      const rawLimit = numberAt(model[field('total_count')]);
      const remainingPercent = numberAt(model[field('remaining_percent')]);
      const status = numberAt(model[field('status')]);
      const unlimited = status === 3;
      const limit = unlimited ? undefined : rawLimit;
      const resetRaw = model[weekly ? 'weekly_end_time' : 'end_time'];
      const resetNumber = numberAt(resetRaw);
      const resetAt = resetNumber ? (resetNumber < 1e12 ? resetNumber * 1000 : resetNumber) : undefined;
      if ([used, limit, remainingPercent, resetAt].every((item) => item === undefined || Number.isNaN(item))) return undefined;
      return {
        id: `${modelName}-${id}`,
        label: `${modelName} · ${label}`,
        unlimited,
        used,
        limit,
        remaining: used !== undefined && limit !== undefined ? Math.max(0, limit - used) : undefined,
        percentUsed: unlimited ? undefined : (remainingPercent !== undefined ? Math.max(0, 100 - remainingPercent) : (used !== undefined && limit ? used / limit * 100 : undefined)),
        resetAt,
        unit: '次调用',
      };
    };
    return [
      createWindow('five-hour', '5 小时', false),
      createWindow('weekly', '周限额', true),
    ].filter((window): window is QuotaWindow => Boolean(window));
  });
}

/* OpenCode（Zen / Go）：官方网关不提供主动查询用量的 API（/usage、/balance、/subscription 等端点均不存在）。
   仅能获得订阅上限（美元值），当前已用额度需登录 opencode.ai/auth 控制台查看。
   这里仅对明确是 Go 配套餐的 plan 返回静态限制窗口（避免把 Go 上限误用于 Zen 订阅），
   前端以 usageUnknown 模式展示“上限 + 控制台提示”，避免误报 0%。 */
function isOpenCodeGoPlan(plan: PlanConfig): boolean {
  const hay = `${plan.provider} ${plan.baseUrl}`;
  const goBaseUrl = /\/go(\/|$)/i.test(plan.baseUrl);
  const goProvider = /(^|\s)go(\s|$)/i.test(plan.provider);
  return /opencode/i.test(hay) && (goBaseUrl || goProvider);
}

/* OpenCode Go 配套餐官方限制（https://opencode.ai/docs/zh-cn/go/）：
   5 小时滚动窗口 $12、每周 $30、每月 $60（以美元价值计费，实际请求数随模型而定）。 */
const opencodeGoWindows = (): QuotaWindow[] => [
  { id: 'go-5h', label: '5 小时（滚动）', limit: 12, unit: '美元', usageUnknown: true },
  { id: 'go-weekly', label: '每周', limit: 30, unit: '美元', usageUnknown: true },
  { id: 'go-monthly', label: '每月', limit: 60, unit: '美元', usageUnknown: true },
];

/* OpenCode Go 达到限额时，网关返回 HTTP 429，body 形如：
   { type:"error", error:{ type:"GoUsageLimitError", message }, metadata:{ workspace, limitName:"5 hour"|"weekly"|"monthly" } }
   这里把对应窗口标记为已用满（100%），让配额面板如实反映“当前不可用”。 */
export function recordGoUsageLimitHit(store: PlanStore, planId: string, error: unknown): void {
  const raw = error instanceof Error ? error.message : String(error);
  if (!raw.includes('GoUsageLimitError')) return;
  const bodyText = raw.match(/\{[\s\S]*\}/)?.[0];
  if (!bodyText) return;
  let body: { metadata?: { limitName?: unknown } };
  try {
    body = JSON.parse(bodyText) as { metadata?: { limitName?: unknown } };
  } catch {
    return;
  }
  const limitName = typeof body?.metadata?.limitName === 'string' ? body.metadata.limitName : '';
  const windowId = ({ '5 hour': 'go-5h', weekly: 'go-weekly', monthly: 'go-monthly' } as Record<string, string>)[limitName];
  if (!windowId) return;
  const snapshot = store.getQuotaSnapshots().find((item) => item.planId === planId);
  if (!snapshot || snapshot.source !== 'remote' || !snapshot.windows.length) return;
  const windows = snapshot.windows.map((window) => window.id === windowId
    ? { ...window, used: window.limit, remaining: 0, percentUsed: 100, usageUnknown: false }
    : window);
  void store.setQuotaSnapshot({ ...snapshot, windows, fetchedAt: Date.now() });
}

export async function fetchPlanQuota(plan: PlanConfig, apiKey: string): Promise<QuotaSnapshot | undefined> {
  if (isOpenCodeGoPlan(plan)) {
    return { planId: plan.id, fetchedAt: Date.now(), source: 'remote', windows: opencodeGoWindows() };
  }
  if (!/minimax/i.test(`${plan.provider} ${plan.baseUrl}`)) return undefined;
  const response = await request('https://api.minimaxi.com/v1/token_plan/remains', apiKey, 'openai', { method: 'GET' });
  const payload = await response.json() as unknown;
  const baseResponse = payload && typeof payload === 'object' && !Array.isArray(payload)
    ? (payload as Record<string, unknown>).base_resp
    : undefined;
  if (baseResponse && typeof baseResponse === 'object' && !Array.isArray(baseResponse)) {
    const statusCode = numberAt((baseResponse as Record<string, unknown>).status_code);
    const statusMessage = (baseResponse as Record<string, unknown>).status_msg;
    if (statusCode !== undefined && statusCode !== 0) {
      const detail = typeof statusMessage === 'string' && statusMessage.trim() ? `：${statusMessage.trim()}` : '';
      const guidance = statusCode === 2049 ? '请重新粘贴 Token Plan 订阅 Key，并确认没有包含引号或多余空格。' : '请根据 MiniMax 返回的状态信息检查订阅权限。';
      throw new Error(`MiniMax 配额请求失败（业务状态码 ${statusCode}）${detail}。${guidance}`);
    }
  }
  const windows = minimaxQuotaWindows(payload);
  if (!windows.length) {
    for (const [index, record] of quotaRecords(payload).entries()) {
      const window = quotaWindowFromContainer(record.value, `quota-${index + 1}`, readableWindowName(record.value, record.path));
      if (window) windows.push(window);
    }
  }
  if (!windows.length && baseResponse) throw new Error('MiniMax 配额请求成功，但响应中没有配额数据。请确认该订阅 Key 已分配 Token Plan 席位或积分权限。');
  if (!windows.length) throw new Error(`MiniMax 配额接口返回了未知格式（结构：${payloadShape(payload)}）。响应值已隐藏，请反馈此结构以便适配。`);
  return { planId: plan.id, fetchedAt: Date.now(), source: 'remote', windows };
}

export async function sendChat(plan: PlanConfig, model: PlanModel, apiKey: string, messages: readonly vscode.LanguageModelChatRequestMessage[], options: vscode.ProvideLanguageModelChatResponseOptions, progress: vscode.Progress<vscode.LanguageModelResponsePart>, token: vscode.CancellationToken): Promise<ChatResult> {
  if (plan.protocol === 'anthropic') return streamAnthropic(plan, model, apiKey, messages, options, progress, token);
  if (plan.protocol === 'responses') return streamResponses(plan, model, apiKey, messages, options, progress, token);
  return streamOpenAi(plan, model, apiKey, messages, options, progress, token);
}