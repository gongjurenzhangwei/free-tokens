# 免费 Token（Free Tokens）

> 将 Token Plan、Coding Plan 或任意自定义兼容端点接入 VS Code Copilot Chat 的语言模型提供商扩展。免费获取 Token 额度，轻松接入你自己的 AI 模型。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![VS Code](https://img.shields.io/badge/VS%20Code-%5E1.104-blue)](https://code.visualstudio.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/gongjurenzhangwei/free-tokens/pulls)

**English version below** · [English](#english-readme)

---

## 目录

- [简介](#简介)
- [功能特性](#功能特性)
- [快速开始](#快速开始)
- [Base URL 规则](#base-url-规则)
- [用量与配额口径](#用量与配额口径)
- [免费 Token 推荐](#免费-token-推荐)
- [检查更新](#检查更新)
- [设置项](#设置项)
- [开发与构建](#开发与构建)
- [隐私与安全](#隐私与安全)
- [已知边界](#已知边界)
- [开源协议](#开源协议)
- [English README](#english-readme)

---

## 简介

「免费 Token」是一款面向 **VS Code Copilot Chat** 的第三方语言模型提供商扩展。它让你可以：

- 把各类 **Token Plan / Coding Plan**（如 MiniMax Token Plan、OpenCode Zen 等）注册为 VS Code Chat 中的可用模型；
- 接入任意 **OpenAI 兼容 / Anthropic 兼容 / 自建网关** 的 Base URL；
- 在统一的管理界面里**查看用量、配额，并管理模型**；
- 通过内置的**免费 Token 推荐页**发现可以免费领取额度的供应商。

核心设计理念是 **BYOK（Bring Your Own Key，自带密钥）**：所有 API Key 仅保存在 VS Code 的 SecretStorage 中，本地优先、不上传任何服务器。

---

## 功能特性

### 协议与接入
- **自动识别三种协议**：OpenAI Responses API、OpenAI Chat Completions、Anthropic Messages。
- **内置供应商预设**：Agnes AI、MiniMax、OpenCode Zen、NVIDIA NIM、OpenAI、Anthropic、DeepSeek、Qwen、Moonshot、智谱、SiliconFlow、OpenRouter、Groq、Mistral、Together AI、xAI 等。
- **任意 Base URL**：支持 Coding Plan 或自建网关，兼容 `/v1`、根地址、完整 endpoint 等多种写法（见 [Base URL 规则](#base-url-规则)）。
- **智能模型发现**：保存后自动尝试兼容的 `/models` 地址，按 Responses → Chat Completions → Anthropic 顺序自动测试协议。

### 模型管理
- 配置界面可**手动拉取模型**，展示供应商返回的上下文长度、视觉、Tools、联网等能力；
- 按需**勾选要启用的模型**，未勾选的不注册到 Chat 模型选择器；
- 连接测试失败时仍可**手动添加模型 ID 与上下文长度**；
- 模型注册后支持**流式文本与工具调用**。

### 用量与配额
- 按 Plan 汇总最近 30 天的请求数、输入/输出 Token、总 Token 与失败次数；
- **MiniMax Token Plan** 可通过官方接口刷新 5 小时滚动窗口与周限额；
- 状态栏可选显示：仅 `BYOK`、本地 Token 用量、最新官方配额；
- 所有统计仅保存在本地 `globalState`，不上传第三方。

### Dashboard 控制台
- 基于 **React + Tailwind** 的现代界面，可折叠侧栏组织五个工作区：**概览 / 接入平台 / 模型 / 用量与配额 / 设置**；
- **暗黑 / 白天双主题**，自动记住选择；
- **中英双语**即时切换，并同步本地化状态栏与悬浮提示；
- 窄面板下自动切换为移动抽屉式布局；
- **「检查更新」**：通过 GitHub Release 检查是否有新版本，一键前往下载；
- **「提交免费渠道」**：通过表单向开发者推荐免费 Token 渠道（经加密的飞书 Webhook 推送）。

### 免费 Token 推荐页
- Dashboard 内置「免费 Token 推荐」卡片列表，列出可以免费领取 Token / 免费额度的供应商；
- 该页面由**独立的远程 HTML**（`docs/free-tokens.html`）通过 iframe 渲染，**不打包进扩展**——更新它只需推送 GitHub 即可，无需重新发布扩展（见 [免费 Token 推荐](#免费-token-推荐)）。

---

## 快速开始

### 方式一：作为扩展使用（开发模式）
1. 克隆本仓库并用 VS Code 打开；
2. 执行 `npm install`；
3. 按 `F5` 启动 **Extension Development Host**；
4. 点击 VS Code 右下角状态栏的 `BYOK`，或命令面板运行 `免费 Token: Open Dashboard`；
5. 选择供应商预设（或「自定义 / Coding Plan」），填写 Plan 名称、Base URL 与 API Key；
6. 点击「获取模型」，扩展自动测试协议并拉取模型列表；
7. 勾选要启用的模型并保存；
8. 在 Chat 的模型选择器中选择 `免费 Token` 下的模型即可对话。

> 如果模型没有显示，请确认 Plan 已启用、模型发现成功，然后执行 `Developer: Reload Window`。

### 方式二：安装 VSIX 包
在 [Releases](https://github.com/gongjurenzhangwei/free-tokens/releases) 页面下载最新 `.vsix`，在 VS Code 扩展面板中选择「从 VSIX 安装…」即可。

---

## Base URL 规则

Base URL 可以是以下任意一种写法，扩展会自动处理：

- 服务根地址（如 `https://api.example.com`）
- 以 `/v1` 结尾（如 `https://api.example.com/v1`）
- 完整 endpoint（如 `.../models`、`.../chat/completions`、`.../responses`、`.../messages`）

扩展会去除已知 endpoint，并按顺序尝试带 `/v1` 与不带 `/v1` 的候选地址：

| 用途 | 尝试路径 |
|---|---|
| 模型发现 | `/v1/models` |
| OpenAI 对话 | `/v1/chat/completions` |
| Responses 对话 | `/v1/responses` |
| Anthropic 对话 | `/v1/messages` |

> 部分 Coding Plan 使用专用网关地址，请以供应商提供的兼容 API 文档为准。当前版本要求模型列表接口兼容 OpenAI / Anthropic 的模型列表响应。

协议自动识别会使用发现到的模型发送最小非流式请求，因此供应商可能记录一次请求并产生极少量 Token 用量。**连接测试成功前，Plan 不会写入配置。**

---

## 用量与配额口径

- 每个成功请求**优先采用供应商响应中的 usage 数据**：
  - Chat Completions：需流式响应支持 `stream_options.include_usage`；
  - Responses：需在完成事件中返回 `response.usage`；
  - Anthropic：需返回 `message_start` 与 `message_delta` 的 usage。
- 若供应商不返回 usage，本次 Token 数记为 **0**，但请求数仍会统计（扩展不估算、不伪造用量）。
- 统计保留最近 **5000 条**本地记录，控制台默认展示最近 30 天。
- **MiniMax** 是当前内置官方远端配额查询的供应商：调用 `https://api.minimaxi.com/v1/token_plan/remains` 并缓存快照。其 `usage_count` / `total_count` 是**调用次数额度**而非 Token 数量，界面因此标记为“次调用”。Token Plan 必须使用 **Subscription Key**，与 MiniMax 按量付费 API Key 不可互换。
- 其他供应商在无公开稳定配额 API 时，只展示本地调用次数与 Token 统计，**不会用本地 Token 伪造官方剩余额度**。

---

## 免费 Token 推荐

「免费 Token 推荐」卡片列表由 `docs/free-tokens.html` 提供，通过 **iframe** 渲染在 Dashboard 中：

- 该 HTML **不打包进扩展**（已在 `.vscodeignore` 中排除）；
- 默认从本仓库 `main` 分支的 `raw.githubusercontent.com` 加载；
- 你可以通过 VS Code 设置 `byokCopilot.freeTokensUrl` 覆盖为**自托管 CDN / 自建站点**的地址；
- 更新渠道列表只需修改并推送 `docs/free-tokens.html`，用户刷新 Dashboard 即可看到新内容，**无需重新发布扩展**。

---

## 检查更新

顶栏的「检查更新」按钮会请求 GitHub Release API（`repos/gongjurenzhangwei/free-tokens/releases/latest`）：

- 有新版本 → 弹出提示并给出「前往下载」按钮（打开 Release 页）；
- 已是最新 → 提示「已是最新版本」；
- 网络异常 → 提示「检查更新失败」。

> 发布新版本时，请用 `npm run package:vsix` 生成带版本号的 VSIX，并创建对应 tag（如 `v1.5.16`）的 GitHub Release。

---

## 设置项

| 设置 | 默认 | 说明 |
|---|---|---|
| `byokCopilot.freeTokensUrl` | 空（使用仓库内 `docs/free-tokens.html`） | 免费 Token 推荐页的远程地址，可改为自托管 CDN |

---

## 开发与构建

```powershell
npm install          # 安装依赖
npm run check        # TypeScript 类型检查
npm run compile      # 编译扩展 + Webview（esbuild + Tailwind）
npm run package      # 类型检查 + 编译
npm run package:vsix # 生成 .vsix 安装包
npm run watch        # 监听编译
```

最低支持 **VS Code 1.104**。

### 目录结构

```
src/                扩展核心（extension / dashboard / provider / store / api / statusPanel）
src/webview/        Dashboard 前端（React + Tailwind）
components/         React 组件（含 Dashboard 主界面）
docs/               免费 Token 推荐页（远程 HTML，不打包）
scripts/            辅助脚本（如 webhook 加密）
preview/            浏览器预览调试环境
```

---

## 隐私与安全

- **API Key 仅存 SecretStorage**：写入操作系统级 Keychain / DPAPI，不出现于明文配置文件。
- **本地优先**：Plan、设置、用量、配额快照均存于工作区 `globalState`，不上传任何服务器。
- **导出加密**：包含 API Key 的导出文件使用 AES-256-GCM 逐 Key 加密，密钥由 scrypt 从工作区专属随机 passphrase 派生并存入 SecretStorage。
- **不收集遥测**：仅在你显式连接的供应商 Base URL 发起网络请求。
- **开源可审计**：关键加密与存储路径均在本仓库，欢迎审查。

---

## 已知边界

- 扩展覆盖 Chat 与工具调用，不替代依赖 GitHub 服务的语义搜索、Embedding 或内联补全。
- 不同兼容供应商对工具调用与流式 usage 的实现可能不同。
- OpenCode Zen 会按模型使用 Responses、Messages 或 Chat Completions；请为不同协议的模型分别建立 Plan 并选择对应协议。
- MiniMax 配额接口未定义固定响应 schema；扩展兼容常见窗口字段，供应商调整格式时会明确提示未知格式。
- 当前模型元数据使用通用上下文默认值；后续可在控制台加入逐模型能力编辑。

---

## 开源协议

本项目基于 **MIT License** 开源，详见 [LICENSE](LICENSE)。

使用或分发前请阅读协议全文。字体（IBM Plex Sans / JetBrains Mono）采用 SIL OFL 1.1 开源协议，可免费商用。

---

<a name="english-readme"></a>

# Free Tokens (English)

> A VS Code Copilot Chat language-model provider extension that connects Token Plans, Coding Plans, or any custom OpenAI/Anthropic-compatible endpoint — and helps you discover free token quotas.

## Introduction

**Free Tokens** is a third-party language-model provider for **VS Code Copilot Chat**. It lets you:

- Register **Token Plans / Coding Plans** (MiniMax Token Plan, OpenCode Zen, etc.) as models in VS Code Chat;
- Connect any **OpenAI-compatible / Anthropic-compatible / self-hosted gateway** Base URL;
- Monitor **usage & quota** and manage models from a unified dashboard;
- Discover providers that offer **free tokens / free-tier quotas** via a built-in recommendations page.

The core philosophy is **BYOK (Bring Your Own Key)**: all API keys live only in VS Code SecretStorage, data stays local, and nothing is uploaded to third-party servers.

## Features

- **Protocol auto-detection**: OpenAI Responses API, OpenAI Chat Completions, Anthropic Messages.
- **Built-in provider presets**: Agnes AI, MiniMax, OpenCode Zen, NVIDIA NIM, OpenAI, Anthropic, DeepSeek, Qwen, Moonshot, Zhipu, SiliconFlow, OpenRouter, Groq, Mistral, Together AI, xAI, and more.
- **Any Base URL**: Coding Plans and self-hosted gateways, tolerant of root / `/v1` / full-endpoint forms.
- **Smart model discovery**: tries compatible `/models` endpoints and tests protocols in order.
- **Model management**: fetch models with context length, vision, tools & web capabilities; enable only the ones you want; manually add models when discovery fails.
- **Streaming & tool calling** for registered models.
- **Usage & quota**: per-plan 30-day stats, MiniMax official quota refresh, status-bar token/quota display.
- **Dashboard**: React + Tailwind UI with five workspaces, dark/light themes, and instant zh/en switching.
- **Update check** via GitHub Releases.
- **Submit a free-token channel** (pushed to the developer via an encrypted Feishu webhook).
- **Free-token recommendations page** rendered via iframe from `docs/free-tokens.html` — not bundled, updatable by pushing to GitHub.

## Quick Start (development)

1. Clone this repo and open it in VS Code.
2. Run `npm install`.
3. Press `F5` to launch the **Extension Development Host**.
4. Click `BYOK` in the status bar (or run `免费 Token: Open Dashboard`).
5. Pick a provider preset (or "Custom / Coding Plan"), fill in plan name, Base URL, and API key.
6. Click "Fetch models" — protocols are tested automatically.
7. Check the models you want to enable and save.
8. Pick a model under `免费 Token` in the Chat model picker.

If models don't appear, verify the plan is enabled, discovery succeeded, then run `Developer: Reload Window`.

## Base URL Rules

Base URLs may be a service root, end with `/v1`, or be a full endpoint (`/models`, `/chat/completions`, `/responses`, `/messages`). The extension strips known endpoints and tries `/v1` and non-`/v1` candidates in order.

## Usage & Quota Semantics

- Successful requests prefer the provider's `usage` field. Providers that don't return usage count the request but record 0 tokens (no estimation/fabrication).
- 5,000 most recent records are kept locally; the dashboard shows the last 30 days by default.
- MiniMax is the built-in official remote quota provider (`/token_plan/remains`). Its `usage_count`/`total_count` are **call counts**, not token amounts — shown as "calls". Use the Subscription Key, not a pay-as-you-go API key.
- Other providers show local call/token stats only; the extension never fakes official quota with local tokens.

## Free-Token Recommendations Page

The card list is served by `docs/free-tokens.html` through an iframe:

- Not bundled into the VSIX (excluded in `.vscodeignore`).
- Loaded by default from `raw.githubusercontent.com` on the repo's `main` branch.
- Overridable via the `byokCopilot.freeTokensUrl` setting (self-hosted CDN).
- To update the list, just edit and push `docs/free-tokens.html` — no extension re-release needed.

## Update Check

The "Check updates" button queries `repos/gongjurenzhangwei/free-tokens/releases/latest`. When publishing, run `npm run package:vsix` and create a tagged release (e.g. `v1.5.16`) with the VSIX attached.

## Development

```powershell
npm install
npm run check        # tsc --noEmit
npm run compile      # esbuild + Tailwind
npm run package      # check + compile
npm run package:vsix # produce .vsix
npm run watch        # watch build
```

Minimum supported VS Code version: **1.104**.

## Privacy & Security

- API keys are stored only in VS Code **SecretStorage** (OS Keychain / DPAPI).
- Plans, settings, usage, and quota snapshots live in workspace `globalState` — local-first, no telemetry.
- Exports containing keys are encrypted with AES-256-GCM; the passphrase is derived via scrypt and stored in SecretStorage.
- Outbound traffic is limited to the provider Base URLs you explicitly connect.

## Known Limitations

- Covers Chat and tool calling; does not replace GitHub-dependent semantic search, embedding, or inline completion.
- Different compatible providers may implement tool calling and streaming usage differently.
- OpenCode Zen routes per-model between Responses, Messages, and Chat Completions — create separate plans per protocol.
- MiniMax quota responses have no fixed public schema; the extension handles common window fields and warns on unknown formats.
- Model metadata currently uses generic context defaults.

## License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE). Fonts (IBM Plex Sans / JetBrains Mono) are licensed under SIL OFL 1.1.