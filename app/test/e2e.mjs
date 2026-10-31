import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.join(__dirname, 'shots');
const DOWNLOADS = path.join(os.tmpdir(), 'workshop-e2e-downloads');
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'workshop-edge-'));
const EDGE = process.env.EDGE_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const APP_URL = process.env.APP_URL || 'http://127.0.0.1:5173/';
const CDP_PORT = Number(process.env.CDP_PORT || 9223);

fs.mkdirSync(SHOTS, { recursive: true });
fs.rmSync(DOWNLOADS, { recursive: true, force: true });
fs.mkdirSync(DOWNLOADS, { recursive: true });

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
    if (msg.error) reject(new Error(`${msg.error.message}`));
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

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
  if (!ok) process.exitCode = 1;
}

try {
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send('Browser.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: DOWNLOADS,
    eventsEnabled: true,
  });

  const loaded = waitEvent('Page.loadEventFired');
  await send('Page.navigate', { url: APP_URL });
  await loaded;
  await waitFor('document.readyState === "complete"');

  check('页面加载', await evaluate('document.title') === 'WORKSHOP / 产品原型');
  check('DEMO 徽标', await evaluate('document.getElementById("mode-badge").dataset.mode') === 'demo');

  await evaluate('document.getElementById("fill-example").click()');
  check('填入示例', (await evaluate('document.getElementById("input").value.length')) > 0);

  await evaluate('document.getElementById("analyze").click()');
  await waitFor('!document.getElementById("result").hidden');
  const itemCount = await evaluate('document.querySelectorAll("#items .item").length');
  check('AI 输出渲染', itemCount === 3, `${itemCount} 条建议`);
  check('步骤到人工确认', await evaluate('document.querySelector(".step[data-step=\\"3\\"]").classList.contains("is-active")'));

  await evaluate(`(() => {
    const boxes = [...document.querySelectorAll('#items input[type="checkbox"]')];
    boxes[1].checked = false;
    boxes[1].dispatchEvent(new Event('change', { bubbles: true }));
    const area = document.querySelector('#items textarea.suggestion');
    area.value = '人工改写后的建议';
    area.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);

  const countText = await evaluate('document.getElementById("confirm-count").textContent');
  check('取消勾选计入确认数量', countText.startsWith('2 / 3'), countText);

  await evaluate('document.getElementById("confirm").click()');
  await waitFor('!document.getElementById("confirmed").hidden');
  check('出现已确认标记', await evaluate('document.getElementById("confirmed-text").textContent.includes("2 条")'));

  let file = null;
  for (let i = 0; i < 40 && !file; i += 1) {
    const files = fs.readdirSync(DOWNLOADS).filter((f) => f.endsWith('.md'));
    if (files.length) file = files[0];
    else await sleep(150);
  }
  check('导出文件生成', Boolean(file), file || '未找到 .md');
  if (file) {
    const text = fs.readFileSync(path.join(DOWNLOADS, file), 'utf8');
    check('导出只含勾选项', !text.includes('联调项二') && text.includes('人工改写后的建议'));
  }

  await evaluate('window.scrollTo(0, 0)');
  const shot = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
    fromSurface: true,
  });
  const shotPath = path.join(SHOTS, 'e2e-confirmed.png');
  fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));
  console.log(`截图：${shotPath}`);

  check('无页面异常', exceptions.length === 0, exceptions.join(' | '));
} finally {
  ws.close();
  edge.kill();
  await sleep(500);
  fs.rmSync(PROFILE, { recursive: true, force: true });
}

const failed = checks.filter((c) => !c.ok);
if (failed.length) {
  console.error(`\n${failed.length} 项失败`);
  process.exit(1);
}
console.log(`\n${checks.length} 项全部通过`);
