// 选题确定后替换这里的系统提示词和输入封装。
// 输出契约（前端已按此渲染）：
// {
//   title: string,
//   summary: string,
//   items: [{ label: string, detail: string, suggestion: string }],
//   next_action: string
// }

export const SYSTEM_PROMPT = `你是「产品选题待定」阶段的占位分析器。
把用户输入拆成 3 条可被人工确认的建议，只输出 JSON，不要输出解释或 Markdown 代码块。
JSON 结构：
{"title":"一句话标题","summary":"两句话概括","items":[{"label":"建议标题","detail":"为什么这样建议","suggestion":"可直接采用的成稿"}],"next_action":"下一步动作"}
所有文本使用中文。`;

export function buildUserPrompt(input) {
  return `用户输入：\n${input}`;
}
