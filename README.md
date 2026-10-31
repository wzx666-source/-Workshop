# Workshop — 电力谈判桌 PowerTable

2 小时冲刺的 AI+ 黑客松原型：**四方能源 AI 自主协商 → 可执行调度协议 → 人工确认**。
题目：智能能源场景 / 多智能体协作 + 博弈决策。

## 快速开始

```bash
cp .env.example .env   # 可选：不填 key 时保持 DEMO_MODE=1 也能跑
node app/server.js     # http://127.0.0.1:5173
node app/test/e2e.mjs  # 无头 Edge 端到端自检
```

## 目录

| 路径 | 作用 |
|---|---|
| `TOPIC.md` | 四方代理、3 轮协议、demo 输入、证据口径 |
| `app/public/powertable.js` / `.css` | 谈判桌可视化：代理卡片、3 轮消息、共识度 |
| `app/public/digitaltwin.js` / `.css` | 数字孪生：中心能源总线 + 四节点 + 电力流线 |
| `app/public/compare.js` / `.css` | 人工调度 vs AI 调度对比 |
| `app/public/sandbox.js` / `.css` | 最终协议 24h 调度沙盘 |
| `app/server.js` | HTTP 入口，`POST /api/analyze` |
| `app/public/` | 单页 UI（输入 / 谈判 / 人工确认 / 导出） |
| `core/prompts.js` | 多代理谈判提示词 |
| `core/demo-cache.json` | 谈判结果缓存（演示兜底） |
| `deck/` | 5 页路演 deck 工作副本 + 渲染脚本 |
| `PLAN.md` / `BRIEF.md` / `PROMPTS.md` | 计划、deck 事实、终端话术 |

## 输出契约

```json
{
  "title": "string",
  "summary": "string",
  "items": [{ "label": "string", "detail": "string", "suggestion": "string" }],
  "next_action": "string",
  "agents": [],
  "rounds": [],
  "agreement": {}
}
```

`items` 固定 6 条时段协议；前端逐条勾选、改写、导出 Markdown。

## 环境

- `DEMO_MODE=1`：只读缓存，零 API 成本，演示兜底。
- `DEMO_MODE=0`：调用真实接口；失败自动降级（`DEMO_FALLBACK=1`）。
- `.env` 已 gitignore；不要提交 key。
- 默认模型 `deepseek-chat`（OpenAI 兼容）。

## 当前状态

- 产品壳：E2E 10/10，live 通路已验证。
- 可视化：谈判桌 + 数字孪生 + 人工/AI 对比 + 最终协议沙盘。
- 选题：电力谈判桌 PowerTable。
