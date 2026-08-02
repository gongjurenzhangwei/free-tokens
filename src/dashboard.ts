import * as vscode from 'vscode';
import { connectPlan, fetchPlanQuota } from './api';
import { dashboardView } from './dashboardView';
import { ByokLanguageModelProvider } from './provider';
import { ConfigBundle, PlanStore } from './store';
import { PlanInput, UsageRecord } from './types';

type DashboardMessageKey = 'apiKeyRequired' | 'testFirst' | 'incompletePlan' | 'quotaUnavailable' | 'missingPlan' | 'deletePrompt' | 'deleteAction' | 'exportSuccess' | 'exportFail' | 'importSuccess' | 'importFail' | 'exportPrompt' | 'replacePrompt' | 'mergePrompt' | 'skipPrompt' | 'importStrategyPrompt';

const messages: Record<'zh-CN' | 'en', Record<DashboardMessageKey, string>> = {
  'zh-CN': {
    apiKeyRequired: '请填写 API Key。',
    testFirst: '请先等待连接测试成功。',
    incompletePlan: 'Plan 或 API Key 不完整。',
    quotaUnavailable: '暂无可用的官方配额接口。',
    missingPlan: '要删除的 Plan 不存在或已被删除。',
    deletePrompt: '及其 API Key？',
    deleteAction: '删除',
    exportSuccess: '配置已导出到 {path}。',
    exportFail: '导出失败：{reason}',
    importSuccess: '导入完成：新增 {added} 个，合并 {reused} 个，覆盖 {overwritten} 个，跳过 {skipped} 个，导入 {keysImported} 个密钥。',
    importFail: '导入失败：{reason}',
    exportPrompt: '导出 BYOK COPILOT 配置',
    replacePrompt: '替换全部现有 Plan',
    mergePrompt: '按 ID 合并同名 Plan',
    skipPrompt: '跳过同名 Plan',
    importStrategyPrompt: '检测到 {count} 个 Plan 与现有配置冲突。处理方式：',
  },
  en: {
    apiKeyRequired: 'Enter an API key.',
    testFirst: 'Wait for a successful connection test first.',
    incompletePlan: 'The plan or API key is incomplete.',
    quotaUnavailable: 'does not provide a supported official quota endpoint.',
    missingPlan: 'The plan no longer exists.',
    deletePrompt: 'and its API key?',
    deleteAction: 'Delete',
    exportSuccess: 'Configuration exported to {path}.',
    exportFail: 'Export failed: {reason}',
    importSuccess: 'Import finished: {added} added, {reused} merged, {overwritten} replaced, {skipped} skipped, {keysImported} keys imported.',
    importFail: 'Import failed: {reason}',
    exportPrompt: 'Export BYOK COPILOT configuration',
    replacePrompt: 'Replace existing plans',
    mergePrompt: 'Merge plans with the same ID',
    skipPrompt: 'Skip plans with the same ID',
    importStrategyPrompt: '{count} plan(s) conflict with existing ones. How should I handle them?',
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
      modelSeries: this.store.getModelUsageSeries({ windowHours: 24, bucketHours: 1, maxModels: 6 }),
      series7d: this.store.getModelUsageSeries({ windowHours: 168, bucketHours: 6, maxModels: 6 }),
      series30d: this.store.getModelUsageSeries({ windowHours: 720, bucketHours: 24, maxModels: 6 }),
      allUsageRecords: this.store.getAllUsageRecords(),
    });
  }

  private async handle(message: any): Promise<void> {
    try {
      if (message.type === 'ready') this.sync();
      if (message.type === 'refreshAll') {
        const plans = this.store.getPlans();
        await Promise.allSettled(plans.map(async (plan) => {
          const key = await this.store.getApiKey(plan.id);
          if (!key) return;
          const existing = this.store.getQuotaSnapshots().find((snapshot) => snapshot.planId === plan.id);
          if (existing?.source === 'unsupported') return;
          try {
            const quota = await fetchPlanQuota(plan, key);
            if (quota) await this.store.setQuotaSnapshot(quota);
          } catch { /* skip individual failures on bulk refresh */ }
        }));
        this.sync();
      }
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
        const existing = this.store.getQuotaSnapshots().find((snapshot) => snapshot.planId === plan.id);
        if (existing?.source === 'unsupported') {
          this.sync();
          return;
        }
        let quota: Awaited<ReturnType<typeof fetchPlanQuota>>;
        try {
          quota = await fetchPlanQuota(plan, key);
        } catch (error) {
          throw error;
        }
        if (!quota) {
          await this.store.markQuotaUnsupported(plan.id);
          this.sync();
          this.notice('success', this.isEnglish
            ? `${plan.provider} does not expose an official quota endpoint. Auto refresh disabled.`
            : `${plan.provider} 未提供官方配额接口，已停止自动刷新。`, plan.id);
          return;
        }
        await this.store.setQuotaSnapshot(quota);
        this.sync();
        this.notice('success', this.isEnglish ? `Refreshed the official quota for ${plan.name}.` : `已刷新 ${plan.name} 的官方配额。`, plan.id);
      }
      if (message.type === 'saveSettings') {
        await this.store.setSettings(message.settings);
        this.provider.refresh();
        this.sync();
      }
      if (message.type === 'exportConfig') {
        await this.handleExport(typeof message.includeApiKeys === 'boolean' ? message.includeApiKeys : false);
        return;
      }
      if (message.type === 'importConfig') {
        await this.handleImport(typeof message.includeApiKeys === 'boolean' ? message.includeApiKeys : false);
        return;
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
      const planId = message && typeof message === 'object' && 'id' in message ? (message as { id?: string }).id : undefined;
      this.notice('error', error instanceof Error ? error.message : String(error), planId);
    }
  }

  private notice(level: 'success' | 'error', message: string, planId?: string): void {
    this.panel?.webview.postMessage({ type: 'notice', level, message, planId });
  }

  private async handleExport(includeApiKeys: boolean): Promise<void> {
    try {
      const defaultName = `byok-copilot-config${includeApiKeys ? '-with-keys' : ''}-${new Date().toISOString().slice(0, 10)}.byok.json`;
      const uri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(defaultName),
        filters: { 'BYOK COPILOT Config': ['json'], JSON: ['json'] },
        title: this.text('exportPrompt'),
      });
      if (!uri) return;
      const bundle = await this.store.exportConfig({ includeApiKeys });
      const payload = JSON.stringify(bundle, null, 2);
      await vscode.workspace.fs.writeFile(uri, Buffer.from(payload, 'utf-8'));
      const path = uri.fsPath || uri.toString();
      const template = this.text('exportSuccess');
      this.notice('success', template.replace('{path}', path));
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      const template = this.text('exportFail');
      this.notice('error', template.replace('{reason}', reason));
    }
  }

  private async handleImport(includeApiKeys: boolean): Promise<void> {
    try {
      const picked = await vscode.window.showOpenDialog({
        canSelectMany: false,
        filters: { 'BYOK COPILOT Config': ['json'], JSON: ['json'] },
        title: this.text('exportPrompt'),
      });
      if (!picked?.length) return;
      const raw = await vscode.workspace.fs.readFile(picked[0]);
      const text = Buffer.from(raw).toString('utf-8');
      const bundle = JSON.parse(text) as ConfigBundle;
      const strategy = await this.promptImportStrategy(bundle);
      if (!strategy) return;
      const summary = await this.store.importConfig(bundle, { strategy, includeApiKeys });
      this.provider.refresh();
      this.sync();
      const template = this.text('importSuccess');
      this.notice('success', template
        .replace('{added}', String(summary.added))
        .replace('{reused}', String(summary.reused))
        .replace('{overwritten}', String(summary.overwritten))
        .replace('{skipped}', String(summary.skipped))
        .replace('{keysImported}', String(summary.apiKeysImported)));
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      const template = this.text('importFail');
      this.notice('error', template.replace('{reason}', reason));
    }
  }

  private async promptImportStrategy(bundle: ConfigBundle): Promise<'replace' | 'merge' | 'skip' | undefined> {
    const existingIds = new Set(this.store.getPlans().map((plan) => plan.id));
    const conflicts = (bundle.plans ?? []).filter((plan) => existingIds.has(plan.id)).length;
    if (!conflicts) return 'merge';
    const prompt = this.text('importStrategyPrompt').replace('{count}', String(conflicts));
    const replace = this.text('replacePrompt');
    const merge = this.text('mergePrompt');
    const skip = this.text('skipPrompt');
    const choice = await vscode.window.showWarningMessage(prompt, { modal: true }, replace, merge, skip);
    if (choice === replace) return 'replace';
    if (choice === skip) return 'skip';
    if (choice === merge) return 'merge';
    return undefined;
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
