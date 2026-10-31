# Workshop 黑客松项目

2 小时冲刺。选题：**电力谈判桌 PowerTable**（智能能源 / 多智能体协作 + 博弈决策）。
先读 `PLAN.md` 和 `TOPIC.md`；deck 终端再读 `BRIEF.md`。

## 当前架构
- `app/public/powertable.js` / `.css`：谈判桌可视化（四代理 + 3 轮消息 + 共识度）
- `app/public/sandbox.js` / `.css`：最终协议 24h 调度沙盘
- `app/server.js`：HTTP 入口，`POST /api/analyze`
- `core/prompts.js`：多代理谈判提示词
- `core/demo-cache.json`：谈判结果缓存（DEMO 兜底）
- `app/public/index.html` / `app.js`：标题、文案、示例输入
- 输出契约：`{title, summary, items:[{label,detail,suggestion}], next_action}`，items 固定 6 条时段协议
- `.env`：已配好 DeepSeek，gitignore；不要打印或提交 key

## 终端角色
- 总控：只维护 PLAN/TOPIC/BRIEF/review，不写产品代码和 deck
- A 产品：只改 `app/`、`core/`、入口文件
- B deck：只改 `deck/`
- C 备用：只读，写 `deck/review.md`

## 硬规则
- 不建分支、不用 worktree；同一目录，按目录隔离
- 一条 demo 主路径：输入场景 → 四方谈判 → 最终协议 → 人工确认
- 演示用 `DEMO_MODE=1` 缓存兜底，不赌 live
- 不碰别人的目录；不做计划外功能
- 卡住超过 10 分钟回总控
- deadline 前 25 分钟代码冻结，前 15 分钟 deck 定稿，前 10 分钟录屏
