import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from '../core/env.js';
import { analyze, getMode, AppError } from '../core/ai.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC = path.join(__dirname, 'public');

loadEnv(ROOT);

const PORT = Number(process.env.PORT || 5173);
const HOST = process.env.HOST || '127.0.0.1';
const MAX_INPUT = 8000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let done = false;
    const chunks = [];

    req.on('data', (chunk) => {
      if (done) return;
      size += chunk.length;
      if (size > 200_000) {
        done = true;
        reject(new AppError(413, '请求体过大'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (!done) resolve(Buffer.concat(chunks).toString('utf8'));
    });
    req.on('error', (err) => {
      if (!done) reject(err);
    });
  });
}

function serveStatic(req, res, pathname) {
  const rel = decodeURIComponent(pathname === '/' ? '/index.html' : pathname);
  const full = path.resolve(PUBLIC, `.${rel}`);

  if (full !== PUBLIC && !full.startsWith(PUBLIC + path.sep)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  fs.readFile(full, (err, data) => {
    if (err) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Not found');
      return;
    }
    res.writeHead(200, {
      'content-type': MIME[path.extname(full).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-cache',
    });
    res.end(data);
  });
}

async function handleAnalyze(req, res) {
  const started = Date.now();
  let body;
  try {
    body = JSON.parse(await readBody(req));
  } catch {
    return sendJson(res, 400, { error: '请求体必须是 JSON' });
  }

  const input = String(body?.input ?? '').trim();
  if (!input) return sendJson(res, 400, { error: '请输入内容' });
  if (input.length > MAX_INPUT) {
    return sendJson(res, 400, { error: `输入超过 ${MAX_INPUT} 字，请截断后再试` });
  }

  try {
    const { result, mode, note } = await analyze(input);
    sendJson(res, 200, {
      result,
      meta: {
        mode,
        note: note ?? null,
        elapsedMs: Date.now() - started,
        model: mode === 'live' ? getMode().model : null,
      },
    });
  } catch (err) {
    const status = err instanceof AppError ? err.status : 500;
    if (status >= 500) console.error('[analyze]', err);
    sendJson(res, status, { error: err.message || '服务端错误' });
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (url.pathname === '/api/health' && req.method === 'GET') {
    return sendJson(res, 200, { ok: true, ...getMode(), now: Date.now() });
  }

  if (url.pathname === '/api/analyze' && req.method === 'POST') {
    handleAnalyze(req, res).catch((err) => {
      console.error('[server]', err);
      if (!res.headersSent) sendJson(res, 500, { error: '服务端错误' });
    });
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  serveStatic(req, res, url.pathname);
});

server.listen(PORT, HOST, () => {
  const mode = getMode();
  console.log(`产品原型已启动 → http://${HOST}:${PORT}`);
  console.log(`模式：${mode.mode === 'demo' ? 'DEMO（缓存兜底）' : `LIVE（${mode.model}）`}${mode.mode === 'live' && !mode.hasKey ? '  缺少 AI_API_KEY' : ''}`);
});
