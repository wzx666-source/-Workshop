(function () {
  'use strict';

  const ts = document.getElementById('ts');
  const startBtn = document.getElementById('ts-start');
  const hint = document.getElementById('ts-hint');
  const lines = document.getElementById('ts-lines');
  const round = document.getElementById('ts-round');
  const consensus = document.getElementById('ts-consensus');
  const net = document.getElementById('v2-network');

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

  const ICONS = {
    wind: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="1.4"/><path d="M12 10.6V3M13.4 12.8l7 4M10.6 12.8l-7 4"/></svg>',
    pv: '<svg viewBox="0 0 24 24"><rect x="4" y="7" width="16" height="10" rx="1"/><path d="M4 12h16M9 7v10M15 7v10"/></svg>',
    storage: '<svg viewBox="0 0 24 24"><rect x="5" y="7" width="12" height="10" rx="2"/><path d="M17 10h2v4h-2"/></svg>',
    sub: '<svg viewBox="0 0 24 24"><path d="M4 20V8h16v12M8 8V4h8v4M9 13h6M9 17h6"/></svg>',
    factory: '<svg viewBox="0 0 24 24"><path d="M4 20V10l5 3V10l5 3V10l6 3v7z"/></svg>',
    grid: '<svg viewBox="0 0 24 24"><path d="M12 3v18M7 21h10M5 7h14M7 7l-2 7M17 7l2 7"/></svg>',
    dc: '<svg viewBox="0 0 24 24"><rect x="5" y="4" width="14" height="16" rx="2"/><path d="M8 9h8M8 13h8M8 17h5"/></svg>',
    charge: '<svg viewBox="0 0 24 24"><path d="M13 2 6 13h5l-1 9 8-12h-5z"/></svg>'
  };

  // 8 个基站分布全城；10 条线形成环 + 交叉，每个基站至少两条线进出
  const STATIONS = [
    { id: 'wind', name: '风电基地', x: 18, y: 22, type: 'wind', icon: 'wind', value: '120 kW' },
    { id: 'pv', name: '光伏基地', x: 26, y: 74, type: 'pv', icon: 'pv', value: '250 kWh' },
    { id: 'storage', name: '储能站', x: 42, y: 56, type: 'storage', icon: 'storage', value: 'SOC 68%' },
    { id: 'sub', name: '变电站 A', x: 50, y: 18, type: 'sub', icon: 'sub', value: '110 kV' },
    { id: 'factory', name: '工厂', x: 72, y: 44, type: 'factory', icon: 'factory', value: '120 kW' },
    { id: 'grid', name: '电网枢纽', x: 76, y: 18, type: 'grid', icon: 'grid', value: '≤120 kW' },
    { id: 'dc', name: '数据中心', x: 78, y: 72, type: 'dc', icon: 'dc', value: '80 kW' },
    { id: 'charge', name: '充电站', x: 56, y: 82, type: 'charge', icon: 'charge', value: '60 kW' },
    { id: 'commercial', name: '商业区', x: 36, y: 34, type: 'factory', icon: 'factory', value: '90 kW', minor: true },
    { id: 'hospital', name: '医院', x: 62, y: 28, type: 'dc', icon: 'dc', value: '70 kW', minor: true },
    { id: 'school', name: '学校', x: 34, y: 64, type: 'dc', icon: 'dc', value: '50 kW', minor: true },
    { id: 'resA', name: '住宅区 A', x: 22, y: 46, type: 'storage', icon: 'storage', value: '40 kW', minor: true },
    { id: 'resB', name: '住宅区 B', x: 66, y: 58, type: 'storage', icon: 'storage', value: '45 kW', minor: true },
    { id: 'industrial', name: '工业园区', x: 86, y: 50, type: 'factory', icon: 'factory', value: '110 kW', minor: true },
    { id: 'water', name: '水厂', x: 70, y: 84, type: 'storage', icon: 'storage', value: '55 kW', minor: true },
    { id: 'subway', name: '地铁站', x: 48, y: 40, type: 'grid', icon: 'grid', value: '65 kW', minor: true },
    { id: 'logistics', name: '物流园', x: 90, y: 66, type: 'factory', icon: 'factory', value: '85 kW', minor: true },
    { id: 'sports', name: '体育中心', x: 10, y: 66, type: 'charge', icon: 'charge', value: '35 kW', minor: true }
  ];

  const EDGES = [
    ['wind', 'sub'],
    ['sub', 'grid'],
    ['grid', 'factory'],
    ['factory', 'dc'],
    ['dc', 'charge'],
    ['charge', 'pv'],
    ['pv', 'storage'],
    ['storage', 'wind'],
    ['storage', 'sub'],
    ['storage', 'factory'],
    ['commercial', 'subway'],
    ['commercial', 'hospital'],
    ['hospital', 'factory'],
    ['hospital', 'grid'],
    ['school', 'storage'],
    ['school', 'resA'],
    ['resA', 'sports'],
    ['resB', 'storage'],
    ['resB', 'factory'],
    ['industrial', 'factory'],
    ['industrial', 'grid'],
    ['water', 'charge'],
    ['water', 'dc'],
    ['subway', 'storage'],
    ['logistics', 'dc'],
    ['logistics', 'industrial'],
    ['sports', 'pv']
  ];

  const CLEAN = new Set(['wind', 'pv', 'storage']);
  const byId = Object.fromEntries(STATIONS.map((s) => [s.id, s]));
  const NS = 'http://www.w3.org/2000/svg';

  const nodes = {};
  const glows = {};

  // 铺基站 + 每个基站的城市光晕
  STATIONS.forEach((s) => {
    const glow = document.createElement('div');
    glow.className = 'v2-glow';
    glow.style.setProperty('--x', s.x + '%');
    glow.style.setProperty('--y', s.y + '%');
    net.appendChild(glow);
    glows[s.id] = glow;

    const node = document.createElement('div');
    node.className = 'ts-node ' + (s.minor ? 'minor ' : '') + s.type;
    node.style.setProperty('--x', s.x + '%');
    node.style.setProperty('--y', s.y + '%');
    node.innerHTML = '<span class="ts-ico">' + (ICONS[s.icon] || ICONS.grid) + '</span><div><b>' + s.name + '</b><em>' + s.value + '</em></div>';
    net.appendChild(node);
    nodes[s.id] = node;
  });

  // 生成传导线网络
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 1600 900');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('class', 'ts-flows');
  svg.setAttribute('aria-hidden', 'true');

  const routes = [];
  const flows = [];
  const particles = [];

  EDGES.forEach(([a, b]) => {
    const A = byId[a];
    const B = byId[b];
    const x1 = A.x * 16;
    const y1 = A.y * 9;
    const x2 = B.x * 16;
    const y2 = B.y * 9;
    const mx = (x1 + x2) / 2;
    const d = 'M' + x1 + ',' + y1 + ' C' + mx + ',' + y1 + ' ' + mx + ',' + y2 + ' ' + x2 + ',' + y2;

    const route = document.createElementNS(NS, 'path');
    route.setAttribute('class', 'ts-route');
    route.setAttribute('d', d);
    routes.push(route);

    const clean = CLEAN.has(A.type) || CLEAN.has(B.type);
    const flow = document.createElementNS(NS, 'path');
    flow.setAttribute('class', 'ts-path ' + (clean ? 'v2-blue' : 'v2-orange'));
    flow.setAttribute('d', d);
    flows.push(flow);

    const dot = document.createElementNS(NS, 'circle');
    dot.setAttribute('class', 'ts-particle');
    dot.setAttribute('r', '2.2');
    const motion = document.createElementNS(NS, 'animateMotion');
    motion.setAttribute('dur', (2.6 + Math.random() * 1.2).toFixed(2) + 's');
    motion.setAttribute('repeatCount', 'indefinite');
    motion.setAttribute('path', d);
    dot.appendChild(motion);
    particles.push(dot);
  });

  routes.forEach((p) => svg.appendChild(p));
  flows.forEach((p) => svg.appendChild(p));
  particles.forEach((p) => svg.appendChild(p));
  net.appendChild(svg);

  // 3.png 风格：每条线路克隆中层、外晕与白色热芯
  flows.forEach((p) => {
    const mid = p.cloneNode(true);
    mid.classList.add('ts-mid');
    p.parentNode.insertBefore(mid, p);
    const glow = p.cloneNode(true);
    glow.classList.add('ts-glow');
    p.parentNode.insertBefore(glow, p);
    const hot = p.cloneNode(true);
    hot.classList.add('ts-hot');
    p.parentNode.insertBefore(hot, p.nextSibling);
  });

  const stationNodes = STATIONS.map((s) => nodes[s.id]);
  const stationGlows = STATIONS.map((s) => glows[s.id]);
  let timers = [];

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
      stationNodes.forEach((node, i) => {
        timers.push(window.setTimeout(() => {
          node.classList.add('is-lit');
          stationGlows[i].classList.add('is-lit');
        }, 150 + i * 220));
      });
    }, 2200));

    timers.push(window.setTimeout(() => {
      ts.classList.add('is-done');
      round.textContent = 'AGREED';
      startBtn.innerHTML = '<span>✓</span> 协议达成 · 92%';
      startBtn.classList.add('is-done');
      consensus.classList.add('is-in');
      activate('all');
      window.dispatchEvent(new CustomEvent('pt:done'));
    }, 4400));
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
    idle.textContent = '8 个基站已布点 · 点击开始，电力按协议在网络中流动';
    lines.append(idle);
    document.querySelectorAll('.ts-agent').forEach((a) => a.classList.remove('is-active', 'is-agree'));
    stationNodes.forEach((n) => n.classList.remove('is-lit'));
    stationGlows.forEach((g) => g.classList.remove('is-lit'));
  }

  startBtn.addEventListener('click', () => {
    if (ts.classList.contains('is-done')) reset();
    else startDemo();
  });

  if (location.search.includes('play=1')) {
    window.setTimeout(startDemo, 600);
  }
})();
