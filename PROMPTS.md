# 终端分工（70 分钟版）

> 总控（当前会话）已写完 powertable / digitaltwin / compare / sandbox 四个可视化组件。
> A/B/C 只做验证、截图、deck 和 QA，不再改组件本体。

## 总控（当前会话）
- 维护 `TOPIC.md` / `PLAN.md` / `BRIEF.md`；做取舍和最终 review。
- 不写 deck；卡住时给可直接粘回 A/B/C 的指令。

## A 产品端（产品验证 + 截图）

```text
你是产品终端，工作目录 E:\desktop\Workshop。
先读 PLAN.md、TOPIC.md、CLAUDE.md、APP_STATUS.md。
产品代码和可视化已由总控完成（powertable / digitaltwin / compare / sandbox），你只做：
1. 重启 node app/server.js
2. 保持 DEMO_MODE=1，点「填入示例」→「开始分析」，确认出 6 条协议
3. 截 ui_main.png / ai_output.png 到 deck/assets/
4. 更新 APP_STATUS.md
不要改 powertable/digitaltwin/compare/sandbox 及其 CSS；不要新增功能。
T+30 前完成截图；卡住 >10 分钟贴给总控。
```

## B deck 端（路演材料）

```text
你是 deck 终端，只负责路演材料，工作目录 E:\desktop\Workshop。
先读 BRIEF.md、CLAUDE.md、DECK_STATUS.md。5 页骨架已完成，不改结构。
按 BRIEF 填：
- 第 1 页：电力谈判桌 + 一句话
- 第 2 页：四方目标冲突、人工调度只能顾 1–2 方
- 第 3 页：四代理 + 调度员 + 3 轮协商；主视觉 app/test/shots/powertable.png
- 第 4 页：人工 vs AI 对比表 + 数字孪生说明
- 第 5 页：路线图
不要编数字；T+45 前完成初稿。
```

## C 视觉 / QA 端（只读）

```text
你是只读复核终端，工作目录 E:\desktop\Workshop。
不改任何文件，只写 deck/review.md。
1. 打开 http://127.0.0.1:5173/?pt=play，等 8 秒，检查谈判桌/数字孪生/对比面板/沙盘
2. 用 qwen_vision 或截图检查文字溢出、对齐、投屏可读性
3. 对照 BRIEF 检查 deck 数字是否一致
按【高/中/低】列出，每条给具体修改建议；T+45 前交给总控。
```

## 关键消息

### 给 A
```text
题目已切到「电力谈判桌」，可视化已由总控完成。你只做：重启、DEMO 模式验证 6 条协议、截图 ui_main.png / ai_output.png、更新 APP_STATUS.md。T+30 前完成，不要改组件。
```

### 给 B
```text
题目已切到「电力谈判桌」。BRIEF.md 已更新，按它填 5 页；第 3 页主视觉用 app/test/shots/powertable.png，第 4 页用人工 vs AI 对比表。T+45 前初稿。
```

### 给 C
```text
只读 QA：打开 5173/?pt=play 等 8 秒，检查谈判桌/数字孪生/对比/沙盘有无溢出、截断、投屏可读性问题；对照 BRIEF 核数字。写 deck/review.md，T+45 前交。
```
