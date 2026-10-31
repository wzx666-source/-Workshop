/* 人工调度 vs AI 调度：同一典型日的对比 */
(function () {
  'use strict';

  const ROWS = [
    ['决策耗时', '40 分钟', '3 轮 · 秒级'],
    ['光伏弃光', '250 kWh', '0 kWh'],
    ['储能循环', '1.4 次/日', '1.0 次/日'],
    ['工厂电费', '基线', '-12%'],
    ['电网峰荷', '140 kW', '119 kW（-15%）'],
    ['四方满意度', '2/4', '4/4 · 共识 92%'],
    ['决策依据', '经验拍板', '每轮理由可追溯']
  ];

  function mount() {
    if (document.getElementById('compare')) return;
    const shell = document.querySelector('main.shell');
    if (!shell) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/compare.css';
    document.head.appendChild(link);

    const section = document.createElement('section');
    section.id = 'compare';
    section.className = 'cmp';

    const rowsHtml = ROWS.map(([label, human, ai]) => [
      '<div class="cmp-row">',
      '  <span class="cmp-human">' + human + '</span>',
      '  <span class="cmp-label">' + label + '</span>',
      '  <strong class="cmp-ai">' + ai + '</strong>',
      '</div>'
    ].join('')).join('');

    section.innerHTML = [
      '<div class="cmp-head">',
      '  <div>',
      '    <p class="cmp-eyebrow">HUMAN VS AI / SAME DAY</p>',
      '    <h2 class="cmp-title">人工调度 vs AI 调度</h2>',
      '    <p class="cmp-sub">同一个典型日：人工靠经验拍板，AI 用 3 轮谈判让四方同时改善。</p>',
      '  </div>',
      '  <span class="cmp-badge">典型日仿真</span>',
      '</div>',
      '<div class="cmp-bars">',
      '  <div class="cmp-bar-row"><span>人工</span><div class="cmp-bar human"><i></i></div><b>40 分钟</b></div>',
      '  <div class="cmp-bar-row"><span>AI</span><div class="cmp-bar ai"><i></i></div><b>3 轮 · 秒级</b></div>',
      '</div>',
      '<div class="cmp-heads">',
      '  <span class="cmp-human">人工调度（现状）</span>',
      '  <span>指标</span>',
      '  <span class="cmp-ai">AI 调度 · 电力谈判桌</span>',
      '</div>',
      '<div class="cmp-rows">' + rowsHtml + '</div>',
      '<p class="cmp-foot">人工只能顾 1–2 方；AI 让光伏、储能、工厂、电网同时改善，而且每一轮让步都有记录。耗时条为示意。</p>'
    ].join('');

    const anchor = document.getElementById('sandbox');
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(section, anchor);
    else {
      const pt = document.getElementById('powertable');
      if (pt) pt.parentNode.insertBefore(section, pt.nextSibling);
      else shell.appendChild(section);
    }

    window.addEventListener('pt:done', () => {
      section.classList.add('is-ai');
      const badge = section.querySelector('.cmp-badge');
      if (badge) badge.textContent = 'AI 已完成 3 轮谈判';
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
