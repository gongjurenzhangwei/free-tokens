# v1.5.60 内容更新：B 站视频 PPT 封面文案改版

## 改进
- **B 站视频 PPT（bilibili-ppt/index.html）封面文案改版**：
  - 主标题改为「把免费token装进VSCode的GitHub Copilot chat里面。」（原为「免费 Token · 把 Claude 装进 VS Code」），并调整字号适配新文案长度。
  - 封面副标题（lead）精简为「7 大免费渠道额度图鉴」，删去原有的「把任意 AI 模型接入 VS Code Copilot Chat · 零成本用上 GPT / Claude / DeepSeek」前缀。
  - 封面与结尾日期统一更新为 2026-08-22（`26.08.22`）。
  - 进度条章节导航中封面章节标题同步更新为「把免费token装进 VSCode 的 GitHub Copilot chat」。

## 说明
- 仅改动 `bilibili-ppt/index.html` 中的文案与样式，不影响扩展运行逻辑、接口或行为。
- 版本号从 1.5.59 递增至 1.5.60，重新打包 VSIX 以包含更新后的 PPT 内容。

## 验证
- `npx tsc --noEmit` + `npm run compile` + `npm test`（34/34）+ `npm run package:vsix` 全通过。