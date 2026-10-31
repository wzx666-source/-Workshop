/* 储智 · 24h 调度沙盘 —— 独立组件，自动挂载，不依赖 app.js */
(function () {
  'use strict';

  const DEMO = {
    hours: Array.from({ length: 25 }, (_, i) => i),
    price: [0.35,0.35,0.35,0.35,0.35,0.35,0.35,0.35, 1.05,1.05,1.05, 0.65,0.65,0.65, 1.05,1.05,1.05,1.05, 1.20,1.20,1.20,1.20, 0.45,0.45,0.45],
    pv:    [0,0,0,0,0,0,0,0,0,50,150,160,170,150,120,60,20,0,0,0,0,0,0,0,0],
    load:  [80,80,80,80,80,80,80,80,100,100,80,80,80,80,100,100,100,100,120,120,120,120,80,80,80],
    battery:[100,0,0,0,0,0,0,0,0,0,70,80,90,10,0,0,0,0,-100,-100,-100,-50,0,0,0],
    soc:   [20,40,40,40,40,40,40,40,40,40,54,70,88,90,90,90,90,90,70,50,30,20,20,20,20],
    kpis: { baseline: 297.5, ai: 385, savings: 87.5, pvUsed: 250, constraints: '3/3' }
  };

  const NS = 'http://www.w3.org/2000/svg';
  const M = { left: 56, right: 64, top: 26, bottom: 36, gap: 22, topH: 180, botH: 92, width: 960 };
  const PLOT_W = M.width - M.left - M.right;
  const TOP_BOTTOM = M.top + M.topH;
  const BOT_TOP = TOP_BOTTOM + M.gap;
  const BOT_BOTTOM = BOT_TOP + M.botH;
  const H = BOT_BOTTOM + M.bottom;

  const x = (h) => M.left + (h / 24) * PLOT_W;
  const yKW = (v) => TOP_BOTTOM - (v / 200) * M.topH;
  const ySOC = (v) => BOT_BOTTOM - (v / 100) * M.botH;
  const barW = PLOT_W / 24;

  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  function txt(parent, x0, y0, str, attrs) {
    const t = el('text', Object.assign({
      x: x0, y: y0, fill: '#8b97a8', 'font-size': 11,
      'font-family': 'ui-monospace, SFMono-Regular, Menlo, monospace'
    }, attrs || {}), parent);
    t.textContent = str;
    return t;
  }

  function priceColor(p) {
    if (p <= 0.5) return '#38e0b0';
    if (p <= 0.9) return '#ffd166';
    return '#ff6b6b';
  }

  function fmtTime(t) {
    const h = Math.floor(t) % 24;
    const m = Math.round((t - Math.floor(t)) * 60);
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  }

  function socAt(t) {
    const i = Math.min(23, Math.floor(t));
    const f = t - i;
    return DEMO.soc[i] * (1 - f) + DEMO.soc[i + 1] * f;
  }

  function actionAt(t) {
    const i = Math.min(23, Math.floor(t));
    const v = DEMO.battery[i];
    if (v > 0) return { text: '充电 ' + v + ' kW', cls: 'charge' };
    if (v < 0) return { text: '放电 ' + (-v) + ' kW', cls: 'discharge' };
    return { text: '待机', cls: 'idle' };
  }

  function buildChart(host) {
    const svg = el('svg', {
      viewBox: '0 0 ' + M.width + ' ' + H,
      role: 'img',
      'aria-label': '储智 24 小时调度沙盘',
      class: 'sb-svg'
    }, host);

    const defs = el('defs', {}, svg);
    const pvGrad = el('linearGradient', { id: 'sbPv', x1: '0', y1: '0', x2: '0', y2: '1' }, defs);
    el('stop', { offset: '0%', 'stop-color': '#ffd166', 'stop-opacity': '.55' }, pvGrad);
    el('stop', { offset: '100%', 'stop-color': '#ffd166', 'stop-opacity': '.04' }, pvGrad);
    const socGrad = el('linearGradient', { id: 'sbSoc', x1: '0', y1: '0', x2: '0', y2: '1' }, defs);
    el('stop', { offset: '0%', 'stop-color': '#5ad1ff', 'stop-opacity': '.34' }, socGrad);
    el('stop', { offset: '100%', 'stop-color': '#5ad1ff', 'stop-opacity': '.02' }, socGrad);
    const glow = el('filter', { id: 'sbGlow', x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs);
    el('feGaussianBlur', { stdDeviation: '3', result: 'b' }, glow);
    const merge = el('feMerge', {}, glow);
    el('feMergeNode', { in: 'b' }, merge);
    el('feMergeNode', { in: 'SourceGraphic' }, merge);

    // 电价背景带
    for (let h = 0; h < 24; h += 1) {
      el('rect', {
        x: x(h), y: M.top, width: barW + 0.5, height: BOT_BOTTOM - M.top,
        fill: priceColor(DEMO.price[h]), opacity: '.085'
      }, svg);
    }

    // 重点区域
    el('rect', {
      x: x(10), y: M.top, width: x(14) - x(10), height: BOT_BOTTOM - M.top,
      fill: '#ffd166', opacity: '.07', rx: 6
    }, svg);
    el('rect', {
      x: x(18), y: M.top, width: x(22) - x(18), height: BOT_BOTTOM - M.top,
      fill: '#ff6b6b', opacity: '.07', rx: 6
    }, svg);

    function regionLabel(cx, y, str, color) {
      const w = str.length * 7 + 20;
      el('rect', {
        x: cx - w / 2, y: y - 14, width: w, height: 20, rx: 10,
        fill: 'rgba(10,12,16,.72)'
      }, svg);
      txt(svg, cx, y, str, {
        'text-anchor': 'middle', fill: color, 'font-size': 12, 'font-weight': 600
      });
    }
    regionLabel(x(12), M.top + 18, '光伏富余 · 消纳 250 kWh', '#ffd166');
    regionLabel(x(20), M.top + 18, '晚高峰 · 放电 350 kWh', '#ff8a8a');

    // 网格
    [0, 100, 200].forEach((v) => {
      el('line', { x1: M.left, x2: M.left + PLOT_W, y1: yKW(v), y2: yKW(v), stroke: 'rgba(242,239,230,.08)' }, svg);
      txt(svg, M.left - 10, yKW(v) + 4, String(v), { 'text-anchor': 'end' });
    });
    [0, 50, 100].forEach((v) => {
      el('line', { x1: M.left, x2: M.left + PLOT_W, y1: ySOC(v), y2: ySOC(v), stroke: 'rgba(242,239,230,.07)' }, svg);
      txt(svg, M.left + PLOT_W + 10, ySOC(v) + 4, String(v) + '%', { 'text-anchor': 'start' });
    });
    txt(svg, M.left + PLOT_W - 6, M.top - 10, 'kW', { 'text-anchor': 'end', fill: '#66707f' });
    txt(svg, M.left + PLOT_W - 6, TOP_BOTTOM - 4, '电池 ±100 kW', { 'text-anchor': 'end', fill: '#66707f', 'font-size': 10 });
    // 光伏面积
    const pvPts = DEMO.hours.map((h) => x(h) + ',' + yKW(DEMO.pv[h])).join(' ');
    el('polygon', {
      points: M.left + ',' + yKW(0) + ' ' + pvPts + ' ' + (M.left + PLOT_W) + ',' + yKW(0),
      fill: 'url(#sbPv)', stroke: '#ffd166', 'stroke-width': 1.4, 'stroke-opacity': '.8'
    }, svg);

    // 负荷曲线
    el('polyline', {
      points: DEMO.hours.map((h) => x(h) + ',' + yKW(DEMO.load[h])).join(' '),
      fill: 'none', stroke: '#5ad1ff', 'stroke-width': 2.2, 'stroke-linejoin': 'round'
    }, svg);

    // 电池充放柱（上充下放）
    el('line', {
      x1: M.left, x2: M.left + PLOT_W, y1: TOP_BOTTOM, y2: TOP_BOTTOM,
      stroke: 'rgba(242,239,230,.28)', 'stroke-width': 1.5
    }, svg);
    for (let h = 0; h < 24; h += 1) {
      const v = DEMO.battery[h];
      if (v === 0) continue;
      const bh = Math.abs(v) / 100 * 18;
      el('rect', {
        x: x(h) + 2, y: v > 0 ? TOP_BOTTOM - bh : TOP_BOTTOM,
        width: Math.max(2, barW - 4), height: bh,
        fill: v > 0 ? '#38e0b0' : '#ff9f43', opacity: '.85', rx: 2
      }, svg);
    }

    // SOC 面积 + 曲线
    const socPts = DEMO.hours.map((h) => x(h) + ',' + ySOC(DEMO.soc[h])).join(' ');
    el('polygon', {
      points: M.left + ',' + ySOC(0) + ' ' + socPts + ' ' + (M.left + PLOT_W) + ',' + ySOC(0),
      fill: 'url(#sbSoc)'
    }, svg);
    el('polyline', {
      points: socPts, fill: 'none', stroke: '#5ad1ff', 'stroke-width': 2,
      'stroke-dasharray': '5 4', 'stroke-linejoin': 'round'
    }, svg);

    // X 轴
    [0, 4, 8, 12, 16, 20, 24].forEach((h) => {
      el('line', { x1: x(h), x2: x(h), y1: M.top, y2: BOT_BOTTOM, stroke: 'rgba(242,239,230,.05)' }, svg);
      txt(svg, x(h), BOT_BOTTOM + 18, String(h).padStart(2, '0') + ':00', { 'text-anchor': 'middle' });
    });

    // 时间游标
    const cursor = el('g', { class: 'sb-cursor' }, svg);
    const cursorLine = el('line', {
      x1: x(0), x2: x(0), y1: M.top, y2: BOT_BOTTOM,
      stroke: '#f2efe6', 'stroke-width': 1.6, 'stroke-opacity': '.9', filter: 'url(#sbGlow)'
    }, cursor);
    const cursorDot = el('circle', { cx: x(0), cy: ySOC(DEMO.soc[0]), r: 5, fill: '#f2efe6', stroke: '#5ad1ff', 'stroke-width': 2 }, cursor);
    const cursorTag = el('g', {}, cursor);
    const tagBg = el('rect', { x: x(0) - 24, y: M.top - 22, width: 48, height: 18, rx: 9, fill: '#f2efe6' }, cursorTag);
    const tagText = txt(cursorTag, x(0), M.top - 9, '00:00', { 'text-anchor': 'middle', fill: '#14140f', 'font-size': 10, 'font-weight': 700 });

    // KPI 引用
    const refs = {
      time: document.getElementById('sb-time'),
      action: document.getElementById('sb-action'),
      soc: document.getElementById('sb-soc'),
      money: document.getElementById('sb-money'),
      badge: document.getElementById('sb-badge'),
    };

    function setCursor(t) {
      const px = x(t);
      const sy = ySOC(socAt(t));
      cursorLine.setAttribute('x1', px); cursorLine.setAttribute('x2', px);
      cursorDot.setAttribute('cx', px); cursorDot.setAttribute('cy', sy);
      tagBg.setAttribute('x', px - 24); tagText.setAttribute('x', px);
      const label = fmtTime(t);
      tagText.textContent = label;
      if (refs.time) refs.time.textContent = label;
      const act = actionAt(t);
      if (refs.action) {
        refs.action.textContent = act.text;
        refs.action.className = act.cls;
      }
      if (refs.soc) refs.soc.textContent = Math.round(socAt(t)) + '%';
      const money = DEMO.kpis.savings * (t / 24);
      if (refs.money) refs.money.textContent = '¥' + money.toFixed(1);
    }

    let raf = 0;
    function play() {
      cancelAnimationFrame(raf);
      const start = performance.now();
      const dur = 8000;
      const step = (now) => {
        const t = Math.min(24, ((now - start) / dur) * 24);
        setCursor(t);
        if (t < 24) raf = requestAnimationFrame(step);
        else if (refs.money) refs.money.classList.add('hot');
      };
      raf = requestAnimationFrame(step);
    }

    setCursor(0);
    const btn = document.getElementById('sb-play');
    if (btn) btn.addEventListener('click', () => {
      if (refs.money) refs.money.classList.remove('hot');
      play();
    });
  }

  function mount() {
    if (document.getElementById('sandbox')) return;
    const shell = document.querySelector('main.shell');
    if (!shell) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/sandbox.css';
    document.head.appendChild(link);

    const section = document.createElement('section');
    section.id = 'sandbox';
    section.className = 'sandbox';
    section.innerHTML = [
      '<div class="sb-head">',
      '  <div>',
      '    <p class="sb-eyebrow">FINAL AGREEMENT / 24H</p>',
      '    <h2 class="sb-title">协议落地 · 24h 调度沙盘</h2>',
      '    <p class="sb-sub">四方谈判达成的最终调度协议：午间光伏充电、晚高峰放电、工厂移峰。点播放看一天怎么跑。</p>',
      '  </div>',
      '  <button class="sb-play" id="sb-play" type="button">▶ 播放一天</button>',
      '</div>',
      '<div class="sb-chart" id="sb-chart"></div>',
      '<div class="sb-kpis">',
      '  <div class="sb-kpi"><span>当前时刻</span><strong id="sb-time">00:00</strong></div>',
      '  <div class="sb-kpi"><span>电池动作</span><strong id="sb-action">充电 100 kW</strong></div>',
      '  <div class="sb-kpi"><span>SOC</span><strong id="sb-soc">20%</strong></div>',
      '  <div class="sb-kpi"><span>储能日收益</span><strong id="sb-money">¥0.0</strong><em>目标 +¥87.5</em></div>',
      '</div>',
      '<div class="sb-foot">',
      '  <div class="sb-legend">',
      '    <span><i class="dot price"></i>电价背景</span>',
      '    <span><i class="dot pv"></i>光伏</span>',
      '    <span><i class="dot load"></i>负荷</span>',
      '    <span><i class="dot charge"></i>充电</span>',
      '    <span><i class="dot discharge"></i>放电</span>',
      '    <span><i class="dot soc"></i>SOC</span>',
      '  </div>',
      '  <span class="sb-badge" id="sb-badge">光伏消纳 250 kWh · 储能 1.0 次/日 · 共识 92%</span>',
      '</div>',
      '<p class="sb-note">演示场景：晴天午间光伏富余 · 最终协议 · 数字为典型日估算</p>'
    ].join('');
    const anchor = shell.querySelector('.stepper') || shell.querySelector('.grid');
    shell.insertBefore(section, anchor);
    const host = section.querySelector('#sb-chart');
    if (host) buildChart(host);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();

  window.Sandbox = { render: mount };
})();
