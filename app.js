/* 나의 숲 — 기록장 */
'use strict';

/* ───────── helpers ───────── */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const pad = (n) => String(n).padStart(2, '0');
const WD = ['일', '월', '화', '수', '목', '금', '토'];
const dkey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hhmm = (d = new Date()) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const parseKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

const KEY = 'grove-data-v1';
const ICONS = ['💭', '📝', '🎯', '🌱', '📚', '💡', '✏️', '📅', '🗂️', '🧠', '💼', '🏃', '🧘', '💧', '🍎', '💤', '🎵', '🎨', '✈️', '🏠', '💰', '❤️', '🙏', '⭐', '🔥', '🌿', '☕', '🧪', '📖', '🛒', '🎁', '📌'];
const TYPES = {
  memo: { icon: '📝', label: '메모', desc: '생각 정리 · 기록' },
  plan: { icon: '🎯', label: '계획', desc: '할 일 · 목표' },
  routine: { icon: '🌱', label: '매일 루틴', desc: '반복 · 체크' },
};

const svgCheck = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const svgBack = '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const svgTrash = '<svg viewBox="0 0 24 24" width="19" height="19"><path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const svgPin = (on) => `<svg viewBox="0 0 24 24" width="19" height="19"><path d="M9 3h6l-1 6 4 4H6l4-4-1-6zM12 13v8" fill="${on ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
const svgMore = '<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="5" cy="12" r="1.8" fill="currentColor"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/><circle cx="19" cy="12" r="1.8" fill="currentColor"/></svg>';
const svgLeaf = '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 21v-8" stroke="#1C3528" stroke-width="2" stroke-linecap="round"/><path d="M12 13c0-4 2.5-7 7-7 0 4.5-3 7-7 7z" fill="#1C3528"/><path d="M12 15c0-3.3-2.2-5.5-6-5.5 0 3.5 2.4 5.5 6 5.5z" fill="#3F7454"/></svg>';

/* ───────── state ───────── */
let S = load();
let view = { name: 'today' };
let installEvt = null;

function seed() {
  const s = (name, icon, type) => ({ id: uid(), name, icon, type, created: Date.now() });
  const think = s('생각 정리', '💭', 'memo');
  const memo = s('메모', '📝', 'memo');
  const plan = s('계획', '🎯', 'plan');
  const routine = s('매일 루틴', '🌱', 'routine');
  const now = Date.now();
  return {
    v: 1,
    sections: [think, memo, plan, routine],
    memos: [
      {
        id: uid(), sectionId: think.id, pinned: true, created: now, updated: now,
        title: '나의 숲 사용법 🌿',
        body: '• 왼쪽 메뉴의 "섹션 +" 로 원하는 만큼 공간을 만들 수 있어요.\n  - 메모형: 생각 정리, 일기, 아이디어\n  - 계획형: 할 일, 목표, 프로젝트\n  - 루틴형: 매일/요일별 반복 습관\n\n• 루틴에 시간을 정하고 설정에서 알림을 켜면 그 시간에 알려드려요.\n• 휴대폰 브라우저에서 "홈 화면에 추가"하면 앱처럼 쓸 수 있어요.\n\n이 메모는 지워도 괜찮아요.',
      },
    ],
    plans: [
      { id: uid(), sectionId: plan.id, title: '나의 숲 둘러보기', note: '', due: dkey(), priority: 1, done: false, created: now,
        steps: [{ id: uid(), text: '섹션 하나 만들어보기', done: false }, { id: uid(), text: '루틴 체크해보기', done: false }, { id: uid(), text: '알림 켜기', done: false }] },
    ],
    routines: [
      { id: uid(), sectionId: routine.id, name: '물 한 잔 마시기', icon: '💧', time: '08:00', days: [0, 1, 2, 3, 4, 5, 6], created: now },
      { id: uid(), sectionId: routine.id, name: '하루 돌아보기', icon: '✏️', time: '22:00', days: [0, 1, 2, 3, 4, 5, 6], created: now },
    ],
    checks: {},
    settings: { notify: false, remindAt: '21:00', remind: true, notified: {} },
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return normalize(JSON.parse(raw));
  } catch (e) { console.warn(e); }
  return seed();
}
function normalize(d) {
  d.sections ||= []; d.memos ||= []; d.plans ||= []; d.routines ||= []; d.checks ||= {};
  d.settings = Object.assign({ notify: false, remindAt: '21:00', remind: true, notified: {} }, d.settings || {});
  return d;
}

let saveTimer;
function save(quiet) {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('저장 공간이 부족해요'); }
  clearTimeout(saveTimer);
  saveTimer = setTimeout(syncSchedule, 400);
  if (!quiet) renderSidebar();
}

/* ───────── routines logic ───────── */
const isOn = (r, d = new Date()) => r.days.includes(d.getDay());
const isChecked = (rid, k = dkey()) => (S.checks[k] || []).includes(rid);
function toggleCheck(rid, k = dkey()) {
  const arr = S.checks[k] || (S.checks[k] = []);
  const i = arr.indexOf(rid);
  if (i >= 0) arr.splice(i, 1); else arr.push(rid);
  if (!arr.length) delete S.checks[k];
  save();
  return i < 0;
}
function streak(r) {
  let d = new Date(); let n = 0;
  if (!isChecked(r.id, dkey(d))) d = addDays(d, -1);
  const createdDay = new Date(r.created); createdDay.setHours(0, 0, 0, 0);
  for (let i = 0; i < 400; i++) {
    if (d < createdDay) break;
    if (isOn(r, d)) { if (isChecked(r.id, dkey(d))) n++; else break; }
    d = addDays(d, -1);
  }
  return n;
}
function daysLabel(days) {
  const s = [...days].sort().join('');
  if (s === '0123456') return '매일';
  if (s === '12345') return '평일';
  if (s === '06') return '주말';
  return [1, 2, 3, 4, 5, 6, 0].filter((x) => days.includes(x)).map((x) => WD[x]).join('·');
}
function todayRoutines() {
  const routineSecs = new Set(S.sections.filter((s) => s.type === 'routine').map((s) => s.id));
  return S.routines.filter((r) => routineSecs.has(r.sectionId) && isOn(r)).sort(byTime);
}
const byTime = (a, b) => (a.time || '99:99').localeCompare(b.time || '99:99');

/* ───────── plan helpers ───────── */
function dueLabel(due) {
  if (!due) return '';
  const t = dkey();
  const diff = Math.round((parseKey(due) - parseKey(t)) / 864e5);
  if (diff === 0) return '오늘';
  if (diff === 1) return '내일';
  if (diff === -1) return '어제';
  const d = parseKey(due);
  const base = `${d.getMonth() + 1}월 ${d.getDate()}일 (${WD[d.getDay()]})`;
  if (diff > 0 && diff <= 30) return `${base} · D-${diff}`;
  return base;
}
function planGroup(p) {
  if (p.done) return 'done';
  if (!p.due) return 'nodate';
  const t = dkey();
  if (p.due < t) return 'overdue';
  if (p.due === t) return 'today';
  return 'upcoming';
}

/* ───────── routing ───────── */
function parseHash() {
  const h = location.hash.slice(1);
  if (h.startsWith('s-')) return { name: 'section', id: h.slice(2) };
  if (h === 'search') return { name: 'search', q: view.q || '' };
  if (h === 'settings') return { name: 'settings' };
  return { name: 'today' };
}
function go(hash) { if (location.hash === hash) render(); else location.hash = hash; }
window.addEventListener('hashchange', () => {
  if (location.hash === '#new-memo') return quickNewMemo();
  view = parseHash(); closeDrawer(); render(); window.scrollTo(0, 0);
});

/* ───────── render ───────── */
function render() {
  renderSidebar();
  const main = $('#main');
  let title = '나의 숲';
  if (view.name === 'today') main.innerHTML = renderToday();
  else if (view.name === 'search') { main.innerHTML = renderSearch(); title = '검색'; }
  else if (view.name === 'settings') { main.innerHTML = renderSettings(); title = '설정'; }
  else if (view.name === 'section') {
    const sec = S.sections.find((s) => s.id === view.id);
    if (!sec) { view = { name: 'today' }; return go('#today'); }
    title = `${sec.icon} ${sec.name}`;
    main.innerHTML = sec.type === 'memo' ? renderMemoSection(sec) : sec.type === 'plan' ? renderPlanSection(sec) : renderRoutineSection(sec);
  }
  $('#topbarTitle').textContent = title;
  document.title = title === '나의 숲' ? '나의 숲 — 기록장' : `${title} · 나의 숲`;
  if (view.name === 'search') { const i = $('#searchInput'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }
}

function renderSidebar() {
  const active = (n, id) => (view.name === n && (!id || view.id === id) ? ' active' : '');
  const count = (s) => s.type === 'memo' ? S.memos.filter((m) => m.sectionId === s.id).length
    : s.type === 'plan' ? S.plans.filter((p) => p.sectionId === s.id && !p.done).length
      : (() => { const rs = S.routines.filter((r) => r.sectionId === s.id && isOn(r)); return rs.length ? `${rs.filter((r) => isChecked(r.id)).length}/${rs.length}` : ''; })();
  $('#sidebar').innerHTML = `
    <div class="brand">
      <div class="brand-mark">${svgLeaf}</div>
      <div><div class="brand-name">나의 숲</div><div class="brand-sub">나만의 기록장</div></div>
    </div>
    <button class="nav-item${active('today')}" data-act="go" data-to="#today"><span class="ni-icon">🏡</span><span class="ni-label">오늘</span></button>
    <button class="nav-item${active('search')}" data-act="go" data-to="#search"><span class="ni-icon">🔍</span><span class="ni-label">검색</span></button>
    <div class="nav-head"><span>섹션</span><button class="nav-add" data-act="new-section" aria-label="섹션 추가">+</button></div>
    <div class="nav-sections">
      ${S.sections.map((s) => `
        <button class="nav-item${active('section', s.id)}" data-act="go" data-to="#s-${s.id}">
          <span class="ni-icon">${esc(s.icon)}</span><span class="ni-label">${esc(s.name)}</span>
          <span class="ni-count">${count(s)}</span>
        </button>`).join('')}
    </div>
    <button class="nav-new" data-act="new-section">＋ 새 섹션 만들기</button>
    <div class="nav-spacer"></div>
    <button class="nav-item${active('settings')}" data-act="go" data-to="#settings"><span class="ni-icon">⚙️</span><span class="ni-label">설정 · 알림 · 백업</span></button>
  `;
}

/* ── Today ── */
function ring(pct, size = 64) {
  const r = (size - 8) / 2, c = 2 * Math.PI * r;
  return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle class="bg" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="6"/>
    <circle class="fg" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="6" stroke-linecap="round"
      stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central">${Math.round(pct * 100)}%</text></svg>`;
}
function greeting() {
  const h = new Date().getHours();
  if (h < 5) return '고요한 밤이에요 🌙';
  if (h < 11) return '좋은 아침이에요 ☀️';
  if (h < 17) return '좋은 오후예요 🌿';
  if (h < 21) return '수고한 저녁이에요 🌇';
  return '오늘 하루도 고생했어요 🌙';
}
function renderToday() {
  const now = new Date();
  const rs = todayRoutines();
  const done = rs.filter((r) => isChecked(r.id)).length;
  const pct = rs.length ? done / rs.length : 0;
  const t = dkey();
  const week = dkey(addDays(now, 7));
  const planSecs = new Set(S.sections.filter((s) => s.type === 'plan').map((s) => s.id));
  const urgent = S.plans.filter((p) => planSecs.has(p.sectionId) && !p.done && p.due && p.due <= week)
    .sort((a, b) => a.due.localeCompare(b.due) || b.priority - a.priority);
  const memoSecs = new Set(S.sections.filter((s) => s.type === 'memo').map((s) => s.id));
  const recent = S.memos.filter((m) => memoSecs.has(m.sectionId)).sort((a, b) => b.updated - a.updated).slice(0, 4);
  const msg = !rs.length ? '오늘 예정된 루틴이 없어요' : done === rs.length ? '오늘 루틴을 모두 끝냈어요! 🎉' : `${rs.length - done}개 남았어요. 하나씩 해볼까요?`;

  return `
    <div class="hello">${greeting()}</div>
    <h1 class="page-title">${now.getMonth() + 1}월 ${now.getDate()}일 ${WD[now.getDay()]}요일</h1>
    <form class="card quick" data-form="quick-memo">
      <input name="q" placeholder="💭 떠오른 생각을 바로 적어보세요" autocomplete="off" />
      <button class="btn btn-primary btn-sm" type="submit">기록</button>
    </form>

    <div class="progress-card">
      ${ring(pct)}
      <div class="pc-text">
        <div class="pc-big">오늘의 루틴 ${done}/${rs.length}</div>
        <div class="pc-small">${msg}</div>
      </div>
    </div>

    <div class="section-title">🌱 오늘 할 루틴</div>
    ${rs.length ? `<div class="list">${rs.map((r) => routineRow(r, true)).join('')}</div>`
      : `<div class="empty"><div class="e-icon">🌱</div>루틴 섹션에서 매일 할 일을 추가해보세요</div>`}

    <div class="grid-2">
      <div>
        <div class="section-title">🎯 다가오는 계획 <span class="count">${urgent.length}</span></div>
        ${urgent.length ? `<div class="list">${urgent.slice(0, 8).map((p) => planRow(p, true)).join('')}</div>`
          : `<div class="empty">7일 안에 마감인 계획이 없어요</div>`}
      </div>
      <div>
        <div class="section-title">📝 최근 메모</div>
        ${recent.length ? `<div class="list">${recent.map((m) => `
          <button class="card memo" style="min-height:0" data-act="open-memo" data-id="${m.id}">
            <div class="m-title">${m.pinned ? `<span class="pin">${svgPin(true)}</span>` : ''}<span>${esc(m.title || '제목 없음')}</span></div>
            ${m.body ? `<div class="m-body" style="-webkit-line-clamp:2">${esc(m.body)}</div>` : ''}
            <div class="m-date">${secName(m.sectionId)} · ${relTime(m.updated)}</div>
          </button>`).join('')}</div>` : `<div class="empty">아직 메모가 없어요</div>`}
      </div>
    </div>
    ${t ? '' : ''}`;
}
const secName = (id) => { const s = S.sections.find((x) => x.id === id); return s ? `${esc(s.icon)} ${esc(s.name)}` : ''; };
function relTime(ts) {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return '방금';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  const d = new Date(ts);
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}일 전`;
  return `${d.getFullYear() !== new Date().getFullYear() ? d.getFullYear() + '. ' : ''}${d.getMonth() + 1}. ${d.getDate()}.`;
}

/* ── Routine ── */
function routineRow(r, showSec) {
  const on = isOn(r);
  const done = isChecked(r.id);
  const st = streak(r);
  const today = new Date();
  const dots = [];
  for (let i = 6; i >= 0; i--) {
    const d = addDays(today, -i);
    const sched = isOn(r, d);
    const c = isChecked(r.id, dkey(d));
    dots.push(`<div class="d${i === 0 ? ' today' : ''}"><div class="dot${c ? ' on' : sched ? '' : ' skip'}"></div><span>${WD[d.getDay()]}</span></div>`);
  }
  return `
    <div class="card routine${done ? ' done' : ''}${on ? '' : ' off'}">
      <button class="check${done ? ' on' : ''}" data-act="toggle-routine" data-id="${r.id}" aria-label="완료 체크" ${on ? '' : 'disabled'}>${svgCheck}</button>
      <button class="r-main" data-act="edit-routine" data-id="${r.id}">
        <div class="r-name">${esc(r.icon || '')} ${esc(r.name)}</div>
        <div class="r-meta">
          ${r.time ? `<span>⏰ ${r.time}</span>` : ''}<span>${daysLabel(r.days)}</span>
          ${st ? `<span class="streak">🔥 ${st}일 연속</span>` : ''}
          ${showSec ? `<span>${secName(r.sectionId)}</span>` : ''}
        </div>
      </button>
      <div class="week">${dots.join('')}</div>
    </div>`;
}
function sectionHead(sec, sub) {
  return `
    <div class="page-head">
      <div class="page-icon">${esc(sec.icon)}</div>
      <div class="grow"><h1 class="page-title">${esc(sec.name)}</h1><div class="page-sub">${sub}</div></div>
      <button class="icon-btn" data-act="edit-section" data-id="${sec.id}" aria-label="섹션 설정">${svgMore}</button>
    </div>`;
}
function renderRoutineSection(sec) {
  const all = S.routines.filter((r) => r.sectionId === sec.id).sort(byTime);
  const today = all.filter((r) => isOn(r));
  const rest = all.filter((r) => !isOn(r));
  const done = today.filter((r) => isChecked(r.id)).length;
  return `
    ${sectionHead(sec, `매일 루틴 · 오늘 ${done}/${today.length} 완료`)}
    ${today.length ? `<div class="list">${today.map((r) => routineRow(r)).join('')}</div>`
      : `<div class="empty"><div class="e-icon">🌱</div>오늘 할 루틴이 없어요.<br/>아래 버튼으로 습관을 추가해보세요.</div>`}
    ${rest.length ? `<div class="section-title">😴 오늘은 쉬는 루틴 <span class="count">${rest.length}</span></div>
      <div class="list">${rest.map((r) => routineRow(r)).join('')}</div>` : ''}
    <button class="fab" data-act="new-routine" data-sec="${sec.id}"><span style="font-size:22px;line-height:1">＋</span>새 루틴</button>`;
}

/* ── Memo ── */
function renderMemoSection(sec) {
  const q = (view.mq || '').trim().toLowerCase();
  let ms = S.memos.filter((m) => m.sectionId === sec.id);
  const total = ms.length;
  if (q) ms = ms.filter((m) => (m.title + ' ' + m.body).toLowerCase().includes(q));
  ms.sort((a, b) => (b.pinned - a.pinned) || b.updated - a.updated);
  return `
    ${sectionHead(sec, `메모 ${total}개`)}
    ${total > 3 ? `<div class="toolbar-row"><label class="search-box">🔍<input id="memoFilter" placeholder="이 섹션에서 찾기" value="${esc(view.mq || '')}" /></label></div>` : ''}
    <div id="memoList">${memoGrid(ms, total)}</div>
    <button class="fab" data-act="new-memo" data-sec="${sec.id}"><span style="font-size:22px;line-height:1">＋</span>새 메모</button>`;
}
function memoGrid(ms, total) {
  if (!ms.length) return `<div class="empty"><div class="e-icon">💭</div>${total ? '찾는 메모가 없어요' : '첫 메모를 남겨보세요'}</div>`;
  return `<div class="memo-grid">${ms.map((m) => `
    <button class="card memo" data-act="open-memo" data-id="${m.id}">
      <div class="m-title">${m.pinned ? `<span class="pin">${svgPin(true)}</span>` : ''}<span>${esc(m.title || '제목 없음')}</span></div>
      <div class="m-body">${esc(m.body)}</div>
      <div class="m-date">${relTime(m.updated)}</div>
    </button>`).join('')}</div>`;
}

/* ── Plan ── */
function planRow(p, showSec) {
  const g = planGroup(p);
  const sd = p.steps?.length ? p.steps.filter((s) => s.done).length : 0;
  return `
    <div class="card plan${p.done ? ' done' : ''}">
      <button class="check sq${p.done ? ' on' : ''}" data-act="toggle-plan" data-id="${p.id}" aria-label="완료">${svgCheck}</button>
      <button class="p-main" data-act="open-plan" data-id="${p.id}">
        <div class="p-title">${esc(p.title || '제목 없음')}</div>
        <div class="p-meta">
          <span class="prio p${p.priority || 0}"></span>
          ${p.due ? `<span class="chip${g === 'overdue' ? ' over' : g === 'today' ? ' today' : ''}">📅 ${dueLabel(p.due)}</span>` : ''}
          ${p.steps?.length ? `<span class="chip">${sd}/${p.steps.length}</span><span class="mini-bar"><i style="width:${(sd / p.steps.length) * 100}%"></i></span>` : ''}
          ${showSec ? `<span class="chip sec">${secName(p.sectionId)}</span>` : ''}
        </div>
      </button>
    </div>`;
}
function renderPlanSection(sec) {
  const ps = S.plans.filter((p) => p.sectionId === sec.id);
  const groups = { overdue: [], today: [], upcoming: [], nodate: [], done: [] };
  ps.forEach((p) => groups[planGroup(p)].push(p));
  const sortDue = (a, b) => (a.due || '').localeCompare(b.due || '') || (b.priority || 0) - (a.priority || 0);
  Object.values(groups).forEach((g) => g.sort(sortDue));
  groups.nodate.sort((a, b) => (b.priority || 0) - (a.priority || 0) || a.created - b.created);
  groups.done.sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0));
  const block = (key, label) => groups[key].length ? `
    <div class="section-title">${label} <span class="count">${groups[key].length}</span></div>
    <div class="list">${groups[key].map((p) => planRow(p)).join('')}</div>` : '';
  const open = ps.length - groups.done.length;
  return `
    ${sectionHead(sec, `진행 중 ${open}개 · 완료 ${groups.done.length}개`)}
    <form class="card quick-add" data-form="quick-plan" data-sec="${sec.id}">
      <span style="color:var(--ink-3);font-size:18px">＋</span>
      <input name="title" placeholder="새 계획을 입력하고 Enter" autocomplete="off" />
      <input name="due" type="date" aria-label="마감일" />
    </form>
    ${!ps.length ? `<div class="empty" style="margin-top:14px"><div class="e-icon">🎯</div>이루고 싶은 계획을 적어보세요</div>` : ''}
    ${block('overdue', '⚠️ 기한 지남')}
    ${block('today', '☀️ 오늘')}
    ${block('upcoming', '🗓️ 예정')}
    ${block('nodate', '📋 언젠가')}
    ${groups.done.length ? `<details class="done-group"${view.showDone ? ' open' : ''}>
      <summary class="section-title">✅ 완료 <span class="count">${groups.done.length}</span><span class="link">펼치기/접기</span></summary>
      <div class="list">${groups.done.map((p) => planRow(p)).join('')}</div></details>` : ''}`;
}

/* ── Search ── */
function hl(text, q) {
  const t = esc(text);
  if (!q) return t;
  const re = new RegExp(esc(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  return t.replace(re, (m) => `<mark>${m}</mark>`);
}
function snippet(body, q) {
  const i = body.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return body.slice(0, 90);
  const s = Math.max(0, i - 30);
  return (s > 0 ? '…' : '') + body.slice(s, s + 110);
}
function renderSearch() {
  return `
    <div class="page-head"><div class="page-icon">🔍</div><div class="grow"><h1 class="page-title">검색</h1><div class="page-sub">메모 · 계획 · 루틴 전체에서 찾기</div></div></div>
    <label class="search-box" style="height:46px">🔍<input id="searchInput" placeholder="무엇을 찾고 있나요?" value="${esc(view.q || '')}" autocomplete="off" /></label>
    <div id="searchResults">${searchResults(view.q || '')}</div>`;
}
function searchResults(q) {
  q = q.trim();
  if (!q) return `<div class="empty" style="margin-top:18px">검색어를 입력하세요</div>`;
  const lq = q.toLowerCase();
  const ms = S.memos.filter((m) => (m.title + ' ' + m.body).toLowerCase().includes(lq)).sort((a, b) => b.updated - a.updated);
  const ps = S.plans.filter((p) => (p.title + ' ' + (p.note || '') + ' ' + (p.steps || []).map((s) => s.text).join(' ')).toLowerCase().includes(lq));
  const rs = S.routines.filter((r) => r.name.toLowerCase().includes(lq));
  if (!ms.length && !ps.length && !rs.length) return `<div class="empty" style="margin-top:18px">"${esc(q)}"에 대한 결과가 없어요</div>`;
  return `
    ${ms.length ? `<div class="section-title">📝 메모 <span class="count">${ms.length}</span></div><div class="list">${ms.map((m) => `
      <button class="card memo" style="min-height:0" data-act="open-memo" data-id="${m.id}">
        <div class="m-title"><span>${hl(m.title || '제목 없음', q)}</span></div>
        <div class="m-body" style="-webkit-line-clamp:2">${hl(snippet(m.body, q), q)}</div>
        <div class="m-date">${secName(m.sectionId)} · ${relTime(m.updated)}</div>
      </button>`).join('')}</div>` : ''}
    ${ps.length ? `<div class="section-title">🎯 계획 <span class="count">${ps.length}</span></div><div class="list">${ps.map((p) => planRow(p, true)).join('')}</div>` : ''}
    ${rs.length ? `<div class="section-title">🌱 루틴 <span class="count">${rs.length}</span></div><div class="list">${rs.map((r) => routineRow(r, true)).join('')}</div>` : ''}`;
}

/* ── Settings ── */
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
function renderSettings() {
  const perm = 'Notification' in window ? Notification.permission : 'unsupported';
  const permText = perm === 'granted' ? '허용됨' : perm === 'denied' ? '차단됨 — 브라우저 설정에서 허용해주세요' : perm === 'unsupported' ? '이 브라우저는 알림을 지원하지 않아요' : '아직 허용하지 않음';
  return `
    <div class="page-head"><div class="page-icon">⚙️</div><div class="grow"><h1 class="page-title">설정</h1><div class="page-sub">알림 · 앱 설치 · 백업</div></div></div>

    <div class="section-title">🔔 알림</div>
    <div class="card">
      <div class="set-row">
        <div class="s-text"><div class="s-title">루틴 시간 알림</div><div class="s-desc">루틴에 정한 시간이 되면 알려드려요 · 권한: ${permText}</div></div>
        <button class="switch${S.settings.notify ? ' on' : ''}" data-act="toggle-notify" aria-label="알림 켜기"></button>
      </div>
      <div class="set-row">
        <div class="s-text"><div class="s-title">못 끝낸 루틴 리마인드</div><div class="s-desc">정한 시간에 남은 루틴이 있으면 한 번 더 알려드려요</div></div>
        <input type="time" class="input" style="width:120px" value="${S.settings.remindAt}" data-change="remindAt" ${S.settings.remind ? '' : 'disabled'} />
        <button class="switch${S.settings.remind ? ' on' : ''}" data-act="toggle-remind" aria-label="리마인드"></button>
      </div>
      <div class="set-row">
        <div class="s-text"><div class="s-title">테스트 알림 보내기</div><div class="s-desc">알림이 잘 오는지 확인해보세요</div></div>
        <button class="btn btn-ghost btn-sm" data-act="test-notify">보내기</button>
      </div>
    </div>
    <div class="note">💡 알림은 앱이 열려 있거나 백그라운드에 있을 때 가장 확실하게 와요. 안드로이드 크롬에서 홈 화면에 설치하면 앱을 닫아도 주기적으로 확인해 알려주고, 아이폰은 iOS 16.4 이상에서 <b>홈 화면에 추가한 뒤</b> 그 아이콘으로 열어야 알림을 허용할 수 있어요.</div>

    <div class="section-title">📱 앱으로 설치</div>
    <div class="card">
      <div class="set-row">
        <div class="s-text"><div class="s-title">${isStandalone() ? '앱으로 실행 중이에요 ✅' : '홈 화면에 추가'}</div>
          <div class="s-desc">${isStandalone() ? '홈 화면 아이콘으로 열려 있어요' : isIOS() ? 'Safari 하단의 공유 버튼 → "홈 화면에 추가"를 눌러주세요' : installEvt ? '버튼을 누르면 바로 설치돼요' : '브라우저 메뉴(⋮) → "앱 설치" 또는 "홈 화면에 추가"'}</div></div>
        ${!isStandalone() && installEvt ? '<button class="btn btn-primary btn-sm" data-act="install">설치</button>' : ''}
      </div>
    </div>

    <div class="section-title">💾 백업</div>
    <div class="card">
      <div class="set-row">
        <div class="s-text"><div class="s-title">백업 파일 내보내기</div><div class="s-desc">모든 기록을 .json 파일로 저장해요</div></div>
        <button class="btn btn-ghost btn-sm" data-act="export">내보내기</button>
      </div>
      <div class="set-row">
        <div class="s-text"><div class="s-title">백업 불러오기</div><div class="s-desc">저장해둔 .json 파일로 복원해요 (현재 기록은 대체돼요)</div></div>
        <label class="btn btn-ghost btn-sm">불러오기<input type="file" accept="application/json,.json" data-change="import" hidden /></label>
      </div>
      <div class="set-row">
        <div class="s-text"><div class="s-title" style="color:var(--danger)">모든 기록 지우기</div><div class="s-desc">처음 상태로 되돌려요. 되돌릴 수 없어요</div></div>
        <button class="btn btn-danger btn-sm" data-act="reset">초기화</button>
      </div>
    </div>
    <div class="note">기록은 이 기기의 브라우저 안에만 저장돼요. 기기를 바꾸거나 브라우저 데이터를 지우기 전에 꼭 백업해주세요.</div>`;
}

/* ───────── Sheet editors ───────── */
let sheetCtx = null;
function openSheet(html, ctx) {
  sheetCtx = ctx;
  const sh = $('#sheet');
  sh.innerHTML = html;
  sh.classList.add('open'); sh.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  history.pushState({ sheet: 1 }, '');
}
function closeSheet(fromPop) {
  const sh = $('#sheet');
  if (!sh.classList.contains('open')) return;
  if (sheetCtx?.onClose) sheetCtx.onClose();
  sh.classList.remove('open'); sh.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  sheetCtx = null;
  if (!fromPop && history.state?.sheet) history.back();
  render();
}
window.addEventListener('popstate', () => { if ($('#modal').classList.contains('open')) closeModal(); if ($('#sheet').classList.contains('open')) closeSheet(true); });

function autoGrow(el) { el.style.height = 'auto'; el.style.height = Math.max(el.scrollHeight, window.innerHeight * 0.5) + 'px'; }

function openMemo(id) {
  const m = S.memos.find((x) => x.id === id);
  if (!m) return;
  const memoSecs = S.sections.filter((s) => s.type === 'memo');
  openSheet(`
    <div class="sheet-bar">
      <button class="icon-btn" data-act="close-sheet" aria-label="닫기">${svgBack}</button>
      <div class="crumb">${secName(m.sectionId)}</div>
      <span class="save-state" id="saveState">저장됨</span>
      <button class="icon-btn" data-act="pin-memo" aria-label="고정" style="color:${m.pinned ? 'var(--g-600)' : 'inherit'}">${svgPin(m.pinned)}</button>
      <button class="icon-btn" data-act="del-memo" aria-label="삭제">${svgTrash}</button>
    </div>
    <div class="sheet-body"><div class="sheet-inner">
      <input class="title-input" id="mTitle" placeholder="제목" value="${esc(m.title)}" />
      <div class="meta-line">
        <span>만든 날 ${new Date(m.created).toLocaleDateString('ko-KR')}</span>
        ${memoSecs.length > 1 ? `<select class="select" id="mSec" style="width:auto;padding:3px 8px;font-size:12.5px;border-radius:8px">${memoSecs.map((s) => `<option value="${s.id}"${s.id === m.sectionId ? ' selected' : ''}>${esc(s.icon)} ${esc(s.name)}</option>`).join('')}</select>` : ''}
      </div>
      <div class="fmt-bar">
        <button data-ins="• ">• 목록</button>
        <button data-ins="☐ ">☐ 체크</button>
        <button data-ins="→ ">→ 화살표</button>
        <button data-ins="time">🕒 지금 시각</button>
        <button data-ins="tpl-think">💭 생각정리 틀</button>
        <button data-ins="tpl-pro">⚖️ 장단점 틀</button>
      </div>
      <textarea class="body-input" id="mBody" placeholder="자유롭게 생각을 적어보세요…">${esc(m.body)}</textarea>
    </div></div>`, {
    type: 'memo', id,
    onClose: () => { if (!m.title.trim() && !m.body.trim()) { S.memos = S.memos.filter((x) => x.id !== id); save(true); } },
  });
  const t = $('#mTitle'), b = $('#mBody');
  autoGrow(b);
  let tm;
  const upd = () => {
    m.title = t.value; m.body = b.value; m.updated = Date.now();
    $('#saveState').textContent = '저장 중…';
    clearTimeout(tm); tm = setTimeout(() => { save(true); $('#saveState').textContent = '저장됨'; }, 350);
  };
  t.addEventListener('input', upd);
  b.addEventListener('input', () => { autoGrow(b); upd(); });
  t.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); b.focus(); } });
  b.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.isComposing) return;
    const pos = b.selectionStart;
    const lineStart = b.value.lastIndexOf('\n', pos - 1) + 1;
    const line = b.value.slice(lineStart, pos);
    const mk = line.match(/^(\s*)(• |☐ |☑ |→ |- |\d+\. )/);
    if (!mk) return;
    e.preventDefault();
    if (line.trim() === mk[2].trim()) { b.setRangeText('', lineStart, pos, 'end'); upd(); return; }
    let next = mk[2] === '☑ ' ? '☐ ' : mk[2];
    const num = mk[2].match(/^(\d+)\. $/); if (num) next = `${+num[1] + 1}. `;
    b.setRangeText('\n' + mk[1] + next, pos, b.selectionEnd, 'end'); autoGrow(b); upd();
  });
  b.addEventListener('click', () => {
    const pos = b.selectionStart;
    const ls = b.value.lastIndexOf('\n', pos - 1) + 1;
    if (pos - ls <= 2) {
      const two = b.value.slice(ls, ls + 2);
      if (two === '☐ ' || two === '☑ ') { b.setRangeText(two === '☐ ' ? '☑ ' : '☐ ', ls, ls + 2, 'preserve'); upd(); }
    }
  });
  $('#mSec')?.addEventListener('change', (e) => { m.sectionId = e.target.value; upd(); $('.crumb').innerHTML = secName(m.sectionId); });
  $$('.fmt-bar button').forEach((btn) => btn.addEventListener('click', () => {
    const k = btn.dataset.ins;
    const tpl = {
      time: `[${hhmm()}] `,
      'tpl-think': '■ 지금 떠오르는 생각\n• \n\n■ 왜 그렇게 느낄까?\n• \n\n■ 내가 할 수 있는 것\n☐ \n\n■ 한 줄 정리\n→ ',
      'tpl-pro': '■ 고민: \n\n👍 장점\n• \n\n👎 단점\n• \n\n✅ 결론\n→ ',
    }[k];
    const ins = tpl ?? k;
    const pos = b.selectionStart;
    const atLineStart = pos === 0 || b.value[pos - 1] === '\n';
    let text = ins;
    if (k.startsWith('tpl-')) { if (!atLineStart) text = '\n\n' + ins; }
    else if (k !== 'time' && !atLineStart) text = '\n' + ins;
    b.focus(); b.setRangeText(text, pos, b.selectionEnd, 'end'); autoGrow(b); upd();
  }));
  if (!m.title && !m.body) setTimeout(() => t.focus(), 280);
}

function openPlan(id) {
  const p = S.plans.find((x) => x.id === id);
  if (!p) return;
  p.steps ||= [];
  const planSecs = S.sections.filter((s) => s.type === 'plan');
  const draw = () => {
    $('#planSteps').innerHTML = p.steps.map((s) => `
      <div class="step${s.done ? ' done' : ''}" data-sid="${s.id}">
        <button class="check sq${s.done ? ' on' : ''}" data-step="toggle" style="width:22px;height:22px">${svgCheck}</button>
        <input type="text" value="${esc(s.text)}" data-step="text" placeholder="단계" />
        <button class="x" data-step="del" aria-label="삭제">✕</button>
      </div>`).join('');
    const d = p.steps.filter((s) => s.done).length;
    $('#stepCount').textContent = p.steps.length ? `${d}/${p.steps.length}` : '';
  };
  openSheet(`
    <div class="sheet-bar">
      <button class="icon-btn" data-act="close-sheet" aria-label="닫기">${svgBack}</button>
      <div class="crumb">${secName(p.sectionId)}</div>
      <button class="icon-btn" data-act="del-plan" aria-label="삭제">${svgTrash}</button>
    </div>
    <div class="sheet-body"><div class="sheet-inner">
      <div style="display:flex;gap:12px;align-items:center;margin-bottom:14px">
        <button class="check sq${p.done ? ' on' : ''}" id="pDone" style="width:28px;height:28px">${svgCheck}</button>
        <input class="title-input" id="pTitle" placeholder="계획 이름" value="${esc(p.title)}" />
      </div>
      <div class="grid-2" style="gap:0 14px">
        <div class="field"><label>마감일</label><input type="date" class="input" id="pDue" value="${p.due || ''}" /></div>
        ${planSecs.length > 1 ? `<div class="field"><label>섹션</label><select class="select" id="pSec">${planSecs.map((s) => `<option value="${s.id}"${s.id === p.sectionId ? ' selected' : ''}>${esc(s.icon)} ${esc(s.name)}</option>`).join('')}</select></div>` : '<div></div>'}
      </div>
      <div class="field"><span class="field-label">중요도</span>
        <div class="seg" id="pPrio">${['보통', '중요', '매우 중요'].map((l, i) => `<button data-v="${i}" class="${(p.priority || 0) === i ? 'on' : ''}">${['⚪', '🟡', '🔴'][i]} ${l}</button>`).join('')}</div>
      </div>
      <div class="field"><span class="field-label">세부 단계 <span id="stepCount" style="color:var(--ink-3);font-weight:500"></span></span>
        <div class="steps" id="planSteps"></div>
        <form id="stepForm" style="display:flex;gap:8px;margin-top:6px"><input class="input" id="stepIn" placeholder="+ 단계 추가 (Enter)" autocomplete="off" /><button class="btn btn-ghost" type="submit">추가</button></form>
      </div>
      <div class="field"><label>메모</label><textarea class="textarea" id="pNote" placeholder="필요한 내용, 아이디어, 링크 등">${esc(p.note || '')}</textarea></div>
    </div></div>`, {
    type: 'plan', id,
    onClose: () => { if (!p.title.trim() && !p.note && !p.steps.length) S.plans = S.plans.filter((x) => x.id !== id); save(true); },
  });
  draw();
  const upd = () => save(true);
  $('#pTitle').addEventListener('input', (e) => { p.title = e.target.value; upd(); });
  $('#pDue').addEventListener('change', (e) => { p.due = e.target.value || ''; upd(); });
  $('#pNote').addEventListener('input', (e) => { p.note = e.target.value; upd(); });
  $('#pSec')?.addEventListener('change', (e) => { p.sectionId = e.target.value; $('.crumb').innerHTML = secName(p.sectionId); upd(); });
  $('#pDone').addEventListener('click', (e) => { p.done = !p.done; p.doneAt = p.done ? Date.now() : 0; e.currentTarget.classList.toggle('on', p.done); upd(); });
  $('#pPrio').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; p.priority = +b.dataset.v; $$('#pPrio button').forEach((x) => x.classList.toggle('on', x === b)); upd(); });
  $('#stepForm').addEventListener('submit', (e) => { e.preventDefault(); const v = $('#stepIn').value.trim(); if (!v) return; p.steps.push({ id: uid(), text: v, done: false }); $('#stepIn').value = ''; draw(); upd(); });
  $('#planSteps').addEventListener('click', (e) => {
    const b = e.target.closest('[data-step]'); if (!b || b.dataset.step === 'text') return;
    const sid = b.closest('.step').dataset.sid; const s = p.steps.find((x) => x.id === sid);
    if (b.dataset.step === 'toggle') s.done = !s.done; else p.steps = p.steps.filter((x) => x.id !== sid);
    draw(); upd();
  });
  $('#planSteps').addEventListener('input', (e) => { if (e.target.dataset.step !== 'text') return; const s = p.steps.find((x) => x.id === e.target.closest('.step').dataset.sid); s.text = e.target.value; upd(); });
  if (!p.title) setTimeout(() => $('#pTitle').focus(), 280);
}

/* ───────── Modals ───────── */
let modalResolve = null;
function openModal(html) {
  const w = $('#modal');
  w.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
  w.classList.add('open'); w.setAttribute('aria-hidden', 'false');
}
function closeModal(val) {
  const w = $('#modal');
  w.classList.remove('open'); w.setAttribute('aria-hidden', 'true'); w.innerHTML = '';
  if (modalResolve) { const r = modalResolve; modalResolve = null; r(val); }
}
$('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(false); });
function ask(title, desc, ok = '확인', danger) {
  return new Promise((res) => {
    modalResolve = res;
    openModal(`<h3>${title}</h3><p class="desc">${desc}</p>
      <div class="modal-actions"><button class="btn btn-ghost" data-act="modal-no">취소</button>
      <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-act="modal-yes">${ok}</button></div>`);
  });
}

function sectionModal(id) {
  const sec = id ? S.sections.find((s) => s.id === id) : null;
  const st = { icon: sec?.icon || '📚', type: sec?.type || 'memo' };
  openModal(`
    <h3>${sec ? '섹션 편집' : '새 섹션 만들기'}</h3>
    <p class="desc">${sec ? '이름과 아이콘을 바꿀 수 있어요' : '기록을 나눠 담을 공간을 만들어요'}</p>
    <div class="field"><label>이름</label><input class="input" id="secName" maxlength="30" placeholder="예: 독서 노트, 운동, 회사 업무" value="${esc(sec?.name || '')}" /></div>
    ${sec ? '' : `<div class="field"><span class="field-label">종류</span><div class="type-cards" id="secType">
      ${Object.entries(TYPES).map(([k, t]) => `<button class="type-card${k === st.type ? ' on' : ''}" data-v="${k}"><span class="t-ic">${t.icon}</span><div><b>${t.label}</b>${t.desc}</div></button>`).join('')}
    </div></div>`}
    <div class="field"><span class="field-label">아이콘</span><div class="emoji-grid" id="secIcon">
      ${ICONS.map((i) => `<button data-v="${i}" class="${i === st.icon ? 'on' : ''}">${i}</button>`).join('')}
    </div></div>
    <div class="modal-actions">
      ${sec ? `<button class="btn btn-danger left" data-act="del-section" data-id="${sec.id}">삭제</button>` : ''}
      ${sec ? `<button class="btn btn-ghost" data-act="move-section" data-id="${sec.id}" data-dir="-1" aria-label="위로">↑</button><button class="btn btn-ghost" data-act="move-section" data-id="${sec.id}" data-dir="1" aria-label="아래로">↓</button>` : ''}
      <button class="btn btn-ghost" data-act="modal-no">취소</button>
      <button class="btn btn-primary" id="secSave">${sec ? '저장' : '만들기'}</button>
    </div>`);
  $('#secType')?.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; st.type = b.dataset.v; $$('#secType button').forEach((x) => x.classList.toggle('on', x === b)); if (!$('#secName').value) { st.icon = TYPES[st.type].icon; $$('#secIcon button').forEach((x) => x.classList.toggle('on', x.dataset.v === st.icon)); } });
  $('#secIcon').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; st.icon = b.dataset.v; $$('#secIcon button').forEach((x) => x.classList.toggle('on', x === b)); });
  const submit = () => {
    const name = $('#secName').value.trim();
    if (!name) { $('#secName').focus(); return toast('이름을 입력해주세요'); }
    if (sec) { sec.name = name; sec.icon = st.icon; save(); closeModal(); render(); }
    else {
      const ns = { id: uid(), name, icon: st.icon, type: st.type, created: Date.now() };
      S.sections.push(ns); save(); closeModal(); go(`#s-${ns.id}`);
    }
  };
  $('#secSave').addEventListener('click', submit);
  $('#secName').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) submit(); });
  setTimeout(() => $('#secName').focus(), 50);
}

function routineModal(id, secId) {
  const r = id ? S.routines.find((x) => x.id === id) : null;
  const st = { icon: r?.icon || '🌿', days: r ? [...r.days] : [0, 1, 2, 3, 4, 5, 6] };
  const routineSecs = S.sections.filter((s) => s.type === 'routine');
  openModal(`
    <h3>${r ? '루틴 편집' : '새 루틴'}</h3>
    <p class="desc">매일 또는 정한 요일마다 체크할 습관이에요</p>
    <div class="field"><label>이름</label><input class="input" id="rName" maxlength="40" placeholder="예: 스트레칭 10분" value="${esc(r?.name || '')}" /></div>
    <div class="field"><span class="field-label">아이콘</span><div class="emoji-grid" id="rIcon">${ICONS.map((i) => `<button data-v="${i}" class="${i === st.icon ? 'on' : ''}">${i}</button>`).join('')}</div></div>
    <div class="field"><span class="field-label">반복 요일</span>
      <div class="days" id="rDays">${[1, 2, 3, 4, 5, 6, 0].map((d) => `<button data-v="${d}" class="${st.days.includes(d) ? 'on' : ''}">${WD[d]}</button>`).join('')}</div>
      <div class="seg" style="margin-top:8px" id="rPreset"><button data-p="all">매일</button><button data-p="wk">평일</button><button data-p="we">주말</button></div>
    </div>
    <div class="field"><label>알림 시간 (선택)</label><input type="time" class="input" id="rTime" value="${r?.time || ''}" /></div>
    ${routineSecs.length > 1 ? `<div class="field"><label>섹션</label><select class="select" id="rSec">${routineSecs.map((s) => `<option value="${s.id}"${s.id === (r?.sectionId || secId) ? ' selected' : ''}>${esc(s.icon)} ${esc(s.name)}</option>`).join('')}</select></div>` : ''}
    <div class="modal-actions">
      ${r ? `<button class="btn btn-danger left" data-act="del-routine" data-id="${r.id}">삭제</button>` : ''}
      <button class="btn btn-ghost" data-act="modal-no">취소</button>
      <button class="btn btn-primary" id="rSave">${r ? '저장' : '추가'}</button>
    </div>`);
  const drawDays = () => $$('#rDays button').forEach((b) => b.classList.toggle('on', st.days.includes(+b.dataset.v)));
  $('#rIcon').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; st.icon = b.dataset.v; $$('#rIcon button').forEach((x) => x.classList.toggle('on', x === b)); });
  $('#rDays').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; const v = +b.dataset.v; st.days = st.days.includes(v) ? st.days.filter((x) => x !== v) : [...st.days, v]; drawDays(); });
  $('#rPreset').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; st.days = { all: [0, 1, 2, 3, 4, 5, 6], wk: [1, 2, 3, 4, 5], we: [0, 6] }[b.dataset.p]; drawDays(); });
  const submit = () => {
    const name = $('#rName').value.trim();
    if (!name) { $('#rName').focus(); return toast('이름을 입력해주세요'); }
    if (!st.days.length) return toast('요일을 하나 이상 골라주세요');
    const time = $('#rTime').value;
    const sectionId = $('#rSec')?.value || r?.sectionId || secId;
    if (r) Object.assign(r, { name, icon: st.icon, days: st.days, time, sectionId });
    else S.routines.push({ id: uid(), sectionId, name, icon: st.icon, days: st.days, time, created: Date.now() });
    save(); closeModal(); render();
    if (time && !S.settings.notify) toast('설정에서 알림을 켜면 시간에 맞춰 알려드려요');
  };
  $('#rSave').addEventListener('click', submit);
  $('#rName').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) submit(); });
  if (!r) setTimeout(() => $('#rName').focus(), 50);
}

/* ───────── actions ───────── */
function newMemo(secId, body = '') {
  const m = { id: uid(), sectionId: secId, title: '', body, pinned: false, created: Date.now(), updated: Date.now() };
  S.memos.push(m); save(true);
  return m;
}
function quickNewMemo() {
  let sec = S.sections.find((s) => s.type === 'memo');
  if (!sec) { sec = { id: uid(), name: '메모', icon: '📝', type: 'memo', created: Date.now() }; S.sections.push(sec); }
  history.replaceState(null, '', `#s-${sec.id}`);
  view = { name: 'section', id: sec.id }; render();
  openMemo(newMemo(sec.id).id);
}

const actions = {
  go: (el) => go(el.dataset.to),
  'open-drawer': () => { $('#sidebar').classList.add('open'); $('#scrim').classList.add('open'); },
  'close-drawer': closeDrawer,
  'new-section': () => { closeDrawer(); sectionModal(); },
  'edit-section': (el) => sectionModal(el.dataset.id),
  'move-section': (el) => {
    const i = S.sections.findIndex((s) => s.id === el.dataset.id); const j = i + +el.dataset.dir;
    if (j < 0 || j >= S.sections.length) return;
    [S.sections[i], S.sections[j]] = [S.sections[j], S.sections[i]]; save();
  },
  'del-section': async (el) => {
    const sec = S.sections.find((s) => s.id === el.dataset.id);
    closeModal();
    const n = S.memos.filter((m) => m.sectionId === sec.id).length + S.plans.filter((p) => p.sectionId === sec.id).length + S.routines.filter((r) => r.sectionId === sec.id).length;
    if (!(await ask('섹션을 삭제할까요?', `"${esc(sec.name)}" 섹션${n ? `과 안에 있는 ${n}개의 기록이` : '이'} 모두 사라져요.`, '삭제', true))) return;
    S.sections = S.sections.filter((s) => s.id !== sec.id);
    S.memos = S.memos.filter((m) => m.sectionId !== sec.id);
    S.plans = S.plans.filter((p) => p.sectionId !== sec.id);
    S.routines = S.routines.filter((r) => r.sectionId !== sec.id);
    save(); toast('섹션을 삭제했어요'); go('#today');
  },
  'modal-yes': () => closeModal(true),
  'modal-no': () => closeModal(false),

  'new-memo': (el) => openMemo(newMemo(el.dataset.sec).id),
  'open-memo': (el) => openMemo(el.dataset.id),
  'pin-memo': (el) => {
    const m = S.memos.find((x) => x.id === sheetCtx.id); m.pinned = !m.pinned; save(true);
    el.innerHTML = svgPin(m.pinned); el.style.color = m.pinned ? 'var(--g-600)' : 'inherit';
    toast(m.pinned ? '맨 위에 고정했어요' : '고정을 풀었어요');
  },
  'del-memo': async () => {
    const id = sheetCtx.id;
    if (!(await ask('메모를 삭제할까요?', '삭제한 메모는 되돌릴 수 없어요.', '삭제', true))) return;
    S.memos = S.memos.filter((m) => m.id !== id); save(true); closeSheet(); toast('메모를 삭제했어요');
  },
  'close-sheet': () => closeSheet(),

  'open-plan': (el) => openPlan(el.dataset.id),
  'toggle-plan': (el) => {
    const p = S.plans.find((x) => x.id === el.dataset.id); p.done = !p.done; p.doneAt = p.done ? Date.now() : 0;
    save(); if (p.done) toast('완료! 잘했어요 👏'); render();
  },
  'del-plan': async () => {
    const id = sheetCtx.id;
    if (!(await ask('계획을 삭제할까요?', '세부 단계와 메모도 함께 사라져요.', '삭제', true))) return;
    S.plans = S.plans.filter((p) => p.id !== id); save(true); closeSheet(); toast('계획을 삭제했어요');
  },

  'new-routine': (el) => routineModal(null, el.dataset.sec),
  'edit-routine': (el) => routineModal(el.dataset.id),
  'toggle-routine': (el) => {
    const on = toggleCheck(el.dataset.id);
    if (on) {
      const rs = todayRoutines();
      if (rs.length && rs.every((r) => isChecked(r.id))) toast('오늘 루틴 완주! 🎉');
      if (navigator.vibrate) try { navigator.vibrate(12); } catch (_) {}
    }
    render();
    const b = $(`[data-act="toggle-routine"][data-id="${el.dataset.id}"]`); if (b && on) b.classList.add('anim');
  },
  'del-routine': async (el) => {
    const id = el.dataset.id; closeModal();
    if (!(await ask('루틴을 삭제할까요?', '체크 기록도 함께 사라져요.', '삭제', true))) return;
    S.routines = S.routines.filter((r) => r.id !== id);
    Object.keys(S.checks).forEach((k) => { S.checks[k] = S.checks[k].filter((x) => x !== id); if (!S.checks[k].length) delete S.checks[k]; });
    save(); render(); toast('루틴을 삭제했어요');
  },

  'toggle-notify': async () => {
    if (S.settings.notify) { S.settings.notify = false; save(); render(); return; }
    if (!('Notification' in window)) return toast(isIOS() ? '홈 화면에 추가한 앱에서 켜주세요' : '이 브라우저는 알림을 지원하지 않아요');
    let p = Notification.permission;
    if (p === 'default') p = await Notification.requestPermission();
    if (p !== 'granted') { render(); return toast('알림 권한이 필요해요'); }
    S.settings.notify = true; save(); render(); registerPeriodic();
    toast('루틴 알림을 켰어요 🔔');
  },
  'toggle-remind': () => { S.settings.remind = !S.settings.remind; save(); render(); },
  'test-notify': async () => {
    if (!('Notification' in window)) return toast('이 브라우저는 알림을 지원하지 않아요');
    let p = Notification.permission;
    if (p === 'default') p = await Notification.requestPermission();
    if (p !== 'granted') return toast('알림 권한이 필요해요');
    await notify('🌿 나의 숲', '알림이 잘 도착했어요!', 'test');
    render();
  },
  install: async () => { if (!installEvt) return; installEvt.prompt(); await installEvt.userChoice; installEvt = null; render(); },
  export: () => {
    const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `나의숲-백업-${dkey()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('백업 파일을 저장했어요');
  },
  reset: async () => {
    if (!(await ask('모든 기록을 지울까요?', '메모, 계획, 루틴과 체크 기록이 전부 사라지고 처음 상태로 돌아가요.', '모두 지우기', true))) return;
    S = seed(); save(); toast('초기화했어요'); go('#today');
  },
};
function closeDrawer() { $('#sidebar').classList.remove('open'); $('#scrim').classList.remove('open'); }

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = actions[el.dataset.act];
  if (fn) { e.preventDefault(); fn(el, e); }
});
document.addEventListener('submit', (e) => {
  const f = e.target.closest('[data-form]'); if (!f) return;
  e.preventDefault();
  if (f.dataset.form === 'quick-memo') {
    const v = f.q.value.trim(); if (!v) return;
    let sec = S.sections.find((s) => s.type === 'memo');
    if (!sec) { sec = { id: uid(), name: '메모', icon: '📝', type: 'memo', created: Date.now() }; S.sections.push(sec); }
    const [first, ...rest] = v.split('\n');
    const m = newMemo(sec.id); m.title = first.slice(0, 60); m.body = rest.join('\n'); save();
    f.q.value = ''; toast(`${sec.icon} ${sec.name}에 기록했어요`); render();
  }
  if (f.dataset.form === 'quick-plan') {
    const v = f.title.value.trim(); if (!v) return;
    S.plans.push({ id: uid(), sectionId: f.dataset.sec, title: v, note: '', due: f.due.value || '', priority: 0, done: false, steps: [], created: Date.now() });
    save(); render(); setTimeout(() => $('[data-form="quick-plan"] input[name="title"]')?.focus(), 0);
  }
});
document.addEventListener('input', (e) => {
  if (e.target.id === 'searchInput') { view.q = e.target.value; $('#searchResults').innerHTML = searchResults(view.q); }
  if (e.target.id === 'memoFilter') {
    view.mq = e.target.value;
    const sec = S.sections.find((s) => s.id === view.id);
    const all = S.memos.filter((m) => m.sectionId === sec.id);
    const q = view.mq.trim().toLowerCase();
    const ms = all.filter((m) => !q || (m.title + ' ' + m.body).toLowerCase().includes(q)).sort((a, b) => (b.pinned - a.pinned) || b.updated - a.updated);
    $('#memoList').innerHTML = memoGrid(ms, all.length);
  }
});
document.addEventListener('change', async (e) => {
  const k = e.target.dataset.change;
  if (k === 'remindAt') { S.settings.remindAt = e.target.value || '21:00'; save(); }
  if (k === 'import') {
    const file = e.target.files[0]; if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data.sections)) throw new Error('bad');
      if (!(await ask('백업을 불러올까요?', `섹션 ${data.sections.length}개, 메모 ${(data.memos || []).length}개, 계획 ${(data.plans || []).length}개, 루틴 ${(data.routines || []).length}개를 불러와요. 지금 기록은 대체돼요.`, '불러오기'))) return;
      S = normalize(data); save(); toast('백업을 불러왔어요'); go('#today');
    } catch (_) { toast('올바른 백업 파일이 아니에요'); }
    e.target.value = '';
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { if ($('#modal').classList.contains('open')) closeModal(false); else if ($('#sheet').classList.contains('open')) closeSheet(); else closeDrawer(); }
});
document.addEventListener('toggle', (e) => { if (e.target.matches?.('details.done-group')) view.showDone = e.target.open; }, true);

let toastTm;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTm); toastTm = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ───────── notifications ───────── */
async function notify(title, body, tag) {
  try {
    const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : null;
    const opts = { body, tag, icon: 'icons/icon-192.png', badge: 'icons/badge-96.png', data: { url: './#today' } };
    if (reg) await reg.showNotification(title, opts); else new Notification(title, opts);
  } catch (e) { console.warn('notify failed', e); }
}
function tick() {
  if (!S.settings.notify || !('Notification' in window) || Notification.permission !== 'granted') return;
  const now = new Date(); const today = dkey(now); const nowMin = now.getHours() * 60 + now.getMinutes();
  const n = S.settings.notified;
  if (n.date !== today) { n.date = today; n.ids = []; n.reminded = false; }
  let changed = false;
  for (const r of todayRoutines()) {
    if (!r.time || isChecked(r.id) || n.ids.includes(r.id)) continue;
    const diff = nowMin - toMin(r.time);
    if (diff >= 0 && diff <= 15) { notify(`${r.icon || '🌱'} ${r.name}`, `${r.time} · 루틴할 시간이에요!`, `r-${r.id}-${today}`); n.ids.push(r.id); changed = true; }
    else if (diff > 15) { n.ids.push(r.id); changed = true; }
  }
  if (S.settings.remind && !n.reminded && S.settings.remindAt) {
    const diff = nowMin - toMin(S.settings.remindAt);
    if (diff >= 0) {
      const left = todayRoutines().filter((r) => !isChecked(r.id));
      if (left.length && diff <= 30) notify('🌙 오늘의 루틴', `${left.length}개 남았어요: ${left.slice(0, 3).map((r) => r.name).join(', ')}${left.length > 3 ? ' …' : ''}`, `remind-${today}`);
      n.reminded = true; changed = true;
    }
  }
  if (changed) save(true);
}

/* mirror schedule to IndexedDB so the service worker can read it */
function idb() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('grove', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
}
async function syncSchedule() {
  try {
    const db = await idb();
    const t = dkey(); const y = dkey(addDays(new Date(), -1));
    const sched = {
      notify: S.settings.notify, remind: S.settings.remind, remindAt: S.settings.remindAt,
      routines: todayRoutinesAll().map(({ id, name, icon, time, days }) => ({ id, name, icon, time, days })),
      checks: { [t]: S.checks[t] || [], [y]: S.checks[y] || [] },
      notified: S.settings.notified,
    };
    const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(sched, 'sched');
  } catch (_) {}
}
function todayRoutinesAll() { const secs = new Set(S.sections.filter((s) => s.type === 'routine').map((s) => s.id)); return S.routines.filter((r) => secs.has(r.sectionId)); }

async function registerPeriodic() {
  try {
    const reg = await navigator.serviceWorker?.ready;
    if (!reg || !('periodicSync' in reg)) return;
    const st = await navigator.permissions.query({ name: 'periodic-background-sync' });
    if (st.state === 'granted') await reg.periodicSync.register('routine-check', { minInterval: 15 * 60 * 1000 });
  } catch (_) {}
}

/* ───────── PWA ───────── */
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then(() => { if (S.settings.notify) registerPeriodic(); }).catch((e) => console.warn('SW 등록 실패', e));
  });
  navigator.serviceWorker.addEventListener('message', (e) => { if (e.data?.type === 'goto') go(e.data.hash || '#today'); });
}
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvt = e; if (view.name === 'settings') render(); });
window.addEventListener('appinstalled', () => { installEvt = null; toast('홈 화면에 설치했어요 🌿'); });

/* refresh when day changes or app comes back */
let lastDay = dkey();
function heartbeat() {
  if (dkey() !== lastDay) { lastDay = dkey(); if (!$('#sheet').classList.contains('open')) render(); }
  tick();
}
setInterval(heartbeat, 20000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { heartbeat(); if (!$('#sheet').classList.contains('open') && !$('#modal').classList.contains('open')) render(); } });

/* boot */
if (location.hash === '#new-memo') { render(); quickNewMemo(); }
else { view = parseHash(); render(); }
save(true);
tick();
