import * as vscode from 'vscode';
import { Dashboard } from './dashboard';
import { ByokLanguageModelProvider } from './provider';
import { PlanStore } from './store';

// 像素条：使用 Emoji 色块呈现像素风格进度
const PIXEL_EMPTY = '⬛';
const PIXEL_GRADIENT = ['🟦', '🟦', '🟩', '🟩', '🟨', '🟧', '🟥'];

function pixelBar(percent: number | undefined, width: number = 12): string {
  if (percent === undefined || percent === null || Number.isNaN(percent)) return '⬜'.repeat(width);
  const clamped = Math.max(0, Math.min(100, percent));
  const filled = Math.max(0, Math.min(width, Math.round(clamped / 100 * width)));
  const empty = width - filled;
  const blocks = Array.from({ length: filled }, (_, index) => {
    const gradientIndex = Math.min(PIXEL_GRADIENT.length - 1, Math.floor(index / Math.max(1, width - 1) * PIXEL_GRADIENT.length));
    return clamped >= 90 && index >= filled - 3 ? '🟥' : PIXEL_GRADIENT[gradientIndex];
  }).join('');
  return `▐${blocks}${PIXEL_EMPTY.repeat(empty)}▌`;
}

function quotaUnit(unit: string, english: boolean): string {
  if (/request|call|次调用/i.test(unit)) return english ? 'calls' : '次调用';
  if (/token/i.test(unit)) return 'Token';
  return unit === 'quota' ? (english ? 'quota units' : '额度单位') : unit;
}

function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value);
}

function formatCompact(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

function formatTimeShort(value: number | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function activate(context: vscode.ExtensionContext): void {
  const store = new PlanStore(context);
  const provider = new ByokLanguageModelProvider(store);
  const dashboard = new Dashboard(store, provider, String(context.extension.packageJSON.version));
  const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 20);
  status.command = 'byokCopilot.openDashboard';

  const usageTooltip = (): vscode.MarkdownString => {
    const english = store.getSettings().language === 'en';
    const locale = english ? 'en' : 'zh-CN';
    const tooltip = new vscode.MarkdownString(undefined, true);
    tooltip.supportHtml = true;
    const usage = store.getUsage(30);
    const totals = usage.reduce((sum, item) => ({
      requests: sum.requests + item.requests,
      input: sum.input + item.inputTokens,
      output: sum.output + item.outputTokens,
      total: sum.total + item.totalTokens,
      failures: sum.failures + item.failures,
    }), { requests: 0, input: 0, output: 0, total: 0, failures: 0 });

    // 头部
    tooltip.appendMarkdown(english ? '### 📊 Local usage in the last 30 days\n\n' : '### 📊 最近 30 天本地用量\n\n');
    tooltip.appendMarkdown('```\n');
    tooltip.appendMarkdown(english
      ? `API calls   ${formatNumber(totals.requests, locale).padStart(7)}\nToken usage ${formatNumber(totals.total, locale).padStart(7)}\nFailures    ${formatNumber(totals.failures, locale).padStart(7)}\n`
      : `API 调用 ${formatNumber(totals.requests, locale).padStart(7)} 次\nToken 使用量 ${formatNumber(totals.total, locale).padStart(4)}\n失败 ${formatNumber(totals.failures, locale).padStart(10)} 次\n`);
    tooltip.appendMarkdown('```\n\n');
    tooltip.appendMarkdown(english
      ? `▸ Input **${formatNumber(totals.input, locale)}** · Output **${formatNumber(totals.output, locale)}**\n\n`
      : `▸ 输入 **${formatNumber(totals.input, locale)}** · 输出 **${formatNumber(totals.output, locale)}**\n\n`);

    // 输入/输出比色块条（按总量做 12 格比例尺）
    const total = Math.max(1, totals.input + totals.output);
    const inputCells = Math.round((totals.input / total) * 12);
    const outputCells = 12 - inputCells;
    tooltip.appendMarkdown(english ? '**Input/output ratio**\n\n' : '**输入输出占比**\n\n');
    tooltip.appendMarkdown('```\n');
    tooltip.appendMarkdown(`${english ? 'Input ' : '输入 '}${'🟦'.repeat(inputCells)}${'⬜'.repeat(outputCells)}\n`);
    tooltip.appendMarkdown(`${english ? 'Output' : '输出 '}${'⬜'.repeat(inputCells)}${'🟧'.repeat(outputCells)}\n`);
    tooltip.appendMarkdown('```\n\n');

    // 各 Plan 用量列表
    if (usage.length) {
      tooltip.appendMarkdown('---\n\n');
      tooltip.appendMarkdown(english ? '**▎Usage by plan**\n\n' : '**▎各 Plan 用量**\n\n');
      tooltip.appendMarkdown('```\n');
      for (const item of usage) {
        const plan = store.getPlan(item.planId);
        const name = (plan?.name ?? (english ? 'Deleted plan' : '已删除 Plan')).slice(0, 14).padEnd(14);
        tooltip.appendMarkdown(`${name} ${formatCompact(item.totalTokens, locale).padStart(7)} tok · ${formatCompact(item.requests, locale).padStart(5)} ${english ? 'calls' : '次调用'}\n`);
      }
      tooltip.appendMarkdown('```\n');
    }
    return tooltip;
  };

  const quotaTooltip = (snapshot: ReturnType<PlanStore['getQuotaSnapshots']>[number]): vscode.MarkdownString => {
    const english = store.getSettings().language === 'en';
    const locale = english ? 'en' : 'zh-CN';
    const tooltip = new vscode.MarkdownString(undefined, true);
    tooltip.supportHtml = true;
    const plan = store.getPlan(snapshot.planId);
    tooltip.appendMarkdown(english ? '### 🎯 Official quota details\n\n' : '### 🎯 官方配额详情\n\n');
    tooltip.appendMarkdown(`> **${plan?.provider ?? (english ? 'Unknown provider' : '未知平台')}** / ${plan?.name ?? (english ? 'Deleted plan' : '已删除 Plan')}\n\n`);
    tooltip.appendMarkdown('---\n\n');

    for (const window of snapshot.windows) {
      const used = window.used ?? (window.limit !== undefined && window.remaining !== undefined ? Math.max(0, window.limit - window.remaining) : undefined);
      const remaining = window.remaining ?? (window.limit !== undefined && used !== undefined ? Math.max(0, window.limit - used) : undefined);
      const percent = window.percentUsed ?? (window.limit ? (used ?? 0) / window.limit * 100 : undefined);
      const unit = quotaUnit(window.unit, english);

      tooltip.appendMarkdown(`#### ▎${window.label}\n\n`);

      if (window.unlimited) {
        tooltip.appendMarkdown('```\n');
        tooltip.appendMarkdown('🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩  ∞\n');
        tooltip.appendMarkdown('```\n');
        tooltip.appendMarkdown(english ? '**♾️ Unlimited**\n\n' : '**♾️ 不限量**\n\n');
      } else {
        const bar = pixelBar(percent, 14);
        const pctText = percent !== undefined ? ` ${Math.round(percent)}%` : '';
        tooltip.appendMarkdown('```\n');
        tooltip.appendMarkdown(bar + pctText + '\n');
        tooltip.appendMarkdown('```\n');
        tooltip.appendMarkdown(`▸ ${english ? 'Remaining' : '剩余调用额度'} **${remaining !== undefined ? formatNumber(remaining, locale) : (english ? 'Unknown' : '未知')}** ${unit}`);
        if (used !== undefined) {
          tooltip.appendMarkdown(`  \n▸ ${english ? 'Used' : '已用调用额度'} **${formatNumber(used, locale)}**${window.limit !== undefined ? ` / ${formatNumber(window.limit, locale)}` : ''} ${unit}`);
        }
        tooltip.appendMarkdown('\n\n');
      }

      if (window.resetAt) {
        tooltip.appendMarkdown(`🕒 ${english ? 'Resets' : '重置时间'}: \`${formatTimeShort(window.resetAt)}\`\n\n`);
      }
    }

    // 本地用量 + 配额更新时间
    const localUsage = store.getUsage(30).find((item) => item.planId === snapshot.planId);
    tooltip.appendMarkdown('---\n\n');
    tooltip.appendMarkdown(english ? '**📈 Local 30-day usage**\n\n' : '**📈 本地 30 天**\n\n');
    tooltip.appendMarkdown('```\n');
    tooltip.appendMarkdown(english
      ? `Token usage ${formatCompact(localUsage?.totalTokens ?? 0, locale).padStart(7)}\nAPI calls   ${formatCompact(localUsage?.requests ?? 0, locale).padStart(7)}\n`
      : `Token 使用量 ${formatCompact(localUsage?.totalTokens ?? 0, locale).padStart(7)}\nAPI 调用    ${formatCompact(localUsage?.requests ?? 0, locale).padStart(7)} 次\n`);
    tooltip.appendMarkdown('```\n\n');
    tooltip.appendMarkdown(`⏱️ ${english ? 'Quota updated' : '配额更新'}: \`${formatTimeShort(snapshot.fetchedAt)}\``);

    return tooltip;
  };

  const updateStatus = (): void => {
    const settings = store.getSettings();
    const english = settings.language === 'en';
    const locale = english ? 'en' : 'zh-CN';
    status.text = '$(key) BYOK';
    status.tooltip = english ? 'Open BYOK COPILOT settings and usage' : '打开 BYOK COPILOT 配置与用量面板';
    if (settings.statusBarUsage === 'tokens') {
      const tokens = store.getUsage(30).reduce((total, usage) => total + usage.totalTokens, 0);
      status.text = `$(key) BYOK ${formatCompact(tokens, locale)} tok`;
      status.tooltip = usageTooltip();
    }
    if (settings.statusBarUsage === 'quota') {
      const preferred = settings.statusBarPlanId
        ? store.getQuotaSnapshots().find((snapshot) => snapshot.planId === settings.statusBarPlanId)
        : [...store.getQuotaSnapshots()].sort((left, right) => right.fetchedAt - left.fetchedAt)[0];
      const window = preferred?.windows[0];
      if (window) {
        const percent = window.percentUsed ?? (window.limit ? (window.used ?? 0) / window.limit * 100 : undefined);
        const value = window.unlimited
          ? (english ? 'Unlimited' : '不限量')
          : percent !== undefined
          ? `${Math.round(percent)}%`
          : `${english ? 'Remaining' : '剩余'} ${formatCompact(window.remaining ?? 0, locale)}`;
        status.text = `$(key) BYOK ${window.label} ${value}`;
        status.tooltip = quotaTooltip(preferred);
      }
    }
    status.show();
  };

  const onSettingsChanged = (): void => {
    provider.refresh();
    updateStatus();
  };

  updateStatus();
  context.subscriptions.push(
    status,
    store.onDidChange(onSettingsChanged),
    vscode.commands.registerCommand('byokCopilot.openDashboard', () => dashboard.open()),
    vscode.commands.registerCommand('byokCopilot.manageLanguageModels', async () => {
      const commands = await vscode.commands.getCommands(true);
      const command = [
        'workbench.action.chat.manageLanguageModels',
        'workbench.action.chat.openLanguageModelsEditor',
      ].find((candidate) => commands.includes(candidate))
        ?? commands.find((candidate) => /manage.*language.*model|language.*model.*manage/i.test(candidate));
      if (command) {
        await vscode.commands.executeCommand(command);
        return;
      }
      await vscode.commands.executeCommand('workbench.action.showCommands');
      const english = store.getSettings().language === 'en';
      void vscode.window.showInformationMessage(english
        ? 'Run “Chat: Manage Language Models” from the Command Palette, then use the eye icon to hide models you do not need.'
        : '请在命令面板运行“Chat: Manage Language Models”，再用眼睛图标隐藏不需要的模型。');
    }),
    vscode.lm.registerLanguageModelChatProvider('byok-copilot', provider),
  );
}

export function deactivate(): void {}