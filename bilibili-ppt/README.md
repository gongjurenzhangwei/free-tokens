# 免费 Token · B 站视频 PPT · 使用说明

## 文件结构
```
bilibili-ppt/
├── index.html       # 单文件 PPT · 用浏览器直接打开
├── outline.md       # 演讲大纲 + 12 页故事弧
└── README.md        # 本文件
```

## PPT 概况
- **风格** · 瑞士国际主义 (Swiss Style)
- **主题色** · 克莱因蓝 IKB (#002FA7)
- **页数** · 12 页
- **建议时长** · 5-7 分钟 (B 站视频)
- **文件大小** · 单文件 ~210 KB

## 12 页故事弧

| # | 版式 | 主旨 |
|---|------|------|
| 01 | Cover (IKB) | 免费 Token · 把 Claude 装进 VS Code |
| 02 | Hook (dark) | 三账单 · 痛点 |
| 03 | Split Solution | 什么是 BYOK-COPILOT |
| 04 | Duo Compare | 订阅派 vs BYOK 派 |
| 05 | Six Cells | 6 大功能 |
| 06 | Three Layers | 三层协议自动识别 |
| 07 | Timeline (4 步) | 3 步开始 |
| 08 | Why Now | 免费 Token 真的能用吗 |
| 09 | Four Cards | 7 大免费渠道 Top 4 |
| 10 | Stacked Ledger | 7 大渠道额度图鉴 |
| 11 | Manifesto | AI 编程不该是月费游戏 |
| 12 | Closing (Split) | 3 条 takeaway + CTA |

## 演讲快捷键
- `←` / `→` 翻页
- `B` 切换静态模式 (B 站录屏省电)
- `ESC` 总览
- `P` 演讲模式 (演讲者备注 + 观众屏同步)

## 录屏建议
1. 浏览器以 1920×1080 全屏打开
2. 按 `B` 进入静态模式 (关闭 WebGL 动画,录屏更省 CPU)
3. 使用 OBS / Bandicam 录屏
4. 音频轨用独立录音 (麦克风),后期合并
5. 视频总时长 ≈ 5-7 分钟

## 内容文案调整
- 所有文案在 `index.html` 内,搜索 `<section class="slide` 即可定位
- 主题色在顶部 `:root` 块 (`--accent` 改色)
- 演讲备注在 `<script>const SPEAKER_NOTES = [...]` 块,可同步修改

## 关联文件
- 插件根目录: `d:\gongjurenzhangwei\Software\BYOK-COPILOT\`
- 插件 README: `README.md` (详细介绍)
- 免费 Token 渠道页: `docs\free-tokens.html` (构建时打包进扩展示)
- 数据来源: `docs\free-tokens.html` (2026-08 实测)
