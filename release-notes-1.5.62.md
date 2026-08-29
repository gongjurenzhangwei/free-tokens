# v1.5.62 界面更新：侧边栏新增署名与 B 站跳转链接

## 改进
- **侧边栏页脚新增署名**：在左侧侧边栏版本号下方新增署名「©️2026 by 工具人张伟」，鼠标悬停高亮，点击即可在系统浏览器打开工具人张伟的 B 站主页（`https://space.bilibili.com/315615481`），与「关于」面板中的关注入口保持一致。
- 署名仅在侧边栏展开时显示；折叠状态下自动隐藏，不影响现有布局。
- 新增样式 `.sidebar-credit`：小字号等宽字体、弱化灰色、悬停青色高亮，并带外部链接 ↗ 提示符。
- 多语言支持：中文界面显示「©️2026 by 工具人张伟」，英文界面显示「©️2026 by Toolman Zhangwei」。

## 说明
- 仅改动 `components/ui/dashboard-with-collapsible-sidebar.tsx`（UI 文案 + 侧边栏页脚）与 `src/webview/styles.css`（署名样式），不影响扩展运行逻辑、接口或行为。
- 版本号从 1.5.61 递增至 1.5.62，重新打包 VSIX 以包含更新后的界面。

## 验证
- `npx tsc --noEmit` + `npm run compile` + `npm test`（34/34）+ `npm run package:vsix` 全通过。