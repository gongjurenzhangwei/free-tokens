# v1.5.48 — 模型思考深度选择器（Reasoning Effort）

## 需求
此前扩展后端已读取 VS Code 原生 `modelConfiguration.reasoningEffort`，但 VS Code 稳定 API 不允许第三方 BYOK provider 声明推理能力，原生「思考等级」选择器对 BYOK provider 不会出现，用户无法选择思考深度。

## 改动
- **src/types.ts**：`PlanModel` 新增 `reasoningEffort?: 'low' | 'medium' | 'high' | 'max'` 字段（模型自配思考深度，协议映射：openai→`body.reasoning_effort`、responses→`body.reasoning.effort`、anthropic→`body.output_config.effort`）。
- **src/store.ts**：新增 `setModelReasoningEffort(planId, modelId, effort)`，镜像 `setModelEnabled` 的持久化与变更通知流程。
- **src/dashboard.ts**：新增 `setModelReasoningEffort` 消息处理（校验取值，落库后 `provider.refresh()` + `sync()`）。
- **src/api.ts**：`streamOpenAi` / `streamAnthropic` / `streamResponses` 三个流函数改为「原生 VS Code 优先、模型自配兜底」：`reasoningEffortOf(options) ?? model.reasoningEffort`。
- **components/ui/dashboard-with-collapsible-sidebar.tsx**：模型卡片新增思考深度下拉框（默认 / 低 / 中 / 高 / 最高），选择即向扩展发送 `setModelReasoningEffort`；补齐中英文文案（`thinkingDepth` 等）并导入 `Brain` 图标。
- **src/webview/styles.css**：新增 `.thinking-depth` 下拉框样式。

## 使用方式
在「模型库」中打开任意模型的卡片，在思考深度下拉框选择想要的档位（默认表示不指定，沿用模型默认）。所选深度会在每次 Chat 请求时叠加到请求体。

## 验证
- `npm run check`（tsc --noEmit）通过
- `npm run compile`（esbuild extension + webview + tailwind）通过
- `npm test`（加密往返 13/13）通过