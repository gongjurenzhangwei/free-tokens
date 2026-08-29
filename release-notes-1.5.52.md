# v1.5.52 — 修复 OpenCode Go 配额检测被历史标记锁死

## 需求
用户反馈升级到 v1.5.51 之后，OpenCode Go 的用量检测仍然显示「已停止自动刷新，该供应商未提供官方配额接口」。

> 用户原话：「Opencode go 还是看不到用量检测呀。它显示'已停止自动刷新，该供应商未提供官方配额接口'，实际上官方是提供了的。我记得你上次就实现了呀，你再看一看。」

## 调研结论
用户判断正确——v1.5.51 已经实现了 OpenCode Go 的真实配额拉取（`fetchOpenCodeGoQuota` → `GET /zen/go/v1/usage`），但界面仍显示「未提供官方配额接口」。根因不是代码没实现，而是**历史遗留的 `unsupported` 缓存标记把新代码锁死了**：

1. **旧版本（≤ v1.5.50）**：当时代码不认识 OpenCode Go 的配额接口，`fetchPlanQuota()` 对 OpenCode Go 返回 `undefined` → 调用 `markQuotaUnsupported(planId)` → 把 `{ source: 'unsupported' }` 快照**持久化到 globalState**。
2. **升级到 v1.5.51 后**：代码已能正确拉取，但 `refreshQuota` / `refreshAll` / 前端 `Usage` 组件都有 `source === 'unsupported'` 的**短路逻辑**（自动轮询跳过、手动刷新按钮禁用）→ 新代码永远不执行 → 界面永远停在「已停止自动刷新」。
3. 前端 `Usage` 组件的 unsupported 判断是「双保险」，把该 Plan 彻底锁死。

## 改动
### 后端（`src/api.ts` + `src/dashboard.ts`）
- **新增 `hasOfficialQuotaEndpoint(plan)`**：判断某 plan 是否有官方配额查询接口（OpenCode Go → true，MiniMax → true）
- **导出 `isOpenCodeGoPlan`**：供 dashboard 复用判定
- **`ready` 时主动重拉历史 unsupported**：升级后打开配置面板，自动对「官方配额接口已适配」但快照仍为 unsupported 的 plan 重新拉取真实配额，覆盖历史标记，无需手动刷新
- **`refreshAll` / `refreshQuota` 绕过 unsupported 短路**：对 `hasOfficialQuotaEndpoint(plan)` 为真的供应商不再被历史 unsupported 标记短路
- **`sync()` 下发 `hasQuotaApi` 字段**：把已适配官方配额接口的 plan 列表同步给前端

### 前端（`components/ui/dashboard-with-collapsible-sidebar.tsx`）
- `Usage` 组件对「已适配官方配额接口」的供应商**豁免 unsupported 短路**：
  - 自动轮询（`duePlans`）不再因历史 unsupported 永久跳过 → 可自动重试拉取
  - 手动刷新按钮可用（`refresh` / `canRefresh`）
  - 不再显示误导性的「已停止自动刷新」，改为显示「等待获取」

## 验证
- `npx tsc --noEmit` 通过
- `npm run compile` 通过
- `npm test` 通过（13/13）
- `npm run package:vsix` 通过

## 产物
- `byok-copilot-1.5.52.vsix`