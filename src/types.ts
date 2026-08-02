export type ApiProtocol = 'openai' | 'responses' | 'anthropic';

export type StatusBarUsageMode = 'off' | 'tokens' | 'quota';

export interface QuotaWindow {
  id: string;
  label: string;
  unlimited?: boolean;
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