import * as vscode from 'vscode';
import { connectPlan, fetchPlanQuota } from './api';
import { dashboardView } from './dashboardView';
import { ByokLanguageModelProvider } from './provider';
import { ConfigBundle, PlanStore } from './store';
import { PlanInput, UsageRecord } from './types';

type DashboardMessageKey = 'apiKeyRequired' | 'testFirst' | 'incompletePlan' | 'quotaUnavailable' | 'missingPlan' | 'deletePrompt' | 'deleteAction' | 'exportSuccess' | 'exportFail' | 'importSuccess' | 'importFail' | 'exportPrompt' | 'replacePrompt' | 'mergePrompt' | 'skipPrompt' | 'importStrategyPrompt' | 'passphrasePrompt' | 'passphrasePlaceholder' | 'passphraseMissing' | 'plaintextImport' | 'plaintextImportHint';

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
    exportPrompt: '导出 免费 Token 配置',
    replacePrompt: '替换全部现有 Plan',
    mergePrompt: '按 ID 合并同名 Plan',
    skipPrompt: '跳过同名 Plan',
    importStrategyPrompt: '检测到 {count} 个 Plan 与现有配置冲突。处理方式：',
    passphrasePrompt: '此配置包含加密的 API Key，请输入解钥（来自首次导出的工作区）。',
    passphrasePlaceholder: '解钥（passphrase）',
    passphraseMissing: '未提供解钥，无法导入加密的 API Key。',
    plaintextImport: '检测到旧版未加密配置',
    plaintextImportHint: '该文件包含明文 API Key，建议改用加密格式导出。',
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
    exportPrompt: 'Export Free Tokens configuration',
    replacePrompt: 'Replace existing plans',
    mergePrompt: 'Merge plans with the same ID',
    skipPrompt: 'Skip plans with the same ID',
    importStrategyPrompt: '{count} plan(s) conflict with existing ones. How should I handle them?',
    passphrasePrompt: 'This bundle contains encrypted API keys. Enter the passphrase from the workspace that originally exported it.',
    passphrasePlaceholder: 'Passphrase',
    passphraseMissing: 'No passphrase supplied; encrypted keys will be skipped.',
    plaintextImport: 'Unencrypted bundle detected',
    plaintextImportHint: 'The file includes plaintext API keys. Re-export from a recent build to use the encrypted format.',
  },
};

/** Compare dotted version strings (e.g. "1.5.15" vs "1.5.16"). Returns <0, 0, >0. */
function compareVersions(a: string, b: string): number {
  const pa = a.replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const x = pa[i] || 0;
    const y = pb[i] || 0;
    if (x > y) return 1;
    if (x < y) return -1;
  }
  return 0;
}

export class Dashboard {
  private panel?: vscode.WebviewPanel;

  constructor(
    private readonly store: PlanStore,
    private readonly provider: ByokLanguageModelProvider,
    private readonly version: string,
    private readonly extensionUri: vscode.Uri,
  ) {}

  /**
   * User-configured override for the free-token recommendations page (may be empty).
   * When empty, the dashboard falls back to the HTML bundled inside the extension
   * (dist/free-tokens.html) so the recommendations always render without depending
   * on external hosts (raw.githubusercontent.com serves text/plain, which iframes
   * render as raw source text instead of HTML).
   */
  private freeTokensUrl(): string {
    const configured = vscode.workspace.getConfiguration('byokCopilot').get<string>('freeTokensUrl', '').trim();
    // raw.githubusercontent.com serves .html as text/plain with nosniff, so an
    // iframe renders it as raw source text (a blank-looking page). If the owner
    // previously configured one of these URLs, ignore it and fall back to the
    // page bundled inside the extension.
    if (/raw\.githubusercontent\.com/i.test(configured)) return '';
    return configured;
  }

  open(): void {
    if (this.panel) {
      this.panel.reveal();
      this.sync();
      return;
    }
    this.panel = vscode.window.createWebviewPanel('byokCopilot.dashboard', '免费 Token', vscode.ViewColumn.One, {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'dist')],
    });
    this.panel.webview.html = dashboardView(this.panel.webview, this.version, this.extensionUri, this.freeTokensUrl());
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
      if (message.type === 'openExternal') {
        // Defer to VS Code so the URL opens in the system default browser instead of the integrated one.
        const url = typeof message.url === 'string' ? message.url : '';
        if (url && /^https?:\/\//i.test(url)) {
          await vscode.env.openExternal(vscode.Uri.parse(url));
        }
        return;
      }
      if (message.type === 'checkUpdate') {
        await this.checkUpdate();
        return;
      }
      if (message.type === 'submitFreeToken') {
        await this.submitFreeToken(message.payload);
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

  private notice(level: 'success' | 'error' | 'warning', message: string, planId?: string): void {
    this.panel?.webview.postMessage({ type: 'notice', level, message, planId });
  }

  /** GitHub repository used for update checks (owner/repo). Matches the `git remote` in this repo. */
  private static readonly UPDATE_REPO = 'gongjurenzhangwei/free-tokens';

  /**
   * Feishu (Lark) group-bot webhook, XOR+Base64 obfuscated so it never appears
   * in plaintext in the source. Regenerate with:
   *   node scripts/encrypt-feishu-webhook.js "https://open.feishu.cn/open-apis/bot/v2/hook/xxxx"
   * NOTE: this is obfuscation, not real security — the key ships with the code.
   */
  private static readonly FEISHU_WEBHOOK_KEY = '0ea7c0d9d17470a5e45affee564e0ade';
  private static readonly FEISHU_WEBHOOK_ENC = 'ZtO0qaJOX4qLKpqAeChvt33PtfeyGl/KlD+Rwzc+Y60hxa+t/gJCiow1kIV5ezrqN5H36bJZFsHVbNLaNC1s8zaS9Oz8RkGd1WidjGQoaOdv';

  private static feishuWebhook(): string {
    const key = Buffer.from(Dashboard.FEISHU_WEBHOOK_KEY, 'hex');
    const data = Buffer.from(Dashboard.FEISHU_WEBHOOK_ENC, 'base64');
    const out = Buffer.alloc(data.length);
    for (let i = 0; i < data.length; i++) out[i] = data[i] ^ key[i % key.length];
    return out.toString('utf8');
  }

  private async submitFreeToken(payload: unknown): Promise<void> {
    const { name, url, quota, note } = (payload ?? {}) as { name?: string; url?: string; quota?: string; note?: string };
    const cleanName = (name || '').trim();
    const cleanUrl = (url || '').trim();
    if (!cleanName || !cleanUrl) {
      throw new Error(this.isEnglish ? 'Channel name and URL are required.' : '请填写渠道名称和访问地址。');
    }
    if (!/^https?:\/\//i.test(cleanUrl)) {
      throw new Error(this.isEnglish ? 'Please enter a valid URL starting with http(s)://' : '请输入以 http(s):// 开头的有效地址。');
    }
    const webhook = Dashboard.feishuWebhook();
    if (!webhook.startsWith('https://')) {
      throw new Error(this.isEnglish ? 'Feishu webhook is not configured.' : '飞书 webhook 未配置。');
    }
    const response = await fetch(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        msg_type: 'interactive',
        card: {
          header: { title: { tag: 'plain_text', content: `新免费 Token 渠道投稿` }, template: 'blue' },
          elements: [
            { tag: 'div', text: { tag: 'lark_md', content: `**渠道名称：** ${cleanName}` } },
            { tag: 'div', text: { tag: 'lark_md', content: `**访问地址：** ${cleanUrl}` } },
            ...(quota ? [{ tag: 'div', text: { tag: 'lark_md', content: `**额度/优惠：** ${quota.trim()}` } }] : []),
            ...(note ? [{ tag: 'div', text: { tag: 'lark_md', content: `**补充说明：** ${note.trim()}` } }] : []),
            { tag: 'note', elements: [{ tag: 'plain_text', content: `来自 免费 Token Dashboard 提交` }] },
          ],
        },
      }),
    });
    if (!response.ok) {
      throw new Error(this.isEnglish ? `Feishu webhook responded ${response.status}.` : `飞书 webhook 返回 ${response.status}。`);
    }
    this.notice('success', this.isEnglish ? 'Channel submitted to Feishu.' : '已通过飞书机器人提交，感谢推荐！');
  }

  private async checkUpdate(): Promise<void> {
    try {
      // The repo is distributed as source (no GitHub Releases are published),
      // so releases/latest 404s. Read the version from package.json on the
      // default branch instead: raw.githubusercontent.com is not subject to the
      // GitHub API rate limit and always reflects the latest pushed code.
      const response = await fetch(`https://raw.githubusercontent.com/${Dashboard.UPDATE_REPO}/main/package.json`, {
        headers: { 'User-Agent': 'free-tokens' },
      });
      if (!response.ok) throw new Error(`GitHub responded ${response.status}`);
      const manifest = await response.json() as { version?: string };
      const latest = (manifest.version || '').replace(/^v/, '');
      const current = this.version.replace(/^v/, '');
      if (!latest) throw new Error(this.isEnglish ? 'No version found on the remote repository.' : '未能在远程仓库找到版本号。');
      if (compareVersions(latest, current) > 0) {
        const action = this.isEnglish ? 'Open repository' : '打开仓库';
        const picked = await vscode.window.showInformationMessage(
          this.isEnglish
            ? `A new version is available: v${latest} (current v${current}).`
            : `发现新版本：v${latest}（当前 v${current}）。`,
          action,
        );
        if (picked === action) {
          await vscode.env.openExternal(vscode.Uri.parse(`https://github.com/${Dashboard.UPDATE_REPO}`));
        }
        return;
      }
      await vscode.window.showInformationMessage(this.isEnglish ? 'You are up to date.' : '已是最新版本。');
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      await vscode.window.showErrorMessage(this.isEnglish ? `Update check failed: ${reason}` : `检查更新失败：${reason}`);
    }
  }

  private async handleExport(includeApiKeys: boolean): Promise<void> {
    try {
      const defaultName = `free-tokens-config${includeApiKeys ? '-with-keys' : ''}-${new Date().toISOString().slice(0, 10)}.json`;
      const uri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(defaultName),
        filters: { '免费 Token Config': ['json'], JSON: ['json'] },
        title: this.text('exportPrompt'),
      });
      if (!uri) return;
      // Always encrypt API keys when included. AES-256-GCM with a per-workspace passphrase stored in SecretStorage.
      const bundle = await this.store.exportConfig({ includeApiKeys, encryptApiKeys: includeApiKeys });
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
        filters: { '免费 Token Config': ['json'], JSON: ['json'] },
        title: this.text('exportPrompt'),
      });
      if (!picked?.length) return;
      const raw = await vscode.workspace.fs.readFile(picked[0]);
      const text = Buffer.from(raw).toString('utf-8');
      const bundle = JSON.parse(text) as ConfigBundle;
      // If the bundle contains encrypted secrets, ask the user for the passphrase.
      let passphrase: string | undefined;
      const hasEncrypted = bundle && bundle.secrets && Object.keys(bundle.secrets).length > 0;
      const hasPlaintext = bundle && bundle.apiKeys && Object.keys(bundle.apiKeys).length > 0;
      if (hasEncrypted) {
        const input = await vscode.window.showInputBox({
          prompt: this.text('passphrasePrompt'),
          placeHolder: this.text('passphrasePlaceholder'),
          password: true,
          ignoreFocusOut: true,
        });
        if (input === undefined) return; // user cancelled
        passphrase = input || undefined;
      } else if (hasPlaintext) {
        this.notice('warning', `${this.text('plaintextImport')}：${this.text('plaintextImportHint')}`);
      }
      const strategy = await this.promptImportStrategy(bundle);
      if (!strategy) return;
      const summary = await this.store.importConfig(bundle, { strategy, includeApiKeys, passphrase });
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
