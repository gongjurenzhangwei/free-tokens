import * as vscode from 'vscode';
import { sendChat } from './api';
import { PlanStore } from './store';

function isLikelyNvidiaFunctionId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

function isNvidiaNim(baseUrl: string): boolean {
  try { return new URL(baseUrl).host.toLowerCase().includes('integrate.api.nvidia.com'); } catch { return false; }
}

function isInvalidModelId(baseUrl: string, modelId: string): boolean {
  return isNvidiaNim(baseUrl) && isLikelyNvidiaFunctionId(modelId);
}

/* 从形如 `HTTP 400: {"error":{"message":"..."}}` 的错误串里提取最内层的可读 message，便于分类判断。 */
function readableError(raw: string): string {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as { error?: { message?: unknown }; message?: unknown };
      const message = parsed?.error?.message ?? parsed?.message;
      if (typeof message === 'string' && message.trim()) return message.trim();
    } catch { /* 不是 JSON，忽略 */ }
  }
  return raw;
}

/* 精简原始错误：单行化并截断，避免在 Chat 错误卡片里显示超长 JSON。 */
function shortRaw(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, 300);
}

function explainChatError(plan: { provider: string; baseUrl: string; protocol: string }, modelId: string, error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  // 幂等保护：如果错误已经是解释过的友好消息（含我们生成的标记），直接返回，
  // 避免任何二次包装导致「排查原因」等内容重复。
  if (raw.includes('可能原因与排查') || raw.includes('\n\n原始错误：')) {
    return raw;
  }
  if (isInvalidModelId(plan.baseUrl, modelId)) {
    return `NVIDIA NIM：模型 ID "${modelId}" 是 Function UUID，无法在 Chat 中使用。\n请打开 NVIDIA NIM 控制台 → Models，复制形如 meta/llama-3.1-70b-instruct 的真实模型名（仅含字母、数字、连字符、斜杠），回到 免费 Token 编辑该 Plan 并替换该模型；旧模型 ID 已被自动从 Chat 选单中隐藏。\n\n原始错误：${shortRaw(raw)}`;
  }
  const text = readableError(raw);
  if (/HTTP 429|Rate limit exceeded|Too Many Requests|rate_limit/i.test(text)) {
    const host = (() => { try { return new URL(plan.baseUrl).host.toLowerCase(); } catch { return ''; } })();
    const isKilo = host.includes('api.kilo.ai');
    const tip = isKilo
      ? 'Kilo Gateway 当前使用的是 OpenRouter 等供应商的共享档位，单一账户/IP 受限于每分钟请求数。\n建议：稍后再试（限速窗口每分钟重置），或在 Kilo 控制台绑定你自己的 OpenRouter/Anthropic/OpenAI Key 以绕过共享档位。'
      : '当前模型共享档位达到每分钟请求数上限。\n建议：稍候片刻再试，或切换到非共享档模型。';
    return `请求被供应商限速（HTTP 429）。\n${tip}\n\n原始错误：${shortRaw(raw)}`;
  }
  const gateway = text.match(/Error from provider \(([^)]+)\)/)?.[1];
  if (gateway || /Upstream request failed|Provider returned error/i.test(text)) {
    const name = gateway ?? '中转网关';
    return `请求被中转网关（${name}）转发时被上游拒绝（HTTP 400）。\n这通常是网关或其上游服务的问题，不是 免费 Token 插件的问题。\n\n可能原因与排查：\n1. 网关账户余额不足或免费额度已用完 —— 打开 ${name} 控制台查看余额与额度；\n2. 模型 "${modelId}" 对上游不可用 —— 确认该模型 ID 在网关目录中有效且已启用，或换一个模型再试；\n3. 网关上游服务临时故障 —— 稍等几分钟后重试。\n\n原始错误：${shortRaw(raw)}`;
  }
  if (/HTTP 401|HTTP 403|Unauthorized|Invalid API key|incorrect api key|api key.*invalid|authentication/i.test(text)) {
    return `认证失败（HTTP 401/403）：API Key 无效或已过期。\n请打开 免费 Token 控制台，重新生成该 Plan 的 API Key 并粘贴（注意不要有多余空格或换行），或换一个 Plan 再试。\n\n原始错误：${shortRaw(raw)}`;
  }
  if (/HTTP 402|insufficient|credits|balance|paid model/i.test(text)) {
    return `余额或配额不足（HTTP 402）：该模型需要付费或额度已用完。\n请打开供应商控制台充值或等待额度重置后重试。\n\n原始错误：${shortRaw(raw)}`;
  }
  if (/HTTP 404|model_not_found|not found for account|: not found/i.test(text)) {
    return `模型 "${modelId}" 不存在或未分配给此账户（HTTP 404）。\n请打开 免费 Token 控制台：确认模型 ID 拼写正确，或点击「重新连接」刷新模型列表。\n\n原始错误：${shortRaw(raw)}`;
  }
  if (/HTTP 400|Unsupported parameter|Bad Request|invalid.*request/i.test(text)) {
    return `供应商拒绝了请求参数（HTTP 400）。\n通常是因为模型不支持请求中的某些参数（如工具调用或图片输入）。\n建议：\n1. 换一个模型再试（当前模型：${modelId}）；\n2. 在 免费 Token 控制台确认该 Plan 的协议与 Base URL 匹配。\n\n原始错误：${shortRaw(raw)}`;
  }
  if (/fetch failed|ENOTFOUND|ECONNREFUSED|ECONNRESET|ETIMEDOUT|network error|socket/i.test(text)) {
    const host = (() => { try { return new URL(plan.baseUrl).host; } catch { return plan.baseUrl; } })();
    return `网络连接失败：无法访问 ${host}。\n请检查网络、代理或防火墙设置后重试。\n\n原始错误：${shortRaw(raw)}`;
  }
  return raw;
}

export class ByokLanguageModelProvider implements vscode.LanguageModelChatProvider {
  private readonly changeEmitter = new vscode.EventEmitter<void>();
  readonly onDidChangeLanguageModelChatInformation = this.changeEmitter.event;

  constructor(private readonly store: PlanStore) {}

  refresh(): void { this.changeEmitter.fire(); }

  async provideLanguageModelChatInformation(): Promise<vscode.LanguageModelChatInformation[]> {
    const settings = this.store.getSettings();
    const filterAvailable = settings.filterAvailable === true;
    const plans = this.store.getPlans();
    const availablePlanIds = filterAvailable
      ? new Set((await Promise.all(plans.map(async (plan) => await this.store.hasApiKey(plan.id) ? plan.id : undefined))).filter((id): id is string => Boolean(id)))
      : undefined;
    return plans.filter((plan) => {
      if (!plan.enabled) return false;
      if (plan.models.length === 0) return false;
      if (filterAvailable && !availablePlanIds?.has(plan.id)) return false;
      return true;
    }).flatMap((plan) => plan.models
      .filter((model) => !isInvalidModelId(plan.baseUrl, model.id))
      .filter((model) => (model.kind ?? 'chat') === 'chat')  // 只把 chat 模型注册到 VS Code Chat 选择器
      .map((model) => ({
        id: `${plan.id}:${model.id}`,
        name: `${plan.provider} / ${model.name}`,
        family: model.id,
        version: '1',
        tooltip: `${plan.provider} · ${plan.name}\n模型 ID: ${model.id}\n协议: ${plan.protocol}`,
        detail: `Plan: ${plan.name}`,
        maxInputTokens: model.maxInputTokens,
        maxOutputTokens: model.maxOutputTokens,
        capabilities: {
          toolCalling: model.supportsTools ?? model.toolCalling ?? true,
          imageInput: model.supportsVision ?? model.vision ?? false,
        },
      })));
  }

  async provideLanguageModelChatResponse(modelInfo: vscode.LanguageModelChatInformation, messages: readonly vscode.LanguageModelChatRequestMessage[], options: vscode.ProvideLanguageModelChatResponseOptions, progress: vscode.Progress<vscode.LanguageModelResponsePart>, token: vscode.CancellationToken): Promise<void> {
    const separator = modelInfo.id.indexOf(':');
    const planId = modelInfo.id.slice(0, separator); const modelId = modelInfo.id.slice(separator + 1);
    const plan = this.store.getPlan(planId); const model = plan?.models.find((item) => item.id === modelId); const apiKey = await this.store.getApiKey(planId);
    if (!plan || !model || !apiKey) throw new Error('Plan 配置或 API Key 不完整，请打开 免费 Token 控制台检查。');
    try {
      const usage = await sendChat(plan, model, apiKey, messages, options, progress, token);
      await this.store.addUsage({ planId, modelId, ...usage, requests: 1, success: true });
    } catch (error) {
      await this.store.addUsage({ planId, modelId, inputTokens: 0, outputTokens: 0, totalTokens: 0, requests: 1, success: false });
      // 抛 LanguageModelError（VS Code 官方 BYOK 错误类型）而不是普通 Error，
      // 避免 Chat 前端把它当作“未指定错误”而同时展示 message 与 cause 导致内容重复。
      throw new vscode.LanguageModelError(explainChatError(plan, model.id, error));
    }
  }

  async provideTokenCount(_model: vscode.LanguageModelChatInformation, text: string | vscode.LanguageModelChatRequestMessage): Promise<number> {
    const value = typeof text === 'string' ? text : text.content.map((part) => part instanceof vscode.LanguageModelTextPart ? part.value : JSON.stringify(part)).join('');
    return Math.ceil(value.length / 4);
  }
}