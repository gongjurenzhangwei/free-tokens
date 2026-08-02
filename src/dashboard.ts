import * as vscode from 'vscode';
import { connectPlan, fetchPlanQuota } from './api';
import { dashboardView } from './dashboardView';
import { ByokLanguageModelProvider } from './provider';
import { PlanStore } from './store';
import { PlanInput } from './types';

export class Dashboard {
  private panel?: vscode.WebviewPanel;

  constructor(
    private readonly store: PlanStore,
    private readonly provider: ByokLanguageModelProvider,
    private readonly version: string,
  ) {}

  open(): void {
    if (this.panel) {
      this.panel.reveal();
      this.sync();
      return;
    }
    this.panel = vscode.window.createWebviewPanel('byokCopilot.dashboard', 'BYOK COPILOT', vscode.ViewColumn.One, {
      enableScripts: true,
      retainContextWhenHidden: true,
    });
    this.panel.webview.html = dashboardView(this.panel.webview, this.version);
    this.panel.onDidDispose(() => { this.panel = undefined; });
    this.panel.webview.onDidReceiveMessage((message) => this.handle(message));
    this.sync();
  }

  private async sync(): Promise<void> {
    const plans = this.store.getPlans();
    const planAvailability = Object.fromEntries(await Promise.all(plans.map(async (plan) => [plan.id, await this.store.hasApiKey(plan.id)])));
    this.panel?.webview.postMessage({
      type: 'state',
      plans,
      planAvailability,
      usage: this.store.getUsage(30),
      quotas: this.store.getQuotaSnapshots(),
      settings: this.store.getSettings(),
    });
  }

  private async handle(message: any): Promise<void> {
    try {
      if (message.type === 'ready') this.sync();
      if (message.type === 'testPlan') {
        const input = message.plan as PlanInput;
        const existing = input.id ? this.store.getPlan(input.id) : undefined;
        const key = input.apiKey?.trim() || (existing && await this.store.getApiKey(existing.id));
        if (!key) throw new Error('请填写 API Key。');
        const preview = {
          id: existing?.id ?? 'preview',
          name: input.name.trim(),
          provider: input.provider.trim(),
          baseUrl: input.baseUrl.trim().replace(/\/+$/, ''),
          protocol: input.protocol,
          enabled: input.enabled,
          models: [],
          createdAt: existing?.createdAt ?? Date.now(),
          updatedAt: Date.now(),
        };
        try {
          const connection = await connectPlan(preview, key);
          this.panel?.webview.postMessage({ type: 'testResult', requestId: message.requestId, ok: true, connection });
        } catch (error) {
          this.panel?.webview.postMessage({
            type: 'testResult',
            requestId: message.requestId,
            ok: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
        return;
      }
      if (message.type === 'savePlan') {
        const input = message.plan as PlanInput;
        const models = Array.isArray(message.models) ? message.models : [];
        if (!models.length) throw new Error('请先等待连接测试成功。');
        const plan = await this.store.savePlan(input);
        await this.store.setModels(plan.id, models);
        this.provider.refresh();
        this.sync();
        this.notice('success', `已连接 ${plan.name}，启用 ${models.length} 个模型。`);
      }
      if (message.type === 'refreshQuota') {
        const plan = this.store.getPlan(message.id);
        const key = plan && await this.store.getApiKey(plan.id);
        if (!plan || !key) throw new Error('Plan 或 API Key 不完整。');
        const quota = await fetchPlanQuota(plan, key);
        if (!quota) throw new Error(`${plan.provider} 暂无可用的官方配额接口。`);
        await this.store.setQuotaSnapshot(quota);
        this.sync();
        this.notice('success', `已刷新 ${plan.name} 的官方配额。`);
      }
      if (message.type === 'saveSettings') {
        await this.store.setSettings(message.settings);
        this.sync();
      }
      if (message.type === 'manageLanguageModels') {
        await vscode.commands.executeCommand('byokCopilot.manageLanguageModels');
      }
      if (message.type === 'delete') {
        const plan = this.store.getPlan(message.id);
        if (!plan) throw new Error('要删除的 Plan 不存在或已被删除。');
        const confirmed = await vscode.window.showWarningMessage(`删除 Plan“${plan.name}”及其 API Key？`, { modal: true }, '删除');
        if (confirmed !== '删除') return;
        await this.store.deletePlan(plan.id);
        this.provider.refresh();
        this.sync();
        this.notice('success', `已删除 ${plan.name}。`);
      }
      if (message.type === 'toggle') {
        const plan = this.store.getPlan(message.id);
        if (plan) {
          await this.store.savePlan({ ...plan, enabled: message.enabled });
          this.provider.refresh();
          this.sync();
        }
      }
    } catch (error) {
      this.sync();
      this.notice('error', error instanceof Error ? error.message : String(error));
    }
  }

  private notice(level: 'success' | 'error', message: string): void {
    this.panel?.webview.postMessage({ type: 'notice', level, message });
  }
}
