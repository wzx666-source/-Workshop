const $ = (id) => document.getElementById(id);

const els = {
  badge: $('mode-badge'),
  modeText: $('mode-text'),
  tag: $('product-tag'),
  input: $('input'),
  counter: $('counter'),
  analyze: $('analyze'),
  error: $('error'),
  outputPanel: $('output-panel'),
  elapsed: $('elapsed'),
  empty: $('empty'),
  emptyTitle: $('empty-title'),
  emptyHint: $('empty-hint'),
  result: $('result'),
  resultTitle: $('result-title'),
  resultSummary: $('result-summary'),
  items: $('items'),
  confirmBar: $('confirm-bar'),
  confirmCount: $('confirm-count'),
  confirm: $('confirm'),
  copy: $('copy'),
  confirmed: $('confirmed'),
  confirmedText: $('confirmed-text'),
  fillExample: $('fill-example'),
  steps: Array.from(document.querySelectorAll('.step')),
};

const state = {
  result: null,
  items: [],
  meta: null,
  loading: false,
};

const EXAMPLE = '电力谈判桌场景：光伏 150 kW（午间富余 250 kWh）、储能 500 kWh（SOC 20%–90%，≤1 次循环/日）、工厂负荷 80–120 kW、电网峰荷上限 120 kW。分时电价：00–08 0.35；08–11 1.05；11–14 0.65；14–18 1.05；18–22 1.20；22–24 0.45。请让四个代理协商今天 6 个时段的调度协议。';

function setBadge(mode, text) {
  els.badge.dataset.mode = mode;
  els.modeText.textContent = text;
}

function setStep(n) {
  for (const step of els.steps) {
    const value = Number(step.dataset.step);
    step.classList.toggle('is-active', value === n);
    step.classList.toggle('is-done', value < n);
  }
}

function showError(message) {
  els.error.textContent = message;
  els.error.hidden = false;
}

function hideError() {
  els.error.hidden = true;
  els.error.textContent = '';
}

function hideConfirmed() {
  if (!els.confirmed.hidden) {
    els.confirmed.hidden = true;
    els.confirm.textContent = '确认并导出';
  }
}

function autosize(el) {
  el.style.height = 'auto';
  el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
}

function updateCounter() {
  els.counter.textContent = `${els.input.value.length} / 8000`;
}

function setLoading(loading) {
  state.loading = loading;
  els.analyze.disabled = loading;
  els.analyze.textContent = loading ? '分析中…' : '开始分析';
  els.analyze.setAttribute('aria-busy', String(loading));
  els.outputPanel.classList.toggle('is-loading', loading);
}

async function loadHealth() {
  try {
    const res = await fetch('/api/health', { cache: 'no-store' });
    const data = await res.json();
    if (data.mode === 'live' && data.hasKey) {
      setBadge('live', `LIVE · ${data.model || '模型'}`);
    } else if (data.mode === 'live') {
      setBadge('live-nokey', 'LIVE · 缺 KEY');
    } else {
      setBadge('demo', 'DEMO · 缓存');
    }
  } catch {
    setBadge('offline', '服务未连接');
  }
}

function renderItem(item, index) {
  const li = document.createElement('li');
  li.className = 'item';

  const label = document.createElement('label');
  label.className = 'check';
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = item.checked;
  checkbox.dataset.i = String(index);
  const box = document.createElement('span');
  box.className = 'box';
  label.append(checkbox, box);

  const body = document.createElement('div');
  body.className = 'item-body';

  const title = document.createElement('h4');
  title.textContent = item.label;
  body.append(title);

  if (item.detail) {
    const detail = document.createElement('p');
    detail.className = 'detail';
    detail.textContent = item.detail;
    body.append(detail);
  }

  const suggestionLabel = document.createElement('label');
  suggestionLabel.className = 'suggestion-label';
  suggestionLabel.textContent = '可编辑建议';
  suggestionLabel.htmlFor = `suggestion-${index}`;

  const suggestion = document.createElement('textarea');
  suggestion.className = 'suggestion';
  suggestion.id = `suggestion-${index}`;
  suggestion.rows = 1;
  suggestion.value = item.text;
  suggestion.dataset.i = String(index);

  body.append(suggestionLabel, suggestion);
  li.append(label, body);
  return li;
}

function renderResult() {
  const result = state.result;
  els.empty.hidden = true;
  els.result.hidden = false;
  els.confirmBar.hidden = false;

  els.resultTitle.textContent = result.title;
  els.resultSummary.textContent = result.summary;
  els.resultSummary.hidden = !result.summary;

  els.items.replaceChildren(...state.items.map(renderItem));
  for (const area of els.items.querySelectorAll('textarea.suggestion')) autosize(area);

  const meta = state.meta || {};
  const elapsed = meta.elapsedMs ? `${(meta.elapsedMs / 1000).toFixed(1)}s` : '';
  const source =
    meta.mode === 'live'
      ? meta.model || 'LIVE'
      : meta.mode === 'fallback'
        ? '接口失败 · 已降级缓存'
        : 'DEMO 缓存';
  els.elapsed.textContent = [elapsed, source].filter(Boolean).join(' · ');
  els.elapsed.classList.toggle('is-warn', meta.mode === 'fallback');

  if (meta.mode === 'live') setBadge('live', `LIVE · ${meta.model || '模型'}`);
  else if (meta.mode === 'fallback') setBadge('fallback', '已降级 · 缓存');
  else setBadge('demo', 'DEMO · 缓存');

  updateConfirmCount();
}

function updateConfirmCount() {
  const chosen = state.items.filter((item) => item.checked).length;
  const total = state.items.length;
  els.confirmCount.textContent = `${chosen} / ${total} 条将进入确认结果`;
  els.confirm.disabled = chosen === 0;
  els.copy.disabled = chosen === 0;
}

function currentMarkdown() {
  const chosen = state.items.filter((item) => item.checked);
  const lines = [`# ${state.result.title}`, ''];

  if (state.result.summary) lines.push(state.result.summary, '');
  lines.push('## 已确认建议', '');

  chosen.forEach((item, index) => {
    lines.push(`### ${index + 1}. ${item.label}`);
    if (item.detail) lines.push('', item.detail);
    const text = item.text.trim();
    if (text) lines.push('', `> ${text.replace(/\n/g, '\n> ')}`);
    lines.push('');
  });

  const source =
    state.meta?.mode === 'live'
      ? `真实 AI（${state.meta.model || '模型'}）`
      : state.meta?.mode === 'fallback'
        ? '接口失败，降级缓存'
        : 'DEMO 缓存';
  lines.push('---', `确认时间：${new Date().toLocaleString('zh-CN', { hour12: false })}`, `来源：${source}`);
  return lines.join('\n');
}

function timestamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

function downloadFile(name, text) {
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function analyze() {
  if (state.loading) return;

  const input = els.input.value.trim();
  if (!input) {
    showError('先输入内容再分析。');
    els.input.focus();
    return;
  }

  hideError();
  hideConfirmed();
  setLoading(true);
  setStep(2);

  els.empty.hidden = false;
  els.emptyTitle.textContent = 'AI 正在分析…';
  els.emptyHint.textContent = '正在把输入交给模型，请稍候。';
  els.result.hidden = true;
  els.confirmBar.hidden = true;
  els.elapsed.textContent = '';
  els.elapsed.classList.remove('is-warn');

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ input }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error || `请求失败（HTTP ${res.status}）`);
    if (!data?.result?.items?.length) throw new Error('返回结果为空');

    state.result = data.result;
    state.meta = data.meta || {};
    state.items = data.result.items.map((item) => ({
      label: item.label,
      detail: item.detail,
      suggestion: item.suggestion,
      text: item.suggestion,
      checked: true,
    }));

    renderResult();
    setStep(3);
  } catch (err) {
    els.emptyTitle.textContent = '分析未完成';
    els.emptyHint.textContent = '看左侧错误提示。DEMO 模式请点击「填入示例」，真实模式请检查 .env 配置。';
    showError(err.message || '分析失败');
    setStep(1);
  } finally {
    setLoading(false);
  }
}

function handleConfirm() {
  const chosen = state.items.filter((item) => item.checked);
  if (!chosen.length) {
    showError('至少勾选一条建议再确认。');
    return;
  }

  hideError();
  downloadFile(`workshop-result-${timestamp()}.md`, currentMarkdown());

  els.confirmed.hidden = false;
  els.confirmedText.textContent = `已导出 ${chosen.length} 条你确认后的建议（${new Date().toLocaleTimeString('zh-CN', { hour12: false })}）。`;
  els.confirm.textContent = '再次导出';
}

async function handleCopy() {
  if (!state.items.some((item) => item.checked)) {
    showError('至少勾选一条建议再复制。');
    return;
  }
  try {
    await navigator.clipboard.writeText(currentMarkdown());
    const previous = els.copy.textContent;
    els.copy.textContent = '已复制';
    setTimeout(() => { els.copy.textContent = previous; }, 1500);
  } catch {
    showError('浏览器不允许剪贴板，请用「确认并导出」。');
  }
}

els.analyze.addEventListener('click', analyze);
els.confirm.addEventListener('click', handleConfirm);
els.copy.addEventListener('click', handleCopy);

els.fillExample.addEventListener('click', () => {
  els.input.value = EXAMPLE;
  updateCounter();
  els.input.focus();
});

els.input.addEventListener('input', () => {
  updateCounter();
  hideError();
});

els.input.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault();
    analyze();
  }
});

els.items.addEventListener('change', (event) => {
  const checkbox = event.target.closest('input[type="checkbox"]');
  if (!checkbox) return;
  const index = Number(checkbox.dataset.i);
  state.items[index].checked = checkbox.checked;
  checkbox.closest('.item').classList.toggle('is-off', !checkbox.checked);
  updateConfirmCount();
  hideConfirmed();
});

els.items.addEventListener('input', (event) => {
  const area = event.target.closest('textarea.suggestion');
  if (!area) return;
  state.items[Number(area.dataset.i)].text = area.value;
  autosize(area);
  hideConfirmed();
});

loadHealth();
updateCounter();
setStep(1);
