/* eslint-disable */
// Mock implementation of VS Code's acquireVsCodeApi() for browser preview.
// Loaded before dist/webview.js so the React app sees a working backend.
// State is persisted in localStorage; messages are dispatched in-page.
(function () {
  'use strict';

  const STORAGE_KEY = 'byokCopilot.previewState.v1';

  const PROTOCOL_MODEL_POOL = {
    openai: [
      { id: 'gpt-4o', name: 'GPT-4o', context: 128000, vision: true, tools: true, web: false, free: false },
      { id: 'gpt-4o-mini', name: 'GPT-4o mini', context: 128000, vision: true, tools: true, web: false, free: false },
      { id: 'o3-mini', name: 'o3-mini', context: 200000, vision: false, tools: true, web: false, free: false },
      { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5', context: 200000, vision: true, tools: true, web: false, free: false },
      { id: 'MiniMax-Text-01', name: 'MiniMax Text-01', context: 1000000, vision: false, tools: true, web: false, free: false },
    ],
    responses: [
      { id: 'gpt-5', name: 'GPT-5', context: 400000, vision: true, tools: true, web: true, free: false },
      { id: 'gpt-5-mini', name: 'GPT-5 mini', context: 400000, vision: true, tools: true, web: true, free: false },
      { id: 'o4-mini', name: 'o4-mini', context: 200000, vision: false, tools: true, web: false, free: false },
    ],
    anthropic: [
      { id: 'claude-opus-4-1', name: 'Claude Opus 4.1', context: 200000, vision: true, tools: true, web: false, free: false },
      { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5', context: 200000, vision: true, tools: true, web: false, free: false },
      { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', context: 200000, vision: true, tools: true, web: false, free: false },
    ],
  };

  const isMiniMaxHost = function (url) {
    try { return /minimax/i.test(new URL(url).host); } catch (e) { return false; }
  };

  const defaultState = function () {
    return {
      plans: [],
      settings: { statusBarUsage: 'off', dashboardTheme: 'system', language: 'zh-CN' },
      usage: [],
      quotas: [],
      apiKeys: {},
      allUsageRecords: [],
    };
  };

  const loadState = function () {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      return Object.assign({}, defaultState(), parsed);
    } catch (e) {
      return defaultState();
    }
  };

  const saveState = function (state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { console.warn('persist failed', e); }
  };

  const aggregateUsage = function (records, days) {
    const cutoff = Date.now() - days * 86400 * 1000;
    const map = new Map();
    for (const r of records) {
      if (r.timestamp < cutoff) continue;
      const k = r.planId;
      const cur = map.get(k) || { planId: r.planId, requests: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0, failures: 0 };
      cur.requests += r.requests;
      cur.totalTokens += r.totalTokens;
      if (!r.success) cur.failures += r.requests;
      map.set(k, cur);
    }
    return Array.from(map.values());
  };

  const computeModelSeries = function (records, windowHours, bucketHours, maxModels) {
    const now = Date.now();
    const start = now - windowHours * 3600 * 1000;
    const filtered = records.filter(function (r) { return r.timestamp >= start && r.success; });
    const modelTotals = new Map();
    for (const r of filtered) { modelTotals.set(r.planId + ':' + r.modelId, (modelTotals.get(r.planId + ':' + r.modelId) || 0) + r.requests); }
    const ranked = Array.from(modelTotals.entries()).sort(function (a, b) { return b[1] - a[1]; }).slice(0, maxModels);
    const numBuckets = Math.max(1, Math.ceil(windowHours / bucketHours));
    const bucketMs = bucketHours * 3600 * 1000;
    return ranked.map(function (entry) {
      const key = entry[0];
      const total = entry[1];
      const planId = key.split(':')[0];
      const modelId = key.split(':')[1];
      const points = [];
      for (let i = 0; i < numBuckets; i++) {
        const ts = start + i * bucketMs;
        const bucketEnd = ts + bucketMs;
        const requests = filtered.filter(function (r) { return r.planId === planId && r.modelId === modelId && r.timestamp >= ts && r.timestamp < bucketEnd; }).reduce(function (s, r) { return s + r.requests; }, 0);
        const tokens = filtered.filter(function (r) { return r.planId === planId && r.modelId === modelId && r.timestamp >= ts && r.timestamp < bucketEnd; }).reduce(function (s, r) { return s + r.totalTokens; }, 0);
        points.push({ timestamp: ts, requests: requests, tokens: tokens });
      }
      return { id: key, planId: planId, modelId: modelId, name: modelId, provider: '', total: total, totalTokens: 0, points: points, windowStart: start, windowEnd: now, bucketHours: bucketHours };
    });
  };

  const mockQuota = function (plan, prev) {
    const base = (prev && prev.windows && prev.windows[0]) || { used: 0, limit: 1000, remaining: 1000 };
    const used = Math.min(base.limit, base.used + Math.floor(Math.random() * 12) + 4);
    const remaining = Math.max(0, base.limit - used);
    return {
      planId: plan.id,
      fetchedAt: Date.now(),
      source: isMiniMaxHost(plan.baseUrl) ? 'remote' : 'unsupported',
      windows: isMiniMaxHost(plan.baseUrl) ? [{
        id: plan.id + '-primary',
        label: 'Token Plan / 配额',
        used: used,
        limit: base.limit,
        remaining: remaining,
        percentUsed: Math.round((used / base.limit) * 100),
        resetAt: Date.now() + 30 * 86400 * 1000,
        unit: 'tokens',
      }] : [],
    };
  };

  const buildStateMessage = function (state) {
    return {
      type: 'state',
      plans: state.plans,
      planAvailability: state.planAvailability || {},
      usage: aggregateUsage(state.allUsageRecords, 30),
      quotas: state.quotas || [],
      settings: state.settings,
      modelSeries: computeModelSeries(state.allUsageRecords, 24, 1, 6),
      series7d: computeModelSeries(state.allUsageRecords, 168, 6, 6),
      series30d: computeModelSeries(state.allUsageRecords, 720, 24, 6),
      allUsageRecords: state.allUsageRecords || [],
    };
  };

  const dispatch = function (msg) {
    window.dispatchEvent(new MessageEvent('message', { data: msg }));
  };

  const mockTestPlan = function (plan) {
    const pool = PROTOCOL_MODEL_POOL[plan.protocol] || PROTOCOL_MODEL_POOL.openai;
    const slice = plan.protocol === 'openai' ? 3 : plan.protocol === 'responses' ? 2 : 2;
    const models = pool.slice(0, slice).map(function (m) { return Object.assign({}, m); });
    if (plan.protocol === 'openai') {
      models.push({ id: 'Agnes-Image-2.0', name: 'Agnes Image 2.0', context: 0, vision: false, tools: false, web: false, kind: 'image' });
      models.push({ id: 'Agnes-Video-V2.0', name: 'Agnes Video V2.0', context: 0, vision: false, tools: false, web: false, kind: 'video' });
    }
    return { models: models };
  };

  const mockVsCodeApi = function () {
    const ctx = { state: loadState() };

    window.addEventListener('message', function (event) {
      const message = event.data;
      if (!message || typeof message !== 'object') return;
      ctx.handleMessage(message);
    });

    const send = function (msg) { dispatch(msg); };

    ctx.handleMessage = async function (message) {
      try {
        if (message.type === 'ready') {
          send(buildStateMessage(ctx.state));
          return;
        }
        if (message.type === 'saveSettings') {
          ctx.state.settings = Object.assign({}, ctx.state.settings, message.settings);
          saveState(ctx.state);
          send(buildStateMessage(ctx.state));
          return;
        }
        if (message.type === 'toggle') {
          ctx.state.plans = ctx.state.plans.map(function (p) {
            return p.id === message.id ? Object.assign({}, p, { enabled: !!message.enabled, updatedAt: Date.now() }) : p;
          });
          saveState(ctx.state);
          send(buildStateMessage(ctx.state));
          return;
        }
        if (message.type === 'toggleModel') {
          ctx.state.plans = ctx.state.plans.map(function (p) {
            if (p.id !== message.planId) return p;
            return Object.assign({}, p, {
              models: (p.models || []).map(function (m) {
                return m.id === message.modelId ? Object.assign({}, m, { enabled: !!message.enabled }) : m;
              }),
              updatedAt: Date.now(),
            });
          });
          saveState(ctx.state);
          send(buildStateMessage(ctx.state));
          return;
        }
        if (message.type === 'toggleAllModels') {
          ctx.state.plans = ctx.state.plans.map(function (p) {
            return Object.assign({}, p, {
              models: (p.models || []).map(function (m) { return Object.assign({}, m, { enabled: !!message.enabled }); }),
              updatedAt: Date.now(),
            });
          });
          saveState(ctx.state);
          send(buildStateMessage(ctx.state));
          return;
        }
        if (message.type === 'delete') {
          ctx.state.plans = ctx.state.plans.filter(function (p) { return p.id !== message.id; });
          delete ctx.state.apiKeys[message.id];
          ctx.state.quotas = ctx.state.quotas.filter(function (q) { return q.planId !== message.id; });
          saveState(ctx.state);
          send(buildStateMessage(ctx.state));
          send({ type: 'notice', level: 'success', message: '已删除 Plan。' });
          return;
        }
        if (message.type === 'savePlan') {
          const input = message.plan;
          const models = message.models || [];
          const existing = input.id ? ctx.state.plans.find(function (p) { return p.id === input.id; }) : undefined;
          const now = Date.now();
          const plan = {
            id: (existing && existing.id) || (crypto.randomUUID ? crypto.randomUUID() : String(Math.random())),
            name: (input.name || '').trim(),
            provider: (input.provider || '').trim(),
            baseUrl: (input.baseUrl || '').trim().replace(/\/+$/, ''),
            protocol: input.protocol,
            enabled: input.enabled !== false,
            models: Array.isArray(models) ? models : [],
            createdAt: (existing && existing.createdAt) || now,
            updatedAt: now,
          };
          ctx.state.plans = ctx.state.plans.filter(function (p) { return p.id !== plan.id; }).concat([plan]);
          if (input.apiKey) ctx.state.apiKeys[plan.id] = input.apiKey;
          if (isMiniMaxHost(plan.baseUrl) && !ctx.state.quotas.find(function (q) { return q.planId === plan.id; })) {
            ctx.state.quotas = ctx.state.quotas.concat([mockQuota(plan, undefined)]);
          }
          saveState(ctx.state);
          send(buildStateMessage(ctx.state));
          send({ type: 'notice', level: 'success', message: '已连接 ' + plan.name + '，启用 ' + plan.models.length + ' 个模型。' });
          return;
        }
        if (message.type === 'testPlan') {
          await new Promise(function (r) { setTimeout(r, 600); });
          try {
            const connection = mockTestPlan(message.plan);
            send({ type: 'testResult', requestId: message.requestId, ok: true, connection: connection });
          } catch (e) {
            send({ type: 'testResult', requestId: message.requestId, ok: false, error: String(e) });
          }
          return;
        }
        if (message.type === 'refreshQuota') {
          const plan = ctx.state.plans.find(function (p) { return p.id === message.id; });
          if (plan) {
            const existing = ctx.state.quotas.find(function (q) { return q.planId === plan.id; });
            const next = mockQuota(plan, existing);
            ctx.state.quotas = ctx.state.quotas.filter(function (q) { return q.planId !== plan.id; }).concat([next]);
            saveState(ctx.state);
            send(buildStateMessage(ctx.state));
          }
          return;
        }
        if (message.type === 'refreshAll') {
          const next = [];
          for (const plan of ctx.state.plans) {
            const existing = ctx.state.quotas.find(function (q) { return q.planId === plan.id; });
            next.push(mockQuota(plan, existing && existing.windows && existing.windows[0]));
          }
          ctx.state.quotas = next;
          saveState(ctx.state);
          send(buildStateMessage(ctx.state));
          return;
        }
        if (message.type === 'exportConfig') {
          const includeKeys = !!message.includeApiKeys;
          const bundle = {
            version: 1,
            plans: ctx.state.plans,
            settings: ctx.state.settings,
            usage: ctx.state.usage,
            quotas: ctx.state.quotas,
            allUsageRecords: ctx.state.allUsageRecords,
            apiKeys: includeKeys ? ctx.state.apiKeys : {},
          };
          const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'free-tokens-config-' + new Date().toISOString().slice(0, 10) + '.json';
          a.click();
          URL.revokeObjectURL(url);
          send({ type: 'notice', level: 'success', message: '配置已导出到下载文件夹。' });
          return;
        }
        if (message.type === 'importConfig') {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'application/json';
          input.onchange = async function () {
            const file = input.files && input.files[0];
            if (!file) return;
            try {
              const text = await file.text();
              const bundle = JSON.parse(text);
              if (Array.isArray(bundle.plans)) ctx.state.plans = bundle.plans;
              if (bundle.settings) ctx.state.settings = Object.assign({}, ctx.state.settings, bundle.settings);
              if (Array.isArray(bundle.quotas)) ctx.state.quotas = bundle.quotas;
              if (bundle.apiKeys) ctx.state.apiKeys = Object.assign({}, ctx.state.apiKeys, bundle.apiKeys);
              saveState(ctx.state);
              send(buildStateMessage(ctx.state));
              send({ type: 'notice', level: 'success', message: '配置已导入。' });
            } catch (e) {
              send({ type: 'notice', level: 'error', message: '导入失败：' + String(e) });
            }
          };
          input.click();
          return;
        }
        if (message.type === 'openExternal') {
          // The VS Code production build wires this to vscode.env.openExternal() which delegates to the
          // host OS's default browser. In the preview environment we just call window.open so the URL is
          // still navigable while testing.
          const url = typeof message.url === 'string' ? message.url : '';
          console.info('[preview] openExternal →', url, '(production: vscode.env.openExternal → system default browser)');
          if (/^https?:\/\//i.test(url)) {
            try { window.open(url, '_blank', 'noopener,noreferrer'); } catch (e) { /* ignore */ }
          }
          return;
        }
      } catch (e) {
        send({ type: 'notice', level: 'error', message: String(e) });
      }
    };

    const buildSample = function () {
      const sample = defaultState();
      const plans = [
        {
          id: 'plan-minimax',
          name: 'MiniMax Token Plan',
          provider: 'MiniMax',
          baseUrl: 'https://api.minimaxi.com/v1',
          protocol: 'openai',
          enabled: true,
          models: PROTOCOL_MODEL_POOL.openai.slice(0, 3).map(function (m) { return Object.assign({}, m); }),
          createdAt: Date.now() - 86400 * 1000 * 3,
          updatedAt: Date.now() - 3600 * 1000,
        },
        {
          id: 'plan-openai',
          name: 'OpenAI Responses',
          provider: 'OpenAI',
          baseUrl: 'https://api.openai.com',
          protocol: 'responses',
          enabled: true,
          models: PROTOCOL_MODEL_POOL.responses.slice(0, 2).map(function (m) { return Object.assign({}, m); }),
          createdAt: Date.now() - 86400 * 1000 * 7,
          updatedAt: Date.now() - 7200 * 1000,
        },
        {
          id: 'plan-anthropic',
          name: 'Anthropic Claude',
          provider: 'Anthropic',
          baseUrl: 'https://api.anthropic.com',
          protocol: 'anthropic',
          enabled: false,
          models: PROTOCOL_MODEL_POOL.anthropic.slice(0, 2).map(function (m) { return Object.assign({}, m); }),
          createdAt: Date.now() - 86400 * 1000,
          updatedAt: Date.now() - 1800 * 1000,
        },
      ];
      sample.plans = plans;
      sample.settings = { statusBarUsage: 'off', dashboardTheme: 'system', language: 'zh-CN' };
      const apiKeys = {};
      for (const p of plans) apiKeys[p.id] = 'sk-preview-demo';
      sample.apiKeys = apiKeys;
      const quotas = [];
      for (const p of plans) {
        if (isMiniMaxHost(p.baseUrl)) quotas.push(mockQuota(p, undefined));
      }
      sample.quotas = quotas;
      const records = [];
      for (let i = 0; i < 120; i++) {
        const planId = i % 2 === 0 ? 'plan-minimax' : 'plan-openai';
        const modelId = planId === 'plan-minimax' ? 'gpt-4o' : 'gpt-5';
        const input = Math.floor(Math.random() * 6000) + 200;
        const output = Math.floor(Math.random() * 2400) + 100;
        records.push({
          id: 'preview-' + i,
          planId: planId,
          modelId: modelId,
          timestamp: Date.now() - Math.floor(Math.random() * 86400 * 1000 * 7),
          inputTokens: input,
          outputTokens: output,
          totalTokens: input + output,
          requests: Math.floor(Math.random() * 3) + 1,
          success: Math.random() > 0.05,
        });
      }
      sample.allUsageRecords = records;
      return sample;
    };

    // Expose helpers for the integrated browser console.
    window.__byokPreview = {
      reset: function () { localStorage.removeItem(STORAGE_KEY); ctx.state = defaultState(); saveState(ctx.state); send(buildStateMessage(ctx.state)); },
      seedSample: function () { ctx.state = buildSample(); saveState(ctx.state); send(buildStateMessage(ctx.state)); return 'seeded ' + ctx.state.plans.length; },
      peek: function () { return ctx.state; },
      reload: function () { send(buildStateMessage(ctx.state)); },
    };

    return {
      postMessage: function (message) { ctx.handleMessage(message); },
    };
  };

  window.acquireVsCodeApi = mockVsCodeApi;
})();