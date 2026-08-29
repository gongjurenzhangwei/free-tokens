# 「思考等级（Thinking Level）」无法配置 — 分析与实现方案

> 分析日期：本次会话
> 结论来源：VS Code 官方源码 + 本插件（BYOK COPILOT）源码双重确认

## 一、结论速览

1. **GitHub Copilot Chat 原生支持思考等级**，并且对第三方 BYOK provider 也"设计上支持"。
2. **根本原因不在 VS Code，而在本插件**：
   - VS Code 把思考等级放在 `ProvideLanguageModelChatResponseOptions.modelConfiguration.reasoningEffort` 传给 provider；
   - 但本插件 `src/api.ts` 的三个 stream 函数只读取 `options.modelOptions`，**完全不读取 `options.modelConfiguration`**，导致思考等级被静默丢弃；
   - 此外插件的配置模型 `PlanModel` 里没有思考等级字段，dashboard 也没有对应下拉选择器；`provider.ts` 的 `capabilities` 只声明了 `toolCalling` 和 `imageInput`。
3. 因此你看到的"能选模型、但配不了思考等级"是**插件未实现该能力**，不是配置操作问题。

---

## 二、VS Code 原生思考等级链路（源码证据）

### 1. 请求选项里承载思考等级

`ProvideLanguageModelChatResponseOptions` 里思考等级位于 **`modelConfiguration.reasoningEffort`**（不是 `modelOptions`）。

VS Code 前端的 BYOK 转发处 `src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostByokLmHandler.ts`：

```ts
const options: ILanguageModelChatRequestOptions = {
  modelOptions: request.modelOptions,
  includeEncryptedThinking: true,
  ...(request.reasoningEffort ? { configuration: { reasoningEffort: request.reasoningEffort } } : {}),
  ...(tools ? { tools } : {}),
};
```

### 2. 发送时合并模型配置

`src/vs/workbench/contrib/chat/common/languageModels.ts` 的 `sendChatRequest`：

```ts
const configuration = this.getModelConfiguration(modelId);
const mergedOptions = configuration ? { ...options, configuration: { ...configuration, ...options.configuration } } : options;
return provider.sendChatRequest(modelId, messages, from, mergedOptions, token);
```

### 3. 官方 BYOK provider 读取 it

- **Anthropic**（`anthropicProvider.ts`）：
  ```ts
  const rawEffort = options.modelConfiguration?.reasoningEffort;
  const supportsEffort = modelCapabilities?.supportsReasoningEffort;
  const effort = supportsEffort && typeof rawEffort === 'string' && supportsEffort.includes(rawEffort)
    ? rawEffort as 'low' | 'medium' | 'high' | 'max' : undefined;
  // 映射进请求
  thinking: supportsAdaptiveThinking ? { type: 'adaptive' } : (thinkingBudget ? { type: 'enabled', budget_tokens: thinkingBudget } : undefined),
  ...(effort ? { output_config: { effort } } : {}),
  ```
- **Gemini**（`geminiNativeProvider.ts`）：
  ```ts
  const rawEffort = options.modelConfiguration?.reasoningEffort;
  const supportedEffortLevels = this._knownModels?.[model.id]?.supportsReasoningEffort;
  const thinkingLevel = ...;
  config: { ..., thinkingConfig: { includeThoughts: true, thinkingLevel } }
  ```
- 且 provider 是否启用思考，依赖**模型元数据的能力标志**（`thinking` / `supportsReasoningEffort`）。

### 4. 思考等级到各协议的参数映射

| 协议 | 请求参数字段 |
|---|---|
| OpenAI Chat Completions | `reasoning_effort: "low" \| "medium" \| "high"` |
| OpenAI Responses API | `reasoning: { effort: "low" \| "medium" \| "high" }` |
| Anthropic Messages | `thinking: { type: 'adaptive' }` 或 `output_config: { effort: "low" \| "medium" \| "high" \| "max" }` |
| Gemini | `thinkingConfig: { includeThoughts: true, thinkingLevel }` |

---

## 三、本插件的现状（源码证据）

`src/api.ts` 三个 stream 函数（`streamOpenAi` / `streamAnthropic` / `streamResponses`）都是同一模式：

```ts
const modelOptions = options.modelOptions as Record<string, unknown> | undefined;
const safeOptions = modelOptions
  ? Object.fromEntries(Object.entries(modelOptions).filter(([key]) => !key.startsWith('_')))
  : {};
const body = { model: model.id, ..., stream: true, ...safeOptions };
```

**缺陷**：
- 只转发 `options.modelOptions`（过滤 `_` 前缀内部键）；
- **从不读取 `options.modelConfiguration.reasoningEffort`**；
- `src/types.ts` 的 `PlanModel` 没有 reasoning/thinking 字段；
- `src/provider.ts` 的 `capabilities` 只有 `toolCalling` + `imageInput`，未声明推理能力。

---

## 四、实现方案（推荐）

### 方案 A：对齐 VS Code 原生 `modelConfiguration`（推荐）
在 `api.ts` 三处 stream 函数里读取 `options.modelConfiguration?.reasoningEffort`，按协议映射进请求体：

- **openai**：`if (effort) body.reasoning_effort = effort;`
- **responses**：`if (effort) body.reasoning = { effort };`
- **anthropic**：`if (effort) body.output_config = { effort };`

这样用户在 VS Code 原生思考等级选择器里选的等级就能生效，且与官方 provider 行为一致、维护成本最低。

### 方案 B：插件自配字段（兜底，可选）
- `types.ts` 的 `PlanModel` 增加 `thinkingLevel?: 'low' | 'medium' | 'high' | 'max'`；
- dashboard 模型配置加一个下拉选择；
- 请求时把该字段合并进 body（叠加在方案 A 之上）。

> 建议：先做方案 A（改动小、对齐官方），若你希望"即使 VS Code 不显示原生选择器也能配"，再加方案 B 作为兜底。

---

## 五、需要你确认 / 注意的点

1. **VS Code 前端是否会对任意第三方 provider 显示原生思考等级选择器**，取决于其展示逻辑（可能与模型 `capabilities`/`family` 相关）。本插件目前未声明模型推理能力，这可能影响原生选择器是否出现。（这条可从 VS Code 的 Chat 调试视图验证实际请求负载。）
2. 实现后需按项目约定执行 `npm run check`、`npm run compile`、`npm run package`，并递增 `package.json`/`package-lock.json` 的 patch 版本、生成对应 VSIX。
