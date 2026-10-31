import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const OUT = path.join(ROOT, 'deck', 'assets');
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'workshop-shots-'));
const EDGE = process.env.EDGE_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const APP_URL = process.env.APP_URL || 'http://127.0.0.1:5173/?pt=play';
const CDP_PORT = Number(process.env.CDP_PORT || 9224);
const VIEWPORT = { width: 1440, height: 1080 };
const DSF = 2;

fs.mkdirSync(OUT, { recursive: true });

const edge = spawn(EDGE, [
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  `--user-data-dir=${PROFILE}`,
  `--remote-debugging-port=${CDP_PORT}`,
  'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getTarget() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
      const targets = await res.json();
      const page = targets.find((t) => t.type === 'page');
      if (page) return page;
    } catch {
      // browser still starting
    }
    await sleep(250);
  }
  throw new Error('Edge CDP 未就绪');
}

const target = await getTarget();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.onopen = resolve;
  ws.onerror = () => reject(new Error('CDP WebSocket 连接失败'));
});

let nextId = 0;
const pending = new Map();
const eventWaiters = new Map();
const exceptions = [];

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(msg.error.message));
    else resolve(msg.result);
    return;
  }
  if (msg.method === 'Runtime.exceptionThrown') {
    const d = msg.params.exceptionDetails;
    exceptions.push(d.exception?.description || d.text || 'unknown exception');
  }
  const waiters = eventWaiters.get(msg.method);
  if (waiters?.length) waiters.shift()(msg.params);
};

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = (nextId += 1);
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

function waitEvent(method, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const queue = eventWaiters.get(method) || [];
    const timer = setTimeout(() => reject(new Error(`等待事件超时：${method}`)), timeout);
    queue.push((params) => { clearTimeout(timer); resolve(params); });
    eventWaiters.set(method, queue);
  });
}

async function evaluate(expression) {
  const result = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description || '页面脚本执行失败');
  }
  return result.result.value;
}

async function waitFor(expression, timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await evaluate(`Boolean(${expression})`)) return;
    await sleep(150);
  }
  throw new Error(`等待条件超时：${expression}`);
}

async function screenshot(clip, file) {
  const shot = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
    fromSurface: true,
    clip: { ...clip, scale: 1 },
  });
  const full = path.join(OUT, file);
  fs.writeFileSync(full, Buffer.from(shot.data, 'base64'));
  console.log(`截图：${full}  (${clip.width}x${clip.height} css @${DSF}x)`);
}

const metricsExpr = `(() => {
  const rect = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x + scrollX), y: Math.round(r.y + scrollY), w: Math.round(r.width), h: Math.round(r.height) };
  };
  return {
    scrollHeight: document.documentElement.scrollHeight,
    masthead: rect('.masthead'),
    powertable: rect('#powertable'),
    sandbox: rect('#sandbox'),
    compare: rect('#compare'),
    stepper: rect('.stepper'),
    grid: rect('main.shell > .grid'),
    inputPanel: rect('main.shell > .grid > .panel:first-child'),
    outputPanel: rect('#output-panel'),
  };
})()`;

try {
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    ...VIEWPORT,
    deviceScaleFactor: DSF,
    mobile: false,
  });

  const loaded = waitEvent('Page.loadEventFired');
  await send('Page.navigate', { url: APP_URL });
  await loaded;
  await waitFor('document.readyState === "complete"');
  await waitFor('document.getElementById("powertable") && document.getElementById("sandbox") && document.getElementById("compare") && document.getElementById("digitaltwin")');

  const demo = await evaluate('document.getElementById("mode-badge").dataset.mode');
  if (demo !== 'demo') throw new Error(`期望 DEMO 模式，实际 ${demo}`);

  await waitFor('document.querySelector("#pt-consensus .pt-consensus-label")?.textContent === "协议达成"', 12000);
  const consensus = await evaluate('document.querySelector("#pt-consensus strong").textContent');
  if (consensus !== '92%') throw new Error(`共识度异常：${consensus}`);

  await evaluate('scrollTo(0, 0)');
  await sleep(500);
  const mainMetrics = await evaluate(metricsExpr);
  console.log('布局：', JSON.stringify(mainMetrics));

  const mainHeight = Math.min(mainMetrics.powertable.y + mainMetrics.powertable.h + 24, 1600);
  await screenshot({ x: 0, y: 0, width: VIEWPORT.width, height: mainHeight }, 'ui_main.png');

  await evaluate('document.getElementById("fill-example").click()');
  await evaluate('document.getElementById("analyze").click()');
  await waitFor('!document.getElementById("result").hidden && document.querySelectorAll("#items .item").length === 6', 10000);

  const labels = await evaluate('[...document.querySelectorAll("#items .item h4")].map(e => e.textContent)');
  const confirmText = await evaluate('document.getElementById("confirm-count").textContent');
  console.log('6 条协议：', labels.join(' | '));
  console.log('确认条：', confirmText);
  if (labels.length !== 6) throw new Error(`协议条数 ${labels.length}，期望 6`);

  await sleep(400);
  const metrics = await evaluate(metricsExpr);
  console.log('输出布局：', JSON.stringify({ grid: metrics.grid, outputPanel: metrics.outputPanel }));

  const grid = metrics.grid;
  const clipTop = Math.max(0, grid.y - 24);
  await screenshot(
    { x: 0, y: clipTop, width: VIEWPORT.width, height: Math.min(grid.h + 48, 2200) },
    'ai_output.png',
  );

  if (exceptions.length) throw new Error(`页面异常：${exceptions.join(' | ')}`);
  console.log('PASS  6 条协议 / 共识 92% / DEMO 模式 / 无页面异常');
} finally {
  ws.close();
  edge.kill();
  await sleep(500);
  fs.rmSync(PROFILE, { recursive: true, force: true });
}
