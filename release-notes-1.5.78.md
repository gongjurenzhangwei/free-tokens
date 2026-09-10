# v1.5.78 新增：本地 Ollama 预设 + 本地服务免 Key

- **新增「Ollama」供应商预设**：Plan 编辑器预设下拉里新增 Ollama 选项，默认 Base URL 填好 `http://localhost:11434/v1`（OpenAI 兼容协议），选完即可直接测试。
- **本地服务无需 API Key**：凡 Base URL 指向本地（`localhost` / `127.0.0.1` / `::1` / `*.localhost`）或预设/供应商为 Ollama 的 Plan，Key 字段变为可选——可留空保存、可直接测试连接。Key 输入框旁新增提示「本地服务无需 API Key，留空即可」。
- **后端放行空 Key 的本地 Plan**：`api.ts` 新增 `isLocalProvider()` 判定；`request()` 对本地供应商跳过「Key 非空」校验并省略鉴权头；`provider.ts` 的可用 Plan 过滤、Chat 响应器 Key 守卫同步放行本地 Plan；`dashboard.ts` 的配额同步与测试连接（`testPlan`）也允许本地 Plan 无 Key。
- **模型自动获取无需改造**：Ollama 的 `/v1/models` 完全兼容 OpenAI 格式，现有 `discoverModels` 直接可用，点「测试并获取模型」即可列出本机已拉取的模型；NVIDIA 专用过滤不影响 Ollama 模型 ID（如 `qwen2.5-coder:7b`）。
- **设置说明同步**：「仅显示可用模型」的说明补充「本地服务除外」；中英文案同步更新。
