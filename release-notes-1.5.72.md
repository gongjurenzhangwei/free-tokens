# v1.5.72 修复：OpenCode Go 请求自动携带会话头（HTTP 400 MissingSessionID）

## 问题

在 Copilot Chat 中使用 OpenCode Go 渠道的模型时，偶发以下报错：

> 供应商拒绝了请求参数：HTTP 400: {"type":"error","error":{"type":"MissingSessionID","message":"Error from provider (Console Go): Request is missing x-opencode-session ..."}}

## 原因

OpenCode Go 网关要求每个请求在 `x-opencode-session` 请求头中携带一段对话内稳定的会话 ID（用于优化路由与提示词缓存），否则直接拒绝（HTTP 400 MissingSessionID）。官方文档明确把 **GitHub Copilot Chat** 列为“已知存在问题的客户端”——VS Code 不会自动发送该请求头，这属于客户端侧需要补齐的请求头，而非网关故障。

## 修复

- 插件现在会为所有 OpenCode（Zen / Go）渠道的请求**自动生成并注入 `x-opencode-session` 会话头**：每个 Plan 生成一个稳定 UUID，同一 Plan 始终使用同一会话 ID（利于网关提示词缓存命中）。
- 同时按官方建议注入专属 `user-agent` 标识（`free-tokens-vscode/1.0`），便于网关识别客户端类型。
- 覆盖所有请求路径：Chat 对话、模型发现、连接探测、配额查询。
- 非 OpenCode 渠道的请求**不添加**任何额外请求头，行为与之前完全一致。
- 错误提示新增 MissingSessionID 专属解释（万一网关策略变更时给出明确指引）。

## 升级说明

安装本版本后无需任何配置变更，直接在 Copilot Chat 重新发送消息即可。
