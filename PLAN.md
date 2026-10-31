# PLAN — [项目名待填]

> 2 小时黑客松冲刺。维护人：总控端。最后更新：13:34（题目未定）。
> 本文件已按 A/B 的实际产物调整；题目一到，直接执行第 4 节。

## 1. 一句话价值
[待题目] 给 [谁] 在 [什么场景] 下，用 [什么 AI 能力]，把 [原来的多难/多久] 变成 [多简单/多久]。

## 2. 3 分钟 demo 剧本
1. **输入**：[用户输入什么]
2. **AI 处理**：[模型做了什么]
3. **输出**：[屏幕上出现什么]
4. **人工确认**：[用户点一下什么]
5. **证据**：[展示什么数字——耗时/成功率/对比]

## 3. 当前状态（13:34）
| 终端 | 已完成 | 卡点 |
|---|---|---|
| A 产品 | 通用壳跑通：零依赖 Node 服务 + 单页 UI；DEMO_MODE 兜底；人工确认/导出；E2E 10/10；live 通路已用 `deepseek-chat` 实测通过 | 等题目；改 prompt/cache/文案 |
| B deck | 5 页骨架 + 占位；已删模板假数据；PNG 逐页检查通过；speaker notes 已写 | 等 BRIEF / A 截图 / 验证数字 |
| 总控 | `.env` 已配好（DeepSeek key 从 CC Switch 读取，未打印，已 gitignore）；live 调用实测成功 | 等题目 |

> `搏创workshop.pptx` 只作视觉模板，不作为赛题要求；内容以 `BRIEF.md` 为准。

## 4. 题目到手后的 75 分钟（T0 = 题目确定）
| 时间 | 总控 | A 产品 | B deck |
|---|---|---|---|
| 0–5 | 填 PLAN/BRIEF，发 A/B 题目补丁 | 读题目，改 `core/prompts.js` | 读 BRIEF，填第 1–3 页 |
| 5–20 | 检查 live 输出与 demo 剧本 | 改 `core/demo-cache.json` + 页面文案；重启；live 测试 | 第 4 页指标占位；第 5 页路线图 |
| 20–35 | 砍范围；确认主路径 | 主路径跑通；截 `ui_main.png` / `ai_output.png` | 等截图；补 speaker notes |
| 35–50 | 看截图/数字 | 跑 3 组验证（前后耗时、成功率） | 插截图 + 真实数字 |
| 50–65 | 彩排；只修阻断 | 修阻断；录屏兜底 | deck 定稿；逐页检查 |
| 65–75 | 最终检查；提交 | 提交 | 提交 |

**Scope cut**：T0+35 主路径还跑不通 → 砍到单条缓存 demo（`DEMO_MODE=1`），把时间全部转给 deck 和彩排。

## 5. 产品壳的固定契约（不要改结构）
- 入口：`app/server.js`，`POST /api/analyze`，body `{input}`
- 模型层：`core/ai.js`；提示词在 `core/prompts.js`；缓存 `core/demo-cache.json`
- 输出契约：`{title, summary, items:[{label, detail, suggestion}], next_action}`（items 1–8 条）
- 页面文案：`app/public/index.html` + `app/public/app.js` 的 `EXAMPLE`
- 兜底：`DEMO_MODE=1` 走缓存；`DEMO_MODE=0` 走真实接口，失败自动降级
- 演示前：`.env` 改 `DEMO_MODE=0`，重启，跑一次 live；失败也能靠 `DEMO_FALLBACK=1` 兜底

## 6. 三个硬规则
1. 只有 A 改产品代码，只有 B 改 deck；不碰对方目录。
2. 卡住超过 10 分钟回总控；不做计划外功能。
3. 题目到达后 35 分钟必须能端到端演示；代码冻结在 deadline 前 25 分钟，deck 定稿在前 15 分钟，录屏在前 10 分钟。
