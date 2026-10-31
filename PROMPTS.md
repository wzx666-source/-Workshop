# 终端启动话术

> 每个终端只粘贴自己那一段。题目到达后，总控会再发一条「题目补丁」。

## 总控端（当前会话）

不写产品代码和 deck。职责：

- 题目到达后 5 分钟内填完 `PLAN.md` / `BRIEF.md`，发 A/B 题目补丁；
- 每 25 分钟读 `APP_STATUS.md` / `DECK_STATUS.md`，给 go/no-go；
- 卡住超过 10 分钟时给决策和可直接粘回 A/B 的指令；
- 最后 20 分钟按模板逐页审 deck 和 demo 剧本。

需要总控做什么，直接把 A/B 的 STATUS、报错、当前决策点贴过来。

## A 产品端

```text
你是产品终端，负责全部产品代码，工作目录 E:\desktop\Workshop。
先读 PLAN.md、CLAUDE.md、APP_STATUS.md。
当前壳已完成：app/server.js + core/ai.js + core/prompts.js + core/demo-cache.json；
E2E 10/10；.env 已配好 DeepSeek live（默认 DEMO_MODE=1）。
题目到达后按顺序改：
1. core/prompts.js：系统提示词 + buildUserPrompt
2. core/demo-cache.json：1 个命中 demo 输入的 case + default
3. app/public/index.html + app/public/app.js：标题、tag、EXAMPLE、placeholder
4. 重启 node app/server.js；先 DEMO_MODE=1 自检，再临时切 0 跑一次 live，最后切回 1
5. 截 ui_main.png / ai_output.png 到 deck/assets/
只改 app/、core/ 和入口；不碰 deck/、BRIEF.md。
卡住超过 10 分钟，把错误和已尝试的方案贴给总控端。
```

## B deck 端

```text
你是 deck 终端，只负责路演材料，工作目录 E:\desktop\Workshop。
先读 BRIEF.md、CLAUDE.md、DECK_STATUS.md。当前 5 页骨架已完成，不要再改结构。
题目到达后：按 BRIEF 填第 1–3 页；第 4 页先占位，等 A 的截图和验证数字；第 5 页写路线图。
截图要求见 deck/assets/README.md。
每完成一页更新 DECK_STATUS.md。
渲染检查：cd deck && python _build/_render.py
只改 deck/；不碰 app/、core/、PLAN.md、BRIEF.md。不要猜数字。
deck 定稿在 deadline 前 15 分钟。
```

## C 备用端（最后 30 分钟再开）

```text
你是只读复核终端。不修改任何文件，只写 deck/review.md。
看 deck 的 5 页成品 + 3 张产品截图，检查：文字溢出、对齐、信息层级、与 BRIEF 不一致、demo 剧本漏洞。
按【高/中/低】列出，每条给具体修改建议。
```

## 题目到达时，总控发给 A/B 的补丁

### 发给 A

```text
题目已定：<项目名>。一句话：<...>。
目标用户/痛点：<...>。
输入：<...>；AI 做什么：<...>；输出：<...>；人工确认动作：<...>。
先改 core/prompts.js + core/demo-cache.json + 页面文案，20 分钟内给我第一版 live 截图。
```

### 发给 B

```text
题目已定：<项目名>。BRIEF.md 已填好，按它填第 1–3 页；第 4 页先留占位，等 A 截图和数字。
```
