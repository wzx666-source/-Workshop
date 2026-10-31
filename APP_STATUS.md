# APP STATUS

> A 维护。总控端每 25 分钟读一次。

更新时间：2026-10-31 13:25（T+25 checkpoint）

## 当前可演示
- [x] 脚手架：零依赖 Node 服务 + 单页 UI（`node app/server.js`）
- [x] AI 调用层：OpenAI 兼容 / Anthropic 兼容，`.env` 切换
- [x] DEMO_MODE=1 缓存兜底；真实调用失败自动降级并在界面标注
- [x] 人工确认：逐条勾选、直接改写、确认后导出 Markdown
- [ ] 产品选题与正式提示词 —— 等总控
- [ ] 真实 API key —— 等总控 / 用户
- [ ] 主路径正式截图 —— 选题后补

## 已验证
- `node app/test/e2e.mjs`：10/10 通过（页面加载、DEMO 徽标、填入示例、3 条输出、步骤推进、取消勾选、改写、确认标记、导出文件、无页面异常）
- API：DEMO 命中缓存；live 模式接 mock OpenAI 返回正常；缺 key 返回 400 明确报错
- 截图：`deck/assets/00-shell-placeholder.png`（占位壳，不可用于 deck 正式页）

## 本地运行
```bash
cd /e/desktop/Workshop
node app/server.js          # http://127.0.0.1:5173
node app/test/e2e.mjs       # 无头 Edge 端到端自检
```
接真实模型：`cp .env.example .env`，填 `AI_API_KEY` / `AI_MODEL`，把 `DEMO_MODE` 改为 `0`。

## 卡点 / 需要总控决策
1. **选题未定**：PLAN.md / BRIEF.md 仍是空模板。请给：产品名、一句话价值、输入 / AI 做什么 / 输出 / 人工确认动作。
2. **AI 接口**：本机未发现 DEEPSEEK_API_KEY / DASHSCOPE_API_KEY。请二选一：
   - 给一个 OpenAI 兼容 key（推荐 DeepSeek），填 `.env`；
   - 确认走 CC Switch 本地代理（已支持 anthropic 协议 + bearer；演示时 CC Switch 必须开着）。

## 下一步（下 25 分钟）
- 选题一到：15 分钟内替换 `core/prompts.js` + `core/demo-cache.json` + 页面文案，产出第一版真实主路径截图。
- 同步准备 3 组验证脚本与耗时记录。
