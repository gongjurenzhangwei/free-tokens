# v1.5.70 新增：免费 / 限时活动 providers

- 在 dashboard「接入 Plan」的预设下拉中新增 4 个免费 / 限时档 providers（均为 OpenAI 协议）：
  - **Empero Free** — `https://free.empero.org/v1`。德国实验室，GLM-5.3-Flash、Qwen3.8-Flash 都可白嫖；Key 可随便填；⚠️ prompt 与回复会按 IP 哈希记录用于训练自家开源模型，不要丢隐私。忙时易 503，重试即可。
  - **AIHubMix** — `https://aihubmix.com/v1`。注册拿 Key；免费项含 Coding GLM 5.3（5 次/分钟、500 次/天、每日 100 万 token）。
  - **TokenHarbor** — `https://tokenharbor.ai/v1`。Qwen3.8-27B 有免费档，GLM-5.3-Flash 已上架；常见 DeepSeek V4 Flash、MiMo V2.5。
  - **TokenRouter** — `https://tokenrouter.com/v1`。Qwen 3.8 Max 免费，额度较大；"旗舰白嫖"位消失很快，请以页面标记为准。
- **未加入预设** 的若干服务仅作信息汇总（不在 BYOK provider 列表）：
  - **Cline** (`https://cline.bot`)：装好直接登录即用 GLM-5.3 / Flash，但本身是 IDE 内 agent，不是 API gateway。
  - **HiLinkup**：GLM-5.3-Flash 限时免费（官方 8/27–9/2 公告），OpenAI 兼容但未给出 Base URL，需自行查阅官方文档。
  - **B.AI** (`https://b.ai`，文档 `https://docs.b.ai/llmservice/promotions-and-pricing-notices/`)：GLM-5.3-Flash API 与 Chat 按 0 Credits 结算（限时活动），适合 Cursor / Claude Code 接入；但其官方 Base URL 未在本汇总中给出，请以文档为准。
- 已有付费 providers 与上一版本的 chat kind 修复（1.5.69）不受影响。