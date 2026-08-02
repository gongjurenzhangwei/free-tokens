import * as vscode from 'vscode';
import { DashboardSettings, PlanConfig, PlanInput, QuotaSnapshot, UsageRecord, UsageSummary } from './types';

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

  async setQuotaSnapshot(snapshot: QuotaSnapshot): Promise<void> {
    const snapshots = this.getQuotaSnapshots().filter((item) => item.planId !== snapshot.planId);
    await this.context.globalState.update(QUOTA_KEY, [...snapshots, snapshot]);
    this.changeEmitter.fire();
  }

  getSettings(): DashboardSettings {
    return this.context.globalState.get<DashboardSettings>(SETTINGS_KEY, { statusBarUsage: 'off' });
  }

  async setSettings(settings: DashboardSettings): Promise<void> {
    await this.context.globalState.update(SETTINGS_KEY, settings);
    this.changeEmitter.fire();
  }
}