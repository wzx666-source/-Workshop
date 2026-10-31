(function () {
  'use strict';

  const ts = document.getElementById('ts');
  const startBtn = document.getElementById('ts-start');
  const hint = document.getElementById('ts-hint');
  const lines = document.getElementById('ts-lines');
  const round = document.getElementById('ts-round');
  const consensus = document.getElementById('ts-consensus');

  const MESSAGES = [
    { t: 0, agent: '风光代理', cls: 'wind', text: '风电 120 kW、光伏富余 250 kWh，申请优先消纳。' },
    { t: 700, agent: '储能代理', cls: 'storage', text: '可以充，但 SOC 20–90%，一天最多一次循环。' },
    { t: 1400, agent: '工厂代理', cls: 'factory', text: '我要低价电，愿意把 10% 负荷移到午间。' },
    { t: 2100, agent: '电网代理', cls: 'grid', text: '晚高峰峰荷不能超过 120 kW。' },
    { t: 2800, agent: '调度员', cls: 'mediator', text: '方案：风光优先充储，18–22 放电，工厂移峰。' },
    { t: 3500, agent: '四方', cls: 'all', text: '4/4 同意，共识度 92%。' }
  ];

  const AGENT_SELECTOR = {
    wind: '.ts-agent.wind',
    storage: '.ts-agent.storage',
    factory: '.ts-agent.factory',
    grid: '.ts-agent.grid'
  };

  let timers = [];

  // 3.png 风格：每条线路克隆出中层与外晕，形成「外晕内实」的霓虹管
  document.querySelectorAll('.ts-path').forEach((p) => {
    const mid = p.cloneNode(true);
    mid.classList.add('ts-mid');
    p.parentNode.insertBefore(mid, p);
    const glow = p.cloneNode(true);
    glow.classList.add('ts-glow');
    p.parentNode.insertBefore(glow, p);
  });

  // 电力中枢直接沿线取点生成，保证每条线都有进有出
  const corePaths = Array.from(document.querySelectorAll('.ts-path'))
    .filter((p) => !p.classList.contains('ts-mid') && !p.classList.contains('ts-glow'));
  const hubPlan = [
    { cls: 'wind', points: [0.30, 0.68] },
    { cls: 'pv', points: [0.50] },
    { cls: 'wind2', points: [0.50] },
    { cls: 'factory', points: [0.50] },
    { cls: 'grid', points: [0.50] },
    { cls: 'pv2', points: [0.55] },
    { cls: 'factory2', points: [0.50] }
  ];
  const hubs = [];
  hubPlan.forEach(({ cls, points }) => {
    const path = corePaths.find((p) => p.classList.contains(cls));
    if (!path) return;
    const total = path.getTotalLength();
    points.forEach((t) => {
      const pt = path.getPointAtLength(total * t);
      const hub = document.createElement('div');
      hub.className = 'ts-hub';
      hub.style.setProperty('--x', (pt.x / 1600 * 100).toFixed(3) + '%');
      hub.style.setProperty('--y', (pt.y / 900 * 100).toFixed(3) + '%');
      hub.innerHTML = '<i></i>';
      ts.appendChild(hub);
      hubs.push(hub);
    });
  });

  function addLine(m) {
    const p = document.createElement('p');
    p.className = 'ts-line ' + m.cls;
    const b = document.createElement('b');
    b.textContent = m.agent;
    const span = document.createElement('span');
    span.textContent = m.text;
    p.append(b, span);
    lines.append(p);
    lines.scrollTop = lines.scrollHeight;
  }

  function activate(cls) {
    document.querySelectorAll('.ts-agent').forEach((a) => a.classList.remove('is-active'));
    if (cls === 'all') {
      document.querySelectorAll('.ts-agent').forEach((a) => a.classList.add('is-agree'));
      return;
    }
    if (cls === 'mediator') {
      document.querySelectorAll('.ts-agent').forEach((a) => a.classList.add('is-active'));
      return;
    }
    const el = document.querySelector(AGENT_SELECTOR[cls]);
    if (el) el.classList.add('is-active');
  }

  function startDemo() {
    if (ts.classList.contains('is-running')) return;
    ts.classList.add('is-running');
    startBtn.disabled = true;
    startBtn.innerHTML = '<span>◌</span> 协商中…';
    hint.classList.add('is-hidden');
    lines.replaceChildren();
    round.textContent = 'ROUND 1';

    MESSAGES.forEach((m, i) => {
      timers.push(window.setTimeout(() => {
        addLine(m);
        activate(m.cls);
        if (i === 2) round.textContent = 'ROUND 2';
        if (i === 4) round.textContent = 'ROUND 3';
      }, m.t));
    });

    timers.push(window.setTimeout(() => {
      ts.classList.add('is-flow');
      startBtn.innerHTML = '<span>◉</span> 电力流动中…';
      hubs.forEach((hub, i) => {
        timers.push(window.setTimeout(() => hub.classList.add('is-lit'), 200 + i * 500));
      });
    }, 2200));

    timers.push(window.setTimeout(() => {
      ts.classList.add('is-done');
      round.textContent = 'AGREED';
      startBtn.innerHTML = '<span>✓</span> 协议达成 · 92%';
      startBtn.classList.add('is-done');
      consensus.classList.add('is-in');
      activate('all');
    }, 4200));
  }

  function reset() {
    timers.forEach((t) => window.clearTimeout(t));
    timers = [];
    ts.classList.remove('is-running', 'is-flow', 'is-done');
    startBtn.disabled = false;
    startBtn.classList.remove('is-done');
    startBtn.innerHTML = '<span>▶</span> 开始演示';
    hint.classList.remove('is-hidden');
    consensus.classList.remove('is-in');
    round.textContent = 'STANDBY';
    lines.replaceChildren();
    const idle = document.createElement('p');
    idle.className = 'ts-line idle';
    idle.textContent = '路径已规划 · 点击开始，电力将沿城市道路流动';
    lines.append(idle);
    document.querySelectorAll('.ts-agent').forEach((a) => a.classList.remove('is-active', 'is-agree'));
    hubs.forEach((hub) => hub.classList.remove('is-lit'));
  }

  startBtn.addEventListener('click', () => {
    if (ts.classList.contains('is-done')) reset();
    else startDemo();
  });

  if (location.search.includes('play=1')) {
    window.setTimeout(startDemo, 600);
  }
})();
