# v1.5.69 修复：智谱 GLM-5.3-Flash 等多模态聊天模型不出现在 Copilot Chat 模型下拉

- **症状**：在插件里配置智谱（zhipu）等支持视频输入的多模态聊天模型（如 `glm-5.3-flash`），模型列表里能看到，但 Copilot Chat 的模型下拉里始终不出现，其他模型正常。
- **根因**：`src/api.ts` 的 `kindForModel(id, name, features)` 把 features 字符串拼进分类判定文本里，命中 `/video/` 后把模型误归为 `kind: "video"`。随后 `src/provider.ts` 第 ⑥ 个过滤条件 `(model.kind ?? 'chat') === 'chat'` 直接剔除非 chat 模型，VS Code 语言模型 provider 收到空结果集，下拉里就看不到。
- **修复**：用途分类（embed / image / video / audio / chat）只看 `id` 与 `name` 关键词，features 仅作为视觉 / 工具 / 联网等能力位，不再混入用途判定。GLM-5.3-Flash 的 features 仍可保留 `"video"`、`"image"`（表示它支持视频 / 图片输入），但 `kind` 会正确归为 `chat`，下拉里立即可见。
- 现有按 id / name 关键词的视频生成模型（Sora / Veo / Kling / Hailuo / Pika / Luma / Runway 等）识别不受影响。