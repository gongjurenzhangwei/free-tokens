import * as vscode from 'vscode';
import { PlanStore } from './store';

type Language = 'zh-CN' | 'en';

function formatCompact(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value);
}

function formatTimeShort(value: number | undefined, english: boolean): string {
  if (!value) return '—';
  const d = new Date(value);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  return `${month}/${day} ${hour}:${minute}`;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

/* ── shared card fragment builders ── */

const C = {
  surface: 'var(--vscode-editorHoverWidget-background)',
  surfaceSoft: 'var(--vscode-editor-background)',
  line: 'var(--vscode-editorWidget-border)',
  muted: 'var(--vscode-descriptionForeground)',
  text: 'var(--vscode-editor-foreground)',
  cyan: 'var(--vscode-textLink-foreground)',
  mono: 'var(--vscode-editor-font-family)',
  green: 'var(--vscode-testing-iconPassed)',
  amber: 'var(--vscode-editorWarning-foreground)',
  red: 'var(--vscode-errorForeground)',
};

function usageNumbers(items: { label: string; value: string }[]): string {
  const cells = items.map((item) =>
    `<div style="padding:12px;border:1px solid ${C.line};border-radius:6px;background:${C.surfaceSoft};"><span style="display:block;color:${C.muted};font-size:10px;">${item.label}</span><strong style="display:block;margin-top:7px;font:600 16px ${C.mono};">${item.value}</strong></div>`
  ).join('');
  return `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:18px;">${cells}</div>`;
}

function quotaRows(windows: any[], language: Language): string {
  const english = language === 'en';
  const rows = windows.map((window: any) => {
    const used = window.used ?? (window.limit !== undefined && window.remaining !== undefined ? Math.max(0, window.limit - window.remaining) : 0);
    const percent = window.percentUsed ?? (window.limit ? (used || 0) / window.limit * 100 : 0);
    const barWidth = Math.min(100, percent);
    const barColor = percent >= 90 ? C.red : percent >= 70 ? C.amber : C.cyan;
    const labelPart = escapeHtml(window.label);
    const percentPart = window.unlimited ? '∞' : `${Math.round(percent)}%`;
    const bar = window.unlimited
      ? `<div style="height:8px;border-radius:4px;background:${C.surfaceSoft};"></div>`
      : `<div style="height:8px;overflow:hidden;margin:8px 0;border-radius:4px;background:${C.surfaceSoft};"><span style="display:block;height:100%;width:${barWidth}%;background:${barColor};"></span></div>`;
    const detail = window.unlimited ? 'UNLIMITED' : `${formatNumber(used || 0, english ? 'en' : 'zh-CN')} / ${formatNumber(window.limit || 0, english ? 'en' : 'zh-CN')} ${escapeHtml(window.unit || '')}`;
    return `<div style=""><div style="display:flex;justify-content:space-between;"><span style="font-size:12px;">${labelPart}</span><strong style="font:600 12px ${C.mono};">${percentPart}</strong></div>${bar}<small style="color:${C.muted};font:500 9px ${C.mono};">${detail}</small></div>`;
  }).join('');
  return `<div style="display:flex;flex-direction:column;gap:16px;border-top:1px solid ${C.line};padding-top:18px;">${rows}</div>`;
}

function planCard(opts: {
  name: string;
  provider: string;
  protocol: string;
  meta?: string;
  usage: { requests: number; inputTokens: number; outputTokens: number; failures: number } | undefined;
  windows?: any[];
  language: Language;
}): string {
  const english = opts.language === 'en';
  const locale = english ? 'en' : 'zh-CN';
  const t = english
    ? { apiCalls: 'API calls', input: 'Input', output: 'Output', failures: 'Failures' }
    : { apiCalls: 'API 调用', input: '输入', output: '输出', failures: '失败' };

  const header = `<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px;">
    <div><strong style="font-size:15px;font-weight:650;">${escapeHtml(opts.name)}</strong><p style="margin:4px 0 0;color:${C.muted};font-size:12px;">${escapeHtml(opts.provider)} / ${escapeHtml(opts.protocol)}</p></div>
    ${opts.meta ? `<span style="display:inline-flex;align-items:center;gap:6px;border:1px solid ${C.line};border-radius:999px;padding:2px 9px;color:${C.muted};background:${C.surfaceSoft};font:500 10px ${C.mono};letter-spacing:0.04em;">${opts.meta}</span>` : ''}
  </div>`;

  const nums = usageNumbers([
    { label: t.apiCalls, value: formatNumber(opts.usage?.requests || 0, locale) },
    { label: t.input, value: formatNumber(opts.usage?.inputTokens || 0, locale) },
    { label: t.output, value: formatNumber(opts.usage?.outputTokens || 0, locale) },
    { label: t.failures, value: formatNumber(opts.usage?.failures || 0, locale) },
  ]);

  const quota = opts.windows && opts.windows.length
    ? quotaRows(opts.windows, opts.language)
    : `<div style="display:flex;min-height:60px;align-items:center;gap:12px;border-top:1px solid ${C.line};color:${C.muted};"><span style="flex:1;">${english ? 'Official quota not fetched' : '尚未获取官方配额'}</span></div>`;

  return `<div style="border:1px solid ${C.line};border-radius:8px;padding:18px;background:${C.surface};">${header}${nums}${quota}</div>`;
}

/* ── panel builders ── */

export function buildUsagePanel(store: PlanStore): vscode.MarkdownString {
  const settings = store.getSettings();
  const english = settings.language === 'en';
  const locale = english ? 'en' : 'zh-CN';
  const tooltip = new vscode.MarkdownString(undefined, true);
  tooltip.supportHtml = true;
  tooltip.supportThemeIcons = true;
  tooltip.isTrusted = true;

  const usage = store.getUsage(30);
  const plans = store.getPlans();

  // Aggregate totals header
  const totals = usage.reduce((sum, item) => ({
    requests: sum.requests + item.requests,
    input: sum.input + item.inputTokens,
    output: sum.output + item.outputTokens,
    total: sum.total + item.totalTokens,
    failures: sum.failures + item.failures,
  }), { requests: 0, input: 0, output: 0, total: 0, failures: 0 });

  tooltip.appendMarkdown(`### $(pulse) BYOK COPILOT \`${english ? 'LAST 30D' : '最近 30 天'}\`\n\n`);
  tooltip.appendMarkdown(usageNumbers([
    { label: english ? 'API calls' : 'API 调用', value: formatNumber(totals.requests, locale) },
    { label: english ? 'Input' : '输入', value: formatNumber(totals.input, locale) },
    { label: english ? 'Output' : '输出', value: formatNumber(totals.output, locale) },
    { label: english ? 'Failures' : '失败', value: formatNumber(totals.failures, locale) },
  ]));

  // Per-plan cards
  for (const plan of plans) {
    const planUsage = usage.find((item) => item.planId === plan.id);
    tooltip.appendMarkdown(planCard({
      name: plan.name,
      provider: plan.provider,
      protocol: plan.protocol.toUpperCase(),
      usage: planUsage,
      language: settings.language as Language,
    }));
    tooltip.appendMarkdown('\n\n');
  }

  tooltip.appendMarkdown(`---\n\n$(sync) _${english ? 'Click to open Dashboard' : '点击打开完整 Dashboard'}_\n`);
  return tooltip;
}

export function buildQuotaPanel(store: PlanStore, snapshot: NonNullable<ReturnType<PlanStore['getQuotaSnapshots']>[number]>): vscode.MarkdownString {
  const settings = store.getSettings();
  const english = settings.language === 'en';
  const tooltip = new vscode.MarkdownString(undefined, true);
  tooltip.supportHtml = true;
  tooltip.supportThemeIcons = true;
  tooltip.isTrusted = true;

  const plan = store.getPlan(snapshot.planId);
  const name = plan?.name ?? (english ? 'Deleted' : '已删除');
  const provider = plan?.provider ?? (english ? 'Unknown' : '未知');
  const protocol = plan?.protocol?.toUpperCase() ?? '—';
  const localUsage = store.getUsage(30).find((item) => item.planId === snapshot.planId);

  const fetchedAt = formatTimeShort(snapshot.fetchedAt, english);
  const meta = english ? `Updated ${fetchedAt}` : `${fetchedAt} 前更新`;

  tooltip.appendMarkdown(`### $(dashboard) BYOK COPILOT \`${english ? 'QUOTA' : '官方配额'}\`\n\n`);
  tooltip.appendMarkdown(planCard({
    name,
    provider,
    protocol,
    meta,
    usage: localUsage,
    windows: snapshot.windows,
    language: settings.language as Language,
  }));
  tooltip.appendMarkdown('\n\n');

  tooltip.appendMarkdown(`---\n\n$(sync) _${english ? 'Auto refresh every 5 min · Click to open Dashboard' : '每 5 分钟自动刷新 · 点击打开完整 Dashboard'}_\n`);
  return tooltip;
}
