import * as vscode from 'vscode';
import { DashboardSettings, ModelSeries, ModelSeriesPoint, PlanConfig, PlanInput, QuotaSnapshot, UsageRecord, UsageSummary } from './types';

const PLANS_KEY = 'byokCopilot.plans';
const USAGE_KEY = 'byokCopilot.usage';
const QUOTA_KEY = 'byokCopilot.quota';
const SETTINGS_KEY = 'byokCopilot.settings';
const SECRET_PREFIX = 'byokCopilot.apiKey.';

export class PlanStore {
  private readonly changeEmitter = new vscode.EventEmitter<void>();
  readonly onDidChange = this.changeEmitter.event;

  constructor(private readonly context: vscode.ExtensionContext) {}

  getPlans(): PlanConfig[] {
    return this.context.globalState.get<PlanConfig[]>(PLANS_KEY, []);
  }

  getPlan(id: string): PlanConfig | undefined {
    return this.getPlans().find((plan) => plan.id === id);
  }

  async savePlan(input: PlanInput): Promise<PlanConfig> {
    const plans = this.getPlans();
    const existing = input.id ? plans.find((plan) => plan.id === input.id) : undefined;
    const now = Date.now();
    const plan: PlanConfig = {
      id: existing?.id ?? crypto.randomUUID(),
      name: input.name.trim(),
      provider: input.provider.trim(),
      baseUrl: input.baseUrl.trim().replace(/\/+$/, ''),
      protocol: input.protocol,
      enabled: input.enabled,
      models: existing?.models ?? [],
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    await this.context.globalState.update(PLANS_KEY, [...plans.filter((item) => item.id !== plan.id), plan]);
    if (input.apiKey) {
      await this.context.secrets.store(`${SECRET_PREFIX}${plan.id}`, input.apiKey);
    }
    this.changeEmitter.fire();
    return plan;
  }

  async setModels(planId: string, models: PlanConfig['models']): Promise<void> {
    const plans = this.getPlans().map((plan) => plan.id === planId ? { ...plan, models, updatedAt: Date.now() } : plan);
    await this.context.globalState.update(PLANS_KEY, plans);
    this.changeEmitter.fire();
  }

  async deletePlan(id: string): Promise<void> {
    await this.context.globalState.update(PLANS_KEY, this.getPlans().filter((plan) => plan.id !== id));
    await this.context.secrets.delete(`${SECRET_PREFIX}${id}`);
    await this.context.globalState.update(QUOTA_KEY, this.getQuotaSnapshots().filter((snapshot) => snapshot.planId !== id));
    const settings = this.getSettings();
    if (settings.statusBarPlanId === id) {
      await this.context.globalState.update(SETTINGS_KEY, { ...settings, statusBarPlanId: undefined });
    }
    this.changeEmitter.fire();
  }

  getApiKey(id: string): Thenable<string | undefined> {
    return this.context.secrets.get(`${SECRET_PREFIX}${id}`);
  }

  async hasApiKey(id: string): Promise<boolean> {
    return Boolean(await this.getApiKey(id));
  }

  async addUsage(record: Omit<UsageRecord, 'id' | 'timestamp'>): Promise<void> {
    const records = this.context.globalState.get<UsageRecord[]>(USAGE_KEY, []);
    records.push({ ...record, id: crypto.randomUUID(), timestamp: Date.now() });
    await this.context.globalState.update(USAGE_KEY, records.slice(-5000));
    this.changeEmitter.fire();
  }

  getUsage(days = 30): UsageSummary[] {
    const cutoff = Date.now() - days * 86400000;
    const summaries = new Map<string, UsageSummary>();
    for (const record of this.context.globalState.get<UsageRecord[]>(USAGE_KEY, []).filter((item) => item.timestamp >= cutoff)) {
      const summary = summaries.get(record.planId) ?? { planId: record.planId, requests: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0, failures: 0 };
      summary.requests += record.requests;
      summary.inputTokens += record.inputTokens;
      summary.outputTokens += record.outputTokens;
      summary.totalTokens += record.totalTokens;
      summary.failures += record.success ? 0 : 1;
      summaries.set(record.planId, summary);
    }
    return [...summaries.values()];
  }

  getQuotaSnapshots(): QuotaSnapshot[] {
    return this.context.globalState.get<QuotaSnapshot[]>(QUOTA_KEY, []);
  }

  getAllUsageRecords(): UsageRecord[] {
    return this.context.globalState.get<UsageRecord[]>(USAGE_KEY, []).filter((r) => r.success);
  }

  getModelUsageSeries(opts: { windowHours: number; bucketHours: number; maxModels: number }): ModelSeries[] {
    const windowHours = Math.max(1, Math.floor(opts.windowHours));
    const bucketHours = Math.max(1, Math.min(windowHours, Math.floor(opts.bucketHours)));
    const maxModels = Math.max(1, Math.floor(opts.maxModels));
    const now = Date.now();
    const start = now - windowHours * 3600 * 1000;
    const bucketMs = bucketHours * 3600 * 1000;
    const numBuckets = Math.max(1, Math.ceil(windowHours / bucketHours));
    const records = this.context.globalState.get<UsageRecord[]>(USAGE_KEY, []).filter((record) => record.timestamp >= start && record.success);
    interface BucketGroup { planId: string; modelId: string; points: number[]; tokenPoints: number[]; total: number; totalTokens: number }
    const groups = new Map<string, BucketGroup>();
    for (const record of records) {
      const key = `${record.planId}:${record.modelId}`;
      const group = groups.get(key) ?? { planId: record.planId, modelId: record.modelId, points: new Array<number>(numBuckets).fill(0), tokenPoints: new Array<number>(numBuckets).fill(0), total: 0, totalTokens: 0 };
      const bucketIndex = Math.min(numBuckets - 1, Math.max(0, Math.floor((record.timestamp - start) / bucketMs)));
      group.points[bucketIndex] += record.requests;
      group.tokenPoints[bucketIndex] += record.totalTokens;
      group.total += record.requests;
      group.totalTokens += record.totalTokens;
      groups.set(key, group);
    }
    const plans = this.getPlans();
    const planById = new Map(plans.map((plan) => [plan.id, plan]));
    const ranked = [...groups.values()].sort((left, right) => right.total - left.total).slice(0, maxModels);
    return ranked.map((group) => {
      const plan = planById.get(group.planId);
      const model = plan?.models.find((item) => item.id === group.modelId);
      const points: ModelSeriesPoint[] = group.points.map((value, index) => ({
        timestamp: start + index * bucketMs,
        requests: value,
        tokens: group.tokenPoints[index],
      }));
      return {
        id: `${group.planId}:${group.modelId}`,
        planId: group.planId,
        modelId: group.modelId,
        name: model?.name ?? group.modelId,
        provider: plan?.provider ?? '',
        total: group.total,
        totalTokens: group.totalTokens,
        points,
        windowStart: start,
        windowEnd: now,
        bucketHours,
      };
    });
  }

  async setQuotaSnapshot(snapshot: QuotaSnapshot): Promise<void> {
    const snapshots = this.getQuotaSnapshots().filter((item) => item.planId !== snapshot.planId);
    await this.context.globalState.update(QUOTA_KEY, [...snapshots, snapshot]);
    this.changeEmitter.fire();
  }

  async markQuotaUnsupported(planId: string): Promise<void> {
    await this.setQuotaSnapshot({ planId, fetchedAt: Date.now(), source: 'unsupported', windows: [] });
  }

  isQuotaSupported(snapshot: QuotaSnapshot | undefined): boolean {
    return Boolean(snapshot) && snapshot!.source === 'remote';
  }

  getSettings(): DashboardSettings {
    return this.context.globalState.get<DashboardSettings>(SETTINGS_KEY, { statusBarUsage: 'off' });
  }

  async setSettings(settings: DashboardSettings): Promise<void> {
    await this.context.globalState.update(SETTINGS_KEY, settings);
    this.changeEmitter.fire();
  }

  async exportConfig(opts: { includeApiKeys: boolean }): Promise<ConfigBundle> {
    const plans = this.getPlans();
    const apiKeys: Record<string, string> = {};
    if (opts.includeApiKeys) {
      for (const plan of plans) {
        const key = await this.context.secrets.get(`${SECRET_PREFIX}${plan.id}`);
        if (key) apiKeys[plan.id] = key;
      }
    }
    return {
      schema: CONFIG_BUNDLE_SCHEMA,
      exportedAt: Date.now(),
      version: CONFIG_BUNDLE_VERSION,
      plans,
      settings: this.getSettings(),
      usage: this.context.globalState.get<UsageRecord[]>(USAGE_KEY, []),
      quotas: this.getQuotaSnapshots(),
      apiKeys,
    };
  }

  async importConfig(bundle: ConfigBundle, opts: { strategy: 'merge' | 'replace' | 'skip'; includeApiKeys: boolean }): Promise<ImportSummary> {
    const incoming = validateConfigBundle(bundle);
    const existingPlans = this.getPlans();
    const planById = new Map(existingPlans.map((plan) => [plan.id, plan]));
    const newPlans: PlanConfig[] = [];
    let reused = 0;
    let added = 0;
    let overwritten = 0;
    let skipped = 0;
    let apiKeysImported = 0;
    let apiKeysSkipped = 0;
    for (const plan of incoming.plans) {
      const collision = planById.has(plan.id);
      if (collision && opts.strategy === 'skip') { skipped++; continue; }
      if (collision && opts.strategy === 'merge') {
        const current = planById.get(plan.id)!;
        newPlans.push({ ...plan, enabled: plan.enabled ?? current.enabled, models: plan.models.length ? plan.models : current.models });
        reused++;
        continue;
      }
      newPlans.push(plan);
      if (collision) overwritten++; else added++;
    }
    await this.context.globalState.update(PLANS_KEY, newPlans);
    if (incoming.settings) {
      await this.context.globalState.update(SETTINGS_KEY, incoming.settings);
    }
    if (Array.isArray(incoming.usage) && incoming.usage.length) {
      const merged = [...this.context.globalState.get<UsageRecord[]>(USAGE_KEY, []), ...incoming.usage].slice(-5000);
      await this.context.globalState.update(USAGE_KEY, merged);
    }
    if (Array.isArray(incoming.quotas) && incoming.quotas.length) {
      const existingQuotas = this.getQuotaSnapshots();
      const planIds = new Set(newPlans.map((plan) => plan.id));
      await this.context.globalState.update(QUOTA_KEY, [
        ...existingQuotas.filter((snapshot) => !planIds.has(snapshot.planId)),
        ...incoming.quotas.filter((snapshot) => planIds.has(snapshot.planId)),
      ]);
    }
    if (opts.includeApiKeys && incoming.apiKeys) {
      for (const [planId, key] of Object.entries(incoming.apiKeys)) {
        if (!planById.has(planId) && !newPlans.some((plan) => plan.id === planId)) { apiKeysSkipped++; continue; }
        await this.context.secrets.store(`${SECRET_PREFIX}${planId}`, key);
        apiKeysImported++;
      }
    }
    this.changeEmitter.fire();
    return { added, overwritten, reused, skipped, apiKeysImported, apiKeysSkipped };
  }
}

export const CONFIG_BUNDLE_SCHEMA = 'byok-copilot.config.bundle';
export const CONFIG_BUNDLE_VERSION = 1;

export interface ConfigBundle {
  schema: string;
  exportedAt: number;
  version: number;
  plans: PlanConfig[];
  settings: DashboardSettings;
  usage: UsageRecord[];
  quotas: QuotaSnapshot[];
  apiKeys: Record<string, string>;
}

export interface ImportSummary {
  added: number;
  overwritten: number;
  reused: number;
  skipped: number;
  apiKeysImported: number;
  apiKeysSkipped: number;
}

function validateConfigBundle(bundle: any): ConfigBundle {
  if (!bundle || typeof bundle !== 'object') throw new Error('配置文件格式无效。');
  if (bundle.schema !== CONFIG_BUNDLE_SCHEMA) throw new Error(`配置 schema 不匹配（期望 ${CONFIG_BUNDLE_SCHEMA}，收到 ${bundle.schema ?? '空'}）。`);
  const plans = Array.isArray(bundle.plans) ? bundle.plans as PlanConfig[] : [];
  const rawSettings = bundle.settings && typeof bundle.settings === 'object' ? bundle.settings as Record<string, unknown> : {};
  const settings: DashboardSettings = {
    statusBarUsage: (['off', 'tokens', 'quota'].includes(String(rawSettings.statusBarUsage)) ? rawSettings.statusBarUsage : 'off') as DashboardSettings['statusBarUsage'],
    statusBarPlanId: typeof rawSettings.statusBarPlanId === 'string' ? rawSettings.statusBarPlanId : undefined,
    filterAvailable: typeof rawSettings.filterAvailable === 'boolean' ? rawSettings.filterAvailable : undefined,
    dashboardTheme: (['system', 'dark', 'light'].includes(String(rawSettings.dashboardTheme)) ? rawSettings.dashboardTheme : undefined) as DashboardSettings['dashboardTheme'],
    language: (['zh-CN', 'en'].includes(String(rawSettings.language)) ? rawSettings.language : undefined) as DashboardSettings['language'],
  };
  const usage = Array.isArray(bundle.usage) ? bundle.usage as UsageRecord[] : [];
  const quotas = Array.isArray(bundle.quotas) ? bundle.quotas as QuotaSnapshot[] : [];
  const apiKeys = bundle.apiKeys && typeof bundle.apiKeys === 'object' ? bundle.apiKeys as Record<string, string> : {};
  return { schema: CONFIG_BUNDLE_SCHEMA, exportedAt: Number(bundle.exportedAt ?? Date.now()), version: Number(bundle.version ?? CONFIG_BUNDLE_VERSION), plans, settings, usage, quotas, apiKeys };
}