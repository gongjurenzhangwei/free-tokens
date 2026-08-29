# v1.5.44 — 状态栏官方配额像素进度条

## 优化内容

- **右下角状态栏官方配额改为像素进度条**：从纯文本 `BYOK 每日 62%` 升级为 `BYOK 每日 ██████░░░░ 62%`，用等宽块字符（`█` 已用 / `░` 未用）直观展示配额占用，悬停 tooltip 的详细彩色进度条保持不变。
- **状态栏文字按占用比例彩色显示**：占用 ≥90% 红色（`statusBarItem.errorForeground`）、≥70% 琥珀色（`statusBarItem.warningForeground`）、其余青色（`textLink.foreground`），与 tooltip 内进度条阈值配色一致，一眼判断余量风险。
- **兼容性**：不限量（Unlimited）与"仅剩余量"（无百分比数据）场景保持原有文本展示，不影响可读性；tokens 模式不受影响。

## 影响文件

- `src/extension.ts`：新增 `pixelBar()` / `quotaColor()`，`updateStatus()` 生成像素进度条并按阈值设置 `status.color`。
