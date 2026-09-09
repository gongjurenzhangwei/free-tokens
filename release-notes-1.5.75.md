# v1.5.75 修复：agnes-3.0-flash「Sorry, no response was returned.」零响应

## 问题

使用 agnes-3.0-flash 模型对话时，Copilot Chat 显示「Sorry, no response was returned.」，请求看似成功但没有任何内容输出。

## 原因

「Sorry, no response was returned.」是 Copilot Chat 在**扩展的请求正常完成、但一个输出片段都没有**时显示的兜底文案。排查发现 v1.5.74 的流解析在多种真实网关行为下会静默产出零输出：

1. **NDJSON 行流**：部分网关（含 AGNES）用单换行分隔 JSON 行（`application/x-ndjson`），而不是 SSE 的空行分帧。旧实现按空行分帧，整个流滞留在缓冲区直到流结束被整体丢弃；
2. **网关忽略 `stream:true`**：直接返回完整 `chat.completion` JSON（`choices[0].message` 而非 `delta`），旧实现只认 `data:` 行，整个 body 被丢弃；
3. **流末尾无空行**：最后一个 SSE 事件若没有空行分隔，残余缓冲不 flush；
4. **`delta.content` 是分段数组**（DashScope 式 `[{text:"..."}]`）：被字符串化后丢弃；
5. **纯 `reasoning_content` 思考流**：思考模型只输出思考内容时被判定为零输出。

以上任何一种情况发生时，扩展不报错、正常返回，Copilot Chat 只能显示笼统的「Sorry, no response was returned.」，无法定位根因。

## 修复

- `readSse` 重写为**首包格式嗅探**：自动识别 SSE / NDJSON 行流 / 完整 JSON（非流式兜底）三种形态并分别按正确方式分帧消费；
- NDJSON 行流逐行解析（兼容无换行结尾的最后一行）；完整 JSON 响应体整体消费后走标准 chunk 处理（`message.content` 兜底输出、usage 照常采集）；
- SSE 分帧修正：流结束后 flush 残余缓冲，最后一个无空行分隔的事件不再丢失；
- `delta.content` 兼容字符串 / 分段数组 / null 三种形态（新增 `textFromContent` 归一化）;
- 思考模型纯 `reasoning_content` 流兜底输出思考内容，不再零响应；
- 新增零输出可诊断错误：流结束但既无文本也无工具调用时，抛出带**响应载荷片段（前 300 字符）与根因提示**（疑似错误信息 / `finish_reason=length` 截断 / 非流式载荷 / 空响应）的错误，替代 Copilot Chat 的笼统文案，一眼定位问题。

## 测试

SSE 解析回归从 5 个场景扩展到 **11 个场景**，全部通过：

1. 同一事件内多行 `data:` 拼接（v1.5.74 原始 bug）
2. `data:` 后无空格
3. 跨网络分包截断
4. 坏 JSON 行不终结流
5. 流内 `{"error":...}` 转信息性错误
6. **NDJSON 行流**（新增）
7. **网关忽略 stream:true 返回完整 JSON**（新增）
8. **`delta.content` 分段数组**（新增）
9. **流末尾无空行残余 flush**（新增）
10. **零输出流抛可诊断错误**（新增）
11. **纯 reasoning_content 思考流**（新增）

既有回归同步通过：`verify-roundtrip`（34/34）、`verify-opencode-headers`（PASS）。
