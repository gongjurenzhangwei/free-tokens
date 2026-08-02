import * as vscode from 'vscode';
import { sendChat } from './api';
import { PlanStore } from './store';

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
    }).flatMap((plan) => plan.models.map((model) => ({
      id: `${plan.id}:${model.id}`,
      name: `${plan.provider} / ${model.name}`,
      family: model.id,
      version: '1',
      tooltip: `${plan.provider} · ${plan.name}\n模型 ID: ${model.id}\n协议: ${plan.protocol}`,
      detail: `Plan: ${plan.name}`,
      maxInputTokens: model.maxInputTokens,
      maxOutputTokens: model.maxOutputTokens,
      capabilities: { toolCalling: model.toolCalling, imageInput: model.vision },
    })));
  }

  async provideLanguageModelChatResponse(modelInfo: vscode.LanguageModelChatInformation, messages: readonly vscode.LanguageModelChatRequestMessage[], options: vscode.ProvideLanguageModelChatResponseOptions, progress: vscode.Progress<vscode.LanguageModelResponsePart>, token: vscode.CancellationToken): Promise<void> {
    const separator = modelInfo.id.indexOf(':');
    const planId = modelInfo.id.slice(0, separator); const modelId = modelInfo.id.slice(separator + 1);
    const plan = this.store.getPlan(planId); const model = plan?.models.find((item) => item.id === modelId); const apiKey = await this.store.getApiKey(planId);
    if (!plan || !model || !apiKey) throw new Error('Plan 配置或 API Key 不完整，请打开 BYOK COPILOT 控制台检查。');
    try {
      const usage = await sendChat(plan, model, apiKey, messages, options, progress, token);
      await this.store.addUsage({ planId, modelId, ...usage, requests: 1, success: true });
    } catch (error) {
      await this.store.addUsage({ planId, modelId, inputTokens: 0, outputTokens: 0, totalTokens: 0, requests: 1, success: false });
      throw error;
    }
  }

  async provideTokenCount(_model: vscode.LanguageModelChatInformation, text: string | vscode.LanguageModelChatRequestMessage): Promise<number> {
    const value = typeof text === 'string' ? text : text.content.map((part) => part instanceof vscode.LanguageModelTextPart ? part.value : JSON.stringify(part)).join('');
    return Math.ceil(value.length / 4);
  }
}