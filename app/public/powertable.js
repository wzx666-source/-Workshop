/* 电力谈判桌 —— 四方代理协商可视化，独立挂载 */
(function () {
  'use strict';

  const AGENTS = [
    { id: 'pv', name: '光伏代理', tag: 'PV', objective: '多消纳、少弃光', redline: '弃光尽量为 0', position: '午间 250 kWh 全部消纳', gain: '弃光 250→0 kWh' },
    { id: 'storage', name: '储能代理', tag: 'ESS', objective: '收益与寿命平衡', redline: 'SOC 20–90%，≤1 次循环/日', position: '午间充、晚高峰放', gain: '日收益 +87.5 元' },
    { id: 'factory', name: '工厂代理', tag: 'LOAD', objective: '用电成本最低', redline: '产量不下降', position: '要求午间低价电', gain: '电费 -12%' },
    { id: 'grid', name: '电网代理', tag: 'GRID', objective: '安全稳定', redline: '峰荷 ≤120 kW', position: '限制晚高峰放电', gain: '峰荷 -15%' }
  ];

  const ROUNDS = [
    { round: 1, title: '亮底牌', messages: [
      ['pv', '午间富余 250 kWh，希望全部消纳，不要弃光。'],
      ['storage', '可以充，但一天只能一次循环，18–22 点必须放。'],
      ['factory', '午间电价 0.65 还是贵，能不能再低？'],
      ['grid', '晚高峰负荷不能超过 120 kW。']
    ] },
    { round: 2, title: '互相让步', messages: [
      ['storage', '接受午间充 250 kWh，18–22 点只放 350 kWh。'],
      ['factory', '工厂愿意把 10% 负荷移到午间。'],
      ['grid', '峰荷上限 120 kW；工厂移峰后可放行。'],
      ['pv', '同意优先给储能充电，余量上网。']
    ] },
    { round: 3, title: '达成协议', messages: [
      ['mediator', '协议：午间光伏充 250 kWh；18–22 放电 350 kWh；工厂移峰 10%；峰荷 ≤120 kW。'],
      ['all', '4/4 同意，共识度 92%。']
    ] }
  ];

  const METRICS = [
    ['光伏消纳', '+250 kWh'],
    ['储能循环', '1.0 次/日'],
    ['工厂电费', '-12%'],
    ['电网峰荷', '-15%'],
    ['共识度', '92%']
  ];

  const NAME = { pv: '光伏', storage: '储能', factory: '工厂', grid: '电网', mediator: '调度员', all: '四方' };

  function esc(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  function mount() {
    if (document.getElementById('powertable')) return;
    const shell = document.querySelector('main.shell');
    if (!shell) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/powertable.css';
    document.head.appendChild(link);

    const section = document.createElement('section');
    section.id = 'powertable';
    section.className = 'pt';

    const agentsHtml = AGENTS.map((a) => [
      '<article class="pt-agent ' + a.id + '">',
      '  <div class="pt-agent-top"><span class="pt-icon">' + a.tag + '</span><h3>' + a.name + '</h3></div>',
      '  <p class="pt-goal">' + a.objective + '</p>',
      '  <p class="pt-line"><b>红线</b>' + a.redline + '</p>',
      '  <p class="pt-line"><b>立场</b>' + a.position + '</p>',
      '  <p class="pt-gain">' + a.gain + '</p>',
      '</article>'
    ].join('')).join('');

    const roundsHtml = ROUNDS.map((r) => [
      '<div class="pt-round is-hidden" data-round="' + r.round + '">',
      '  <div class="pt-round-head"><span>ROUND ' + r.round + '</span><h4>' + r.title + '</h4></div>',
      r.messages.map(([who, text]) => [
        '<div class="pt-msg ' + who + '">',
        '  <span class="pt-who">' + (NAME[who] || who) + '</span>',
        '  <p>' + esc(text) + '</p>',
        '</div>'
      ].join('')).join(''),
      '</div>'
    ].join('')).join('');

    const metricsHtml = METRICS.map(([k, v]) => '<div class="pt-metric"><span>' + k + '</span><strong>' + v + '</strong></div>').join('');

    section.innerHTML = [
      '<div class="pt-head">',
      '  <div>',
      '    <p class="pt-eyebrow">MULTI-AGENT NEGOTIATION / 3 ROUNDS</p>',
      '    <h2 class="pt-title">电力谈判桌</h2>',
      '    <p class="pt-sub">光伏要消纳、储能保寿命、工厂降成本、电网保安全。四个 AI 代理自主协商，人只做最终确认。</p>',
      '  </div>',
      '  <button class="pt-play" id="pt-play" type="button">▶ 开始谈判</button>',
      '</div>',
      '<div class="pt-agents">' + agentsHtml + '</div>',
      '<div class="pt-arena">',
      '  <div class="pt-consensus" id="pt-consensus">',
      '    <span class="pt-consensus-label">等待谈判</span>',
      '    <strong>—</strong>',
      '    <span class="pt-consensus-sub">四方尚未达成协议</span>',
      '  </div>',
      '  <div class="pt-rounds" id="pt-rounds">' + roundsHtml + '</div>',
      '</div>',
      '<div class="pt-metrics is-hidden" id="pt-metrics">' + metricsHtml + '</div>',
      '<p class="pt-note">演示场景：晴天午间光伏富余 · 3 轮协商 · 数字为典型日估算</p>'
    ].join('');

    const anchor = document.getElementById('sandbox') || shell.querySelector('.stepper') || shell.querySelector('.grid');
    shell.insertBefore(section, anchor);

    const btn = section.querySelector('#pt-play');
    const rounds = Array.from(section.querySelectorAll('.pt-round'));
    const consensus = section.querySelector('#pt-consensus');
    const metrics = section.querySelector('#pt-metrics');

    const isDemo = location.search.includes('pt=play');
    if (isDemo) document.body.classList.add('pt-demo');
    if (isDemo) {
      window.setTimeout(() => btn.click(), 700);
    }

    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      btn.disabled = true;
      btn.textContent = '谈判中…';
      rounds.forEach((r, i) => {
        window.setTimeout(() => {
          r.classList.remove('is-hidden');
          requestAnimationFrame(() => r.classList.add('is-in'));
          window.dispatchEvent(new CustomEvent('pt:round', { detail: { round: Number(r.dataset.round) } }));
        }, 500 + i * 900);
      });
      window.setTimeout(() => {
        consensus.classList.add('is-done');
        consensus.querySelector('.pt-consensus-label').textContent = '协议达成';
        consensus.querySelector('strong').textContent = '92%';
        consensus.querySelector('.pt-consensus-sub').textContent = '4/4 代理同意 · 方案可执行';
        metrics.classList.remove('is-hidden');
        metrics.classList.add('is-in');
        btn.textContent = '协议已达成';
        window.dispatchEvent(new CustomEvent('pt:done'));
        let toast = document.getElementById('pt-toast');
        if (!toast) {
          toast = document.createElement('div');
          toast.id = 'pt-toast';
          toast.className = 'pt-toast';
          toast.innerHTML = '<b>92%</b><span>协议达成 · 4/4 代理同意</span>';
          document.body.appendChild(toast);
        }
        toast.classList.add('is-in');
      }, 500 + rounds.length * 900 + 200);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
