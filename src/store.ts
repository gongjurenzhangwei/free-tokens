import * as vscode from 'vscode';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync, createHash } from 'node:crypto';
import { DashboardSettings, ModelSeries, ModelSeriesPoint, PlanConfig, PlanInput, QuotaSnapshot, UsageRecord, UsageSummary } from './types';

const PLANS_KEY = 'byokCopilot.plans';
const USAGE_KEY = 'byokCopilot.usage';
const QUOTA_KEY = 'byokCopilot.quota';
const SETTINGS_KEY = 'byokCopilot.settings';
const SECRET_PREFIX = 'byokCopilot.apiKey.';
const EXPORT_PASSPHRASE_KEY = 'byokCopilot.exportPassphrase';
const ENCRYPTION_ALGO = 'aes-256-gcm';
const SCRYPT_SALT = Buffer.from('byok-copilot/config-bundle/v1', 'utf8');
/** Cost factor for scrypt: 2^14 keeps key derivation fast (<200ms) while still slowing brute force. */
const SCRYPT_COST = 16384;

/**
 * Persists (or mints) a workspace-local passphrase used to encrypt API keys in exported config bundles.
 * The passphrase is stored in SecretStorage so it never lives in plain text on disk and is unique per workspace.
 */
async function getOrCreateExportPassphrase(context: vscode.ExtensionContext): Promise<string> {
  const existing = await context.secrets.get(EXPORT_PASSPHRASE_KEY);
  if (existing) return existing;
  // 192-bit random passphrase, base64-encoded (~32 chars). Plenty of entropy and ASCII-safe for JSON.
  const passphrase = randomBytes(24).toString('base64url');
  await context.secrets.store(EXPORT_PASSPHRASE_KEY, passphrase);
  return passphrase;
}

function deriveKey(passphrase: string): Buffer {
  return scryptSync(passphrase, SCRYPT_SALT, 32, { N: SCRYPT_COST });
}

function encryptApiKey(key: string, passphrase: string): EncryptedSecret {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ENCRYPTION_ALGO, deriveKey(passphrase), iv);
  const ciphertext = Buffer.concat([cipher.update(Buffer.from(key, 'utf8')), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { v: 1, algo: ENCRYPTION_ALGO, iv: iv.toString('base64'), tag: tag.toString('base64'), ct: ciphertext.toString('base64') };
}

function decryptApiKey(secret: EncryptedSecret, passphrase: string): string {
  if (secret.algo !== ENCRYPTION_ALGO) throw new Error('配置中的加密算法不匹配。');
  const iv = Buffer.from(secret.iv, 'base64');
  const tag = Buffer.from(secret.tag, 'base64');
  const ct = Buffer.from(secret.ct, 'base64');
  const decipher = createDecipheriv(ENCRYPTION_ALGO, deriveKey(passphrase), iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(ct), decipher.final()]);
  return plain.toString('utf8');
}

interface EncryptedSecret {
  v: number;
  algo: string;
  iv: string;
  tag: string;
  ct: string;
}

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

  async exportConfig(opts: { includeApiKeys: boolean; encryptApiKeys?: boolean }): Promise<ConfigBundle> {
    const plans = this.getPlans();
    const apiKeys: Record<string, string> = {};
    const secrets: Record<string, EncryptedSecret> = {};
    const includeKeys = !!opts.includeApiKeys;
    const encrypt = opts.encryptApiKeys !== false; // encrypt by default when including keys
    if (includeKeys) {
      const passphrase = encrypt ? await getOrCreateExportPassphrase(this.context) : '';
      for (const plan of plans) {
        const key = await this.context.secrets.get(`${SECRET_PREFIX}${plan.id}`);
        if (!key) continue;
        if (encrypt) {
          secrets[plan.id] = encryptApiKey(key, passphrase);
        } else {
          apiKeys[plan.id] = key;
        }
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
      secrets: Object.keys(secrets).length ? secrets : undefined,
    };
  }

  async importConfig(bundle: ConfigBundle, opts: { strategy: 'merge' | 'replace' | 'skip'; includeApiKeys: boolean; passphrase?: string }): Promise<ImportSummary> {
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
    if (opts.includeApiKeys) {
      // Prefer encrypted secrets when present; fall back to plaintext apiKeys for legacy bundles.
      const encryptedEntries = incoming.secrets ? Object.entries(incoming.secrets) : [];
      const plaintextEntries = Object.entries(incoming.apiKeys ?? {});
      if (encryptedEntries.length && !opts.passphrase) {
        throw new Error('配置包含加密的 API Key，但导入时未提供解钥。');
      }
      const passphrase = opts.passphrase ?? await this.context.secrets.get(EXPORT_PASSPHRASE_KEY) ?? undefined;
      for (const [planId, secret] of encryptedEntries) {
        if (!planById.has(planId) && !newPlans.some((plan) => plan.id === planId)) { apiKeysSkipped++; continue; }
        try {
          const plain = decryptApiKey(secret, passphrase || '');
          await this.context.secrets.store(`${SECRET_PREFIX}${planId}`, plain);
          apiKeysImported++;
        } catch (err) {
          apiKeysSkipped++;
        }
      }
      for (const [planId, key] of plaintextEntries) {
        if (encryptedEntries.some(([id]) => id === planId)) continue;
        if (!planById.has(planId) && !newPlans.some((plan) => plan.id === planId)) { apiKeysSkipped++; continue; }
        await this.context.secrets.store(`${SECRET_PREFIX}${planId}`, key);
        apiKeysImported++;
      }
    }
    this.changeEmitter.fire();
    return { added, overwritten, reused, skipped, apiKeysImported, apiKeysSkipped };
  }
}

export async function seedDemoData(context: vscode.ExtensionContext): Promise<void> {
  const store = new PlanStore(context);
  const demoPlans: PlanConfig[] = [
    {
      id: 'demo-openai',
      name: 'OpenAI Production',
      provider: 'OpenAI',
      baseUrl: 'https://api.openai.com',
      protocol: 'responses',
      enabled: true,
      models: [
        { id: 'gpt-4.1', name: 'GPT-4.1', maxInputTokens: 128000, maxOutputTokens: 8192, toolCalling: true, vision: true, contextLength: 128000, supportsTools: true, supportsVision: true, supportsWebSearch: false, free: false },
        { id: 'o3', name: 'O3', maxInputTokens: 128000, maxOutputTokens: 8192, toolCalling: true, vision: true, contextLength: 128000, supportsTools: true, supportsVision: true, supportsWebSearch: false, free: false },
      ],
      createdAt: Date.now() - 86400000 * 5,
      updatedAt: Date.now() - 86400000 * 2,
    },
    {
      id: 'demo-nvidia',
      name: 'NVIDIA NIM',
      provider: 'NVIDIA NIM',
      baseUrl: 'https://integrate.api.nvidia.com/v1',
      protocol: 'openai',
      enabled: true,
      models: [
        { id: 'meta/llama-3.3-70b-instruct', name: 'Meta Llama 3.3 70B', maxInputTokens: 128000, maxOutputTokens: 8192, toolCalling: true, vision: false, contextLength: 128000, supportsTools: true, supportsVision: false, supportsWebSearch: false, free: true },
        { id: 'deepseek-ai/deepseek-r1', name: 'DeepSeek R1', maxInputTokens: 128000, maxOutputTokens: 8192, toolCalling: true, vision: false, contextLength: 128000, supportsTools: true, supportsVision: false, supportsWebSearch: false, free: true },
      ],
      createdAt: Date.now() - 86400000 * 8,
      updatedAt: Date.now() - 86400000,
    },
    {
      id: 'demo-anthropic',
      name: 'Anthropic Claude',
      provider: 'Anthropic',
      baseUrl: 'https://api.anthropic.com',
      protocol: 'anthropic',
      enabled: true,
      models: [
        { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', maxInputTokens: 200000, maxOutputTokens: 16384, toolCalling: true, vision: true, contextLength: 200000, supportsTools: true, supportsVision: true, supportsWebSearch: false, free: false },
        { id: 'claude-haiku-4-20250514', name: 'Claude Haiku 4', maxInputTokens: 200000, maxOutputTokens: 8192, toolCalling: true, vision: true, contextLength: 200000, supportsTools: true, supportsVision: true, supportsWebSearch: false, free: false },
      ],
      createdAt: Date.now() - 86400000 * 3,
      updatedAt: Date.now() - 86400000 * 3,
    },
  ];
  const demoQuotas: QuotaSnapshot[] = demoPlans.map((plan, index) => ({
    planId: plan.id,
    fetchedAt: Date.now() - index * 60000,
    source: 'remote',
    windows: [
      {
        id: `${plan.id}-primary`,
        label: plan.provider === 'OpenAI' ? 'GPT-4.1 / O3 配额' : plan.provider === 'NVIDIA NIM' ? 'Llama 3.3 70B / DeepSeek R1' : 'Claude Sonnet 4 / Haiku 4',
        used: Math.floor(Math.random() * 420) + 80,
        limit: plan.provider === 'OpenAI' ? 1000 : plan.provider === 'NVIDIA NIM' ? 800 : 1000,
        remaining: 780,
        unit: 'reqs/min',
        resetAt: Date.now() + 3600000,
      },
    ],
  }));
  const demoUsage: UsageRecord[] = [];
  const demoModels: { planId: string; modelId: string }[] = [
    { planId: 'demo-openai', modelId: 'gpt-4.1' },
    { planId: 'demo-openai', modelId: 'o3' },
    { planId: 'demo-nvidia', modelId: 'meta/llama-3.3-70b-instruct' },
    { planId: 'demo-anthropic', modelId: 'claude-sonnet-4-20250514' },
  ];
  for (let i = 0; i < 120; i++) {
    const planAndModel = demoModels[i % demoModels.length];
    const input = Math.floor(Math.random() * 12000) + 800;
    const output = Math.floor(Math.random() * 4200) + 400;
    demoUsage.push({
      id: crypto.randomUUID(),
      planId: planAndModel.planId,
      modelId: planAndModel.modelId,
      timestamp: Date.now() - Math.floor(Math.random() * 7200000),
      inputTokens: input,
      outputTokens: output,
      totalTokens: input + output,
      requests: Math.floor(Math.random() * 4) + 1,
      success: Math.random() > 0.04,
    });
  }
  await context.globalState.update(PLANS_KEY, demoPlans);
  await context.globalState.update(QUOTA_KEY, demoQuotas);
  await context.globalState.update(USAGE_KEY, demoUsage.slice(-5000));
  const settings = store.getSettings();
  await context.globalState.update(SETTINGS_KEY, { ...settings, filterAvailable: true });
  store.changeEmitter.fire();
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
  /** Legacy plaintext API keys. Only populated when the user explicitly disables encryption on export. */
  apiKeys: Record<string, string>;
  /** AES-256-GCM encrypted API keys, keyed by plan id. Preferred over apiKeys when present. */
  secrets?: Record<string, EncryptedSecret>;
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
  const secrets = bundle.secrets && typeof bundle.secrets === 'object' ? bundle.secrets as Record<string, EncryptedSecret> : undefined;
  return { schema: CONFIG_BUNDLE_SCHEMA, exportedAt: Number(bundle.exportedAt ?? Date.now()), version: Number(bundle.version ?? CONFIG_BUNDLE_VERSION), plans, settings, usage, quotas, apiKeys, secrets };
}