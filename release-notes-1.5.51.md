# v1.5.51 — 配额排序 + OpenCode Go 真实配额查询

## 需求
1. 在「用量与配额」界面里，把能检测到配额的 Plan 排在最前面。
2. 检查 OpenCode Go 配额接口——用户配置了 OpenCode Go，之前配额功能没起作用。

> 用户原话：「在'用量与配额'里面，把能检测到配额的放在最前面。同时检查一下 Open Code。其实我配置了 Open Code Go，它有一个配额的接口，但现在好像没有起作用，请检查一下。」

## 调研结论
用户判断正确：**OpenCode Go 确实有真实的配额查询接口** `GET https://opencode.ai/zen/go/v1/usage`（`Authorization: Bearer <apiKey>`），返回 `{ usage: { rolling, weekly, monthly } }`，每项含 `status` / `percent`（使用百分比）/ `resetsAt`（重置时间）。之前的代码误以为官方网关不提供用量查询 API，只显示静态上限，导致配额功能「没起作用」。

## 改动
### OpenCode Go 真实配额拉取（`src/api.ts`）
- 新增 `fetchOpenCodeGoQuota()`：调 `/zen/go/v1/usage` 真实拉取
  - 5 小时滚动（$12）、每周（$30）、每月（$60）三个窗口显示真实使用百分比 / 已用 / 剩余 / 重置时间
  - 请求失败（网络 / 鉴权 / 无订阅）时回退到静态上限窗口，仍显示「未返回实时用量」提示，不会误报 0%
- `fetchPlanQuota()` 对 OpenCode Go plan 走真实拉取分支

### 配额排序（前端 `Usage` 组件）
- 能检测到配额（有真实用量数据）的 Plan 排**最前**
- 其次是有上限但仅静态提示的
- 最后是待获取 / 不支持官方配额接口的
- 同一档位内保持原有顺序，避免刷新时卡片跳动

### 文案与状态栏
- 前端 `goUsageHint` 文案更新：「未返回实时用量，请在控制台查看」
- 状态栏 `quotaRows()` 对 `usageUnknown` 窗口显示「≤ 上限」+ 防止误报 0%，回退时不显示误导性的 0%

## 验证
- `npx tsc --noEmit` 通过
- `npm run compile` 通过
- `npm test` 通过（13/13）
- `npm run package:vsix` 通过

## 产物
- `byok-copilot-1.5.51.vsix`