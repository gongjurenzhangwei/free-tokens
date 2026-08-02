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
  source: 'remote';
  windows: QuotaWindow[];
}

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

export interface DashboardSettings {
  statusBarUsage: StatusBarUsageMode;
  statusBarPlanId?: string;
  /** 仅显示已启用、已选择模型且已配置 API Key 的 Plan */
  filterAvailable?: boolean;
  dashboardTheme?: 'system' | 'dark' | 'light';
  dashboardStyle?: 'glass' | 'cyber';
  language?: 'zh-CN' | 'en';
}