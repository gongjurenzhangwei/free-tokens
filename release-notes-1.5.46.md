# v1.5.46 — 修复 tooltip 像素进度条在 VS Code 1.132+ 下不显示

## 问题

- v1.5.45 的悬停 tooltip 配额进度条改用 10 段独立色块（`<span style="width/height/background/...">`），在 **VS Code 1.132 及以上版本不生效**——hover 渲染会经过 markdown sanitizer 白名单，只允许 SPAN 的 `color` / `background-color` / `border-radius` 样式，`width`、`height`、`display`、`flex`、`background` 等一律被移除，导致进度条显示不出来（看起来"没有变化"）。

## 修复

- 将 tooltip 配额进度条改为**与状态栏本体完全一致的 `█`/`░` 字符像素条**：
  - 已用段用阈值彩色 `█`（≥90% 红 / ≥70% 琥珀 / 其余青色）
  - 未用段用空槽色 `░`（边框色）
  - 不限量（UNLIMITED）显示 10 段空槽 `░`
- 只使用 SPAN 的 `color` 样式（sanitizer 白名单允许），**任何 VS Code 版本都能正常显示**，且与右下角状态栏的像素风格视觉统一。

## 影响文件

- `src/statusPanel.ts`：`quotaRows()` 的进度条从 span 色块改为字符像素块。
