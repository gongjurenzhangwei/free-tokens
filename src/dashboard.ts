import * as vscode from 'vscode';
import { connectPlan, fetchPlanQuota } from './api';
import { dashboardView } from './dashboardView';
import { ByokLanguageModelProvider } from './provider';
import { PlanStore } from './store';
import { PlanInput } from './types';

type DashboardMessageKey = 'apiKeyRequired' | 'testFirst' | 'incompletePlan' | 'quotaUnavailable' | 'missingPlan' | 'deletePrompt' | 'deleteAction';

const messages: Record<'zh-CN' | 'en', Record<DashboardMessageKey, string>> = {
  'zh-CN': {
    apiKeyRequired: '请填写 API Key。',
    testFirst: '请先等待连接测试成功。',
    incompletePlan: 'Plan 或 API Key 不完整。',
    quotaUnavailable: '暂无可用的官方配额接口。',
    missingPlan: '要删除的 Plan 不存在或已被删除。',
    deletePrompt: '及其 API Key？',
    deleteAction: '删除',
  },
  en: {
    apiKeyRequired: 'Enter an API key.',
    testFirst: 'Wait for a successful connection test first.',
    incompletePlan: 'The plan or API key is incomplete.',
    quotaUnavailable: 'does not provide a supported official quota endpoint.',
    missingPlan: 'The plan no longer exists.',
    deletePrompt: 'and its API key?',
    deleteAction: 'Delete',
  },
};

export class Dashboard {
  private panel?: vscode.WebviewPanel;

  constructor(
    private readonly store: PlanStore,
    private readonly provider: ByokLanguageModelProvider,
    private readonly version: string,
    private readonly extensionUri: vscode.Uri,
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
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'dist')],
    });
    this.panel.webview.html = dashboardView(this.panel.webview, this.version, this.extensionUri);
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
        if (!key) throw new Error(this.text('apiKeyRequired'));
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
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.panel?.webview.postMessage({
            type: 'testResult',
            requestId: message.requestId,
            ok: false,
            error: this.localizeError(errorMessage),
          });
        }
        return;
      }
      if (message.type === 'savePlan') {
        const input = message.plan as PlanInput;
        const models = Array.isArray(message.models) ? message.models : [];
        if (!models.length) throw new Error(this.text('testFirst'));
        const plan = await this.store.savePlan(input);
        await this.store.setModels(plan.id, models);
        this.provider.refresh();
        this.sync();
        this.notice('success', this.isEnglish
          ? `Connected ${plan.name} with ${models.length} model(s).`
          : `已连接 ${plan.name}，启用 ${models.length} 个模型。`);
      }
      if (message.type === 'refreshQuota') {
        const plan = this.store.getPlan(message.id);
        const key = plan && await this.store.getApiKey(plan.id);
        if (!plan || !key) throw new Error(this.text('incompletePlan'));
        const quota = await fetchPlanQuota(plan, key);
        if (!quota) throw new Error(this.isEnglish
          ? `${plan.provider} ${this.text('quotaUnavailable')}`
          : `${plan.provider} ${this.text('quotaUnavailable')}`);
        await this.store.setQuotaSnapshot(quota);
        this.sync();
        this.notice('success', this.isEnglish ? `Refreshed the official quota for ${plan.name}.` : `已刷新 ${plan.name} 的官方配额。`);
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
        if (!plan) throw new Error(this.text('missingPlan'));
        const action = this.text('deleteAction');
        const prompt = this.isEnglish ? `Delete plan “${plan.name}” ${this.text('deletePrompt')}` : `删除 Plan“${plan.name}”${this.text('deletePrompt')}`;
        const confirmed = await vscode.window.showWarningMessage(prompt, { modal: true }, action);
        if (confirmed !== action) return;
        await this.store.deletePlan(plan.id);
        this.provider.refresh();
        this.sync();
        this.notice('success', this.isEnglish ? `Deleted ${plan.name}.` : `已删除 ${plan.name}。`);
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

  private get isEnglish(): boolean {
    return this.store.getSettings().language === 'en';
  }

  private text(key: DashboardMessageKey): string {
    return messages[this.isEnglish ? 'en' : 'zh-CN'][key];
  }

  private localizeError(message: string): string {
    if (!this.isEnglish) return message;
    return message
      .replace('API Key 为空，请在 Plan 中重新填写。', 'The API key is empty. Enter it again in the plan.')
      .replace('未发现模型。请检查 Base URL、API Key 和供应商的模型列表权限。', 'No models found. Check the Base URL, API key, and model-list permissions.')
      .replace('连接测试失败', 'Connection test failed')
      .replace('请求失败', 'Request failed')
      .replace('未知错误', 'Unknown error');
  }
}
