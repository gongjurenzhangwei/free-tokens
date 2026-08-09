import {
  Activity, AlertTriangle, Archive, BarChart3, Boxes, Check, ChevronRight, CircleHelp, Cpu, Database,
  Download, ExternalLink, Eye, EyeOff, Gauge, Gift, Globe, Heart, KeyRound, Languages, LayoutDashboard, Menu, Moon, Network,
  PackageOpen, PanelLeftClose, PanelLeftOpen, Pencil, Plus, RefreshCw, Search, Send, Server, Settings, Share2, Smile, Sparkles,
  ShieldCheck, Sun, Trash2, Users, Wind, X, Zap,
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import type {
  ApiProtocol, DashboardSettings, ModelSeries, ModelSeriesPoint, PlanConfig, PlanInput, PlanModel, QuotaSnapshot, UsageSummary,
} from '../../src/types';

declare function acquireVsCodeApi(): { postMessage(message: unknown): void };

function GithubMark({ size = 20, strokeWidth = 0 }: { size?: number; strokeWidth?: number }) {
  // GitHub mark, simplified for inline use.
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" strokeWidth={strokeWidth} aria-hidden="true">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.16c-3.2.7-3.87-1.36-3.87-1.36-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.24 3.34.95.1-.74.4-1.24.72-1.53-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18.92-.26 1.9-.39 2.88-.39.98 0 1.96.13 2.88.39 2.18-1.49 3.14-1.18 3.14-1.18.63 1.58.23 2.75.11 3.04.74.81 1.18 1.84 1.18 3.1 0 4.43-2.7 5.41-5.27 5.69.41.36.78 1.05.78 2.12v3.14c0 .31.21.67.8.56 4.57-1.52 7.85-5.83 7.85-10.91C23.5 5.65 18.35.5 12 .5z"/>
    </svg>
  );
}

// Inline social marks (paths mirror the SVG icons used on gongjurenzhangwei.com/about).
function IconBilibili({ size = 16 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 1024 1024" fill="currentColor" aria-hidden="true">
      <path d="M887.365 952.784H184.456C82.759 952.784 0 876.724 0 783.272V336.111c0-93.477 82.759-169.537 184.456-169.537h704.043c51.969 0 101.671 20.226 136.377 55.499A159.257 159.257 0 0 1 1071.846 336.42V783.27c0 93.452-82.759 169.512-184.481 169.512zM184.456 251.6c-54.83 0-99.43 37.901-99.43 84.511V783.27c0 46.61 44.6 84.511 99.43 84.511H887.37c54.829 0 99.43-37.901 99.43-84.511V335.416a74.54 74.54 0 0 0-22.57-53.721c-18.81-19.118-46.379-30.094-75.751-30.094z" />
      <path d="M397.794 495.317l-178.143 40.606a36.355 36.355 0 0 1-15.176-71.113l178.143-40.555a35.814 35.814 0 0 1 43.132 27.956c4.302 19.17-8.787 38.854-27.956 43.157zM674.052 495.317c-19.17-4.303-32.258-23.988-27.956-43.157a35.814 35.814 0 0 1 43.132-27.956l178.143 40.555a36.355 36.355 0 0 1-15.176 71.113l-178.143-40.555zM268.812 1024a56.684 56.684 0 0 1-56.684-56.813v-42.59a56.684 56.684 0 1 1 113.6 0v42.59A56.684 56.684 0 0 1 268.812 1024zM803.035 1024a56.684 56.684 0 0 1-56.813-56.813v-42.59a56.684 56.684 0 1 1 113.6 0v42.59A56.684 56.684 0 0 1 803.035 1024z" />
      <path d="M248.92 42.95m26.538-29.67l0 0q26.538-29.67 56.21-3.13L517.567 176.42q29.67 26.538 3.13 56.21l0 0q-26.538 29.67-56.21 3.13L278.59 69.49q-29.67-26.54-3.13-56.21Z" />
      <path d="M577.63 262.33m-26.54-29.67l0 0q-26.538-29.67 3.13-56.21l185.9-166.27q29.67-26.54 56.21-3.13l0 0q26.54 29.67-3.13 56.21L607.3 229.53q-29.67 26.54-56.21 3.13Z" />
    </svg>
  );
}
function IconDouyin({ size = 16 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 1024 1024" fill="currentColor" aria-hidden="true">
      <path d="M909.995 309.476v-34.702a241.21 241.21 0 0 1-45.511-4.893 222.322 222.322 0 0 1-71.68-29.184 23.32 23.32 0 0 0-4.665-4.38 192.17 192.17 0 0 1-69.518-76.46 238.93 238.93 0 0 1-22.755-63.146h-.854a209.64 209.64 0 0 1-3.47-39.822H534.358c0 75.72.284 151.44-.342 227.158v396.46a131.41 131.41 0 0 1-61.78 109.624 130.1 130.1 0 0 1-130.844 4.608 160.82 160.82 0 0 1-39.823-32.598 124.59 124.59 0 0 1-29.98-67.527 133.58 133.58 0 0 1 13.482-74.922 113.78 113.78 0 0 1 28.445-35.328 159.29 159.29 0 0 1 66.674-31.915 110.7 110.7 0 0 1 61.952 1.877V476.217c0-15.246.455-30.55-.342-45.511-.512-12.231 0-24.462 0-36.694a287.35 287.35 0 0 0-190.236 39.823 290.13 290.13 0 0 0-95.63 95.63 286.89 286.89 0 0 0 79.644 384.398l2.105 1.82a283.19 283.19 0 0 0 104.106 45.057 332.3 332.3 0 0 0 80.612 6.485 264.53 264.53 0 0 0 148.992-50.517 297.19 297.19 0 0 0 81.01-91.193 310.56 310.56 0 0 0 42.04-134.03c.967-12.857.4-25.714.342-38.57a35146 35146 0 0 1-.967-289.679 371.43 371.43 0 0 0 216.178 67.812V309.476z" />
    </svg>
  );
}
function IconXiaohongshu({ size = 16 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 1024 1024" fill="currentColor" aria-hidden="true">
      <path d="M832 0H192C86.016 0 0 86.016 0 192v640c0 105.984 86.016 192 192 192h640c105.984 0 192-86.016 192-192V192C1024 86.016 937.984 0 832 0zM198.144 419.328a44.5 44.5 0 0 1 4.096-13.824C226.816 345.6 254.976 286.72 281.6 227.84c8.704-19.456 17.92-38.4 27.648-57.344 2.56-4.608 8.192-11.264 12.8-11.264C360.96 158.72 399.36 158.72 441.344 158.72c-3.584 9.216-5.632 15.872-8.704 21.504L361.984 327.68c-4.608 9.728-10.752 20.48 7.168 28.16 4.608-25.6 24.064-20.992 40.96-20.992h97.28c-4.096 9.728-6.656 16.384-9.728 23.04-30.208 62.976-60.416 124.928-90.112 187.392-12.288 25.6-8.192 31.744 19.968 32.256 14.336-.512 29.184-.512 48.64-.512-18.432 37.888-34.816 72.192-51.712 105.472-3.072 4.096-7.68 6.144-12.288 6.144-40.96 0-82.432 1.536-123.392-1.536s-57.344-29.696-40.96-69.632c18.432-46.592 40.96-91.648 61.952-136.704 1.024-3.072 2.048-5.632 4.608-12.288-16.384 0-31.232.512-45.568 0-11.776 0-23.552-1.024-35.328-3.072-22.016-2.56-37.888-23.04-35.328-46.08zM349.184 865.28c-55.808-.512-112.128-1.536-167.936-3.072a55.1 55.1 0 0 1-22.528-6.144l31.232-63.488c10.24-20.992 19.968-41.984 31.232-61.952 3.072-4.608 7.68-8.192 13.312-8.704 51.2 2.56 102.4 6.144 154.112 9.216 10.24.512 19.968 0 34.816 0-23.04 45.568-43.008 87.04-64 127.488-2.048 4.096-6.144 6.144-10.24 6.656z m516.096-16.896c0 10.752-2.56 16.384-14.848 16.384-140.288 0-280.576-.512-420.864-.512a18 18 0 0 1-8.704-2.048c5.632-12.8 10.752-23.552 15.872-34.304 11.776-22.016 22.528-44.544 32.256-68.096 5.632-22.016 27.136-34.816 48.128-30.208 30.208 2.048 60.928.512 92.672.512V336.896c-21.504 0-42.496-.512-62.976 0-14.336.512-19.456-4.096-19.456-19.456 1.024-37.376 0-74.752 0-114.176h295.424v90.624c0 42.496 0 42.496-41.472 42.496h-41.472v394.752H829.44c36.352 0 36.352 0 36.352 37.888v79.36z" />
    </svg>
  );
}
function IconZhihu({ size = 16 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 1024 1024" fill="currentColor" aria-hidden="true">
      <path d="M526.677 766.421l-72.021 45.824-90.923-142.933c-18.773 59.819-50.005 113.707-91.264 163.2-17.152 20.608-34.987 39.168-55.509 58.667-6.613 6.272-33.067 30.592-37.461 34.987l-60.331-60.331c5.93-5.93 33.579-31.36 39.04-36.523 18.347-17.408 33.92-33.707 48.725-51.456 54.016-64.768 86.613-136.96 91.179-223.189H128v-85.333h170.667V298.667h-37.035c-29.397 54.016-66.475 94.805-111.701 121.898L106.069 347.435c59.52-35.755 103.467-111.104 129.621-228.693l83.285 18.517c-5.973 27.008-12.928 52.352-20.864 76.075H490.667v85.333H384v170.667h106.667v85.333H391.893l134.784 211.755z m163.755-2.987L738.048 725.333H810.667V298.667h-170.667v426.667h31.403l19.029 38.101zM554.667 213.333h341.333v597.334h-128l-106.667 85.333-42.667-85.333H554.667V213.333z" />
    </svg>
  );
}
function IconBaijia({ size = 16 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 1024 1024" fill="currentColor" aria-hidden="true">
      <path d="M819.814 806.912c-.205-58.982-.205-117.76-.41-176.742-4.3-2.253-30.105 16.589-36.659 19.866-6.758 4.096-13.722 8.397-20.48 12.493-16.589 7.987-33.178 16.179-49.766 24.166-9.626 3.482-19.046 7.168-28.672 10.65-7.578 2.253-15.974 3.482-21.914 7.373-2.048 8.397-.819 20.685-.819 30.515v100.352c-5.939 3.277-20.685 1.024-28.877 1.024h-70.04c-87.655-.205-175.31-.205-262.964-.41-2.458-4.096-.819-25.6-.819-33.382V381.542c5.325-2.867 18.227-1.024 26.42-1.024h62.668c90.726.205 181.453.205 271.974.41.41.205.819.205 1.024.41 2.048 11.878-1.843 28.057 1.024 39.32 5.94 2.049 31.95-13.72 39.322-16.588 22.118-8.602 44.851-16.18 68.608-23.552 15.36-4.71 32.154-5.734 48.333-9.626 3.072-5.12 2.662-21.299.819-27.443-8.192-4.71-32.768-4.096-44.442-6.144-25.395-4.506-52.224-5.53-78.438-10.24-7.373-1.434-25.19-5.734-32.358-4.096-.615.41-1.229.819-1.843 1.024-1.024 4.506.205 12.698-1.024 16.589H449.946c-.41-.205-.819-.41-1.024-.819 27.034-44.442 54.272-88.678 81.306-133.12 7.168-11.264 13.516-22.733 20.48-33.792 2.252-3.482 4.096-10.854 8.397-12.083h321.945c8.397 0 19.66 1.229 26.829-.819 10.035-14.95-11.469-19.866-18.432-24.576-22.528-12.083-45.056-24.166-67.38-36.25-6.348-3.89-21.094-14.745-28.876-14.95-16.794 12.083-33.792 24.166-50.586 36.25-49.97.205-99.942.205-149.914.41H97.895c-10.65 0-39.936-2.049-46.49.819-1.229 6.349 3.89 10.445 5.94 14.95 2.252 4.915 8.396 21.094 12.082 23.552 3.482 2.253 11.469.819 16.794.819h292.864l.819 1.434c1.638 4.3-1.638 10.854-2.662 14.745-2.663 12.288-3.891 24.576-6.554 35.84-1.638 10.24-3.276 20.275-4.71 30.515" />
    </svg>
  );
}
function IconBlog({ size = 16 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 1024 1024" fill="currentColor" aria-hidden="true">
      <path d="M0 0h1024v1024H0z" fill="none" opacity=".01" />
      <path d="M238.912 136.512a102.4 102.4 0 0 0-102.4 102.4v546.176a102.4 102.4 0 0 0 102.4 102.4h512V238.912a102.4 102.4 0 0 0-102.4-102.4h-409.6z m409.6-68.224c81.152 0 151.04 57.024 167.296 136.512h37.504a102.4 102.4 0 0 1 102.4 102.4v546.112a102.4 102.4 0 0 1-102.4 102.4h-614.4a170.688 170.688 0 0 1-170.624-170.624V238.912a170.688 170.688 0 0 1 170.624-170.624h409.6z m204.8 819.2a34.112 34.112 0 0 0 34.176-34.176V307.2a34.112 34.112 0 0 0-34.176-34.112H819.2v614.4h34.112z" />
      <path d="M443.712 580.288a34.112 34.112 0 0 1 0 68.224h-204.8a34.112 34.112 0 1 1 0-68.224h204.8z m204.8-136.576a34.112 34.112 0 1 1 0 68.288h-409.6a34.112 34.112 0 0 1 0-68.288z m0-136.512a34.112 34.112 0 1 1 0 68.288h-409.6a34.112 34.112 0 1 1 0-68.288z" />
    </svg>
  );
}
function IconWechat({ size = 16 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 1024 1024" fill="currentColor" aria-hidden="true">
      <path d="M693.12 347.264c11.776 0 23.36.896 35.008 2.176-31.36-146.048-187.456-254.528-365.696-254.528C163.2 94.912 0 230.656 0 403.136c0 99.52 54.272 181.248 145.024 244.736L108.8 756.864l126.72-63.488c45.312 8.896 81.664 18.112 126.912 18.112 11.392 0 22.656-.512 33.792-1.344-7.04-24.256-11.2-49.6-11.2-76.032C385.088 475.776 521.024 347.264 693.12 347.264zM498.304 249.024c27.392 0 45.376 17.984 45.376 45.248 0 27.136-17.984 45.312-45.376 45.312-27.072 0-54.336-18.176-54.336-45.312C443.968 266.944 471.168 249.024 498.304 249.024zM244.672 339.584c-27.2 0-54.592-18.176-54.592-45.312 0-27.264 27.392-45.248 54.592-45.248S289.92 266.944 289.92 294.272C289.92 321.408 271.872 339.584 244.672 339.584zM1024 629.76c0-144.896-145.024-262.976-307.904-262.976-172.48 0-308.224 118.144-308.224 262.976 0 145.28 135.808 262.976 308.224 262.976 36.096 0 72.512-9.024 108.736-18.112l99.392 54.528-27.264-90.624C969.728 783.872 1024 711.488 1024 629.76zM616.128 584.384c-17.984 0-36.224-17.92-36.224-36.224 0-18.048 18.24-36.224 36.224-36.224 27.52 0 45.376 18.176 45.376 36.224C661.504 566.464 643.648 584.384 616.128 584.384zM815.488 584.384c-17.856 0-36.032-17.92-36.032-36.224 0-18.048 18.112-36.224 36.032-36.224 27.264 0 45.376 18.176 45.376 36.224C860.864 566.464 842.752 584.384 815.488 584.384z" />
    </svg>
  );
}

type View = 'overview' | 'connections' | 'models' | 'usage' | 'freetokens' | 'settings';
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
  xai: { provider: 'xAI', url: 'https://api.x.ai', protocol: 'openai' },  kilo: { provider: 'Kilo Gateway', url: 'https://api.kilo.ai/api/gateway', protocol: 'openai' },};
const protocolNames: Record<ApiProtocol, string> = {
  responses: 'Responses API', openai: 'Chat Completions', anthropic: 'Anthropic Messages',
};
const copy = {
  'zh-CN': {
    overview: '概览', connections: '接入平台', models: '模型', usage: '用量与配额', settings: '设置', workspace: '控制中心',
    subtitle: '管理模型供应商、访问密钥与本地用量', newPlan: '接入 Plan', checkUpdate: '检查更新', enabledPlans: '已启用 Plan', availableModels: '可用模型',
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
    freetokens: '免费 Token', freetokensTitle: '免费 Token 推荐', freetokensDesc: '一些可以拿到免费 Token / 免费额度的供应商，注册即可使用。额度与限制请以官方页面为准。', freetokensQuota: '额度', freetokensInvite: '前往获取 →', freetokensDocs: '文档',
    submitChannel: '提交免费 Token 渠道', submitChannelDesc: '发现好的免费 Token / 免费额度渠道？填个表单推荐给开发者，审核通过后会收录到上方列表。', channelName: '渠道名称', channelNamePh: '例如：某云厂商免费额度', channelUrl: '访问地址', channelUrlPh: 'https://example.com/register', channelQuota: '额度 / 优惠（可选）', channelQuotaPh: '例如：注册送 100 万 Token', channelNote: '补充说明（可选）', channelNotePh: '协议、限制、使用心得…', submit: '提交免费渠道', submitting: '正在提交…', channelNameRequired: '请填写渠道名称。', channelUrlRequired: '请填写访问地址。',
    statusBar: '状态栏显示', source: '配额来源', off: '仅 BYOK', tokens: '本地 Token', quota: '官方配额',
    theme: '主题', system: '跟随系统', light: '白天', dark: '暗黑', language: '界面语言', help: '帮助与信息', version: '扩展版本',
    aboutTitle: '关于 免费 Token', aboutDesc: '版本、隐私与开发者信息',
    versionInfo: '版本信息', currentVersion: '当前版本', security: '隐私与安全', changelog: '更新日志',
    developer: '开发者信息', developerName: '关于工具人张伟', developerSite: '访问官网',
    social: '社交媒体',
    socialGithub: 'GitHub', socialX: 'X (Twitter)', socialYoutube: 'YouTube', socialBilibili: 'B站',
    socialDouyin: '抖音', socialXiaohongshu: '小红书', socialZhihu: '知乎',
    socialBaijia: '百家号', socialBlog: '博客', socialWechat: '公众号', socialEmail: '邮箱反馈',
    planName: 'Plan 名称', baseUrl: 'Base URL', apiKey: 'API Key / Subscription Key', secretHint: '仅保存在 VS Code SecretStorage', preset: '供应商预设',
    test: '测试并获取模型', testing: '正在测试连接…', fillTest: '填写连接信息后测试，也可以直接手动添加模型。', connectionChanged: '连接配置已变化，请重新测试。',
    connected: (count: number) => `连接成功，发现 ${count} 个模型。`, customModel: '手动添加模型', modelId: '模型 ID', displayName: '显示名称（可选）', context: '上下文长度',
    vision: '视觉', tools: '工具调用', web: '联网', add: '添加', selectAll: '全选', clearAll: '清空', selected: (count: number) => `已选择 ${count} 个模型`, cancel: '取消', save: '保存 Plan',
    requiredModel: '请填写模型 ID。', duplicateModel: '该模型 ID 已存在。', invalidConnection: '请填写有效的 Base URL 和 API Key。', editPlan: '编辑 Plan', newPlanTitle: '接入新 Plan',
  },
  en: {
    overview: 'Overview', connections: 'Connections', models: 'Models', usage: 'Usage & quota', settings: 'Settings', workspace: 'Control center',
    subtitle: 'Manage model providers, credentials, and local usage', newPlan: 'Connect plan', checkUpdate: 'Check updates', enabledPlans: 'Enabled plans', availableModels: 'Available models',
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
    freetokens: 'Free Tokens', freetokensTitle: 'Free Token Recommendations', freetokensDesc: 'Providers offering free tokens or free-tier quotas. Sign up and start using immediately. Limits are subject to the provider’s official page.', freetokensQuota: 'Quota', freetokensInvite: 'Get free access →', freetokensDocs: 'Docs',
    submitChannel: 'Submit a free-token channel', submitChannelDesc: 'Know a great free-token / free-quota channel? Recommend it to the developer — it will be added to the list above after review.', channelName: 'Channel name', channelNamePh: 'e.g. Some cloud free quota', channelUrl: 'Access URL', channelUrlPh: 'https://example.com/register', channelQuota: 'Quota / bonus (optional)', channelQuotaPh: 'e.g. 1M free tokens on signup', channelNote: 'Extra notes (optional)', channelNotePh: 'Protocol, limits, usage tips…', submit: 'Submit free channel', submitting: 'Submitting…', channelNameRequired: 'Channel name is required.', channelUrlRequired: 'Access URL is required.',
    statusBar: 'Status bar', source: 'Quota source', off: 'BYOK only', tokens: 'Local tokens', quota: 'Official quota',
    theme: 'Theme', system: 'System', light: 'Light', dark: 'Dark', language: 'Language', help: 'Help & information', version: 'Extension version',
    aboutTitle: 'About Free Tokens', aboutDesc: 'Version, privacy, and developer info',
    versionInfo: 'Version', currentVersion: 'Current version', security: 'Privacy & security', changelog: 'Changelog',
    developer: 'Developer', developerName: 'About Toolman Zhangwei', developerSite: 'Visit website',
    social: 'Social',
    socialGithub: 'GitHub', socialX: 'X (Twitter)', socialYoutube: 'YouTube', socialBilibili: 'Bilibili',
    socialDouyin: 'Douyin', socialXiaohongshu: 'Xiaohongshu', socialZhihu: 'Zhihu',
    socialBaijia: 'Baijia', socialBlog: 'Blog', socialWechat: 'WeChat', socialEmail: 'Email feedback',
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
function normalizeModelName(value: string): string { return String(value || '').trim(); }
/** Provider name / Base URL → favicon host. Falls back to provider domain or generic Cpu icon. */
function modelIconDomain(provider: string, baseUrl?: string): string | undefined {
  const text = `${provider || ''} ${baseUrl || ''}`.toLowerCase();
  const map: Array<[RegExp, string]> = [
    [/openai|gpt/, 'openai.com'],
    [/anthropic|claude/, 'anthropic.com'],
    [/minimax|minimax/, 'minimaxi.com'],
    [/google|gemini|gemini[-_]?studio/, 'google.com'],
    [/deepseek/, 'deepseek.com'],
    [/qwen|alibaba|dashscope|tongyi/, 'qwen.ai'],
    [/moonshot|kimi/, 'moonshot.cn'],
    [/zhipu|bigmodel|glm/, 'zhipuai.cn'],
    [/mistral/, 'mistral.ai'],
    [/xai|grok/, 'x.ai'],
    [/meta|llama/, 'meta.com'],
    [/mistral|codestral/, 'mistral.ai'],
    [/openrouter/, 'openrouter.ai'],
    [/nvidia|nim/, 'nvidia.com'],
    [/huggingface|hf/, 'huggingface.co'],
    [/cohere/, 'cohere.com'],
    [/perplexity/, 'perplexity.ai'],
    [/together/, 'together.ai'],
    [/fireworks/, 'fireworks.ai'],
    [/replicate/, 'replicate.com'],
    [/stability|sd|stable/, 'stability.ai'],
    [/midjourney/, 'midjourney.com'],
    [/elevenlabs/, 'elevenlabs.io'],
  ];
  for (const [pattern, domain] of map) if (pattern.test(text)) return domain;
  try {
    const host = baseUrl ? new URL(baseUrl).hostname : '';
    if (host) {
      const parts = host.split('.');
      if (parts.length >= 2) return parts.slice(-2).join('.');
      return host;
    }
  } catch (e) { /* ignore */ }
  return undefined;
}
function ModelIcon({ provider, baseUrl, name, kind }: { provider: string; baseUrl?: string; name: string; kind?: PlanModel['kind'] }) {
  const [failed, setFailed] = useState(false);
  // Prefer a per-kind lucide icon (image/video/chat/audio/embed), then fall back to provider favicon, then Cpu.
  const KindIcon = (() => {
    switch (kind) {
      case 'image': return Sparkles;
      case 'video': return Zap;
      case 'embed': return Database;
      case 'audio': return Wind;
      case 'chat':
      default: return Cpu;
    }
  })();
  const domain = modelIconDomain(provider, baseUrl);
  const src = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : '';
  const initial = normalizeModelName(name).slice(0, 1).toUpperCase() || (provider || '?').slice(0, 1).toUpperCase();
  if (domain && !failed) {
    return (
      <img className="model-chip-favicon"
        src={src}
        alt={domain}
        width={20}
        height={20}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <span className="model-chip-glyph" aria-hidden>
      {initial || <KindIcon size={18} strokeWidth={2} />}
    </span>
  );
}
const modelKindLabels: Record<NonNullable<PlanModel['kind']>, { zh: string; en: string; tone: string }> = {
  chat:  { zh: '对话',     en: 'Chat',   tone: '#4567e8' },
  image: { zh: '生图',     en: 'Image',  tone: '#db2777' },
  video: { zh: '生视频',   en: 'Video',  tone: '#9333ea' },
  embed: { zh: '向量',     en: 'Embed',  tone: '#0891b2' },
  audio: { zh: '语音',     en: 'Audio',  tone: '#ea580c' },
};

export function Example() {
  const [state, setState] = useState<DashboardState>(emptyState);
  const [view, setView] = useState<View>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [editorPlan, setEditorPlan] = useState<PlanConfig | null | undefined>(undefined);
  const [notice, setNotice] = useState<{ level: string; message: string }>();
  const [refreshing, setRefreshing] = useState(false);
  const [showSubmitChannel, setShowSubmitChannel] = useState(false);
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
    { id: 'freetokens' as const, icon: Gift, label: text.freetokens },
    { id: 'settings' as const, icon: Settings, label: text.settings },
  ];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="brand-row">
          <span className="brand-mark"><KeyRound /></span>
          {sidebarOpen && <div className="brand-copy"><strong>免费 Token</strong><span>FREE TOKENS</span></div>}
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
            <button className="secondary-button" onClick={() => vscode.postMessage({ type: 'checkUpdate' })} title={text.checkUpdate}>
              <Download size={16} strokeWidth={2} />{text.checkUpdate}
            </button>
            <button className="secondary-button" onClick={() => setShowSubmitChannel(true)} title={text.submitChannel}>
              <Gift size={16} strokeWidth={2} />{text.submit}
            </button>
          </div>
        </header>

        <div className="content-wrap">
          {view === 'overview' && <Overview state={state} totals={totals} availableModels={availableModels} language={language} text={text} openConnections={() => setView('connections')} edit={setEditorPlan} />}
          {view === 'connections' && <Connections state={state} language={language} text={text} edit={setEditorPlan} create={() => setEditorPlan(null)} />}
          {view === 'models' && <Models state={state} language={language} text={text} />}
          {view === 'usage' && <Usage state={state} language={language} text={text} />}
          {view === 'freetokens' && <FreeTokensView language={language} text={text} />}
          {view === 'settings' && <SettingsView state={state} text={text} language={language} save={saveSettings} />}
        </div>
      </main>
      {editorPlan !== undefined && <PlanEditor plan={editorPlan} language={language} text={text} close={() => setEditorPlan(undefined)} />}
      {showSubmitChannel && <SubmitChannelModal language={language} text={text} close={() => setShowSubmitChannel(false)} />}
      {notice && <div className={`toast ${notice.level}`}>{notice.level === 'success' ? <Check /> : <X />}<span>{notice.message}</span></div>}
    </div>
  );
}

function SubmitChannelModal({ language, text, close }: { language: 'zh-CN' | 'en'; text: any; close: () => void }) {
  const isZh = language !== 'en';
  const [channel, setChannel] = useState({ name: '', url: '', quota: '', note: '' });
  const [submitting, setSubmitting] = useState(false);
  const [channelError, setChannelError] = useState('');

  const submitChannel = (event: FormEvent) => {
    event.preventDefault();
    const name = channel.name.trim();
    const url = channel.url.trim();
    if (!name) { setChannelError(text.channelNameRequired); return; }
    if (!url || !/^https?:\/\//i.test(url)) { setChannelError(text.channelUrlRequired); return; }
    setChannelError('');
    setSubmitting(true);
    vscode.postMessage({
      type: 'submitFreeToken',
      payload: { name, url, quota: channel.quota.trim(), note: channel.note.trim() },
    });
    setChannel({ name: '', url: '', quota: '', note: '' });
    close();
  };

  return (
    <div className="modal-backdrop submit-channel-modal" role="dialog" aria-modal="true"
      onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div className="editor-modal submit-channel-modal-card">
        <header>
          <div>
            <p>{text.freetokens}</p>
            <h2>{text.submitChannel}</h2>
          </div>
          <button className="icon-button" onClick={close} aria-label={isZh ? '关闭' : 'Close'}><X size={18} /></button>
        </header>
        <form className="submit-channel-modal-body" onSubmit={submitChannel} noValidate>
          <p className="submit-channel-desc">{text.submitChannelDesc}</p>
          <label className="submit-field">
            <span>{text.channelName} <i>*</i></span>
            <input type="text" value={channel.name} placeholder={text.channelNamePh}
              onChange={(event) => setChannel((prev) => ({ ...prev, name: event.target.value }))} />
          </label>
          <label className="submit-field">
            <span>{text.channelUrl} <i>*</i></span>
            <input type="url" value={channel.url} placeholder={text.channelUrlPh}
              onChange={(event) => setChannel((prev) => ({ ...prev, url: event.target.value }))} />
          </label>
          <label className="submit-field">
            <span>{text.channelQuota}</span>
            <input type="text" value={channel.quota} placeholder={text.channelQuotaPh}
              onChange={(event) => setChannel((prev) => ({ ...prev, quota: event.target.value }))} />
          </label>
          <label className="submit-field">
            <span>{text.channelNote}</span>
            <textarea rows={3} value={channel.note} placeholder={text.channelNotePh}
              onChange={(event) => setChannel((prev) => ({ ...prev, note: event.target.value }))} />
          </label>
          {channelError && <span className="error-text">{channelError}</span>}
          <footer>
            <button className="secondary-button" type="button" onClick={close}>{isZh ? '取消' : 'Cancel'}</button>
            <button className="primary-button" type="submit" disabled={submitting}>
              <Send size={16} strokeWidth={2} />{submitting ? text.submitting : text.submit}
            </button>
          </footer>
        </form>
      </div>
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
              <span className="trend-value">
                <strong>{formatNumber(totalOf(item), language)}</strong>
                <small>{mode === 'requests' ? text.trendRequests : text.trendTokens}</small>
              </span>
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
      const displayName = normalizeModelName(model.name) || model.id;
      const showName = displayName !== model.id;
      return <article className={`model-card ${invalid ? 'is-invalid' : ''}`} key={`${model.plan.id}-${model.id}`}><div className="model-card-head"><span className="model-chip"><ModelIcon provider={model.plan.provider} baseUrl={model.plan.baseUrl} name={model.name} kind={model.kind} /></span><span className={`health ${invalid ? 'danger' : (model.plan.enabled ? 'healthy' : 'warning')}`}><i />{invalid ? text.modelInvalid : (model.plan.enabled ? text.available : text.disabled)}</span></div>{showName ? <strong>{displayName}</strong> : <strong className="model-card-id-only">{model.id}</strong>}<code>{model.id}</code><p>{model.plan.name} / {model.plan.provider}</p>{invalid ? <p className="model-invalid-hint">{text.modelInvalidHint}</p> : <div className="feature-list">{modelFeatures(model, language).map(value => <span key={value}>{value}</span>)}</div>}</article>;
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

function AboutPanel({ language, text }: { language: 'zh-CN' | 'en'; text: any }) {
  const isZh = language !== 'en';
  const [showPolicy, setShowPolicy] = useState(false);
  const [showWechat, setShowWechat] = useState(false);
  // Version comes from the meta tag injected by the host (or the preview HTML).
  const version = (typeof document !== 'undefined'
    ? document.querySelector('meta[name="byok-version"]')?.getAttribute('content') || ''
    : '') || '1.5.15';
  // Real WeChat QR code (matches https://www.gongjurenzhangwei.com/about/).
  const wechatQr = (typeof document !== 'undefined'
    ? document.querySelector('meta[name="byok-wechat-qr"]')?.getAttribute('content') || ''
    : '');
  const site = 'https://www.gongjurenzhangwei.com';
  // Match the social list on https://www.gongjurenzhangwei.com/about/
  const socials = [
    { key: 'bilibili', label: isZh ? 'B站' : 'Bilibili', href: 'https://space.bilibili.com/315615481', Icon: IconBilibili },
    { key: 'douyin', label: isZh ? '抖音' : 'Douyin', href: 'https://www.douyin.com/user/MS4wLjABAAAAYCSdSQTmkesqpzM4eS97PaZvL2fLIF_VrOpGbFreYXTwbfFspknG-oFFopt8AsOr', Icon: IconDouyin },
    { key: 'xiaohongshu', label: isZh ? '小红书' : 'Xiaohongshu', href: 'https://www.xiaohongshu.com/user/profile/64d8414c000000000100f8f6', Icon: IconXiaohongshu },
    { key: 'zhihu', label: isZh ? '知乎' : 'Zhihu', href: 'https://www.zhihu.com/people/gongjurenzhangwei', Icon: IconZhihu },
    { key: 'baijia', label: isZh ? '百家号' : 'Baijia', href: 'https://author.baidu.com/home?from=bjh_article&app_id=1723304085569082', Icon: IconBaijia },
    { key: 'blog', label: isZh ? '博客' : 'Blog', href: 'https://www.gongjurenzhangwei.com', Icon: IconBlog },
    { key: 'wechat', label: isZh ? '公众号' : 'WeChat', Icon: IconWechat, popup: true },
  ];
  return (
    <section className="glass-panel info-panel about-panel">
      <header className="about-header">
        <ShieldCheck />
        <div>
          <h3>{text.aboutTitle}</h3>
          <p>{text.aboutDesc}</p>
        </div>
      </header>
      <div className="about-stack">
        <div className="about-block">
          <div className="about-block-title">{text.versionInfo}</div>
          <dl className="about-rows">
            <div className="about-row"><dt>{text.currentVersion}</dt><dd><code>v{version}</code></dd></div>
            <div className="about-row"><dt>{text.security}</dt><dd><button type="button" className="about-link-button" onClick={() => setShowPolicy(true)}>{isZh ? '安全说明' : 'Security notes'} →</button></dd></div>
          </dl>
        </div>
        <div className="about-block">
          <div className="about-block-title">{text.developer}</div>
          <div className="about-developer">
            <div className="about-developer-id">
              <div className="about-developer-name">
                <strong>{text.developerName}</strong>
                <button type="button" className="about-open-button about-open-button--inline" onClick={() => vscode.postMessage({ type: 'openExternal', url: 'https://www.gongjurenzhangwei.com/about/' })} aria-label={isZh ? '在浏览器中打开关于页' : 'Open About in browser'} title={isZh ? '在系统浏览器中打开' : 'Open in system browser'}>
                  <ExternalLink size={14} strokeWidth={2} />
                </button>
              </div>
              <span>{isZh
                ? '计算机教师，独立开发者，效率达人，分享各种办公/软件/工具/网站/外贸/设计/编程技能，欢迎关注工具人张伟。'
                : 'Computer-science teacher, indie developer, and productivity nerd sharing office, software, tools, sites, trade, design, and coding skills. Follow Toolman Zhangwei for more.'}</span>
            </div>
            <div className="about-developer-actions">
              <button type="button" className="primary-button about-cta" onClick={() => vscode.postMessage({ type: 'openExternal', url: site })}>{text.developerSite} →</button>
            </div>
          </div>
        </div>
        <div className="about-block">
          <div className="about-block-title">{text.social}</div>
          <div className="about-socials">
            {socials.map(({ key, label, href, Icon, popup }) => {
              if (popup) {
                return (
                  <button key={key} type="button" className="about-social-link is-wechat" aria-label={label} onClick={() => setShowWechat(true)}>
                    <span className="about-social-chip"><Icon size={12} /></span>
                    <span className="about-social-label">{label}</span>
                  </button>
                );
              }
              return (
                <a key={key} className="about-social-link" href={href} rel="noopener noreferrer" aria-label={label} onClick={(event) => { event.preventDefault(); vscode.postMessage({ type: 'openExternal', url: href }); }}>
                  <span className="about-social-chip"><Icon size={12} /></span>
                  <span className="about-social-label">{label}</span>
                  <span className="about-social-arrow"><ExternalLink size={12} strokeWidth={2} /></span>
                </a>
              );
            })}
          </div>
        </div>
      </div>
      {showPolicy && (
        <div className="modal-backdrop about-policy-modal" role="dialog" aria-modal="true" onClick={(event) => { if (event.target === event.currentTarget) setShowPolicy(false); }}>
          <div className="editor-modal about-policy-modal-card">
            <header>
              <div>
                <p>{text.security}</p>
                <h2>{isZh ? '免费 Token 隐私与安全说明' : 'Free Tokens Privacy & Security'}</h2>
              </div>
              <button className="icon-button" onClick={() => setShowPolicy(false)} aria-label={isZh ? '关闭' : 'Close'}><X size={18} /></button>
            </header>
            <div className="about-policy-modal-body">
              {isZh ? (
                <>
                  <p>免费 Token（"本扩展"）以"自带密钥（BYOK）"为核心原则，致力于让模型调用过程中的所有敏感数据都保留在你自己的设备上。下面是与隐私和安全相关的关键条款：</p>
                  <ol>
                    <li><strong>本地优先的数据存储</strong>：所有 Plan、设置、用量记录、配额快照与 kind 标记均保存在本工作区的 <code>globalState</code> 中；不会上传到 免费 Token 任何服务器。</li>
                    <li><strong>API Key 的安全保存</strong>：你填写的所有 API Key 一律写入 VS Code 的 <code>SecretStorage</code>（操作系统级 Keychain / DPAPI），不在明文配置文件中出现。</li>
                    <li><strong>导出文件加密</strong>：当你导出包含 API Key 的配置时，扩展会用 AES-256-GCM 对每个 Key 单独加密；密钥由 scrypt 从本工作区专属随机 passphrase 派生，并保存于 <code>SecretStorage</code>。导入时需提供 passphrase 才能恢复 Key。</li>
                    <li><strong>不收集遥测</strong>：本扩展不会发送任何使用统计、模型输入/输出内容或设备信息到第三方服务器；网络请求仅限于你显式连接的供应商 Base URL。</li>
                    <li><strong>最小权限原则</strong>：扩展只请求用于访问 SecretStorage 与文件系统（备份导出/导入）所需的最小 VS Code 权限范围。</li>
                    <li><strong>透明开源</strong>：本扩展的关键加密逻辑（备份加解密、SecretStorage 写入路径）均在开源仓库中可审计。</li>
                  </ol>
                  <p className="about-policy-modal-foot">{isZh ? '如对本协议有疑问，可在「关于」面板底部通过社交媒体与开发者联系。' : ''}</p>
                </>
              ) : (
                <>
                  <p>Free Tokens ("the extension") follows a Bring-Your-Own-Key (BYOK) approach so sensitive data stays on your machine. Key privacy and security terms:</p>
                  <ol>
                    <li><strong>Local-first storage.</strong> Plans, settings, usage records, quota snapshots, and kind metadata live in your workspace's <code>globalState</code>. Nothing is uploaded to Free Tokens servers.</li>
                    <li><strong>API keys in SecretStorage.</strong> Every API key is written to VS Code's <code>SecretStorage</code> (OS-level Keychain / DPAPI). Plain-text credentials are never persisted.</li>
                    <li><strong>Encrypted exports.</strong> Backups that include API keys are encrypted with AES-256-GCM, one key per plan. The encryption key is derived with scrypt from a workspace-local passphrase stored in <code>SecretStorage</code>. The passphrase is required to restore keys on import.</li>
                    <li><strong>No telemetry.</strong> The extension does not send usage stats, prompts, completions, or device info anywhere. Outbound network traffic is limited to the Base URLs you explicitly connect.</li>
                    <li><strong>Minimal permissions.</strong> Only the VS Code scopes required for SecretStorage access and backup file I/O are requested.</li>
                    <li><strong>Open & auditable.</strong> The crypto and storage paths live in the open-source repository for review.</li>
                  </ol>
                  <p className="about-policy-modal-foot">{!isZh ? 'Questions? Reach the developer via the social links below the About panel.' : ''}</p>
                </>
              )}
            </div>
            <footer>
              <button className="primary-button" onClick={() => setShowPolicy(false)}>{isZh ? '我已知悉' : 'Got it'}</button>
            </footer>
          </div>
        </div>
      )}
      {showWechat && (
        <div className="modal-backdrop about-wechat-modal" role="dialog" aria-modal="true" onClick={(event) => { if (event.target === event.currentTarget) setShowWechat(false); }}>
          <div className="editor-modal about-wechat-modal-card">
            <header>
              <div>
                <p>{isZh ? '社交媒体' : 'Social'}</p>
                <h2>{isZh ? '关注公众号' : 'Follow WeChat'}</h2>
              </div>
              <button className="icon-button" onClick={() => setShowWechat(false)} aria-label={isZh ? '关闭' : 'Close'}><X size={18} /></button>
            </header>
            <div className="about-wechat-modal-body">
              {wechatQr ? (
                <img className="about-wechat-modal-qr" src={wechatQr} alt={isZh ? '公众号二维码' : 'WeChat QR'} draggable={false} />
              ) : (
                <div className="about-wechat-modal-qr about-wechat-modal-qr--placeholder" role="img" aria-label={isZh ? '公众号二维码' : 'WeChat QR'}>
                  {isZh ? '公众号' : 'WeChat'}<br />{isZh ? '二维码占位' : 'QR placeholder'}
                </div>
              )}
              <p className="about-wechat-modal-hint">
                <strong>{isZh ? '工具人张伟' : 'Toolman Zhangwei'}</strong><br />
                {isZh ? '使用微信扫一扫即可关注' : 'Open WeChat and scan to follow'}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function SettingsView({ state, text, language, save }: any) {
  const quotaPlans = state.plans.filter(isMiniMax);
  const [includeKeys, setIncludeKeys] = useState(true);
  return <div className="settings-layout"><section className="glass-panel settings-card"><PanelHeading title={text.settingsTitle} detail={text.settingsDesc} />
    <SettingRow icon={Eye} title={text.onlyAvailable} detail={text.onlyAvailableDesc}><button className={`toggle-button ${state.settings.filterAvailable ? 'on' : ''}`} onClick={() => save({ filterAvailable: !state.settings.filterAvailable })}>{state.settings.filterAvailable ? <Eye /> : <EyeOff />}</button></SettingRow>
    <SettingRow icon={Activity} title={text.statusBar}><select value={state.settings.statusBarUsage || 'off'} onChange={event => save({ statusBarUsage: event.target.value })}><option value="off">{text.off}</option><option value="tokens">{text.tokens}</option><option value="quota">{text.quota}</option></select></SettingRow>
    {state.settings.statusBarUsage === 'quota' && <SettingRow icon={Gauge} title={text.source}><select value={state.settings.statusBarPlanId || quotaPlans[0]?.id || ''} onChange={event => save({ statusBarPlanId: event.target.value })}>{quotaPlans.map((plan: PlanConfig) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}</select></SettingRow>}
    <SettingRow icon={Moon} title={text.theme}><div className="segmented three"><button className={state.settings.dashboardTheme === 'system' ? 'active' : ''} onClick={() => save({ dashboardTheme: 'system' })}>{text.system}</button><button className={state.settings.dashboardTheme === 'light' ? 'active' : ''} onClick={() => save({ dashboardTheme: 'light' })}>{text.light}</button><button className={state.settings.dashboardTheme === 'dark' ? 'active' : ''} onClick={() => save({ dashboardTheme: 'dark' })}>{text.dark}</button></div></SettingRow>
    <SettingRow icon={Languages} title={text.language}><div className="segmented"><button className={language === 'zh-CN' ? 'active' : ''} onClick={() => save({ language: 'zh-CN' })}>中文</button><button className={language === 'en' ? 'active' : ''} onClick={() => save({ language: 'en' })}>English</button></div></SettingRow>
    <SettingRow icon={ShieldCheck} title={text.includeApiKeys} detail={text.includeApiKeysDesc}><button className={`toggle-button ${includeKeys ? 'on' : ''}`} onClick={() => setIncludeKeys(!includeKeys)}>{includeKeys ? <Eye /> : <EyeOff />}</button></SettingRow>
    <div className="config-row">
      <div className="config-row-copy">
        <span className="setting-icon"><Archive /></span>
        <div>
          <strong>{text.configTitle}</strong>
          <span>{text.configDesc}</span>
        </div>
      </div>
      <div className="config-actions">
        <button className="primary-button" onClick={() => vscode.postMessage({ type: 'exportConfig', includeApiKeys: includeKeys })}><Download />{text.exportConfig}</button>
        <button className="secondary-button" onClick={() => vscode.postMessage({ type: 'importConfig', includeApiKeys: includeKeys })}><PackageOpen />{text.importConfig}</button>
      </div>
    </div>
  </section>
  <AboutPanel language={language} text={text} /></div>;
}

function FreeTokensView({ language, text }: { language: 'zh-CN' | 'en'; text: any }) {
  // The free-token card list lives in a standalone HTML file (docs/free-tokens.html)
  // hosted externally so owners can update it without re-releasing the extension.
  // We render it via iframe; the URL is injected from the host as a meta tag.
  const freeTokensUrl = (typeof document !== 'undefined'
    ? document.querySelector('meta[name="byok-freetokens-url"]')?.getAttribute('content') || ''
    : '');

  if (!freeTokensUrl) {
    // Fallback: keep the same message in both languages so a missing host
    // configuration never silently renders an empty page.
    return (
      <div className="settings-layout">
        <section className="glass-panel free-tokens-panel">
          <PanelHeading title={text.freetokensTitle} detail={text.freetokensDesc} />
          <p className="about-block">
            {language === 'en'
              ? 'The free-token recommendations page is not configured. Set "byokCopilot.freeTokensUrl" in VS Code settings or update docs/free-tokens.html in the repository.'
              : '免费 Token 推荐页未配置。请在 VS Code 设置中填写 "byokCopilot.freeTokensUrl"，或在仓库中更新 docs/free-tokens.html。'}
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="settings-layout">
      <section className="glass-panel free-tokens-panel">
        <PanelHeading title={text.freetokensTitle} detail={text.freetokensDesc} />
        <iframe
          className="free-tokens-iframe"
          src={freeTokensUrl}
          title={text.freetokensTitle}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </section>
    </div>
  );
}

function _legacyFreeTokensView({ language, text }: { language: 'zh-CN' | 'en'; text: any }) {
  // Kept for reference; the production FreeTokensView above renders an iframe
  // backed by docs/free-tokens.html. The provider list below is preserved so
  // a future maintainer can copy data into the standalone HTML.
  const isZh = language !== 'en';
  const _faviconFor = (domain: string): string => `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  return null; // The remaining legacy free-token provider list and JSX were intentionally
  //            removed; the production FreeTokensView above renders an iframe
  //            backed by docs/free-tokens.html. See git history for the old
  //            inlined implementation if you need to migrate the data.
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
      {connection?.models.length ? <div className="model-options">{visible.map(model => {
        const kind = (model.kind ?? 'chat') as keyof typeof modelKindLabels;
        const kindInfo = modelKindLabels[kind];
        return <label key={model.id} className={selected.has(model.id) ? 'selected' : ''}><input type="checkbox" checked={selected.has(model.id)} onChange={() => toggleModel(model.id)} /><span><strong>{model.name}</strong><code>{model.id}</code><i>{modelFeatures(model, language).map(feature => <em key={feature}>{feature}</em>)}</i>{kind !== 'chat' && <em className="kind-badge" title={language === 'en' ? `Model kind: ${kindInfo.en}` : `模型类型：${kindInfo.zh}`} style={{ color: kindInfo.tone, borderColor: kindInfo.tone + '55', background: kindInfo.tone + '14' }}>{language === 'en' ? kindInfo.en : kindInfo.zh}</em>}{model.free === true ? <em className="free-badge" title={text.freeHint}>{text.free}</em> : <em className="free-badge muted" title={text.freeUnknown}>{text.freeUnknown}</em>}</span>{(model as ModelWithCustom).custom && <button type="button" className="icon-button danger" onClick={event => { event.preventDefault(); setConnection(current => current ? { ...current, models: current.models.filter(item => item.id !== model.id) } : current); setSelected(current => { const next = new Set(current); next.delete(model.id); return next; }); }}><Trash2 /></button>}</label>;
      })}</div> : null}
      <div className="custom-model"><div className="custom-title"><Plus /><div><strong>{text.customModel}</strong><span>{text.fillTest}</span></div></div><div className="custom-fields"><label><span>{text.modelId}</span><input value={custom.id} onChange={event => setCustom(current => ({ ...current, id: event.target.value }))} placeholder="gpt-5-mini" /></label><label><span>{text.displayName}</span><input value={custom.name} onChange={event => setCustom(current => ({ ...current, name: event.target.value }))} /></label><label><span>{text.context}</span><input type="number" min="1" value={custom.context} onChange={event => setCustom(current => ({ ...current, context: event.target.value }))} placeholder="128000" /></label><button type="button" className="primary-button" onClick={addCustom}><Plus />{text.add}</button></div>
        <div className="capability-toggles">{(['vision', 'tools', 'web'] as const).map(key => <label key={key}><input type="checkbox" checked={custom[key]} onChange={event => setCustom(current => ({ ...current, [key]: event.target.checked }))} /><span>{text[key]}</span></label>)}</div>{customError && <p className="error-text">{customError}</p>}
      </div>
    </section>
    <footer><button type="button" className="secondary-button" onClick={close}>{text.cancel}</button><button type="submit" className="primary-button" disabled={!connection || !selected.size}><Check />{text.save}</button></footer></form>
  </section></div>;
}

export default Example;