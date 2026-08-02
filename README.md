# BYOK COPILOT

将 Token Plan、Coding Plan 或自定义兼容端点接入 VS Code Copilot Chat 的语言模型提供商扩展。

## 功能

- 自动识别 OpenAI Responses API、OpenAI Chat Completions 与 Anthropic Messages 协议。
- 内置 Agnes AI、MiniMax、OpenCode Zen、NVIDIA NIM、OpenAI、Anthropic、DeepSeek、Qwen、Moonshot、智谱、SiliconFlow、OpenRouter、Groq、Mistral、Together AI、xAI 预设。
- 支持任意 Coding Plan 或自建网关的 Base URL。
- 智能识别服务根地址、`/v1` 地址和完整 API endpoint，保存后自动尝试兼容的 `/models` 地址。
- 配置界面可手动获取模型，以纵向列表展示供应商返回的上下文长度、视觉、Tools、联网等能力，并选择要启用的模型。
- 模型注册到 VS Code Chat 的模型选择器，并支持流式文本和工具调用。
- API Key 仅保存在 VS Code SecretStorage，不写入设置或工作区文件。
- 按 Plan 汇总最近 30 天请求数、输入 Token、输出 Token、总 Token 和失败次数。
- MiniMax Token Plan 可通过官方接口刷新 5 小时滚动窗口和周限额。
- 状态栏可选择仅显示 `BYOK`、显示本地 Token 用量或显示最新官方配额。
- Dashboard 支持暗黑与白天模式，并会记住选择。
- Dashboard 菜单栏支持中文与英文即时切换，并同步本地化状态栏、悬浮用量面板和操作提示。
- `Only Available` 只向聊天模型选择器提供已启用、已选模型且 SecretStorage 中存在 API Key 的 Plan；Dashboard 始终保留全部 Plan。
- 使用 `Manage Models` 打开 VS Code 官方 Language Models 管理器，再用眼睛图标隐藏不需要的 GitHub Copilot 默认模型。

## 使用

1. 按 `F5` 启动 Extension Development Host。
2. 点击 VS Code 右下角状态栏中的 `BYOK`。
3. 选择供应商预设，或选择“自定义 / Coding Plan”。
4. 填写 Plan 名称、Base URL 和 API Key。
5. 点击“获取模型”，扩展会按 Responses、Chat Completions、Anthropic 的顺序自动测试协议。
6. 在模型列表中勾选要启用的模型并保存；未勾选的模型不会注册到 Chat 模型选择器。
7. 在 Chat 模型选择器中选择 `BYOK COPILOT` 下的模型。

如果模型没有显示，请确认 Plan 已启用、模型发现成功，并在命令面板执行 `Developer: Reload Window`。

## Base URL 规则

Base URL 可以是服务根地址、以 `/v1` 结尾的地址，或完整的 `/models`、`/chat/completions`、`/responses`、`/messages` 地址。扩展会去除已知 endpoint，并按顺序尝试带 `/v1` 和不带 `/v1` 的候选地址：

- 模型发现：`/v1/models`
- OpenAI 对话：`/v1/chat/completions`
- Responses 对话：`/v1/responses`
- Anthropic 对话：`/v1/messages`

部分 Coding Plan 使用专用网关地址，请以供应商提供的兼容 API 文档为准。当前版本要求模型列表接口兼容 OpenAI/Anthropic 的模型列表响应。

协议自动识别会使用发现到的模型发送最小非流式请求，因此供应商可能记录一次请求并产生极少量 Token 用量。连接测试成功前，Plan 不会写入配置。

## 用量口径

每个成功请求优先采用供应商响应中的 usage 数据。Chat Completions 端点需要在流式响应中支持 `stream_options.include_usage`；Responses 端点需要在完成事件中返回 `response.usage`；Anthropic 端点需要返回 `message_start` 和 `message_delta` usage。若供应商不返回 usage，本次 Token 数记为 0，但请求数仍会统计。

统计保留最近 5000 条本地记录，控制台默认展示最近 30 天。统计仅保存在 VS Code 的 globalState，不上传到第三方。

MiniMax 是当前内置官方远端配额查询的供应商。扩展调用 `https://api.minimaxi.com/v1/token_plan/remains` 并缓存最新快照。接口的 `usage_count` / `total_count` 是 Token Plan 的调用次数额度，不是 Token 数量；界面因此标记为“次调用”。Token Plan 必须使用 Subscription Key；它与 MiniMax 按量付费 API Key 不可互换。其他供应商在没有公开且稳定的配额 API 时只展示本地 API 调用次数和 Token 统计，不会用本地 Token 伪造官方剩余额度。

Dashboard 与状态栏中的本地 Token 统计来自模型响应的 usage 字段：OpenAI Chat Completions 使用 `prompt_tokens` / `completion_tokens`，Responses API 使用 `input_tokens` / `output_tokens`，Anthropic Messages 使用 `input_tokens` / `output_tokens`。若供应商不返回 usage，扩展不会估算或伪造实际 Token 用量，该次记录会显示为 0。

MiniMax API 预设使用 `https://api.minimaxi.com/v1`。

## 开发

```powershell
npm install
npm run package
```

最低支持 VS Code 1.104。

## 已知边界

- BYOK 覆盖 Chat 和工具调用，不替代依赖 GitHub 服务的语义搜索、Embedding 或内联补全。
- 不同兼容供应商对工具调用和流式 usage 的实现可能不同。
- OpenCode Zen 会按模型使用 Responses、Messages 或 Chat Completions；请为不同协议的模型分别建立 Plan，并选择对应协议。
- MiniMax 配额接口的公开文档未定义固定响应 schema；扩展兼容常见窗口字段，供应商调整格式时会明确提示未知格式。
- 当前模型元数据使用通用上下文默认值；后续可在控制台加入逐模型能力编辑。