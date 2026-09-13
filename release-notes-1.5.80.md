# v1.5.80 修复：工具调用同 id 重复累积 args（防御网关重发完整参数）

## 问题现象

部分 OpenAI 兼容代理与 Anthropic 网关会在**每个流分片**里把同一 `id` 调用的完整
`arguments` 整段（或当前累积完整 args）重新发送一次。v1.5.79 累积器对此是无脑
`args += slice`，导致最终上报给 Copilot Chat 的参数变成：

```
{"a":1}{"a":1}{"a":1}    // OpenAI 整段重发 3 次
{"a"{"a":1}              // 每片重发累积完整 args
{"a":{"a":1}}            // Anthropic partial_json 夹了整段
```

VS Code 解析这段 JSON 失败 → 工具调用返回错误结果 → 模型观察到「上一轮调用没成功」
→ 模型重新发起**完全相同**的工具调用 → 进入死循环。

v1.5.79 修了「工具名被清空」导致的循环，本版本进一步处理「参数被重复累积」导致的另
一类工具调用循环。

## 改动内容（src/toolCalls.ts）

- 新增 `appendArguments(current, slice)` 工具函数：把新的参数分片追加到已累积的
  args 串上时，先按以下规则识别「重复分片」并跳过或裁剪，**无法识别时才兜底 append**
  （避免误丢合法但形态奇怪的真实分片）：
  1. 当前已累积 args 完全为空 → 直接采用新分片（首次到达）。
  2. 新分片 == 当前 args → 整段重发，跳过。
  3. 当前 args 以新分片结尾 → 分片是已累积 args 的「整段重复」，跳过。
  4. 新分片以当前 args 开头 → 分片是「续传+重发」，截掉重复前缀只追加剩余部分。
  5. 都不匹配 → 按流式语义拼接 `current + slice`（兜底）。
- `merge()` 中 `argsMode === 'append'` 分支改用 `appendArguments()`；`complete()`
  仍走 replace 语义（权威完整载荷整段覆盖，行为不变）。

> `complete()` 路径不变，所以 Responses API 那种「added+delta+done」三连中 done
> 仍会用权威完整载荷整段覆盖（避免与已追加的增量重复），回归测试场景 6 继续通过。

## 验证

- 新增 3 个回归场景（`scripts/verify-tool-calls.mjs` 场景 8/9/10）：
  - **[8]** OpenAI 整段重发 3 次 → 最终 args 仍是 `{"a":1}`。
  - **[9]** OpenAI 每片重发累积完整 args → 识别为前缀延续 + 末尾增量。
  - **[10]** Anthropic 增量中夹了完整 `partial_json` → 同样识别为前缀延续。
- `npm test` 现有 **74 通过 / 0 失败**（roundtrip 34 + tool-calls 40）。
- `npm run check`（`tsc --noEmit`，`strict: true`）通过。
- `npm run compile` 干净，dist 产物已更新。
