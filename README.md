# Workshop — AI+ 黑客松骨架

2 小时冲刺用的最小可演示骨架：**输入 → AI → 输出 → 人工确认**。
当前选题未定；产品壳、deck 骨架和协作流程已就绪。

## 快速开始

```bash
cp .env.example .env   # 可选：不填 key 时保持 DEMO_MODE=1 也能跑
node app/server.js     # http://127.0.0.1:5173
node app/test/e2e.mjs  # 无头 Edge 端到端自检
```

## 目录

| 路径 | 作用 |
|---|---|
| `app/server.js` | HTTP 入口，`POST /api/analyze` |
| `app/public/` | 单页 UI（输入 / AI 输出 / 人工确认 / 导出） |
| `core/ai.js` | DEMO / live / fallback |
| `core/prompts.js` | 系统提示词（选题后改这里） |
| `core/demo-cache.json` | 演示缓存（选题后改这里） |
| `deck/` | 5 页路演 deck 工作副本 + 渲染脚本 |
| `PLAN.md` | 题目、demo 剧本、75 分钟时间盒 |
| `BRIEF.md` | 给 deck 终端的事实来源 |
| `PROMPTS.md` | 三个终端的启动话术 |
| `APP_STATUS.md` / `DECK_STATUS.md` | 两个工作终端的实时状态 |
| `CLAUDE.md` | 给 Claude Code 的项目规则 |

## 输出契约

```json
{
  "title": "string",
  "summary": "string",
  "items": [
    { "label": "string", "detail": "string", "suggestion": "string" }
  ],
  "next_action": "string"
}
```

`items` 1–8 条；前端逐条勾选、改写、导出 Markdown。

## 环境

- `DEMO_MODE=1`：只读缓存，零 API 成本，演示兜底。
- `DEMO_MODE=0`：调用真实接口；失败自动降级（`DEMO_FALLBACK=1`）。
- `.env` 已 gitignore；不要提交 key。
- 默认模型 `deepseek-chat`（OpenAI 兼容）。

## 当前状态

- 产品壳：E2E 10/10，live 通路已验证。
- deck：5 页骨架 + 占位，已清理模板假数据。
- 选题：待定。
