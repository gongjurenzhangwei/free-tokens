# v1.5.74 修复：AGNES 等供应商流式响应 JSON 解析失败导致对话中断

## 问题

使用 AGNES AI（agnes-ai.com）等部分免费渠道的模型对话时，Chat 直接报错：

```
Expected ',' or '}' after property value in JSON at position 56 (line 1 column 57)
```

整轮对话失败，且错误信息晦涩，无法判断原因。

## 原因

SSE（Server-Sent Events）规范允许供应商把**一个 JSON 载荷拆成同一事件内的多条 `data:` 行**（按换行拼接后再解析）。旧实现的 `readSse` 逐行独立 `JSON.parse`，而 AGNES 网关返回的 chunk 恰好在第 56 字符处被拆成两行 `data:`，第一行单独解析必然抛 `SyntaxError`，随后：

- 解析异常没有被捕获，直接终结整个流式请求；
- 裸 `SyntaxError` 文案原样冒泡到 Chat 错误卡片。

## 修复

- **`readSse` 按 SSE 规范按事件聚合**：同一事件内的多条 `data:` 行先按换行拼接再解析；拼接结果仍非完整 JSON 时回退为逐行解析（兼容把多个独立 JSON 拼在同一事件的供应商）；同时兼容 `data:` 后无空格的写法；
- **所有流式回调（openai / anthropic / responses 三协议）的 `JSON.parse` 加防御层**：解析失败时静默跳过该行，不再让一行坏数据终结整轮对话；解析成功但载荷是错误对象（`{"error":{...}}`）时抛出包含供应商信息的可读错误；
- **工具调用参数解析兜底**：流式累积的工具参数若非合法 JSON，回退为空对象并记录警告，不再抛 `SyntaxError`；
- **错误卡片友好化**：`explainChatError` 新增分支，把 `JSON at position` / `Unexpected token` 类解析错误映射为「供应商返回了无法解析的响应格式」+ 排查建议，附原始错误。

## 回归验证

新增 `scripts/verify-sse-parsing.mjs`，覆盖 5 个场景（全部通过）：

1. 同一事件内 JSON 拆成两条 `data:` 行（复现原始 bug）→ 拼接后正常输出；
2. `data:` 后无空格 → 正常解析；
3. data 行被网络分包从中间截断 → 缓冲后完整解析；
4. 流内夹带坏 JSON 行 → 跳过该行，后续内容继续输出；
5. 流内 `{"error":...}` 载荷 → 转为信息性错误抛出而非静默无输出。

既有回归 `verify-roundtrip.mjs`（34/34）与 `verify-opencode-headers.mjs` 全部通过。

## 升级说明

- 覆盖安装即可，无需迁移配置；数据存储结构无变化。
- 兼容 VS Code 1.104 及以上版本。
