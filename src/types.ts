export type ApiProtocol = 'openai' | 'responses' | 'anthropic';

/**
 * 模型的用途分类。
 *  - chat    文本对话（注册到 VS Code Chat 模型选择器）
 *  - image   文生图 / 图生图（OpenAI `/v1/images/generations` 兼容）
 *  - video   文生视频 / 图生视频（OpenAI `/v1/videos` 兼容）
 *  - embed   向量嵌入（用于检索）
 *  - audio   语音合成 / 转写
 */
export type ModelKind = 'chat' | 'image' | 'video' | 'embed' | 'audio';

export type StatusBarUsageMode = 'off' | 'tokens' | 'quota';

export interface QuotaWindow {
  id: string;
  label: string;
  unlimited?: boolean;
  /** 供应商提供上限但未开放当前用量查询（如 OpenCode Go）：前端只展示上限与提示，不再推算 0%。 */
  usageUnknown?: boolean;
  used?: number;
  limit?: number;
  remaining?: number;
  percentUsed?: number;
  resetAt?: number;
  unit: string;
}

export interface QuotaSnapshot {
  planId: string;
  fetchedAt: number;
  source: 'remote' | 'unsupported';
  windows: QuotaWindow[];
}

export type QuotaSnapshotWithStatus = QuotaSnapshot | { planId: string; fetchedAt: number; source: 'unsupported'; windows: never[] };

export interface PlanModel {
  id: string;
  name: string;
  /**
   * 模型用途分类。`undefined` 时按 `chat` 处理（兼容旧配置）。
   * - chat：注册到 VS Code Chat 模型选择器
   * - image / video / embed / audio：保留在 Plan 中供后续扩展调用，不进 Chat 选单
   */
  kind?: ModelKind;
  maxInputTokens: number;
  maxOutputTokens: number;
  toolCalling: boolean;
  vision: boolean;
  contextLength?: number;
  supportsTools?: boolean;
  supportsVision?: boolean;
  supportsWebSearch?: boolean;
  features?: string[];
  /** 供应商侧标识该模型属于免费档位（仅作为前端提示，BYOK 不会主动改写请求）。 */
  free?: boolean;
}

export interface PlanConfig {
  id: string;
  name: string;
  provider: string;
  baseUrl: string;
  protocol: ApiProtocol;
  enabled: boolean;
  models: PlanModel[];
  createdAt: number;
  updatedAt: number;
}

export interface UsageRecord {
  id: string;
  planId: string;
  modelId: string;
  timestamp: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  requests: number;
  success: boolean;
}

export interface PlanInput extends Omit<PlanConfig, 'id' | 'models' | 'createdAt' | 'updatedAt'> {
  id?: string;
  apiKey?: string;
}

export interface UsageSummary {
  planId: string;
  requests: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  failures: number;
}

export interface ModelSeriesPoint {
  timestamp: number;
  requests: number;
  tokens: number;
}

export interface ModelSeries {
  id: string;
  planId: string;
  modelId: string;
  name: string;
  provider: string;
  total: number;
  totalTokens: number;
  points: ModelSeriesPoint[];
  windowStart: number;
  windowEnd: number;
  bucketHours: number;
}

export interface DashboardSettings {
  statusBarUsage: StatusBarUsageMode;
  statusBarPlanId?: string;
  /** 仅显示已启用、已选择模型且已配置 API Key 的 Plan */
  filterAvailable?: boolean;
  dashboardTheme?: 'system' | 'dark' | 'light';
  language?: 'zh-CN' | 'en';
}