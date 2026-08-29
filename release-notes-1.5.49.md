# v1.5.49 — 状态栏样式固定，始终可见

## 需求
用户反馈：额度快用完时右下角状态栏文字颜色会变成白色，导致文字看不见。要求文字颜色不能变、样式不随用量变化，始终保持可见。

## 改动
- **src/extension.ts**：
  - 删除 `quotaColor()` 函数（原按用量阈值把状态栏整体着色：≥90% 红 / ≥70% 琥珀 / 否则青）。
  - `updateStatus()` 不再设置 `status.color`（移除行首 `status.color = undefined` 及 quota 分支的 `status.color = quotaColor(...)`）。
  - 保留像素进度条 `pixelBar()`（█/░ 字符，仅表示用量占比，不依赖动态颜色）。
  - 状态栏文字颜色固定使用 VS Code 默认状态栏前景色，由主题保证始终可读，不再随用量变化。

## 验证
- `npm run check`（tsc --noEmit）通过
- `npm run compile`（esbuild extension + webview + tailwind）通过
- `npm test`（加密往返 13/13）通过
- `npm run package:vsix` 打包通过