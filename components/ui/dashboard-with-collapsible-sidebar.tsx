import {
  Activity, AlertTriangle, BarChart3, Boxes, Check, ChevronRight, CircleHelp, Cpu, Database,
  Download, Eye, EyeOff, Gauge, KeyRound, Languages, LayoutDashboard, Menu, Moon,
  PackageOpen, PanelLeftClose, PanelLeftOpen, Pencil, Plus, RefreshCw, Search, Settings,
  ShieldCheck, Sun, Trash2, X, Zap,
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import type {
  ApiProtocol, DashboardSettings, ModelSeries, ModelSeriesPoint, PlanConfig, PlanInput, PlanModel, QuotaSnapshot, UsageSummary,
} from '../../src/types';

declare function acquireVsCodeApi(): { postMessage(message: unknown): void };

type View = 'overview' | 'connections' | 'models' | 'usage' | 'settings';
type ModelWithCustom = PlanModel & { custom?: boolean };
type DashboardState = {
  plans: PlanConfig[];
  planAvailability: Record<string, boolean>;
  usage: UsageSummary[];
  quotas: QuotaSnapshot[];
  settings: DashboardSettings;
  modelSeries: ModelSeries[];
  series7d: ModelSeries[];
  series30d: ModelSeries[];
  allUsageRecords: { planId: string; modelId: string; timestamp: number; requests: number; totalTokens: number; success: boolean }[];
};
type Connection = { protocol: ApiProtocol; models: ModelWithCustom[] };

const vscode = acquireVsCodeApi();
const emptyState: DashboardState = {
  plans: [], planAvailability: {}, usage: [], quotas: [],
  settings: { statusBarUsage: 'off', dashboardTheme: 'system', language: 'zh-CN' },
  modelSeries: [], series7d: [], series30d: [], allUsageRecords: [],
};
const TREND_PALETTE = ['#6d8cff', '#34d399', '#f59e0b', '#ec4899', '#a78bfa', '#2dd4bf', '#f87171', '#facc15'];
const presets: Record<string, { provider: string; url: string; protocol: ApiProtocol }> = {
  custom: { provider: 'Custom', url: '', protocol: 'openai' },
  agnes: { provider: 'Agnes AI', url: 'https://apihub.agnes-ai.com/v1', protocol: 'openai' },
  minimax: { provider: 'MiniMax', url: 'https://api.minimaxi.com/v1', protocol: 'openai' },
  opencode: { provider: 'OpenCode Zen', url: 'https://opencode.ai/zen/v1', protocol: 'openai' },
  nvidia: { provider: 'NVIDIA NIM', url: 'https://integrate.api.nvidia.com/v1', protocol: 'openai' },
  openai: { provider: 'OpenAI', url: 'https://api.openai.com', protocol: 'responses' },
  anthropic: { provider: 'Anthropic', url: 'https://api.anthropic.com', protocol: 'anthropic' },
  deepseek: { provider: 'DeepSeek', url: 'https://api.deepseek.com', protocol: 'openai' },
  qwen: { provider: 'Qwen', url: 'https://dashscope.aliyuncs.com/compatible-mode', protocol: 'openai' },
  moonshot: { provider: 'Moonshot', url: 'https://api.moonshot.cn', protocol: 'openai' },
  zhipu: { provider: 'Zhipu', url: 'https://open.bigmodel.cn/api/paas', protocol: 'openai' },
  siliconflow: { provider: 'SiliconFlow', url: 'https://api.siliconflow.cn', protocol: 'openai' },
  openrouter: { provider: 'OpenRouter', url: 'https://openrouter.ai/api', protocol: 'openai' },
  groq: { provider: 'Groq', url: 'https://api.groq.com/openai', protocol: 'openai' },
  mistral: { provider: 'Mistral', url: 'https://api.mistral.ai', protocol: 'openai' },
  together: { provider: 'Together AI', url: 'https://api.together.xyz', protocol: 'openai' },
  xai: { provider: 'xAI', url: 'https://api.x.ai', protocol: 'openai' },
};
const protocolNames: Record<ApiProtocol, string> = {
  responses: 'Responses API', openai: 'Chat Completions', anthropic: 'Anthropic Messages',
};
const copy = {
  'zh-CN': {
    overview: '概览', connections: '接入平台', models: '模型', usage: '用量与配额', settings: '设置', workspace: '控制中心',
    subtitle: '管理模型供应商、访问密钥与本地用量', newPlan: '接入 Plan', enabledPlans: '已启用 Plan', availableModels: '可用模型',
    apiCalls: 'API 调用', totalTokens: 'Token 总量', connectionsTitle: '连接管理', connectionsDesc: '供应商、协议、模型与凭据状态',
    noPlans: '尚未接入 Plan', noPlansDesc: '连接首个供应商后，模型会出现在 VS Code Chat 选择器中。', provider: '供应商',
    protocol: '协议', localUsage: '30 天用量', state: '状态', available: '可用', disabled: '已停用', noModels: '无模型', noKey: '无密钥',
    edit: '编辑', remove: '删除', refresh: '刷新配额', refreshPlan: '刷新此 Plan', refreshing: '正在刷新…', lastRefreshed: (when: string) => `${when} 前更新`, refreshSoon: '每 5 分钟自动刷新', autoRefreshOn: '自动刷新已开启', autoRefreshOff: '自动刷新已暂停', modelLibrary: '模型库', modelLibraryDesc: '所有已接入并选择的模型',
    search: '搜索模型或供应商', noModelMatch: '没有匹配的模型', usageTitle: '用量与官方配额', usageDesc: '本地 30 天请求统计与供应商配额快照',
    input: '输入', output: '输出', failures: '失败', quotaPending: '尚未获取官方配额', quotaUnsupported: '该供应商未提供官方配额接口', quotaUnsupportedHint: '已停止自动刷新。', modelInvalid: '模型 ID 不可用', modelInvalidHint: 'Function UUID 不能用于 Chat。请改用真实的 NIM 模型名，例如 meta/llama-3.1-70b-instruct。', settingsTitle: '控制台设置', settingsDesc: '调整模型可见性、状态栏和外观',
    onlyAvailable: '仅显示可用模型', onlyAvailableDesc: '只向 Chat 暴露已启用、有模型且已保存 API Key 的 Plan。',
    configTitle: '配置备份', configDesc: '导出或导入所有 Plan、设置、用量记录与配额快照。',
    exportConfig: '导出', importConfig: '导入', includeApiKeys: '包含 API Key', includeApiKeysDesc: '把已保存的 API Key 一起打包到文件里；关闭后可分享脱敏配置。',
    modelTrendTitle: '模型调用趋势', modelTrendDesc: '过去 24 小时每个模型的请求量 / Token 用量折线，每条线代表一个模型。', modelTrendEmpty: '暂无调用记录，发送第一条 Chat 请求后会显示折线。', trendLast24h: '最近 24 小时', trendHour: '小时', trendRequests: '次调用', trendTokens: 'Token', trendModeRequests: '调用量', trendModeTokens: 'Token 用量', trendRange24h: '24 小时', trendRange7d: '7 天', trendRange30d: '30 天', trendRangeAll: '全部', trendRangeCustom: '自定义', trendFrom: '起始', trendTo: '结束',
    free: '免费', onlyFree: '仅免费', selectFree: '选择免费', freeHint: '基于 NVIDIA NIM 公开免费档位白名单的本地标记，仅作为筛选提示。', freeUnknown: '档位未知',
    statusBar: '状态栏显示', source: '配额来源', off: '仅 BYOK', tokens: '本地 Token', quota: '官方配额',
    theme: '主题', system: '跟随系统', light: '白天', dark: '暗黑', language: '界面语言', help: '帮助与信息', version: '扩展版本',
    planName: 'Plan 名称', baseUrl: 'Base URL', apiKey: 'API Key / Subscription Key', secretHint: '仅保存在 VS Code SecretStorage', preset: '供应商预设',
    test: '测试并获取模型', testing: '正在测试连接…', fillTest: '填写连接信息后测试，也可以直接手动添加模型。', connectionChanged: '连接配置已变化，请重新测试。',
    connected: (count: number) => `连接成功，发现 ${count} 个模型。`, customModel: '手动添加模型', modelId: '模型 ID', displayName: '显示名称（可选）', context: '上下文长度',
    vision: '视觉', tools: '工具调用', web: '联网', add: '添加', selectAll: '全选', clearAll: '清空', selected: (count: number) => `已选择 ${count} 个模型`, cancel: '取消', save: '保存 Plan',
    requiredModel: '请填写模型 ID。', duplicateModel: '该模型 ID 已存在。', invalidConnection: '请填写有效的 Base URL 和 API Key。', editPlan: '编辑 Plan', newPlanTitle: '接入新 Plan',
  },
  en: {
    overview: 'Overview', connections: 'Connections', models: 'Models', usage: 'Usage & quota', settings: 'Settings', workspace: 'Control center',
    subtitle: 'Manage model providers, credentials, and local usage', newPlan: 'Connect plan', enabledPlans: 'Enabled plans', availableModels: 'Available models',
    apiCalls: 'API calls', totalTokens: 'Total tokens', connectionsTitle: 'Connections', connectionsDesc: 'Provider, protocol, models, and credential health',
    noPlans: 'No plans connected', noPlansDesc: 'Connect a provider to expose its models in the VS Code Chat picker.', provider: 'Provider',
    protocol: 'Protocol', localUsage: '30-day usage', state: 'State', available: 'Available', disabled: 'Disabled', noModels: 'No models', noKey: 'No key',
    edit: 'Edit', remove: 'Delete', refresh: 'Refresh quota', refreshPlan: 'Refresh this plan', refreshing: 'Refreshing…', lastRefreshed: (when: string) => `Updated ${when} ago`, refreshSoon: 'Updates every 5 minutes', autoRefreshOn: 'Auto refresh on', autoRefreshOff: 'Auto refresh paused', modelLibrary: 'Model library', modelLibraryDesc: 'Every selected model across connected plans',
    search: 'Search models or providers', noModelMatch: 'No models match this search', usageTitle: 'Usage & official quota', usageDesc: 'Local 30-day request data and provider quota snapshots',
    input: 'Input', output: 'Output', failures: 'Failures', quotaPending: 'Official quota not fetched', quotaUnsupported: 'Provider has no official quota endpoint', quotaUnsupportedHint: 'Auto refresh is disabled.', modelInvalid: 'Invalid model ID', modelInvalidHint: 'Function UUID cannot be used in Chat. Replace it with a real NIM model id like meta/llama-3.1-70b-instruct.', settingsTitle: 'Console settings', settingsDesc: 'Control model visibility, status bar, and appearance',
    onlyAvailable: 'Only show available models', onlyAvailableDesc: 'Only expose enabled plans with models and a stored API key to Chat.',
    configTitle: 'Configuration backup', configDesc: 'Export or import all plans, settings, usage, and quota snapshots.',
    exportConfig: 'Export', importConfig: 'Import', includeApiKeys: 'Include API keys', includeApiKeysDesc: 'Bundle the stored API keys with the file. Disable to share an anonymised config.',
    modelTrendTitle: 'Model call trend', modelTrendDesc: 'Requests or tokens per model over the last 24 hours, one line per model.', modelTrendEmpty: 'No calls yet. Send a Chat request to populate this chart.', trendLast24h: 'Last 24h', trendHour: 'h', trendRequests: 'calls', trendTokens: 'tokens', trendModeRequests: 'Requests', trendModeTokens: 'Tokens', trendRange24h: '24h', trendRange7d: '7d', trendRange30d: '30d', trendRangeAll: 'All', trendRangeCustom: 'Custom', trendFrom: 'From', trendTo: 'To',
    free: 'Free', onlyFree: 'Only free', selectFree: 'Select free', freeHint: 'Local hint based on the NVIDIA NIM public free-tier allow list. Final tier is determined by your account.', freeUnknown: 'Tier unknown',
    statusBar: 'Status bar', source: 'Quota source', off: 'BYOK only', tokens: 'Local tokens', quota: 'Official quota',
    theme: 'Theme', system: 'System', light: 'Light', dark: 'Dark', language: 'Language', help: 'Help & information', version: 'Extension version',
    planName: 'Plan name', baseUrl: 'Base URL', apiKey: 'API key / Subscription key', secretHint: 'Stored only in VS Code SecretStorage', preset: 'Provider preset',
    test: 'Test & fetch models', testing: 'Testing connection…', fillTest: 'Enter connection details, then test. You can also add a model manually.', connectionChanged: 'Connection changed. Test it again.',
    connected: (count: number) => `Connected. Found ${count} model(s).`, customModel: 'Add model manually', modelId: 'Model ID', displayName: 'Display name (optional)', context: 'Context length',
    vision: 'Vision', tools: 'Tool calling', web: 'Web search', add: 'Add', selectAll: 'Select all', clearAll: 'Clear', selected: (count: number) => `${count} model(s) selected`, cancel: 'Cancel', save: 'Save plan',
    requiredModel: 'Enter a model ID.', duplicateModel: 'This model ID already exists.', invalidConnection: 'Enter a valid Base URL and API key.', editPlan: 'Edit plan', newPlanTitle: 'Connect a new plan',
  },
} as const;

function formatNumber(value: number, language: 'zh-CN' | 'en') {
  return new Intl.NumberFormat(language, { notation: value >= 10000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(value || 0);
}
function isMiniMax(plan: PlanConfig) { return /minimax/i.test(`${plan.provider} ${plan.baseUrl}`); }
function isNvidiaNim(plan: PlanConfig) { try { return new URL(plan.baseUrl).host.toLowerCase().includes('integrate.api.nvidia.com'); } catch { return false; } }
function isLikelyNvidiaFunctionId(id: string) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id); }
function isInvalidModelId(plan: PlanConfig, id: string) { return isNvidiaNim(plan) && isLikelyNvidiaFunctionId(id); }
function modelFeatures(model: PlanModel, language: 'zh-CN' | 'en') {
  const values: string[] = [];
  if (model.contextLength) values.push(`CTX ${formatNumber(model.contextLength, language)}`);
  if (model.supportsVision ?? model.vision) values.push('VISION');
  if (model.supportsTools ?? model.toolCalling) values.push('TOOLS');
  if (model.supportsWebSearch) values.push('WEB');
  return values;
}

export function Example() {
  const [state, setState] = useState<DashboardState>(emptyState);
  const [view, setView] = useState<View>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [editorPlan, setEditorPlan] = useState<PlanConfig | null | undefined>(undefined);
  const [notice, setNotice] = useState<{ level: string; message: string }>();
  const [refreshing, setRefreshing] = useState(false);
  const language = state.settings.language === 'en' ? 'en' : 'zh-CN';
  const text = copy[language];
  const resolvedTheme = state.settings.dashboardTheme === 'system'
    ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    : state.settings.dashboardTheme || 'dark';

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.data.type === 'state') setState(event.data);
      if (event.data.type === 'notice') {
        setNotice(event.data);
        window.setTimeout(() => setNotice(undefined), 5000);
      }
    };
    window.addEventListener('message', receive);
    vscode.postMessage({ type: 'ready' });
    return () => window.removeEventListener('message', receive);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.lang = language;
  }, [language, resolvedTheme]);

  const saveSettings = (patch: Partial<DashboardSettings>) => {
    const settings = { ...state.settings, ...patch };
    setState(current => ({ ...current, settings }));
    vscode.postMessage({ type: 'saveSettings', settings });
  };

  const refreshAll = () => {
    if (refreshing) return;
    setRefreshing(true);
    vscode.postMessage({ type: 'refreshAll' });
    window.setTimeout(() => setRefreshing(false), 3000);
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      vscode.postMessage({ type: 'refreshAll' });
    }, 60000);
    return () => window.clearInterval(timer);
  }, []);
  const totals = state.usage.reduce((sum, item) => ({
    requests: sum.requests + item.requests, input: sum.input + item.inputTokens,
    output: sum.output + item.outputTokens, failures: sum.failures + item.failures,
  }), { requests: 0, input: 0, output: 0, failures: 0 });
  const availableModels = state.plans.reduce((count, plan) => count + (plan.enabled && state.planAvailability[plan.id] ? plan.models.length : 0), 0);
  const nav = [
    { id: 'overview' as const, icon: LayoutDashboard, label: text.overview },
    { id: 'connections' as const, icon: Database, label: text.connections, badge: state.plans.length },
    { id: 'models' as const, icon: Cpu, label: text.models, badge: state.plans.reduce((sum, plan) => sum + plan.models.length, 0) },
    { id: 'usage' as const, icon: BarChart3, label: text.usage },
    { id: 'settings' as const, icon: Settings, label: text.settings },
  ];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="brand-row">
          <span className="brand-mark"><KeyRound /></span>
          {sidebarOpen && <div className="brand-copy"><strong>BYOK COPILOT</strong><span>PROVIDER CONTROL</span></div>}
          <button className="icon-button desktop-collapse" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
            {sidebarOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
          </button>
          <button className="icon-button mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X /></button>
        </div>
        <nav className="nav-list">
          {nav.map(item => <button key={item.id} className={`nav-item ${view === item.id ? 'selected' : ''}`} onClick={() => { setView(item.id); setMobileOpen(false); }} title={!sidebarOpen ? item.label : undefined}>
            <item.icon /><span className="nav-label">{item.label}</span>{Boolean(item.badge) && <span className="nav-badge">{item.badge}</span>}
          </button>)}
        </nav>
        <div className="sidebar-foot">
          <div className="status-pulse"><span />{sidebarOpen && <span>EXTENSION ONLINE</span>}</div>
          {sidebarOpen && <span className="version">v{document.querySelector('meta[name="byok-version"]')?.getAttribute('content')}</span>}
        </div>
      </aside>
      {mobileOpen && <button className="sidebar-scrim" onClick={() => setMobileOpen(false)} aria-label="Close menu" />}

      <main className="main-area">
        <header className="page-header">
          <div className="header-title">
            <button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu /></button>
            <div><p>{text.workspace}</p><h1>{nav.find(item => item.id === view)?.label}</h1></div>
          </div>
          <div className="header-actions">
            <button className={`icon-button ${refreshing ? 'is-loading' : ''}`} onClick={refreshAll} disabled={refreshing} title={language === 'en' ? 'Refresh all' : '刷新全部'}>
              <RefreshCw className={refreshing ? 'spin' : ''} />
            </button>
            <button className="icon-button" onClick={() => saveSettings({ language: language === 'en' ? 'zh-CN' : 'en' })} title={text.language}><Languages /></button>
            <button className="icon-button" onClick={() => saveSettings({ dashboardTheme: resolvedTheme === 'dark' ? 'light' : 'dark' })} title={text.theme}>
              {resolvedTheme === 'dark' ? <Sun /> : <Moon />}
            </button>
            <button className="primary-button" onClick={() => setEditorPlan(null)}><Plus />{text.newPlan}</button>
          </div>
        </header>

        <div className="content-wrap">
          {view === 'overview' && <Overview state={state} totals={totals} availableModels={availableModels} language={language} text={text} openConnections={() => setView('connections')} edit={setEditorPlan} />}
          {view === 'connections' && <Connections state={state} language={language} text={text} edit={setEditorPlan} create={() => setEditorPlan(null)} />}
          {view === 'models' && <Models state={state} language={language} text={text} />}
          {view === 'usage' && <Usage state={state} language={language} text={text} />}
          {view === 'settings' && <SettingsView state={state} text={text} language={language} save={saveSettings} />}
        </div>
      </main>
      {editorPlan !== undefined && <PlanEditor plan={editorPlan} language={language} text={text} close={() => setEditorPlan(undefined)} />}
      {notice && <div className={`toast ${notice.level}`}>{notice.level === 'success' ? <Check /> : <X />}<span>{notice.message}</span></div>}
    </div>
  );
}

function Overview({ state, totals, availableModels, language, text, openConnections, edit }: any) {
  const cards = [
    [ShieldCheck, text.enabledPlans, state.plans.filter((plan: PlanConfig) => plan.enabled).length, 'cyan'],
    [Cpu, text.availableModels, availableModels, 'green'], [Activity, text.apiCalls, formatNumber(totals.requests, language), 'amber'],
    [Zap, text.totalTokens, formatNumber(totals.input + totals.output, language), 'pink'],
  ];
  return <>
    <section className="intro"><div><p className="eyebrow">SYSTEM / 30D</p><h2>{text.subtitle}</h2></div><button className="text-button" onClick={openConnections}>{text.connections}<ChevronRight /></button></section>
    <section className="metric-grid">{cards.map(([Icon, label, value, color]: any) => <article className={`metric-card accent-${color}`} key={label}><div className="metric-icon"><Icon /></div><span>{label}</span><strong>{value}</strong><small>LIVE DATA</small></article>)}</section>
    <section className="glass-panel trend-panel"><PanelHeading title={text.modelTrendTitle} detail={text.modelTrendDesc} /><ModelTrendChart series24h={state.modelSeries} series7d={state.series7d} series30d={state.series30d} allUsageRecords={state.allUsageRecords} language={language} text={text} /></section>
    <section className="dashboard-grid">
      <div className="glass-panel span-2"><PanelHeading title={text.connectionsTitle} detail={text.connectionsDesc} />
        <div className="activity-list">{state.plans.length ? state.plans.slice(0, 5).map((plan: PlanConfig) => <PlanActivity key={plan.id} plan={plan} state={state} language={language} text={text} edit={edit} />) : <Empty text={text} create={() => edit(null)} />}</div>
      </div>
      <div className="glass-panel"><PanelHeading title={text.usageTitle} detail="INPUT / OUTPUT" /><TokenRatio input={totals.input} output={totals.output} text={text} language={language} /><div className="quick-stat"><span>{text.failures}</span><strong>{formatNumber(totals.failures, language)}</strong></div></div>
    </section>
  </>;
}

type TimeRange = '24h' | '7d' | '30d' | 'all' | 'custom';
type RawRecord = { planId: string; modelId: string; timestamp: number; requests: number; totalTokens: number };

function aggregateRecords(records: RawRecord[], windowStart: number, bucketMs: number, maxModels: number): ModelSeries[] {
  const now = Date.now();
  const start = windowStart;
  const numBuckets = Math.max(1, Math.ceil((now - start) / bucketMs));
  const filtered = records.filter((r) => r.timestamp >= start);
  const groups = new Map<string, { planId: string; modelId: string; pts: number[]; tokPts: number[]; total: number; totalTokens: number }>();
  for (const r of filtered) {
    const key = `${r.planId}:${r.modelId}`;
    const g = groups.get(key) ?? { planId: r.planId, modelId: r.modelId, pts: new Array(numBuckets).fill(0), tokPts: new Array(numBuckets).fill(0), total: 0, totalTokens: 0 };
    const bi = Math.min(numBuckets - 1, Math.max(0, Math.floor((r.timestamp - start) / bucketMs)));
    g.pts[bi] += r.requests;
    g.tokPts[bi] += r.totalTokens;
    g.total += r.requests;
    g.totalTokens += r.totalTokens;
    groups.set(key, g);
  }
  const ranked = [...groups.values()].sort((a, b) => b.total - a.total).slice(0, maxModels);
  return ranked.map((g) => ({
    id: `${g.planId}:${g.modelId}`, planId: g.planId, modelId: g.modelId,
    name: g.modelId, provider: '', total: g.total, totalTokens: g.totalTokens,
    points: g.pts.map((v, i) => ({ timestamp: start + i * bucketMs, requests: v, tokens: g.tokPts[i] })),
    windowStart: start, windowEnd: now, bucketHours: bucketMs / 3600000,
  }));
}

function ModelTrendChart({ series24h, series7d, series30d, allUsageRecords, language, text }: { series24h: ModelSeries[]; series7d: ModelSeries[]; series30d: ModelSeries[]; allUsageRecords: RawRecord[]; language: 'zh-CN' | 'en'; text: any }) {
  const [mode, setMode] = useState<'requests' | 'tokens'>('requests');
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [chartWidth, setChartWidth] = useState(640);
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().slice(0, 10);
  });
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const series = useMemo<ModelSeries[]>(() => {
    if (timeRange === '24h') return series24h;
    if (timeRange === '7d') return series7d;
    if (timeRange === '30d') return series30d;
    const endMs = new Date(customEnd + 'T23:59:59').getTime();
    const startMs = new Date(customStart + 'T00:00:00').getTime();
    if (timeRange === 'all' || isNaN(startMs) || isNaN(endMs) || endMs <= startMs) {
      const dayMs = 86400000;
      const rangeDays = Math.max(1, (Date.now() - (allUsageRecords.length ? Math.min(...allUsageRecords.map((r) => r.timestamp)) : Date.now())) / dayMs);
      const bucketH = rangeDays > 180 ? 168 : rangeDays > 30 ? 24 : 6;
      return aggregateRecords(allUsageRecords, Date.now() - rangeDays * dayMs, bucketH * 3600000, 6);
    }
    const rangeDays = (endMs - startMs) / 86400000;
    const bucketH = rangeDays > 60 ? 168 : rangeDays > 7 ? 24 : 6;
    return aggregateRecords(allUsageRecords, startMs, bucketH * 3600000, 6);
  }, [timeRange, customStart, customEnd, series24h, series7d, series30d, allUsageRecords]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const updateWidth = () => setChartWidth(Math.max(320, Math.round(chart.getBoundingClientRect().width)));
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(chart);
    return () => observer.disconnect();
  }, [series.length]);

  if (!series || series.length === 0) {
    return <div className="empty-compact"><BarChart3 /><span>{text.modelTrendEmpty}</span></div>;
  }
  const palette = TREND_PALETTE;
  const W = chartWidth, H = 250, PAD_LEFT = 38, PAD_RIGHT = 4, PAD_TOP = 28, PAD_BOTTOM = 28;
  const innerW = W - PAD_LEFT - PAD_RIGHT, innerH = H - PAD_TOP - PAD_BOTTOM;
  const valueOf = (p: ModelSeriesPoint) => (mode === 'requests' ? p.requests : p.tokens);
  const totalOf = (item: ModelSeries) => (mode === 'requests' ? item.total : item.totalTokens);
  const numPoints = series[0].points.length;
  const maxY = Math.max(1, ...series.flatMap((item) => item.points.map((p) => valueOf(p))));
  const xStep = numPoints > 1 ? innerW / (numPoints - 1) : 0;
  const yTicks = [0, 0.25, 0.5, 0.75, 1];
  const total = series.reduce((s, item) => s + totalOf(item), 0);

  const fmtLabel = (ts: number) => {
    const d = new Date(ts);
    if (timeRange === '24h') { const hh = String(d.getHours()).padStart(2, '0'); return language === 'zh-CN' ? `${hh}时` : `${hh}${text.trendHour}`; }
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return language === 'zh-CN' ? `${mm}/${dd}` : `${mm}/${dd}`;
  };
  const labelStride = numPoints > 12 ? Math.ceil(numPoints / 6) : 2;
  const formatCompact = (v: number) => {
    if (v >= 1e9) return `${(v / 1e9).toFixed(1).replace(/\.0$/, '')}B`;
    if (v >= 1e6) return `${(v / 1e6).toFixed(1).replace(/\.0$/, '')}M`;
    if (v >= 1e3) return `${(v / 1e3).toFixed(1).replace(/\.0$/, '')}k`;
    return String(Math.round(v));
  };
  const clampY = (y: number) => Math.max(PAD_TOP, Math.min(PAD_TOP + innerH, y));
  const buildSmoothPath = (pts: { x: number; y: number }[]): string => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x.toFixed(2)} ${clampY(pts[0].y).toFixed(2)}`;
    const widths = pts.slice(0, -1).map((point, index) => pts[index + 1].x - point.x);
    const slopes = widths.map((width, index) => (pts[index + 1].y - pts[index].y) / width);
    const tangents = slopes.map((slope, index) => {
      if (index === 0) return slope;
      const previousSlope = slopes[index - 1];
      if (previousSlope === 0 || slope === 0 || Math.sign(previousSlope) !== Math.sign(slope)) return 0;
      const previousWidth = widths[index - 1];
      const width = widths[index];
      const firstWeight = 2 * width + previousWidth;
      const secondWeight = width + 2 * previousWidth;
      return (firstWeight + secondWeight) / (firstWeight / previousSlope + secondWeight / slope);
    });
    tangents.push(slopes[slopes.length - 1]);
    let d = `M ${pts[0].x.toFixed(2)} ${clampY(pts[0].y).toFixed(2)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i], p2 = pts[i + 1], width = widths[i];
      const c1x = p1.x + width / 3, c1y = p1.y + tangents[i] * width / 3;
      const c2x = p2.x - width / 3, c2y = p2.y - tangents[i + 1] * width / 3;
      d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${clampY(p2.y).toFixed(2)}`;
    }
    return d;
  };

  const rangePresets: { key: TimeRange; label: string }[] = [
    { key: '24h', label: text.trendRange24h }, { key: '7d', label: text.trendRange7d },
    { key: '30d', label: text.trendRange30d }, { key: 'all', label: text.trendRangeAll },
    { key: 'custom', label: text.trendRangeCustom },
  ];

  /* ---------- hover crosshair ---------- */
  const handleSvgMouse = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg || numPoints < 2) return;
    /* use SVG-native coordinate transform for accurate mapping */
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const svgPt = pt.matrixTransform(ctm.inverse());
    const idx = Math.round((svgPt.x - PAD_LEFT) / xStep);
    setHoverIdx(Math.max(0, Math.min(numPoints - 1, idx)));
  };

  return (
    <div ref={chartRef} className="trend-chart">
      <div className="trend-tools">
        <div className="trend-toggle" role="group">
          <button type="button" className={mode === 'requests' ? 'is-active' : ''} onClick={() => setMode('requests')}>{text.trendModeRequests}</button>
          <button type="button" className={mode === 'tokens' ? 'is-active' : ''} onClick={() => setMode('tokens')}>{text.trendModeTokens}</button>
        </div>
        <div className="trend-range-group">
          <div className="trend-toggle trend-range" role="group">
            {rangePresets.map((p) => <button key={p.key} type="button" className={timeRange === p.key ? 'is-active' : ''} onClick={() => setTimeRange(p.key)}>{p.label}</button>)}
          </div>
          {timeRange === 'custom' && (
            <div className="trend-custom-dates">
              <label className="trend-date-label">{text.trendFrom}<input type="date" className="trend-date-input" value={customStart} max={customEnd} onChange={(e) => setCustomStart(e.target.value)} /></label>
              <label className="trend-date-label">{text.trendTo}<input type="date" className="trend-date-input" value={customEnd} min={customStart} onChange={(e) => setCustomEnd(e.target.value)} /></label>
            </div>
          )}
        </div>
      </div>
      <div className="trend-plot" onMouseLeave={() => setHoverIdx(null)}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={text.modelTrendTitle} onMouseMove={handleSvgMouse}>
        {yTicks.map((tick) => {
          const y = PAD_TOP + innerH * (1 - tick);
          return <g key={tick}><line x1={PAD_LEFT} x2={W - PAD_RIGHT} y1={y} y2={y} stroke="var(--line)" strokeWidth="1" strokeDasharray={tick === 0 ? undefined : '3 4'} opacity={tick === 0 ? 1 : 0.55} /><text x={PAD_LEFT - 8} y={y} textAnchor="end" dominantBaseline="middle" className="trend-axis">{formatCompact(maxY * tick)}</text></g>;
        })}
        {series[0].points.map((point, index) => {
          if (index % labelStride !== 0 && index !== numPoints - 1) return null;
          const x = PAD_LEFT + index * xStep;
          return <text key={`x-${index}`} x={x} y={H - 10} textAnchor="middle" className="trend-axis">{fmtLabel(point.timestamp)}</text>;
        })}
        {series.map((item, index) => {
          const color = palette[index % palette.length];
          const pts = item.points.map((point, idx) => {
            const x = PAD_LEFT + idx * xStep;
            const yRatio = maxY === 0 ? 0 : Math.min(1, valueOf(point) / maxY);
            return { x, y: PAD_TOP + innerH * (1 - yRatio) };
          });
          const d = buildSmoothPath(pts);
          const last = pts[pts.length - 1];
          return (
            <g key={item.id}>
              <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              <circle cx={last.x} cy={last.y} r="3.5" fill={color} stroke="var(--surface)" strokeWidth="1.5" />
            </g>
          );
        })}
        {/* crosshair vertical line */}
        {hoverIdx !== null && (
          <line
            x1={PAD_LEFT + hoverIdx * xStep} x2={PAD_LEFT + hoverIdx * xStep}
            y1={PAD_TOP} y2={PAD_TOP + innerH}
            stroke="var(--text)" strokeWidth="1.25" strokeDasharray="4 3" opacity="0.8"
          />
        )}
        {/* crosshair dots */}
        {hoverIdx !== null && series.map((item, si) => {
          const color = palette[si % palette.length];
          const pt = item.points[hoverIdx];
          if (!pt) return null;
          const val = valueOf(pt);
          const yRatio = maxY === 0 ? 0 : Math.min(1, val / maxY);
          const cx = PAD_LEFT + hoverIdx * xStep;
          const cy = PAD_TOP + innerH * (1 - yRatio);
          return (
            <g key={`h-${item.id}`}>
              <circle cx={cx} cy={cy} r="6" fill="var(--surface-strong)" stroke={color} strokeWidth="3" />
            </g>
          );
        })}
        {/* crosshair time label at bottom */}
        {hoverIdx !== null && (
          <g>
            <rect x={PAD_LEFT + hoverIdx * xStep - 28} y={H - 28} width={56} height={18} rx={4} fill="var(--surface-strong)" stroke="var(--line)" strokeWidth="0.5" opacity="0.95" />
            <text x={PAD_LEFT + hoverIdx * xStep} y={H - 16} textAnchor="middle" className="trend-axis" fontWeight="600">{fmtLabel(series[0].points[hoverIdx].timestamp)}</text>
          </g>
        )}
      </svg>
      {hoverIdx !== null && series[0].points[hoverIdx] && (
        <div className={`trend-tooltip ${hoverIdx > (numPoints - 1) / 2 ? 'is-left' : 'is-right'}`}>
          <strong>{new Date(series[0].points[hoverIdx].timestamp).toLocaleString(language === 'zh-CN' ? 'zh-CN' : 'en-US', timeRange === '24h' ? { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' } : { year: 'numeric', month: '2-digit', day: '2-digit' })}</strong>
          {series.map((item, index) => {
            const point = item.points[hoverIdx];
            if (!point) return null;
            const value = valueOf(point);
            return <div className="trend-tooltip-row" key={`tip-${item.id}`}><i style={{ background: palette[index % palette.length] }} /><span title={item.name}>{item.name}</span><b title={String(value)}>{formatNumber(value, language)}</b></div>;
          })}
        </div>
      )}
      </div>
      <ul className="trend-legend">
        {series.map((item, index) => {
          const color = palette[index % palette.length];
          return (
            <li key={item.id}>
              <i style={{ background: color }} />
              <span className="trend-name" title={item.provider ? `${item.provider} · ${item.name}` : item.name}>{item.name}</span>
              <strong>{formatNumber(totalOf(item), language)}</strong>
              <small>{mode === 'requests' ? text.trendRequests : text.trendTokens}</small>
            </li>
          );
        })}
      </ul>
      <div className="trend-total">{mode === 'requests' ? text.trendRequests : text.trendTokens} · <strong>{formatNumber(total, language)}</strong></div>
    </div>
  );
}

function Connections({ state, language, text, edit, create }: any) {
  return <section className="glass-panel table-panel"><PanelHeading title={text.connectionsTitle} detail={text.connectionsDesc} action={<button className="primary-button" onClick={create}><Plus />{text.newPlan}</button>} />
    {state.plans.length ? <div className="plan-table"><div className="table-head"><span>PLAN / {text.provider}</span><span>{text.protocol}</span><span>{text.localUsage}</span><span>{text.state}</span><span /></div>
      {state.plans.map((plan: PlanConfig) => <PlanRow key={plan.id} plan={plan} state={state} language={language} text={text} edit={edit} />)}</div> : <Empty text={text} create={create} />}
  </section>;
}

function PlanRow({ plan, state, language, text, edit }: any) {
  const usage = state.usage.find((item: UsageSummary) => item.planId === plan.id);
  const available = plan.enabled && plan.models.length && state.planAvailability[plan.id];
  const status = available ? text.available : !plan.enabled ? text.disabled : !plan.models.length ? text.noModels : text.noKey;
  return <article className="plan-row"><div className="plan-identity"><span className="provider-avatar">{plan.provider.slice(0, 2).toUpperCase()}</span><div><strong>{plan.name}</strong><small>{plan.provider} · {plan.models.length} {text.models}</small></div></div>
    <div><span className="protocol-badge">{protocolNames[plan.protocol as ApiProtocol]}</span></div>
    <div className="usage-cell"><strong>{formatNumber(usage?.totalTokens || 0, language)} tok</strong><small>{formatNumber(usage?.requests || 0, language)} {text.apiCalls}</small></div>
    <div><span className={`health ${available ? 'healthy' : 'warning'}`}><i />{status}</span></div>
    <div className="row-actions"><label className="switch"><input type="checkbox" checked={plan.enabled} onChange={event => vscode.postMessage({ type: 'toggle', id: plan.id, enabled: event.target.checked })} /><span /></label>
      {isMiniMax(plan) && <button className="icon-button" onClick={() => vscode.postMessage({ type: 'refreshQuota', id: plan.id })} title={text.refresh}><RefreshCw /></button>}
      <button className="icon-button" onClick={() => edit(plan)} title={text.edit}><Pencil /></button><button className="icon-button danger" onClick={() => vscode.postMessage({ type: 'delete', id: plan.id })} title={text.remove}><Trash2 /></button></div>
  </article>;
}

function PlanActivity({ plan, state, language, text, edit }: any) {
  const usage = state.usage.find((item: UsageSummary) => item.planId === plan.id);
  const available = plan.enabled && plan.models.length && state.planAvailability[plan.id];
  return <button className="activity-row" onClick={() => edit(plan)}><span className={`activity-icon ${available ? 'online' : ''}`}><Database /></span><span className="activity-copy"><strong>{plan.name}</strong><small>{plan.provider} · {plan.models.length} {text.models}</small></span><span className="activity-value"><strong>{formatNumber(usage?.totalTokens || 0, language)} tok</strong><small>{available ? text.available : text.disabled}</small></span><ChevronRight /></button>;
}

function Models({ state, language, text }: any) {
  const [query, setQuery] = useState('');
  const models = state.plans.flatMap((plan: PlanConfig) => plan.models.map(model => ({ ...model, plan })));
  const visible = models.filter((model: any) => `${model.id} ${model.name} ${model.plan.provider}`.toLowerCase().includes(query.toLowerCase()));
  return <section className="glass-panel"><PanelHeading title={text.modelLibrary} detail={text.modelLibraryDesc} />
    <div className="search-box"><Search /><input value={query} onChange={event => setQuery(event.target.value)} placeholder={text.search} /></div>
    <div className="model-grid">{visible.map((model: any) => {
      const invalid = isInvalidModelId(model.plan, model.id);
      return <article className={`model-card ${invalid ? 'is-invalid' : ''}`} key={`${model.plan.id}-${model.id}`}><div className="model-card-head"><span className="model-chip"><Cpu /></span><span className={`health ${invalid ? 'danger' : (model.plan.enabled ? 'healthy' : 'warning')}`}><i />{invalid ? text.modelInvalid : (model.plan.enabled ? text.available : text.disabled)}</span></div><strong>{model.name}</strong><code>{model.id}</code><p>{model.plan.name} / {model.plan.provider}</p>{invalid ? <p className="model-invalid-hint">{text.modelInvalidHint}</p> : <div className="feature-list">{modelFeatures(model, language).map(value => <span key={value}>{value}</span>)}</div>}</article>;
    })}</div>
    {!visible.length && <div className="empty-compact"><Search /><span>{text.noModelMatch}</span></div>}
  </section>;
}

function Usage({ state, language, text }: any) {
  const [refreshing, setRefreshing] = useState<Record<string, boolean>>({});
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (state.plans.length === 0) return;
    const duePlans = state.plans.filter((plan: PlanConfig) => {
      if (!state.planAvailability[plan.id]) return false;
      const snapshot = state.quotas.find((item: QuotaSnapshot) => item.planId === plan.id);
      if (snapshot?.source === 'unsupported') return false;
      const fetchedAt = snapshot?.fetchedAt ?? 0;
      return now - fetchedAt >= 5 * 60 * 1000;
    });
    if (!duePlans.length) return;
    const fetchedStamps = duePlans.map((plan: PlanConfig) => state.quotas.find((item: QuotaSnapshot) => item.planId === plan.id)?.fetchedAt ?? 0);
    const earliest = fetchedStamps.length ? Math.min(...fetchedStamps) : 0;
    const delay = Math.max(800, 5 * 60 * 1000 - (now - earliest));
    const id = window.setTimeout(() => {
      setRefreshing(current => ({ ...current, ...Object.fromEntries(duePlans.map((plan: PlanConfig) => [plan.id, true])) }));
      duePlans.forEach((plan: PlanConfig) => vscode.postMessage({ type: 'refreshQuota', id: plan.id }));
    }, delay);
    return () => window.clearTimeout(id);
  }, [now, state.plans, state.quotas, state.planAvailability]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.data?.type !== 'notice' || !event.data?.planId) return;
      const level = event.data.level === 'success' ? false : true;
      setRefreshing(current => ({ ...current, [event.data.planId]: level }));
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, []);
  const refresh = (planId: string) => {
    const snapshot = state.quotas.find((item: QuotaSnapshot) => item.planId === planId);
    if (snapshot?.source === 'unsupported') return;
    if (!state.planAvailability[planId]) return;
    setRefreshing(current => ({ ...current, [planId]: true }));
    vscode.postMessage({ type: 'refreshQuota', id: planId });
  };
  return (
    <div className="usage-layout">
      {state.plans.map((plan: PlanConfig) => {
        const usage = state.usage.find((item: UsageSummary) => item.planId === plan.id);
        const quota = state.quotas.find((item: QuotaSnapshot) => item.planId === plan.id);
        const isRefreshing = Boolean(refreshing[plan.id]);
        const canRefresh = Boolean(state.planAvailability[plan.id]) && quota?.source !== 'unsupported';
        const fetchedAt = quota?.fetchedAt;
        const elapsed = fetchedAt ? Math.max(0, now - fetchedAt) : null;
        const isUnsupported = quota?.source === 'unsupported';
        const meta = isUnsupported
          ? text.quotaUnsupportedHint
          : fetchedAt
          ? `${text.lastRefreshed(formatRelative(elapsed, language))} · ${text.refreshSoon}`
          : text.refreshSoon;
        const action = (
          <button
            className={`icon-button refresh-button ${isRefreshing ? 'is-loading' : ''}`}
            disabled={!canRefresh || isRefreshing}
            onClick={() => refresh(plan.id)}
            title={isUnsupported ? text.quotaUnsupported : text.refreshPlan}
            aria-label={text.refreshPlan}>
            <RefreshCw className={isRefreshing ? 'spin' : ''} />
          </button>
        );
        return (
          <article className={`glass-panel usage-plan ${isRefreshing ? 'is-refreshing' : ''} ${isUnsupported ? 'is-unsupported' : ''}`} key={plan.id}>
            <PanelHeading title={plan.name} detail={`${plan.provider} / ${protocolNames[plan.protocol]}`} meta={meta} action={action} />
            <div className="usage-numbers">
              <div><span>{text.apiCalls}</span><strong>{formatNumber(usage?.requests || 0, language)}</strong></div>
              <div><span>{text.input}</span><strong>{formatNumber(usage?.inputTokens || 0, language)}</strong></div>
              <div><span>{text.output}</span><strong>{formatNumber(usage?.outputTokens || 0, language)}</strong></div>
              <div><span>{text.failures}</span><strong>{formatNumber(usage?.failures || 0, language)}</strong></div>
            </div>
            {isUnsupported ? (
              <div className="quota-empty">
                <Gauge /><span>{text.quotaUnsupported}</span>
              </div>
            ) : quota && quota.source === 'remote' && quota.windows.length ? (
              <div className="quota-list">
                {quota.windows.map((window: any) => {
                  const percent = window.percentUsed ?? (window.limit ? (window.used || 0) / window.limit * 100 : 0);
                  return (
                    <div className="quota-row" key={window.id}>
                      <div><span>{window.label}</span><strong>{window.unlimited ? '∞' : `${Math.round(percent)}%`}</strong></div>
                      <div className="progress"><span style={{ width: `${Math.min(100, percent)}%` }} /></div>
                      <small>{window.unlimited ? 'UNLIMITED' : `${formatNumber(window.used || 0, language)} / ${formatNumber(window.limit || 0, language)} ${window.unit}`}</small>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="quota-empty">
                <Gauge /><span>{text.quotaPending}</span>
              </div>
            )}
          </article>
        );
      })}
      {!state.plans.length && <div className="glass-panel"><Empty text={text} create={() => undefined} /></div>}
    </div>
  );
}

function formatRelative(elapsed: number | null, language: 'zh-CN' | 'en'): string {
  if (elapsed === null) return '—';
  const seconds = Math.round(elapsed / 1000);
  if (seconds < 60) return language === 'zh-CN' ? `${seconds} 秒` : `${seconds}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return language === 'zh-CN' ? `${minutes} 分钟` : `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return language === 'zh-CN' ? `${hours} 小时` : `${hours}h`;
  const days = Math.round(hours / 24);
  return language === 'zh-CN' ? `${days} 天` : `${days}d`;
}

function SettingsView({ state, text, language, save }: any) {
  const quotaPlans = state.plans.filter(isMiniMax);
  const [includeKeys, setIncludeKeys] = useState(true);
  return <div className="settings-layout"><section className="glass-panel"><PanelHeading title={text.settingsTitle} detail={text.settingsDesc} />
    <SettingRow icon={Eye} title={text.onlyAvailable} detail={text.onlyAvailableDesc}><button className={`toggle-button ${state.settings.filterAvailable ? 'on' : ''}`} onClick={() => save({ filterAvailable: !state.settings.filterAvailable })}>{state.settings.filterAvailable ? <Eye /> : <EyeOff />}</button></SettingRow>
    <SettingRow icon={Activity} title={text.statusBar}><select value={state.settings.statusBarUsage || 'off'} onChange={event => save({ statusBarUsage: event.target.value })}><option value="off">{text.off}</option><option value="tokens">{text.tokens}</option><option value="quota">{text.quota}</option></select></SettingRow>
    {state.settings.statusBarUsage === 'quota' && <SettingRow icon={Gauge} title={text.source}><select value={state.settings.statusBarPlanId || quotaPlans[0]?.id || ''} onChange={event => save({ statusBarPlanId: event.target.value })}>{quotaPlans.map((plan: PlanConfig) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}</select></SettingRow>}
    <SettingRow icon={Moon} title={text.theme}><div className="segmented three"><button className={state.settings.dashboardTheme === 'system' ? 'active' : ''} onClick={() => save({ dashboardTheme: 'system' })}>{text.system}</button><button className={state.settings.dashboardTheme === 'light' ? 'active' : ''} onClick={() => save({ dashboardTheme: 'light' })}>{text.light}</button><button className={state.settings.dashboardTheme === 'dark' ? 'active' : ''} onClick={() => save({ dashboardTheme: 'dark' })}>{text.dark}</button></div></SettingRow>
    <SettingRow icon={Languages} title={text.language}><div className="segmented"><button className={language === 'zh-CN' ? 'active' : ''} onClick={() => save({ language: 'zh-CN' })}>中文</button><button className={language === 'en' ? 'active' : ''} onClick={() => save({ language: 'en' })}>English</button></div></SettingRow>
    <SettingRow icon={ShieldCheck} title={text.includeApiKeys} detail={text.includeApiKeysDesc}><button className={`toggle-button ${includeKeys ? 'on' : ''}`} onClick={() => setIncludeKeys(!includeKeys)}>{includeKeys ? <Eye /> : <EyeOff />}</button></SettingRow>
  </section>
    <section className="glass-panel config-panel"><PanelHeading title={text.configTitle} detail={text.configDesc} />
      <div className="config-actions"><button className="primary-button" onClick={() => vscode.postMessage({ type: 'exportConfig', includeApiKeys: includeKeys })}><Download />{text.exportConfig}</button><button className="secondary-button" onClick={() => vscode.postMessage({ type: 'importConfig', includeApiKeys: includeKeys })}><PackageOpen />{text.importConfig}</button></div>
    </section>
  <section className="glass-panel info-panel"><CircleHelp /><h3>{text.help}</h3><p>BYOK COPILOT</p><span>{text.version} {document.querySelector('meta[name="byok-version"]')?.getAttribute('content')}</span></section></div>;
}

function SettingRow({ icon: Icon, title, detail, children }: any) { return <div className="setting-row"><span className="setting-icon"><Icon /></span><div className="setting-copy"><strong>{title}</strong>{detail && <small>{detail}</small>}</div><div className="setting-control">{children}</div></div>; }
function PanelHeading({ title, detail, meta, action }: any) {
  return (
    <div className="panel-heading">
      <div>
        <div className="panel-heading-row">
          <h2>{title}</h2>
          {meta && <span className="panel-meta">{meta}</span>}
        </div>
        {detail && <p>{detail}</p>}
      </div>
      {action}
    </div>
  );
}
function Empty({ text, create }: any) { return <div className="empty-state"><span><KeyRound /></span><h3>{text.noPlans}</h3><p>{text.noPlansDesc}</p><button className="primary-button" onClick={create}><Plus />{text.newPlan}</button></div>; }
function TokenRatio({ input, output, text, language }: any) { const total = Math.max(1, input + output); return <div className="token-ratio"><div className="ratio-value"><strong>{formatNumber(input + output, language)}</strong><span>tok</span></div><div className="ratio-bar"><span style={{ width: `${input / total * 100}%` }} /><i /></div><div className="ratio-legend"><span><i className="input-dot" />{text.input} {formatNumber(input, language)}</span><span><i className="output-dot" />{text.output} {formatNumber(output, language)}</span></div></div>; }

function PlanEditor({ plan, language, text, close }: { plan: PlanConfig | null; language: 'zh-CN' | 'en'; text: any; close(): void }) {
  const [preset, setPreset] = useState(() => plan ? Object.entries(presets).find(([, value]) => value.provider === plan.provider)?.[0] || 'custom' : 'custom');
  const [form, setForm] = useState({ name: plan?.name || '', baseUrl: plan?.baseUrl || '', protocol: plan?.protocol || 'openai' as ApiProtocol, apiKey: '' });
  const [connection, setConnection] = useState<Connection | undefined>(() => plan ? { protocol: plan.protocol, models: plan.models } : undefined);
  const [selected, setSelected] = useState(() => new Set(plan?.models.map(model => model.id) || []));
  const [query, setQuery] = useState('');
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState(plan ? text.selected(plan.models.length) : text.fillTest);
  const [showKey, setShowKey] = useState(false);
  const [custom, setCustom] = useState({ id: '', name: '', context: '', vision: true, tools: true, web: false });
  const [customError, setCustomError] = useState('');
  const [requestId, setRequestId] = useState(0);
  const [onlyFree, setOnlyFree] = useState(false);
  const visible = useMemo(() => {
    const all = (connection?.models || []).filter(model => `${model.id} ${model.name} ${modelFeatures(model, language).join(' ')}`.toLowerCase().includes(query.toLowerCase()));
    return onlyFree ? all.filter(model => model.free === true) : all;
  }, [connection, language, query, onlyFree]);
  const freeCount = useMemo(() => (connection?.models || []).filter(model => model.free === true).length, [connection]);

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.data.type !== 'testResult' || event.data.requestId !== requestId) return;
      setTesting(false);
      if (event.data.ok) { const next = event.data.connection as Connection; setConnection(next); setSelected(new Set(next.models.map(model => model.id))); setStatus(text.connected(next.models.length)); }
      else { setConnection(undefined); setSelected(new Set()); setStatus(event.data.error); }
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [requestId, text]);

  const changeConnection = (patch: Partial<typeof form>) => { setForm(current => ({ ...current, ...patch })); setConnection(undefined); setSelected(new Set()); setStatus(text.connectionChanged); };
  const selectPreset = (key: string) => { const value = presets[key]; setPreset(key); setForm(current => ({ ...current, name: current.name || value.provider, baseUrl: value.url, protocol: value.protocol })); setConnection(undefined); setSelected(new Set()); setStatus(text.connectionChanged); };
  const input = (): PlanInput => ({ id: plan?.id, name: form.name, provider: presets[preset].provider === 'Custom' ? form.name : presets[preset].provider, baseUrl: form.baseUrl, protocol: form.protocol, apiKey: form.apiKey || undefined, enabled: plan?.enabled ?? true });
  const test = () => { if (!form.baseUrl || (!form.apiKey && !plan)) { setStatus(text.invalidConnection); return; } const next = requestId + 1; setRequestId(next); setTesting(true); setStatus(text.testing); vscode.postMessage({ type: 'testPlan', requestId: next, plan: input() }); };
  const toggleModel = (id: string) => setSelected(current => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const addCustom = () => {
    const id = custom.id.trim(); setCustomError('');
    if (!id) { setCustomError(text.requiredModel); return; }
    if (connection?.models.some(model => model.id === id)) { setCustomError(text.duplicateModel); return; }
    const context = Number(custom.context) || undefined;
    const model: ModelWithCustom = { id, name: custom.name.trim() || id, maxInputTokens: context || 8192, maxOutputTokens: context ? Math.max(1024, Math.floor(context / 4)) : 4096, toolCalling: custom.tools, vision: custom.vision, contextLength: context, supportsTools: custom.tools, supportsVision: custom.vision, supportsWebSearch: custom.web, features: custom.web ? ['web_search'] : [], custom: true };
    const next = connection ? { ...connection, models: [...connection.models, model] } : { protocol: form.protocol, models: [model] };
    setConnection(next); setSelected(current => new Set(current).add(id)); setCustom({ id: '', name: '', context: '', vision: true, tools: true, web: false }); setStatus(text.connected(next.models.length));
  };
  const submit = (event: FormEvent) => { event.preventDefault(); if (!connection || !selected.size) return; vscode.postMessage({ type: 'savePlan', plan: input(), models: connection.models.filter(model => selected.has(model.id)) }); close(); };

  return <div className="modal-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && close()}><section className="editor-modal" role="dialog" aria-modal="true" aria-labelledby="editor-title">
    <header><div><p>PROVIDER / CONFIG</p><h2 id="editor-title">{plan ? text.editPlan : text.newPlanTitle}</h2></div><button className="icon-button" onClick={close} aria-label={text.cancel}><X /></button></header>
    <form onSubmit={submit}><div className="form-grid">
      <label><span>{text.preset}</span><select value={preset} onChange={event => selectPreset(event.target.value)}>{Object.entries(presets).map(([key, value]) => <option key={key} value={key}>{key === 'custom' ? 'Custom / Coding Plan' : value.provider}</option>)}</select></label>
      <label><span>{text.planName}</span><input required value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} /></label>
      <label className="wide"><span>{text.baseUrl}</span><input type="url" required value={form.baseUrl} onChange={event => changeConnection({ baseUrl: event.target.value })} placeholder="https://api.example.com/v1" /></label>
      <label className="wide"><span>{text.protocol}</span><select value={form.protocol} onChange={event => changeConnection({ protocol: event.target.value as ApiProtocol })}><option value="responses">OpenAI Responses API</option><option value="openai">OpenAI Chat Completions</option><option value="anthropic">Anthropic Messages</option></select><small>{form.protocol === 'responses' ? '/v1/responses' : form.protocol === 'anthropic' ? '/v1/messages + x-api-key' : '/v1/chat/completions'}</small></label>
      <label className="wide"><span>{text.apiKey}<i>{text.secretHint}</i></span><div className="password-field"><input type={showKey ? 'text' : 'password'} required={!plan} value={form.apiKey} onChange={event => changeConnection({ apiKey: event.target.value })} autoComplete="off" /><button type="button" className="icon-button" onClick={() => setShowKey(!showKey)} aria-label={showKey ? 'Hide key' : 'Show key'}>{showKey ? <EyeOff /> : <Eye />}</button></div></label>
    </div>
    <div className="connection-test"><button type="button" className="secondary-button" disabled={testing} onClick={test}><RefreshCw className={testing ? 'spin' : ''} />{text.test}</button><p className={connection ? 'success-text' : ''}>{status}</p></div>
    <section className="model-picker"><div className="picker-heading"><div><h3>{text.models}</h3><span>{text.selected(selected.size)}</span></div>{connection?.models.length ? <div className="picker-tools"><div className="search-box compact"><Search /><input value={query} onChange={event => setQuery(event.target.value)} placeholder={text.search} /></div>{freeCount > 0 ? <button type="button" className={`secondary-button ${onlyFree ? 'active' : ''}`} onClick={() => setOnlyFree(current => !current)} title={text.freeHint}><Zap />{text.onlyFree} · {freeCount}</button> : null}{freeCount > 0 ? <button type="button" className="secondary-button" onClick={() => setSelected(current => { const next = new Set(current); (connection?.models || []).forEach(model => { if (model.free === true) next.add(model.id); }); return next; })}>{text.selectFree}</button> : null}<button type="button" className="secondary-button" onClick={() => setSelected(current => new Set([...current, ...visible.map(model => model.id)]))}>{text.selectAll}</button><button type="button" className="secondary-button" onClick={() => setSelected(current => { const next = new Set(current); visible.forEach(model => next.delete(model.id)); return next; })}>{text.clearAll}</button></div> : null}</div>
      {connection?.models.length ? <div className="model-options">{visible.map(model => <label key={model.id} className={selected.has(model.id) ? 'selected' : ''}><input type="checkbox" checked={selected.has(model.id)} onChange={() => toggleModel(model.id)} /><span><strong>{model.name}</strong><code>{model.id}</code><i>{modelFeatures(model, language).map(feature => <em key={feature}>{feature}</em>)}</i>{model.free === true ? <em className="free-badge" title={text.freeHint}>{text.free}</em> : <em className="free-badge muted" title={text.freeUnknown}>{text.freeUnknown}</em>}</span>{(model as ModelWithCustom).custom && <button type="button" className="icon-button danger" onClick={event => { event.preventDefault(); setConnection(current => current ? { ...current, models: current.models.filter(item => item.id !== model.id) } : current); setSelected(current => { const next = new Set(current); next.delete(model.id); return next; }); }}><Trash2 /></button>}</label>)}</div> : null}
      <div className="custom-model"><div className="custom-title"><Plus /><div><strong>{text.customModel}</strong><span>{text.fillTest}</span></div></div><div className="custom-fields"><label><span>{text.modelId}</span><input value={custom.id} onChange={event => setCustom(current => ({ ...current, id: event.target.value }))} placeholder="gpt-5-mini" /></label><label><span>{text.displayName}</span><input value={custom.name} onChange={event => setCustom(current => ({ ...current, name: event.target.value }))} /></label><label><span>{text.context}</span><input type="number" min="1" value={custom.context} onChange={event => setCustom(current => ({ ...current, context: event.target.value }))} placeholder="128000" /></label><button type="button" className="primary-button" onClick={addCustom}><Plus />{text.add}</button></div>
        <div className="capability-toggles">{(['vision', 'tools', 'web'] as const).map(key => <label key={key}><input type="checkbox" checked={custom[key]} onChange={event => setCustom(current => ({ ...current, [key]: event.target.checked }))} /><span>{text[key]}</span></label>)}</div>{customError && <p className="error-text">{customError}</p>}
      </div>
    </section>
    <footer><button type="button" className="secondary-button" onClick={close}>{text.cancel}</button><button type="submit" className="primary-button" disabled={!connection || !selected.size}><Check />{text.save}</button></footer></form>
  </section></div>;
}

export default Example;