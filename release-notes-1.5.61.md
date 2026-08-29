# v1.5.61 内容更新：B 站视频 PPT 封面标题行距加宽

## 改进
- **B 站视频 PPT（bilibili-ppt/index.html）封面主标题行距加宽**：封面 h1（「把免费 Token 引入 / GitHub Copilot Chat」两行）的 `line-height` 由 `0.94` 调整为 `1.5`，两行文字间行距更宽松，视觉上更透气。
- 仅做样式微调，不影响文案内容。

## 说明
- 仅改动 `bilibili-ppt/index.html` 中封面 h1 的 `line-height`，不影响扩展运行逻辑、接口或行为。
- 版本号从 1.5.60 递增至 1.5.61，重新打包 VSIX 以包含更新后的 PPT 内容。

## 验证
- `npx tsc --noEmit` + `npm run compile` + `npm test`（34/34）+ `npm run package:vsix` 全通过。