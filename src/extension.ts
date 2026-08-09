import * as vscode from 'vscode';
import { Dashboard } from './dashboard';
import { ByokLanguageModelProvider } from './provider';
import { PlanStore, seedDemoData } from './store';
import { buildUsagePanel, buildQuotaPanel } from './statusPanel';
import { discoverModels } from './api';

function formatCompact(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

export function activate(context: vscode.ExtensionContext): void {
  const store = new PlanStore(context);
  const provider = new ByokLanguageModelProvider(store);
  const dashboard = new Dashboard(store, provider, String(context.extension.packageJSON.version), context.extensionUri);
  const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 20);
  status.command = 'byokCopilot.openDashboard';

  const updateStatus = (): void => {
    const settings = store.getSettings();
    const english = settings.language === 'en';
    const locale = english ? 'en' : 'zh-CN';
    status.text = '$(key) BYOK';
    status.tooltip = english ? 'Open Free Tokens settings and usage' : '打开 免费 Token 配置与用量面板';
    if (settings.statusBarUsage === 'tokens') {
      const tokens = store.getUsage(30).reduce((total, usage) => total + usage.totalTokens, 0);
      status.text = `$(key) BYOK ${formatCompact(tokens, locale)} tok`;
      status.tooltip = buildUsagePanel(store);
    }
    if (settings.statusBarUsage === 'quota') {
      const preferred = settings.statusBarPlanId
        ? store.getQuotaSnapshots().find((snapshot) => snapshot.planId === settings.statusBarPlanId)
        : [...store.getQuotaSnapshots()].sort((left, right) => right.fetchedAt - left.fetchedAt)[0];
      const window = preferred?.windows[0];
      if (window && preferred) {
        const percent = window.percentUsed ?? (window.limit ? (window.used ?? 0) / window.limit * 100 : undefined);
        const value = window.unlimited
          ? (english ? 'Unlimited' : '不限量')
          : percent !== undefined
          ? `${Math.round(percent)}%`
          : `${english ? 'Remaining' : '剩余'} ${formatCompact(window.remaining ?? 0, locale)}`;
        status.text = `$(key) BYOK ${window.label} ${value}`;
        status.tooltip = buildQuotaPanel(store, preferred);
      }
    }
    status.show();
  };

  const onStoreChanged = (): void => {
    updateStatus();
  };

  updateStatus();

  /* Auto-migrate stale NVIDIA NIM Function UUID models to public model IDs. */
  (async () => {
    const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const isNvidiaNim = (url: string) => { try { return new URL(url).host.toLowerCase().includes('integrate.api.nvidia.com'); } catch { return false; } };
    let changed = false;
    for (const plan of store.getPlans()) {
      if (!isNvidiaNim(plan.baseUrl)) continue;
      const cleanModels = plan.models.filter((model) => !isUuid(model.id));
      if (cleanModels.length === plan.models.length) continue;
      let replacement = cleanModels;
      const key = await store.getApiKey(plan.id);
      if (key) {
        try {
          const models = await discoverModels(plan, key);
          if (models.length) replacement = models;
        } catch { /* Keep existing public model IDs when discovery is temporarily unavailable. */ }
      }
      await store.setModels(plan.id, replacement);
      changed = true;
    }
    if (changed) provider.refresh();
  })();

  context.subscriptions.push(
    status,
    store.onDidChange(onStoreChanged),
    vscode.commands.registerCommand('byokCopilot.openDashboard', () => dashboard.open()),
    vscode.commands.registerCommand('byokCopilot.seedDemoData', async () => {
      await seedDemoData(context);
      vscode.window.showInformationMessage('免费 Token 演示数据已注入。');
      provider.refresh();
      dashboard.open();
    }),
    vscode.lm.registerLanguageModelChatProvider('byok-copilot', provider),
  );

  /* 打开 VS Code 时自动检查更新（发现新版本才提示）。 */
  void dashboard.autoCheckUpdate();
}

export function deactivate(): void {}