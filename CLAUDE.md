# Workshop 黑客松项目

2 小时冲刺。先读 `PLAN.md`；deck 终端再读 `BRIEF.md`。

## 当前架构
- `app/server.js`：HTTP 入口，`POST /api/analyze`，body `{input}`
- `core/ai.js`：DEMO / live / fallback；OpenAI 兼容 + Anthropic 兼容
- `core/prompts.js`：系统提示词 + 输入封装（选题后改这里）
- `core/demo-cache.json`：演示缓存（选题后改这里）
- `app/public/`：单页 UI（选题后改标题、tag、EXAMPLE、placeholder）
- 输出契约：`{title, summary, items:[{label, detail, suggestion}], next_action}`，items 1–8 条
- `.env`：已配好 DeepSeek，gitignore；不要打印或提交 key

## 终端角色
- 总控：只维护 `PLAN.md` / `BRIEF.md` / review，不写产品代码和 deck
- A 产品：只改 `app/`、`core/`、入口文件
- B deck：只改 `deck/`
- C 备用：只读，写 `deck/review.md`

## 硬规则
- 不建分支、不用 worktree；同一目录，按目录隔离
- 一条 demo 主路径：输入 → AI → 输出 → 人工确认
- A 必须保留 `DEMO_MODE=1` 缓存兜底
- 不碰别人的目录；要改契约，先写进共享文件并告知总控
- 每 25 分钟 checkpoint；卡住超过 10 分钟回总控
- 题目到达后 35 分钟必须能端到端演示
- 代码冻结：deadline 前 25 分钟；deck 定稿：前 15 分钟；录屏：前 10 分钟

## 选题到达后的 20 分钟
1. A 改 `core/prompts.js` + `core/demo-cache.json` + 页面文案
2. A 重启，`DEMO_MODE=1` 自检，再 `DEMO_MODE=0` 跑 live
3. A 截 `ui_main.png` / `ai_output.png` 到 `deck/assets/`
4. B 按 `BRIEF.md` 填第 1–3 页
5. 总控检查 live 输出是否命中 demo 剧本
