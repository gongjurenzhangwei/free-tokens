# v1.5.79 修复：工具调用 name 为空（模型反复自言自语「工具调用 name 属性为空」）

## 问题现象

对话里模型会反复输出类似「我注意到工具调用 name 属性为空。让我尝试调用无参数工具 … 测试工具。」的内容，并不断重试同一个工具。
根因不是模型，而是本扩展在解析供应商工具调用分片时，会把**参数正确但 name 为空**的 `LanguageModelToolCallPart` 上报出去；坏调用一旦写进对话历史，回传供应商时带的就是 `function.name: ""`，模型随后就能观察到这个畸形调用并开始自我解释。

## 修复的四种网关行为

1. **网关省略 `index`（OpenAI 非流式回退 `message.tool_calls` 时必然如此）**：旧代码用 `toolCalls.get(call.index)` 作 Map 键，`get(undefined)` 命中不到原条目，同一个调用被拆成「有名字、无参数」和「有参数、无名字」两条，后者以空名字上报。
2. **后续分片带 `function.name: ""`**：旧写法 `call.function?.name ?? current.name` 里空字符串不是 nullish，`"" ?? x` 得到 `""`，已经拿到的工具名被直接清空。
3. **一次返回多个调用且都没有 `index`**：全部塌缩到同一个 Map 键互相覆盖，调用被丢弃。
4. **Responses API 的 `output_item.done`**：该事件带完整对象，旧实现整体覆盖 Map 条目；若该事件的 `item` 没有重复 `name`，名字同样被清成空串。同时旧实现把 `call_id`（`call_xxx`）误当作归并键，而分片增量给的是 `item.id`（`fc_xxx`），导致参数可能匹配不上。

## 改动内容

- **新增 `src/toolCalls.ts`**：纯逻辑（不依赖 `vscode`，可离线回归验证）的工具调用累积器 `ToolCallStream`。
  - 归并顺序：`id` 优先，其次 `index`，两者都缺失时才视为「上一个调用的延续」，避免并行调用串台。
  - `name` / `id` 只在拿到**非空**值时才写入，绝不用空串覆盖已有值；`push()` 按流式语义拼接参数，`complete()` 用权威完整载荷整段覆盖。
  - `ToolCallDelta.callId` 区分「归并标识」与「对外上报 ID」：Responses 用 `item.id` 匹配分片，但向 Copilot Chat 上报、以及回传供应商的必须是 `call_id`。
  - `nameless` getter 暴露缺名调用数量。
- **新增 `reportToolCalls()` 守卫（`src/api.ts`）**：这是最后一道防线。若供应商始终没发 `name`，扩展会抛出可诊断错误（含供应商、模型、响应载荷片段），而**不再**上报空名字的调用——避免污染对话历史。若只有部分调用缺名，则跳过这些调用并 `console.warn`，保留其余正常调用。
- **三条协议路径全部迁移到累积器**：OpenAI Chat Completions（`streamOpenAi`，含 `message` 非流式回退，用 `withFallbackIndex()` 补数组下标）、OpenAI Responses（`streamResponses`）、Anthropic Messages（`streamAnthropic`）。

## 验证

- 新增 `scripts/verify-tool-calls.mjs`：针对上述四种历史缺陷与并行调用串台共 **33 条断言，全部通过**；`npm test` 现已串联执行该脚本（原 34 条往返断言同步通过，合计 67 条）。
- `npm run check`（`tsc --noEmit`，`strict: true`）通过。
