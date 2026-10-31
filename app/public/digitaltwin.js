/* 数字孪生：谈判过程中的电力流动可视化 */
(function () {
  'use strict';

  const LABELS = {
    0: { pv: '250 kWh 富余', storage: '待机', factory: '80–120 kW', grid: '≤120 kW', state: '等待谈判', hub: '250 kWh' },
    1: { pv: '250 kWh 富余', storage: '待机', factory: '要低价', grid: '弃光风险 250 kWh', state: 'Round 1 · 亮底牌', hub: '250 kWh' },
    2: { pv: '250 kWh', storage: '充电 250 kWh', factory: '移峰 10%', grid: '峰荷 ≤120 kW', state: 'Round 2 · 互相让步', hub: '充 250' },
    3: { pv: '250 kWh', storage: '放电 350 kWh', factory: '-12%', grid: '-15%', state: 'Round 3 · 协议达成', hub: '放 350' }
  };

  const NS = 'http://www.w3.org/2000/svg';
  const pathPv = 'M 280 67 C 360 67, 400 118, 436 145';
  const pathStorage = 'M 436 175 C 400 202, 360 253, 280 253';
  const pathFactory = 'M 524 145 C 560 118, 600 67, 680 67';
  const pathGrid = 'M 524 175 C 560 202, 600 253, 680 253';

  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  function node(parent, x, y, cls, title, valueId) {
    const g = el('g', { class: 'dt-node ' + cls }, parent);
    el('rect', { x, y, width: 180, height: 56, rx: 12 }, g);
    const t = el('text', { x: x + 16, y: y + 23, class: 'dt-node-title' }, g);
    t.textContent = title;
    const v = el('text', { x: x + 16, y: y + 43, class: 'dt-node-value', id: valueId }, g);
    v.textContent = '—';
    return g;
  }

  function particle(parent, path, begin) {
    const c = el('circle', { r: 4, class: 'dt-particle' }, parent);
    const m = el('animateMotion', {
      dur: '2.4s', repeatCount: 'indefinite', begin: begin, path: path
    }, c);
    m.setAttribute('path', path);
    return c;
  }

  function build(host) {
    const svg = el('svg', {
      viewBox: '0 0 960 320', role: 'img',
      'aria-label': '数字孪生：电力流动', class: 'dt-svg'
    }, host);

    const defs = el('defs', {}, svg);
    const grad = el('radialGradient', { id: 'dtHub' }, defs);
    el('stop', { offset: '0%', 'stop-color': '#38e0b0', 'stop-opacity': '.55' }, grad);
    el('stop', { offset: '100%', 'stop-color': '#38e0b0', 'stop-opacity': '0' }, grad);
    const glow = el('filter', { id: 'dtGlow', x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs);
    el('feGaussianBlur', { stdDeviation: '4', result: 'b' }, glow);
    const merge = el('feMerge', {}, glow);
    el('feMergeNode', { in: 'b' }, merge);
    el('feMergeNode', { in: 'SourceGraphic' }, merge);

    el('circle', { cx: 480, cy: 160, r: 110, fill: 'url(#dtHub)' }, svg);

    const paths = [
      ['pv-to-hub', pathPv], ['hub-to-storage', pathStorage],
      ['hub-to-factory', pathFactory], ['hub-to-grid', pathGrid]
    ];
    paths.forEach(([cls, d]) => {
      el('path', { d, class: 'dt-path ' + cls }, svg);
      particle(svg, d, '0s');
      particle(svg, d, '1.2s');
    });

    // 节点
    node(svg, 100, 40, 'pv', '光伏代理', 'dt-value-pv');
    node(svg, 100, 226, 'storage', '储能代理', 'dt-value-storage');
    node(svg, 680, 40, 'factory', '工厂代理', 'dt-value-factory');
    node(svg, 680, 226, 'grid', '电网代理', 'dt-value-grid');

    // 中心能源总线
    const hub = el('g', { class: 'dt-hub' }, svg);
    el('circle', { cx: 480, cy: 160, r: 48, filter: 'url(#dtGlow)' }, hub);
    el('circle', { cx: 480, cy: 160, r: 42, fill: '#0d1117', stroke: '#38e0b0', 'stroke-width': 2 }, hub);
    const hubTitle = el('text', { x: 480, y: 152, 'text-anchor': 'middle', class: 'dt-hub-title' }, hub);
    hubTitle.textContent = '能源总线';
    const hubValue = el('text', { x: 480, y: 174, 'text-anchor': 'middle', class: 'dt-hub-value', id: 'dt-hub-value' }, hub);
    hubValue.textContent = '250 kWh';

    // 路径旁标签
    const tag = (x, y, id, cls) => {
      const t = el('text', { x, y, 'text-anchor': 'middle', class: 'dt-tag ' + cls, id }, svg);
      t.textContent = '—';
      return t;
    };
    tag(352, 92, 'dt-tag-pv', 'pv');
    tag(352, 238, 'dt-tag-storage', 'storage');
    tag(612, 92, 'dt-tag-factory', 'factory');
    tag(612, 238, 'dt-tag-grid', 'grid');

    return svg;
  }

  function setRound(svg, round) {
    const r = Math.max(0, Math.min(3, Number(round) || 0));
    svg.classList.remove('dt-r0', 'dt-r1', 'dt-r2', 'dt-r3');
    svg.classList.add('dt-r' + r);
    const l = LABELS[r];
    ['pv', 'storage', 'factory', 'grid'].forEach((k) => {
      const v = svg.querySelector('#dt-value-' + k);
      const t = svg.querySelector('#dt-tag-' + k);
      if (v) v.textContent = l[k];
      if (t) t.textContent = l[k];
    });
    const hub = svg.querySelector('#dt-hub-value');
    if (hub) hub.textContent = l.hub;
    const state = document.getElementById('dt-state');
    if (state) state.textContent = l.state;
  }

  function mount() {
    if (document.getElementById('digitaltwin')) return;
    const pt = document.getElementById('powertable');
    if (!pt) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/digitaltwin.css';
    document.head.appendChild(link);

    const section = document.createElement('section');
    section.id = 'digitaltwin';
    section.className = 'dt';
    section.innerHTML = [
      '<div class="dt-head">',
      '  <div><p class="dt-eyebrow">DIGITAL TWIN / POWER FLOW</p><h3>数字孪生 · 电力流动</h3></div>',
      '  <span class="dt-state" id="dt-state">等待谈判</span>',
      '</div>',
      '<div class="dt-chart" id="dt-chart"></div>',
      '<div class="dt-legend">',
      '  <span><i class="dot pv"></i>光伏</span>',
      '  <span><i class="dot storage"></i>储能</span>',
      '  <span><i class="dot factory"></i>工厂</span>',
      '  <span><i class="dot grid"></i>电网</span>',
      '  <span class="dt-note">流线 = 电力流向 · 谈判每推进一步，流线重排</span>',
      '</div>'
    ].join('');
    const anchor = pt.querySelector('.pt-arena');
    pt.insertBefore(section, anchor);
    const svg = build(section.querySelector('#dt-chart'));
    setRound(svg, 0);

    window.addEventListener('pt:round', (e) => setRound(svg, e.detail.round));
    window.addEventListener('pt:done', () => setRound(svg, 3));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
