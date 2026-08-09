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

function explainChatError(plan: { provider: string; baseUrl: string; protocol: string }, modelId: string, error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  if (isInvalidModelId(plan.baseUrl, modelId)) {
    return `NVIDIA NIM：模型 ID "${modelId}" 是 Function UUID，无法在 Chat 中使用。\n请打开 NVIDIA NIM 控制台 → Models，复制形如 meta/llama-3.1-70b-instruct 的真实模型名（仅含字母、数字、连字符、斜杠），回到 免费 Token 编辑该 Plan 并替换该模型；旧模型 ID 已被自动从 Chat 选单中隐藏。\n\n原始错误：${raw}`;
  }
  if (/HTTP 429|Rate limit exceeded|Too Many Requests|rate_limit/i.test(raw)) {
    const host = (() => { try { return new URL(plan.baseUrl).host.toLowerCase(); } catch { return ''; } })();
    const isKilo = host.includes('api.kilo.ai');
    const tip = isKilo
      ? 'Kilo Gateway 当前使用的是 OpenRouter 等供应商的共享档位，单一账户/IP 受限于每分钟请求数。\n建议：稍后再试（限速窗口每分钟重置），或在 Kilo 控制台绑定你自己的 OpenRouter/Anthropic/OpenAI Key 以绕过共享档位。'
      : '当前模型共享档位达到每分钟请求数上限。\n建议：稍候片刻再试，或切换到非共享档模型。';
    return `请求被供应商限速（HTTP 429）。\n${tip}\n\n原始错误：${raw}`;
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
      throw new Error(explainChatError(plan, model.id, error));
    }
  }

  async provideTokenCount(_model: vscode.LanguageModelChatInformation, text: string | vscode.LanguageModelChatRequestMessage): Promise<number> {
    const value = typeof text === 'string' ? text : text.content.map((part) => part instanceof vscode.LanguageModelTextPart ? part.value : JSON.stringify(part)).join('');
    return Math.ceil(value.length / 4);
  }
}