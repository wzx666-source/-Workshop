import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompts.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_FILE = path.join(__dirname, 'demo-cache.json');

export class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const env = (name, fallback = '') => String(process.env[name] ?? fallback).trim();

export const isDemo = () => env('DEMO_MODE', '1') === '1';
const canFallback = () => env('DEMO_FALLBACK', '1') === '1';

export function getMode() {
  return {
    mode: isDemo() ? 'demo' : 'live',
    model: isDemo() ? null : env('AI_MODEL') || null,
    hasKey: Boolean(env('AI_API_KEY')),
    fallback: canFallback(),
  };
}

function pickDemoResult(input) {
  let cache;
  try {
    cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  } catch {
    throw new AppError(500, 'demo-cache.json 缺失或格式错误');
  }

  const q = input.trim();
  const hit = Array.isArray(cache.cases)
    ? cache.cases.find((c) => c && c.match && q.includes(c.match))
    : null;

  if (hit && hit.result) return hit.result;
  if (cache.default) return cache.default;
  throw new AppError(500, 'demo-cache.json 没有 default 结果');
}

function readConfig() {
  const protocol = (env('AI_PROTOCOL', 'openai') || 'openai').toLowerCase();
  if (protocol !== 'openai' && protocol !== 'anthropic') {
    throw new AppError(500, `AI_PROTOCOL 只能是 openai 或 anthropic，当前是 ${protocol}`);
  }

  const apiKey = env('AI_API_KEY');
  if (!apiKey) {
    throw new AppError(400, '未配置 AI_API_KEY：复制 .env.example 为 .env 并填写，或保持 DEMO_MODE=1');
  }

  return {
    protocol,
    apiKey,
    baseUrl: env('AI_BASE_URL', 'https://api.deepseek.com/v1').replace(/\/+$/, ''),
    model: env('AI_MODEL', 'deepseek-chat'),
    timeoutMs: Math.max(3000, Number(env('AI_TIMEOUT_MS', '45000')) || 45000),
    authHeader: env('AI_AUTH_HEADER', 'x-api-key').toLowerCase(),
  };
}

function parseJsonLoose(text) {
  if (!text || !text.trim()) throw new AppError(502, '模型返回为空');

  let s = text.trim();
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start === -1 || end <= start) throw new AppError(502, '模型没有返回 JSON 对象');

  try {
    return JSON.parse(s.slice(start, end + 1));
  } catch {
    throw new AppError(502, '模型返回的 JSON 无法解析');
  }
}

function cleanResult(raw) {
  const text = (v) => (typeof v === 'string' ? v.trim() : '');

  const items = (Array.isArray(raw?.items) ? raw.items : [])
    .map((item) => {
      if (typeof item === 'string') {
        return { label: item.trim(), detail: '', suggestion: item.trim() };
      }
      if (!item || typeof item !== 'object') return null;
      const label = text(item.label);
      const suggestion = text(item.suggestion);
      if (!label && !suggestion) return null;
      return {
        label: label || '建议',
        detail: text(item.detail),
        suggestion: suggestion || label,
      };
    })
    .filter(Boolean)
    .slice(0, 8);

  if (!items.length) throw new AppError(502, '模型结果里没有可确认的建议项');

  return {
    title: text(raw?.title) || '分析结果',
    summary: text(raw?.summary),
    items,
    next_action: text(raw?.next_action),
  };
}

async function callOpenAI(cfg, input) {
  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      stream: false,
      temperature: 0.4,
      max_tokens: 2000,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(input) },
      ],
    }),
    signal: AbortSignal.timeout(cfg.timeoutMs),
  });

  if (!res.ok) {
    const detail = (await res.text().catch(() => '')).slice(0, 300);
    throw new AppError(502, `AI 接口返回 ${res.status}${detail ? `：${detail}` : ''}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? '';
}

async function callAnthropic(cfg, input) {
  const url = cfg.baseUrl.endsWith('/v1')
    ? `${cfg.baseUrl}/messages`
    : `${cfg.baseUrl}/v1/messages`;

  const auth =
    cfg.authHeader === 'bearer'
      ? { authorization: `Bearer ${cfg.apiKey}` }
      : { 'x-api-key': cfg.apiKey };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'anthropic-version': '2023-06-01',
      ...auth,
    },
    body: JSON.stringify({
      model: cfg.model,
      max_tokens: 2000,
      temperature: 0.4,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(input) }],
    }),
    signal: AbortSignal.timeout(cfg.timeoutMs),
  });

  if (!res.ok) {
    const detail = (await res.text().catch(() => '')).slice(0, 300);
    throw new AppError(502, `AI 接口返回 ${res.status}${detail ? `：${detail}` : ''}`);
  }

  const data = await res.json();
  const block = Array.isArray(data?.content)
    ? data.content.find((b) => b?.type === 'text')
    : null;
  return block?.text ?? '';
}

async function callModel(cfg, input) {
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const text =
        cfg.protocol === 'anthropic'
          ? await callAnthropic(cfg, input)
          : await callOpenAI(cfg, input);
      return cleanResult(parseJsonLoose(text));
    } catch (err) {
      lastError = err;
      const retryable = !(err instanceof AppError) || (err.status >= 500 && err.status !== 502);
      if (!retryable || attempt === 1) break;
    }
  }
  throw lastError;
}

export async function analyze(input) {
  if (isDemo()) {
    return { result: pickDemoResult(input), mode: 'demo' };
  }

  const cfg = readConfig();
  try {
    const result = await callModel(cfg, input);
    return { result, mode: 'live' };
  } catch (err) {
    if (!canFallback()) throw err;
    console.warn(`[ai] 真实调用失败，降级到缓存：${err.message}`);
    return { result: pickDemoResult(input), mode: 'fallback', note: err.message };
  }
}
