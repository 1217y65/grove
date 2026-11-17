/* Grove */
'use strict';

/* ───────── helpers ───────── */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const pad = (n) => String(n).padStart(2, '0');
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WD2 = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const WDL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const dkey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hhmm = (d = new Date()) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const parseKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

const KEY = 'grove-data-v1';
const ICONS = ['📝', '🎯', '🌱', '✨', '💭', '💡', '📚', '📖', '🎓', '🏫', '✏️', '🧪', '🧠', '💼', '💻', '📅', '🗂️', '📌', '🏃', '🧘', '💪', '💧', '🍎', '💤', '🎵', '🎬', '🎨', '📷', '✈️', '🏠', '💰', '🛒', '❤️', '🙏', '⭐', '🔥', '🌿', '🌸', '☕', '🎁', '🐶', '🌙'];
const TYPES = {
  memo: { icon: '📝', label: 'Memo', desc: 'Notes · Thoughts' },
  plan: { icon: '🎯', label: 'Plan', desc: 'Tasks · Goals' },
  routine: { icon: '🌱', label: 'Routine', desc: 'Daily habits' },
  inspo: { icon: '✨', label: 'Inspiration', desc: 'Films · Books · Quotes' },
};
const KINDS = {
  film: { icon: '🎬', label: 'Film', who: 'Director', title: 'Title' },
  book: { icon: '📚', label: 'Book', who: 'Author', title: 'Title' },
  quote: { icon: '💬', label: 'Quote', who: 'Said by', title: 'Source' },
  music: { icon: '🎵', label: 'Music', who: 'Artist', title: 'Title' },
  other: { icon: '✨', label: 'Other', who: 'By', title: 'Title' },
};
const firstGrapheme = (str) => {
  str = (str || '').trim(); if (!str) return '';
  try { return [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(str)][0].segment; } catch (_) { return [...str][0]; }
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
  const memo = s('Memo', '📝', 'memo');
  const plan = s('Plan', '🎯', 'plan');
  const routine = s('Routine', '🌱', 'routine');
  const inspo = s('Inspiration', '✨', 'inspo');
  const now = Date.now();
  return {
    v: 3,
    sections: [memo, plan, routine, inspo],
    inspos: [
      { id: uid(), sectionId: inspo.id, kind: 'quote', text: 'The best time to plant a tree was 20 years ago. The second best time is now.', title: '', who: 'Proverb', note: '', rating: 0, date: dkey(), created: now, updated: now },
    ],
    memos: [
      {
        id: uid(), sectionId: memo.id, pinned: true, created: now, updated: now,
        title: 'Welcome to Grove 🌿',
        body: '• Use "+ New section" in the sidebar to add as many spaces as you like.\n  - Memo: notes, thoughts, journaling, ideas\n  - Plan: tasks, goals, projects\n  - Routine: daily or weekly habits\n  - Inspiration: films, books, quotes\n\n• Give a routine a time and turn on notifications in Settings to get reminded.\n• On your phone, "Add to Home Screen" to use Grove like an app.\n\nFeel free to delete this memo.',
      },
    ],
    plans: [
      { id: uid(), sectionId: plan.id, title: 'Explore Grove', note: '', due: dkey(), priority: 1, done: false, created: now,
        steps: [{ id: uid(), text: 'Create a new section', done: false }, { id: uid(), text: 'Check off a routine', done: false }, { id: uid(), text: 'Turn on notifications', done: false }] },
    ],
    routines: [
      { id: uid(), sectionId: routine.id, name: 'Drink a glass of water', icon: '💧', times: ['08:00', '13:00', '17:00'], days: [0, 1, 2, 3, 4, 5, 6], created: now },
      { id: uid(), sectionId: routine.id, name: 'Daily reflection', icon: '✏️', times: ['22:00'], days: [0, 1, 2, 3, 4, 5, 6], created: now },
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
  d.sections ||= []; d.memos ||= []; d.plans ||= []; d.routines ||= []; d.inspos ||= []; d.checks ||= {};
  d.settings = Object.assign({ notify: false, remindAt: '21:00', remind: true, notified: {} }, d.settings || {});
  if ((d.v || 1) < 2) migrateV2(d);
  if (d.v < 3) {
    if (!d.sections.some((s) => s.type === 'inspo')) d.sections.push({ id: uid(), name: 'Inspiration', icon: '✨', type: 'inspo', created: Date.now() });
    d.v = 3;
  }
  d.sections.forEach((s) => { if (s.type === 'plan') s.groups ||= []; });
  d.routines.forEach((r) => { if (!Array.isArray(r.times)) r.times = r.time ? [r.time] : []; delete r.time; });
  return d;
}
/* v2: English default section names, drop the old "생각 정리" section (its memos move to Memo) */
function migrateV2(d) {
  const rename = { '메모': 'Memo', '계획': 'Plan', '매일 루틴': 'Routine' };
  d.sections.forEach((s) => { if (rename[s.name]) s.name = rename[s.name]; });
  const think = d.sections.find((s) => s.name === '생각 정리' && s.type === 'memo');
  if (think) {
    const welcome = '나의 숲 사용법 🌿';
    d.memos = d.memos.filter((m) => !(m.sectionId === think.id && m.title === welcome));
    const rest = d.memos.filter((m) => m.sectionId === think.id);
    if (rest.length) {
      let memo = d.sections.find((s) => s.type === 'memo' && s.id !== think.id);
      if (!memo) { memo = { id: uid(), name: 'Memo', icon: '📝', type: 'memo', created: Date.now() }; d.sections.unshift(memo); }
      rest.forEach((m) => { m.sectionId = memo.id; });
    }
    d.sections = d.sections.filter((s) => s.id !== think.id);
  }
  const sample = { '\uB098\uC758 \uC232 \uB458\uB7EC\uBCF4\uAE30': 'Explore Grove', '\uC139\uC158 \uD558\uB098 \uB9CC\uB4E4\uC5B4\uBCF4\uAE30': 'Create a new section', '\uB8E8\uD2F4 \uCCB4\uD06C\uD574\uBCF4\uAE30': 'Check off a routine', '\uC54C\uB9BC \uCF1C\uAE30': 'Turn on notifications', '\uBB3C \uD55C \uC794 \uB9C8\uC2DC\uAE30': 'Drink a glass of water', '\uD558\uB8E8 \uB3CC\uC544\uBCF4\uAE30': 'Daily reflection' };
  d.plans.forEach((p) => { if (sample[p.title]) p.title = sample[p.title]; (p.steps || []).forEach((st) => { if (sample[st.text]) st.text = sample[st.text]; }); });
  d.routines.forEach((r) => { if (sample[r.name]) r.name = sample[r.name]; });
  d.v = 2;
}

let saveTimer;
function save(quiet) {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Storage is full'); }
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
  if (s === '0123456') return 'Every day';
  if (s === '12345') return 'Weekdays';
  if (s === '06') return 'Weekends';
  return [1, 2, 3, 4, 5, 6, 0].filter((x) => days.includes(x)).map((x) => WD[x]).join(' · ');
}
function todayRoutines() {
  const routineSecs = new Set(S.sections.filter((s) => s.type === 'routine').map((s) => s.id));
  return S.routines.filter((r) => routineSecs.has(r.sectionId) && isOn(r)).sort(byTime);
}
const byTime = (a, b) => (a.times?.[0] || '99:99').localeCompare(b.times?.[0] || '99:99');
const timesLabel = (ts) => ts.length <= 3 ? ts.join(' · ') : `${ts.slice(0, 2).join(' · ')} +${ts.length - 2}`;

/* ───────── plan helpers ───────── */
function dueLabel(due) {
  if (!due) return '';
  const t = dkey();
  const diff = Math.round((parseKey(due) - parseKey(t)) / 864e5);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  const d = parseKey(due);
  const base = `${WD[d.getDay()]}, ${MON[d.getMonth()]} ${d.getDate()}`;
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
  if (h.startsWith('s-')) { const [id, group] = h.slice(2).split('-'); return { name: 'section', id, group: group || null }; }
  if (h === 'search') return { name: 'search', q: view.q || '' };
  if (h === 'settings') return { name: 'settings' };
  return { name: 'today' };
}
function go(hash) { if (location.hash === hash) render(); else location.hash = hash; }
window.addEventListener('hashchange', () => {
  if (location.hash === '#new-memo') return quickNewMemo();
  const prev = view; view = parseHash(); if (prev.name === 'section' && view.name === 'section' && prev.id === view.id) view.kind = prev.kind; closeDrawer(); render(); window.scrollTo(0, 0);
});

/* ───────── render ───────── */
function render() {
  renderSidebar();
  const main = $('#main');
  let title = 'Grove';
  if (view.name === 'today') main.innerHTML = renderToday();
  else if (view.name === 'search') { main.innerHTML = renderSearch(); title = 'Search'; }
  else if (view.name === 'settings') { main.innerHTML = renderSettings(); title = 'Settings'; }
  else if (view.name === 'section') {
    const sec = S.sections.find((s) => s.id === view.id);
    if (!sec) { view = { name: 'today' }; return go('#today'); }
    title = `${sec.icon} ${sec.name}`;
    const grp = sec.type === 'plan' && view.group ? (sec.groups || []).find((g) => g.id === view.group) : null;
    if (grp) title = `${grp.icon} ${grp.name}`;
    main.innerHTML = sec.type === 'memo' ? renderMemoSection(sec) : sec.type === 'plan' ? renderPlanSection(sec) : sec.type === 'inspo' ? renderInspoSection(sec) : renderRoutineSection(sec);
  }
  $('#topbarTitle').textContent = title;
  document.title = title === 'Grove' ? 'Grove' : `${title} · Grove`;
  if (view.name === 'search') { const i = $('#searchInput'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }
}

function renderSidebar() {
  const active = (n, id, g) => (view.name === n && (!id || view.id === id) && (g === undefined || (view.group || null) === g) ? ' active' : '');
  const count = (s) => s.type === 'memo' ? S.memos.filter((m) => m.sectionId === s.id).length
    : s.type === 'inspo' ? S.inspos.filter((x) => x.sectionId === s.id).length
    : s.type === 'plan' ? S.plans.filter((p) => p.sectionId === s.id && !p.done).length
      : (() => { const rs = S.routines.filter((r) => r.sectionId === s.id && isOn(r)); return rs.length ? `${rs.filter((r) => isChecked(r.id)).length}/${rs.length}` : ''; })();
  $('#sidebar').innerHTML = `
    <div class="brand">
      <div class="brand-mark">${svgLeaf}</div>
      <div class="brand-name">Grove</div>
    </div>
    <button class="nav-item${active('today')}" data-act="go" data-to="#today"><span class="ni-icon">🏡</span><span class="ni-label">Today</span></button>
    <div class="nav-head"><span>SECTIONS</span><button class="nav-add" data-act="new-section" aria-label="Add section">+</button></div>
    <div class="nav-sections">
      ${S.sections.map((s) => `
        <button class="nav-item${active('section', s.id, s.type === 'plan' ? null : undefined)}" data-act="go" data-to="#s-${s.id}">
          <span class="ni-icon">${esc(s.icon)}</span><span class="ni-label">${esc(s.name)}</span>
          <span class="ni-count">${count(s)}</span>
        </button>
        ${s.type === 'plan' ? (s.groups || []).map((g) => `
        <button class="nav-item nav-sub${active('section', s.id, g.id)}" data-act="go" data-to="#s-${s.id}-${g.id}">
          <span class="ni-icon">${esc(g.icon)}</span><span class="ni-label">${esc(g.name)}</span>
          <span class="ni-count">${S.plans.filter((p) => p.groupId === g.id && !p.done).length || ''}</span>
        </button>`).join('') : ''}`).join('')}
    </div>
    <button class="nav-new" data-act="new-section">＋ New section</button>
    <div class="nav-spacer"></div>
    <button class="nav-item${active('search')}" data-act="go" data-to="#search"><span class="ni-icon">🔍</span><span class="ni-label">Search</span></button>
    <button class="nav-item${active('settings')}" data-act="go" data-to="#settings"><span class="ni-icon">⚙️</span><span class="ni-label">Settings</span></button>
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
  if (h < 5) return 'Good night 🌙';
  if (h < 11) return 'Good morning ☀️';
  if (h < 17) return 'Good afternoon 🌿';
  if (h < 21) return 'Good evening 🌇';
  return 'Wind down, well done 🌙';
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
  const msg = !rs.length ? 'No routines scheduled today' : done === rs.length ? 'All done for today! 🎉' : `${rs.length - done} to go — one step at a time.`;

  return `
    <div class="hello">${greeting()}</div>
    <h1 class="page-title display">${WDL[now.getDay()]}, ${MONL[now.getMonth()]} ${now.getDate()}</h1>
    <form class="card quick" data-form="quick-memo">
      <input name="q" placeholder="💭 Capture a thought…" autocomplete="off" />
      <button class="btn btn-primary btn-sm" type="submit">Save</button>
    </form>

    <div class="progress-card">
      ${ring(pct)}
      <div class="pc-text">
        <div class="pc-big">Today's routines ${done}/${rs.length}</div>
        <div class="pc-small">${msg}</div>
      </div>
    </div>

    <div class="section-title">🌱 Routines</div>
    ${rs.length ? `<div class="list">${rs.map((r) => routineRow(r, true)).join('')}</div>`
      : `<div class="empty"><div class="e-icon">🌱</div>Add daily habits in a Routine section</div>`}

    <div class="grid-2">
      <div>
        <div class="section-title">🎯 Upcoming <span class="count">${urgent.length}</span></div>
        ${urgent.length ? `<div class="list">${urgent.slice(0, 8).map((p) => planRow(p, true)).join('')}</div>`
          : `<div class="empty">Nothing due in the next 7 days</div>`}
      </div>
      <div>
        <div class="section-title">📝 Memos</div>
        ${recent.length ? `<div class="list">${recent.map((m) => `
          <button class="card memo" style="min-height:0" data-act="open-memo" data-id="${m.id}">
            <div class="m-title">${m.pinned ? `<span class="pin">${svgPin(true)}</span>` : ''}<span>${esc(m.title || 'Untitled')}</span></div>
            ${m.body ? `<div class="m-body" style="-webkit-line-clamp:2">${esc(m.body)}</div>` : ''}
            <div class="m-date">${secName(m.sectionId)} · ${relTime(m.updated)}</div>
          </button>`).join('')}</div>` : `<div class="empty">No memos yet</div>`}
      </div>
    </div>
    ${(() => {
      const secs = new Set(S.sections.filter((x) => x.type === 'inspo').map((x) => x.id));
      const pool = S.inspos.filter((x) => secs.has(x.sectionId) && x.text);
      if (!pool.length) return '';
      const seedN = [...dkey()].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0;
      return `<div class="section-title">✨ Inspiration</div>${inspoCard(pool[seedN % pool.length], true)}`;
    })()}
    <div>
    </div>
    ${t ? '' : ''}`;
}
const secName = (id) => { const s = S.sections.find((x) => x.id === id); return s ? `${esc(s.icon)} ${esc(s.name)}` : ''; };
function relTime(ts) {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const d = new Date(ts);
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return `${MON[d.getMonth()]} ${d.getDate()}${d.getFullYear() !== new Date().getFullYear() ? ', ' + d.getFullYear() : ''}`;
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
    dots.push(`<div class="d${i === 0 ? ' today' : ''}"><div class="dot${c ? ' on' : sched ? '' : ' skip'}"></div><span>${WD2[d.getDay()]}</span></div>`);
  }
  return `
    <div class="card routine${done ? ' done' : ''}${on ? '' : ' off'}">
      <button class="check${done ? ' on' : ''}" data-act="toggle-routine" data-id="${r.id}" aria-label="Mark done" ${on ? '' : 'disabled'}>${svgCheck}</button>
      <button class="r-main" data-act="edit-routine" data-id="${r.id}">
        <div class="r-name">${esc(r.icon || '')} ${esc(r.name)}</div>
        <div class="r-meta">
          ${r.times?.length ? `<span>⏰ ${timesLabel(r.times)}</span>` : ''}<span>${daysLabel(r.days)}</span>
          ${st ? `<span class="streak">🔥 ${st}-day streak</span>` : ''}
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
      <button class="icon-btn" data-act="edit-section" data-id="${sec.id}" aria-label="Section settings">${svgMore}</button>
    </div>`;
}
function renderRoutineSection(sec) {
  const all = S.routines.filter((r) => r.sectionId === sec.id).sort(byTime);
  const today = all.filter((r) => isOn(r));
  const rest = all.filter((r) => !isOn(r));
  const done = today.filter((r) => isChecked(r.id)).length;
  return `
    ${sectionHead(sec, `Routine · ${done}/${today.length} done today`)}
    ${today.length ? `<div class="list">${today.map((r) => routineRow(r)).join('')}</div>`
      : `<div class="empty"><div class="e-icon">🌱</div>Nothing scheduled for today.<br/>Add a habit with the button below.</div>`}
    ${rest.length ? `<div class="section-title">😴 Resting today <span class="count">${rest.length}</span></div>
      <div class="list">${rest.map((r) => routineRow(r)).join('')}</div>` : ''}
    <button class="fab" data-act="new-routine" data-sec="${sec.id}"><span style="font-size:22px;line-height:1">＋</span>New routine</button>`;
}

/* ── Memo ── */
function renderMemoSection(sec) {
  const q = (view.mq || '').trim().toLowerCase();
  let ms = S.memos.filter((m) => m.sectionId === sec.id);
  const total = ms.length;
  if (q) ms = ms.filter((m) => (m.title + ' ' + m.body).toLowerCase().includes(q));
  ms.sort((a, b) => (b.pinned - a.pinned) || b.updated - a.updated);
  return `
    ${sectionHead(sec, `${total} memo${total === 1 ? '' : 's'}`)}
    ${total > 3 ? `<div class="toolbar-row"><label class="search-box">🔍<input id="memoFilter" placeholder="Search this section" value="${esc(view.mq || '')}" /></label></div>` : ''}
    <div id="memoList">${memoGrid(ms, total)}</div>
    <button class="fab" data-act="new-memo" data-sec="${sec.id}"><span style="font-size:22px;line-height:1">＋</span>New memo</button>`;
}
function memoGrid(ms, total) {
  if (!ms.length) return `<div class="empty"><div class="e-icon">💭</div>${total ? 'No matching memos' : 'Write your first memo'}</div>`;
  return `<div class="memo-grid">${ms.map((m) => `
    <button class="card memo" data-act="open-memo" data-id="${m.id}">
      <div class="m-title">${m.pinned ? `<span class="pin">${svgPin(true)}</span>` : ''}<span>${esc(m.title || 'Untitled')}</span></div>
      <div class="m-body">${esc(m.body)}</div>
      <div class="m-date">${relTime(m.updated)}</div>
    </button>`).join('')}</div>`;
}

/* ── Plan ── */
function groupOf(p) {
  if (!p.groupId) return null;
  const sec = S.sections.find((s) => s.id === p.sectionId);
  return (sec?.groups || []).find((g) => g.id === p.groupId) || null;
}
function planRow(p, showSec, showGroup) {
  const g = planGroup(p);
  const grp = showGroup ? groupOf(p) : null;
  const sd = p.steps?.length ? p.steps.filter((s) => s.done).length : 0;
  return `
    <div class="card plan${p.done ? ' done' : ''}">
      <button class="check sq${p.done ? ' on' : ''}" data-act="toggle-plan" data-id="${p.id}" aria-label="Done">${svgCheck}</button>
      <button class="p-main" data-act="open-plan" data-id="${p.id}">
        <div class="p-title">${esc(p.title || 'Untitled')}</div>
        <div class="p-meta">
          <span class="prio p${p.priority || 0}"></span>
          ${p.due ? `<span class="chip${g === 'overdue' ? ' over' : g === 'today' ? ' today' : ''}">📅 ${dueLabel(p.due)}</span>` : ''}
          ${p.steps?.length ? `<span class="chip">${sd}/${p.steps.length}</span><span class="mini-bar"><i style="width:${(sd / p.steps.length) * 100}%"></i></span>` : ''}
          ${grp ? `<span class="chip sec">${esc(grp.icon)} ${esc(grp.name)}</span>` : ''}
          ${showSec ? `<span class="chip sec">${secName(p.sectionId)}${(() => { const x = groupOf(p); return x ? ` › ${esc(x.icon)} ${esc(x.name)}` : ''; })()}</span>` : ''}
        </div>
      </button>
    </div>`;
}
function renderPlanSection(sec) {
  const gl = sec.groups || [];
  const cur = view.group ? gl.find((g) => g.id === view.group) : null;
  if (view.group && !cur) view.group = null;
  const all = S.plans.filter((p) => p.sectionId === sec.id);
  const ps = cur ? all.filter((p) => p.groupId === cur.id) : all;
  const showGroup = !cur && gl.length > 0;
  const groups = { overdue: [], today: [], upcoming: [], nodate: [], done: [] };
  ps.forEach((p) => groups[planGroup(p)].push(p));
  const sortDue = (a, b) => (a.due || '').localeCompare(b.due || '') || (b.priority || 0) - (a.priority || 0);
  Object.values(groups).forEach((g) => g.sort(sortDue));
  groups.nodate.sort((a, b) => (b.priority || 0) - (a.priority || 0) || a.created - b.created);
  groups.done.sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0));
  const block = (key, label) => groups[key].length ? `
    <div class="section-title">${label} <span class="count">${groups[key].length}</span></div>
    <div class="list">${groups[key].map((p) => planRow(p, false, showGroup)).join('')}</div>` : '';
  const open = ps.length - groups.done.length;
  return `
    ${sectionHead(sec, `${open} in progress · ${groups.done.length} done`)}
    <div class="tabs">
      <button class="tab${cur ? '' : ' on'}" data-act="go" data-to="#s-${sec.id}">All <span>${all.filter((p) => !p.done).length}</span></button>
      ${gl.map((g) => `<button class="tab${cur?.id === g.id ? ' on' : ''}" data-act="go" data-to="#s-${sec.id}-${g.id}">${esc(g.icon)} ${esc(g.name)} <span>${all.filter((p) => p.groupId === g.id && !p.done).length}</span></button>`).join('')}
      <button class="tab add" data-act="new-group" data-sec="${sec.id}">＋ Group</button>
    </div>
    ${cur ? `<div class="group-head"><span class="gh-icon">${esc(cur.icon)}</span><span class="gh-name">${esc(cur.name)}</span><button class="btn btn-ghost btn-sm" data-act="edit-group" data-sec="${sec.id}" data-id="${cur.id}">Edit group</button></div>` : ''}
    <form class="card quick-add" data-form="quick-plan" data-sec="${sec.id}" data-group="${cur?.id || ''}">
      <span style="color:var(--ink-3);font-size:18px">＋</span>
      <input name="title" placeholder="Add a plan…" autocomplete="off" />
      <input name="due" type="date" aria-label="Due date" />
    </form>
    ${!ps.length ? `<div class="empty" style="margin-top:14px"><div class="e-icon">${cur ? esc(cur.icon) : '🎯'}</div>${cur ? `Nothing in ${esc(cur.name)} yet` : 'What do you want to get done?'}${!cur && !gl.length ? '<br/><span style="font-size:13px">Tip: use ＋ Group to split plans, e.g. School or Work</span>' : ''}</div>` : ''}
    ${block('overdue', '⚠️ Overdue')}
    ${block('today', '☀️ Today')}
    ${block('upcoming', '🗓️ Upcoming')}
    ${block('nodate', '📋 Someday')}
    ${groups.done.length ? `<details class="done-group"${view.showDone ? ' open' : ''}>
      <summary class="section-title">✅ Completed <span class="count">${groups.done.length}</span><span class="link">Show / hide</span></summary>
      <div class="list">${groups.done.map((p) => planRow(p, false, showGroup)).join('')}</div></details>` : ''}`;
}

/* ── Inspiration ── */
const stars = (n, size = 13) => n ? `<span class="stars" style="font-size:${size}px">${'★'.repeat(n)}<i>${'★'.repeat(5 - n)}</i></span>` : '';
function inspoCard(x, wide) {
  const k = KINDS[x.kind] || KINDS.other;
  if (x.kind === 'quote' || (!x.title && x.text)) {
    return `<button class="card inspo quote${wide ? ' wide' : ''}" data-act="open-inspo" data-id="${x.id}">
      <div class="q-text">${esc(x.text || x.title)}</div>
      <div class="q-by">${x.who ? `— ${esc(x.who)}` : ''}${x.title && x.text ? `${x.who ? ', ' : '— '}<i>${esc(x.title)}</i>` : ''}</div>
      ${x.kind !== 'quote' ? `<div class="i-kind">${k.icon} ${k.label}</div>` : ''}
    </button>`;
  }
  return `<button class="card inspo${wide ? ' wide' : ''}" data-act="open-inspo" data-id="${x.id}">
    <div class="i-kind">${k.icon} ${k.label}${x.date ? ` · ${dueLabel(x.date).replace(/ · D-\d+$/, '')}` : ''}</div>
    <div class="i-title">${esc(x.title || 'Untitled')}</div>
    ${x.who ? `<div class="i-who">${esc(x.who)}</div>` : ''}
    ${stars(x.rating)}
    ${x.text ? `<div class="i-line">“${esc(x.text)}”</div>` : x.note ? `<div class="i-note">${esc(x.note)}</div>` : ''}
  </button>`;
}
function renderInspoSection(sec) {
  const all = S.inspos.filter((x) => x.sectionId === sec.id).sort((a, b) => b.created - a.created);
  const kind = view.kind && KINDS[view.kind] ? view.kind : '';
  const xs = kind ? all.filter((x) => x.kind === kind) : all;
  return `
    ${sectionHead(sec, `${all.length} saved · films, books, quotes & more`)}
    <div class="tabs">
      <button class="tab${kind ? '' : ' on'}" data-act="inspo-kind" data-k="">All <span>${all.length}</span></button>
      ${Object.entries(KINDS).map(([k, v]) => `<button class="tab${kind === k ? ' on' : ''}" data-act="inspo-kind" data-k="${k}">${v.icon} ${v.label}${all.filter((x) => x.kind === k).length ? ` <span>${all.filter((x) => x.kind === k).length}</span>` : ''}</button>`).join('')}
    </div>
    ${xs.length ? `<div class="inspo-grid">${xs.map((x) => inspoCard(x)).join('')}</div>`
      : `<div class="empty"><div class="e-icon">${kind ? KINDS[kind].icon : '✨'}</div>${kind ? `No ${KINDS[kind].label.toLowerCase()}s yet` : 'Save the films, books and words that move you'}</div>`}
    <button class="fab" data-act="new-inspo" data-sec="${sec.id}"><span style="font-size:22px;line-height:1">＋</span>Add</button>`;
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
    <div class="page-head"><div class="page-icon">🔍</div><div class="grow"><h1 class="page-title">Search</h1><div class="page-sub">Across all memos, plans and routines</div></div></div>
    <label class="search-box" style="height:46px">🔍<input id="searchInput" placeholder="What are you looking for?" value="${esc(view.q || '')}" autocomplete="off" /></label>
    <div id="searchResults">${searchResults(view.q || '')}</div>`;
}
function searchResults(q) {
  q = q.trim();
  if (!q) return `<div class="empty" style="margin-top:18px">Type to search</div>`;
  const lq = q.toLowerCase();
  const ms = S.memos.filter((m) => (m.title + ' ' + m.body).toLowerCase().includes(lq)).sort((a, b) => b.updated - a.updated);
  const ps = S.plans.filter((p) => (p.title + ' ' + (p.note || '') + ' ' + (p.steps || []).map((s) => s.text).join(' ')).toLowerCase().includes(lq));
  const rs = S.routines.filter((r) => r.name.toLowerCase().includes(lq));
  const xs = S.inspos.filter((x) => [x.title, x.who, x.text, x.note].join(' ').toLowerCase().includes(lq));
  if (!ms.length && !ps.length && !rs.length && !xs.length) return `<div class="empty" style="margin-top:18px">No results for "${esc(q)}"</div>`;
  return `
    ${ms.length ? `<div class="section-title">📝 Memos <span class="count">${ms.length}</span></div><div class="list">${ms.map((m) => `
      <button class="card memo" style="min-height:0" data-act="open-memo" data-id="${m.id}">
        <div class="m-title"><span>${hl(m.title || 'Untitled', q)}</span></div>
        <div class="m-body" style="-webkit-line-clamp:2">${hl(snippet(m.body, q), q)}</div>
        <div class="m-date">${secName(m.sectionId)} · ${relTime(m.updated)}</div>
      </button>`).join('')}</div>` : ''}
    ${ps.length ? `<div class="section-title">🎯 Plans <span class="count">${ps.length}</span></div><div class="list">${ps.map((p) => planRow(p, true)).join('')}</div>` : ''}
    ${rs.length ? `<div class="section-title">🌱 Routines <span class="count">${rs.length}</span></div><div class="list">${rs.map((r) => routineRow(r, true)).join('')}</div>` : ''}
    ${xs.length ? `<div class="section-title">✨ Inspiration <span class="count">${xs.length}</span></div><div class="inspo-grid">${xs.map((x) => inspoCard(x)).join('')}</div>` : ''}`;
}

/* ── Settings ── */
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
function renderSettings() {
  const perm = 'Notification' in window ? Notification.permission : 'unsupported';
  const permText = perm === 'granted' ? 'allowed' : perm === 'denied' ? 'blocked — allow it in browser settings' : perm === 'unsupported' ? 'not supported in this browser' : 'not yet allowed';
  return `
    <div class="page-head"><div class="page-icon">⚙️</div><div class="grow"><h1 class="page-title">Settings</h1><div class="page-sub">Notifications · Install · Backup</div></div></div>

    <div class="section-title">🔔 Notifications</div>
    <div class="card">
      <div class="set-row">
        <div class="s-text"><div class="s-title">Routine reminders</div><div class="s-desc">Get notified at each routine's time · Permission: ${permText}</div></div>
        <button class="switch${S.settings.notify ? ' on' : ''}" data-act="toggle-notify" aria-label="Enable notifications"></button>
      </div>
      <div class="set-row">
        <div class="s-text"><div class="s-title">Evening nudge</div><div class="s-desc">A reminder at this time if routines are still open</div></div>
        <input type="time" class="input" style="width:120px" value="${S.settings.remindAt}" data-change="remindAt" ${S.settings.remind ? '' : 'disabled'} />
        <button class="switch${S.settings.remind ? ' on' : ''}" data-act="toggle-remind" aria-label="Evening nudge"></button>
      </div>
      <div class="set-row">
        <div class="s-text"><div class="s-title">Send a test notification</div><div class="s-desc">Make sure notifications reach you</div></div>
        <button class="btn btn-ghost btn-sm" data-act="test-notify">Send</button>
      </div>
    </div>
    <div class="note">💡 Reminders are most reliable while Grove is open or in the background. On Android (Chrome), installing Grove lets it check periodically even when closed. On iPhone (iOS 16.4+), add Grove to your Home Screen and open it from there to allow notifications.</div>

    <div class="section-title">📱 Install app</div>
    <div class="card">
      <div class="set-row">
        <div class="s-text"><div class="s-title">${isStandalone() ? 'Running as an app ✅' : 'Add to Home Screen'}</div>
          <div class="s-desc">${isStandalone() ? 'Opened from your Home Screen' : isIOS() ? 'In Safari, tap Share → "Add to Home Screen"' : installEvt ? 'Tap the button to install' : 'Browser menu (⋮) → "Install app" or "Add to Home screen"'}</div></div>
        ${!isStandalone() && installEvt ? '<button class="btn btn-primary btn-sm" data-act="install">Install</button>' : ''}
      </div>
    </div>

    <div class="section-title">💾 Backup</div>
    <div class="card">
      <div class="set-row">
        <div class="s-text"><div class="s-title">Export backup</div><div class="s-desc">Save everything as a .json file</div></div>
        <button class="btn btn-ghost btn-sm" data-act="export">Export</button>
      </div>
      <div class="set-row">
        <div class="s-text"><div class="s-title">Import backup</div><div class="s-desc">Restore from a .json file (replaces current data)</div></div>
        <label class="btn btn-ghost btn-sm">Import<input type="file" accept="application/json,.json" data-change="import" hidden /></label>
      </div>
      <div class="set-row">
        <div class="s-text"><div class="s-title" style="color:var(--danger)">Erase everything</div><div class="s-desc">Start fresh. This can't be undone</div></div>
        <button class="btn btn-danger btn-sm" data-act="reset">Reset</button>
      </div>
    </div>
    <div class="note">Your data lives only in this browser on this device. Export a backup before switching devices or clearing browser data.</div>`;
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
      <button class="icon-btn" data-act="close-sheet" aria-label="Close">${svgBack}</button>
      <div class="crumb">${secName(m.sectionId)}</div>
      <span class="save-state" id="saveState">Saved</span>
      <button class="icon-btn" data-act="pin-memo" aria-label="Pin" style="color:${m.pinned ? 'var(--g-600)' : 'inherit'}">${svgPin(m.pinned)}</button>
      <button class="icon-btn" data-act="del-memo" aria-label="Delete">${svgTrash}</button>
    </div>
    <div class="sheet-body"><div class="sheet-inner">
      <input class="title-input" id="mTitle" placeholder="Title" value="${esc(m.title)}" />
      <div class="meta-line">
        <span>Created ${MON[new Date(m.created).getMonth()]} ${new Date(m.created).getDate()}, ${new Date(m.created).getFullYear()}</span>
        ${memoSecs.length > 1 ? `<select class="select" id="mSec" style="width:auto;padding:3px 8px;font-size:12.5px;border-radius:8px">${memoSecs.map((s) => `<option value="${s.id}"${s.id === m.sectionId ? ' selected' : ''}>${esc(s.icon)} ${esc(s.name)}</option>`).join('')}</select>` : ''}
      </div>
      <div class="fmt-bar">
        <button data-ins="• ">• List</button>
        <button data-ins="☐ ">☐ Checkbox</button>
        <button data-ins="→ ">→ Arrow</button>
        <button data-ins="time">🕒 Time</button>
        <button data-ins="tpl-think">💭 Reflect</button>
        <button data-ins="tpl-pro">⚖️ Pros &amp; cons</button>
      </div>
      <textarea class="body-input" id="mBody" placeholder="Start writing…">${esc(m.body)}</textarea>
    </div></div>`, {
    type: 'memo', id,
    onClose: () => { if (!m.title.trim() && !m.body.trim()) { S.memos = S.memos.filter((x) => x.id !== id); save(true); } },
  });
  const t = $('#mTitle'), b = $('#mBody');
  autoGrow(b);
  let tm;
  const upd = () => {
    m.title = t.value; m.body = b.value; m.updated = Date.now();
    $('#saveState').textContent = 'Saving…';
    clearTimeout(tm); tm = setTimeout(() => { save(true); $('#saveState').textContent = 'Saved'; }, 350);
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
      'tpl-think': '■ What\'s on my mind\n• \n\n■ Why do I feel this way?\n• \n\n■ What I can do\n☐ \n\n■ In one line\n→ ',
      'tpl-pro': '■ Decision: \n\n👍 Pros\n• \n\n👎 Cons\n• \n\n✅ Verdict\n→ ',
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
        <input type="text" value="${esc(s.text)}" data-step="text" placeholder="Step" />
        <button class="x" data-step="del" aria-label="Delete">✕</button>
      </div>`).join('');
    const d = p.steps.filter((s) => s.done).length;
    $('#stepCount').textContent = p.steps.length ? `${d}/${p.steps.length}` : '';
  };
  openSheet(`
    <div class="sheet-bar">
      <button class="icon-btn" data-act="close-sheet" aria-label="Close">${svgBack}</button>
      <div class="crumb">${secName(p.sectionId)}</div>
      <button class="icon-btn" data-act="del-plan" aria-label="Delete">${svgTrash}</button>
    </div>
    <div class="sheet-body"><div class="sheet-inner">
      <div style="display:flex;gap:12px;align-items:center;margin-bottom:14px">
        <button class="check sq${p.done ? ' on' : ''}" id="pDone" style="width:28px;height:28px">${svgCheck}</button>
        <input class="title-input" id="pTitle" placeholder="Plan name" value="${esc(p.title)}" />
      </div>
      <div class="grid-2" style="gap:0 14px">
        <div class="field"><label>Due date</label><input type="date" class="input" id="pDue" value="${p.due || ''}" /></div>
        ${planSecs.length > 1 || planSecs.some((x) => (x.groups || []).length) ? `<div class="field"><label>Group</label><select class="select" id="pSec">${planSecs.map((x) => `<option value="${x.id}|"${x.id === p.sectionId && !p.groupId ? ' selected' : ''}>${esc(x.icon)} ${esc(x.name)}</option>${(x.groups || []).map((g) => `<option value="${x.id}|${g.id}"${x.id === p.sectionId && p.groupId === g.id ? ' selected' : ''}>&nbsp;&nbsp;&nbsp;${esc(x.name)} › ${esc(g.icon)} ${esc(g.name)}</option>`).join('')}`).join('')}</select></div>` : '<div></div>'}
      </div>
      <div class="field"><span class="field-label">Priority</span>
        <div class="seg" id="pPrio">${['Normal', 'High', 'Urgent'].map((l, i) => `<button data-v="${i}" class="${(p.priority || 0) === i ? 'on' : ''}">${['⚪', '🟡', '🔴'][i]} ${l}</button>`).join('')}</div>
      </div>
      <div class="field"><span class="field-label">Steps <span id="stepCount" style="color:var(--ink-3);font-weight:500"></span></span>
        <div class="steps" id="planSteps"></div>
        <form id="stepForm" style="display:flex;gap:8px;margin-top:6px"><input class="input" id="stepIn" placeholder="+ Add a step (Enter)" autocomplete="off" /><button class="btn btn-ghost" type="submit">Add</button></form>
      </div>
      <div class="field"><label>Notes</label><textarea class="textarea" id="pNote" placeholder="Details, ideas, links…">${esc(p.note || '')}</textarea></div>
    </div></div>`, {
    type: 'plan', id,
    onClose: () => { if (!p.title.trim() && !p.note && !p.steps.length) S.plans = S.plans.filter((x) => x.id !== id); save(true); },
  });
  draw();
  const upd = () => save(true);
  $('#pTitle').addEventListener('input', (e) => { p.title = e.target.value; upd(); });
  $('#pDue').addEventListener('change', (e) => { p.due = e.target.value || ''; upd(); });
  $('#pNote').addEventListener('input', (e) => { p.note = e.target.value; upd(); });
  $('#pSec')?.addEventListener('change', (e) => { const [sid, gid] = e.target.value.split('|'); p.sectionId = sid; p.groupId = gid || ''; $('.crumb').innerHTML = secName(p.sectionId); upd(); });
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

function openInspo(id) {
  const x = S.inspos.find((i) => i.id === id);
  if (!x) return;
  const draw = () => {
    const k = KINDS[x.kind];
    const isQ = x.kind === 'quote';
    $('#inspoForm').innerHTML = `
      <div class="seg kind-seg" id="iKind">${Object.entries(KINDS).map(([kk, v]) => `<button data-v="${kk}" class="${x.kind === kk ? 'on' : ''}">${v.icon} ${v.label}</button>`).join('')}</div>
      ${isQ ? `<textarea class="quote-input" id="iText" rows="3" placeholder="Write the quote…">${esc(x.text)}</textarea>`
        : `<input class="title-input" id="iTitle" placeholder="${k.label} title" value="${esc(x.title)}" />`}
      <div class="grid-2" style="gap:0 14px;margin-top:10px">
        <div class="field"><label>${k.who}</label><input class="input" id="iWho" value="${esc(x.who)}" placeholder="${isQ ? 'e.g. Maya Angelou' : k.who}" /></div>
        ${isQ ? `<div class="field"><label>Source (optional)</label><input class="input" id="iTitle" value="${esc(x.title)}" placeholder="Book, film, speech…" /></div>`
          : `<div class="field"><label>Date</label><input type="date" class="input" id="iDate" value="${x.date || ''}" /></div>`}
      </div>
      ${isQ ? '' : `<div class="field"><span class="field-label">Rating</span><div class="star-pick" id="iRate">${[1, 2, 3, 4, 5].map((n) => `<button data-v="${n}" class="${n <= x.rating ? 'on' : ''}" aria-label="${n} stars">★</button>`).join('')}</div></div>
      <div class="field"><label>Favorite line (optional)</label><textarea class="textarea" id="iText" style="min-height:70px" placeholder="A line that stayed with you">${esc(x.text)}</textarea></div>`}
      <div class="field"><label>Thoughts</label><textarea class="textarea" id="iNote" placeholder="Why it matters to you…">${esc(x.note)}</textarea></div>`;
    const upd = () => { x.updated = Date.now(); save(true); };
    $('#iKind').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; x.kind = b.dataset.v; upd(); draw(); });
    $('#iTitle')?.addEventListener('input', (e) => { x.title = e.target.value; upd(); });
    $('#iText')?.addEventListener('input', (e) => { x.text = e.target.value; upd(); });
    $('#iWho').addEventListener('input', (e) => { x.who = e.target.value; upd(); });
    $('#iNote').addEventListener('input', (e) => { x.note = e.target.value; upd(); });
    $('#iDate')?.addEventListener('change', (e) => { x.date = e.target.value; upd(); });
    $('#iRate')?.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; const v = +b.dataset.v; x.rating = x.rating === v ? 0 : v; upd(); $$('#iRate button').forEach((y) => y.classList.toggle('on', +y.dataset.v <= x.rating)); });
  };
  openSheet(`
    <div class="sheet-bar">
      <button class="icon-btn" data-act="close-sheet" aria-label="Close">${svgBack}</button>
      <div class="crumb">${secName(x.sectionId)}</div>
      <button class="icon-btn" data-act="del-inspo" aria-label="Delete">${svgTrash}</button>
    </div>
    <div class="sheet-body"><div class="sheet-inner" id="inspoForm"></div></div>`, {
    type: 'inspo', id,
    onClose: () => { if (!x.title.trim() && !x.text.trim() && !x.note.trim() && !x.who.trim()) S.inspos = S.inspos.filter((i) => i.id !== id); save(true); },
  });
  draw();
  if (!x.title && !x.text) setTimeout(() => ($('#iText') || $('#iTitle'))?.focus(), 280);
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
function ask(title, desc, ok = 'OK', danger) {
  return new Promise((res) => {
    modalResolve = res;
    openModal(`<h3>${title}</h3><p class="desc">${desc}</p>
      <div class="modal-actions"><button class="btn btn-ghost" data-act="modal-no">Cancel</button>
      <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-act="modal-yes">${ok}</button></div>`);
  });
}

function sectionModal(id) {
  const sec = id ? S.sections.find((s) => s.id === id) : null;
  const st = { icon: sec?.icon || '📚', type: sec?.type || 'memo' };
  openModal(`
    <h3>${sec ? 'Edit section' : 'New section'}</h3>
    <p class="desc">${sec ? 'Rename it or pick a new icon' : 'A space to keep things organized'}</p>
    <div class="field"><label>Name</label><input class="input" id="secName" maxlength="30" placeholder="e.g. Reading, Workout, Work" value="${esc(sec?.name || '')}" /></div>
    ${sec ? '' : `<div class="field"><span class="field-label">Type</span><div class="type-cards" id="secType">
      ${Object.entries(TYPES).map(([k, t]) => `<button class="type-card${k === st.type ? ' on' : ''}" data-v="${k}"><span class="t-ic">${t.icon}</span><div><b>${t.label}</b>${t.desc}</div></button>`).join('')}
    </div></div>`}
    ${emojiField('secIcon', st.icon)}
    <div class="modal-actions">
      ${sec ? `<button class="btn btn-danger left" data-act="del-section" data-id="${sec.id}">Delete</button>` : ''}
      ${sec ? `<button class="btn btn-ghost" data-act="move-section" data-id="${sec.id}" data-dir="-1" aria-label="Move up">↑</button><button class="btn btn-ghost" data-act="move-section" data-id="${sec.id}" data-dir="1" aria-label="Move down">↓</button>` : ''}
      <button class="btn btn-ghost" data-act="modal-no">Cancel</button>
      <button class="btn btn-primary" id="secSave">${sec ? 'Save' : 'Create'}</button>
    </div>`);
  const secPick = bindEmoji('secIcon', st);
  $('#secType')?.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; st.type = b.dataset.v; $$('#secType button').forEach((x) => x.classList.toggle('on', x === b)); if (!$('#secName').value) secPick(TYPES[st.type].icon); });
  const submit = () => {
    const name = $('#secName').value.trim();
    if (!name) { $('#secName').focus(); return toast('Please enter a name'); }
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

/* ── emoji picker: presets + any emoji from the keyboard ── */
function emojiField(id, cur) {
  return `<div class="field"><span class="field-label">Icon</span>
    <div class="emoji-custom">
      <span class="emoji-preview" id="${id}Prev">${esc(cur)}</span>
      <input class="input" id="${id}In" placeholder="Type or paste any emoji 😊" autocomplete="off" />
    </div>
    <div class="emoji-grid" id="${id}">${ICONS.map((i) => `<button type="button" data-v="${i}" class="${i === cur ? 'on' : ''}">${i}</button>`).join('')}</div></div>`;
}
function bindEmoji(id, st) {
  const set = (v) => {
    if (!v) return;
    st.icon = v; $(`#${id}Prev`).textContent = v;
    $$(`#${id} button`).forEach((x) => x.classList.toggle('on', x.dataset.v === v));
  };
  $(`#${id}`).addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { set(b.dataset.v); $(`#${id}In`).value = ''; } });
  $(`#${id}In`).addEventListener('input', (e) => { if (e.isComposing) return; const g = firstGrapheme(e.target.value); if (g) set(g); });
  $(`#${id}In`).addEventListener('compositionend', (e) => { const g = firstGrapheme(e.target.value); if (g) set(g); });
  return set;
}

function groupModal(secId, gid) {
  const sec = S.sections.find((s) => s.id === secId);
  sec.groups ||= [];
  const g = gid ? sec.groups.find((x) => x.id === gid) : null;
  const st = { icon: g?.icon || '📘' };
  const n = g ? S.plans.filter((p) => p.groupId === g.id).length : 0;
  openModal(`
    <h3>${g ? 'Edit group' : 'New group'}</h3>
    <p class="desc">Split ${esc(sec.icon)} ${esc(sec.name)} into smaller lists — e.g. School, Work, Side project</p>
    <div class="field"><label>Name</label><input class="input" id="gName" maxlength="30" placeholder="e.g. School" value="${esc(g?.name || '')}" /></div>
    ${emojiField('gIcon', st.icon)}
    <div class="modal-actions">
      ${g ? `<button class="btn btn-danger left" id="gDel">Delete</button>` : ''}
      <button class="btn btn-ghost" data-act="modal-no">Cancel</button>
      <button class="btn btn-primary" id="gSave">${g ? 'Save' : 'Create'}</button>
    </div>`);
  bindEmoji('gIcon', st);
  const submit = () => {
    const name = $('#gName').value.trim();
    if (!name) { $('#gName').focus(); return toast('Please enter a name'); }
    if (g) { g.name = name; g.icon = st.icon; save(); closeModal(); render(); }
    else { const ng = { id: uid(), name, icon: st.icon }; sec.groups.push(ng); save(); closeModal(); go(`#s-${sec.id}-${ng.id}`); }
  };
  $('#gSave').addEventListener('click', submit);
  $('#gName').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) submit(); });
  $('#gDel')?.addEventListener('click', async () => {
    closeModal();
    if (!(await ask('Delete this group?', n ? `Its ${n} plan${n === 1 ? '' : 's'} will stay in ${esc(sec.name)}, just without a group.` : 'The group will be removed.', 'Delete', true))) return;
    sec.groups = sec.groups.filter((x) => x.id !== g.id);
    S.plans.forEach((p) => { if (p.groupId === g.id) p.groupId = ''; });
    save(); toast('Group deleted'); go(`#s-${sec.id}`);
  });
  if (!g) setTimeout(() => $('#gName').focus(), 50);
}

function routineModal(id, secId) {
  const r = id ? S.routines.find((x) => x.id === id) : null;
  const st = { icon: r?.icon || '🌿', days: r ? [...r.days] : [0, 1, 2, 3, 4, 5, 6], times: r ? [...(r.times || [])] : [] };
  const routineSecs = S.sections.filter((s) => s.type === 'routine');
  openModal(`
    <h3>${r ? 'Edit routine' : 'New routine'}</h3>
    <p class="desc">A habit you check off on chosen days</p>
    <div class="field"><label>Name</label><input class="input" id="rName" maxlength="40" placeholder="e.g. Stretch for 10 min" value="${esc(r?.name || '')}" /></div>
    ${emojiField('rIcon', st.icon)}
    <div class="field"><span class="field-label">Repeat on</span>
      <div class="days" id="rDays">${[1, 2, 3, 4, 5, 6, 0].map((d) => `<button data-v="${d}" class="${st.days.includes(d) ? 'on' : ''}">${WD2[d]}</button>`).join('')}</div>
      <div class="seg" style="margin-top:8px" id="rPreset"><button data-p="all">Every day</button><button data-p="wk">Weekdays</button><button data-p="we">Weekends</button></div>
    </div>
    <div class="field"><span class="field-label">Reminders (optional)</span>
      <div class="times" id="rTimes"></div>
      <button type="button" class="btn btn-ghost btn-sm" id="rAddTime" style="margin-top:8px">＋ Add time</button>
    </div>
    ${routineSecs.length > 1 ? `<div class="field"><label>Section</label><select class="select" id="rSec">${routineSecs.map((s) => `<option value="${s.id}"${s.id === (r?.sectionId || secId) ? ' selected' : ''}>${esc(s.icon)} ${esc(s.name)}</option>`).join('')}</select></div>` : ''}
    <div class="modal-actions">
      ${r ? `<button class="btn btn-danger left" data-act="del-routine" data-id="${r.id}">Delete</button>` : ''}
      <button class="btn btn-ghost" data-act="modal-no">Cancel</button>
      <button class="btn btn-primary" id="rSave">${r ? 'Save' : 'Add'}</button>
    </div>`);
  const drawDays = () => $$('#rDays button').forEach((b) => b.classList.toggle('on', st.days.includes(+b.dataset.v)));
  bindEmoji('rIcon', st);
  $('#rDays').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; const v = +b.dataset.v; st.days = st.days.includes(v) ? st.days.filter((x) => x !== v) : [...st.days, v]; drawDays(); });
  $('#rPreset').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; st.days = { all: [0, 1, 2, 3, 4, 5, 6], wk: [1, 2, 3, 4, 5], we: [0, 6] }[b.dataset.p]; drawDays(); });
  const submit = () => {
    const name = $('#rName').value.trim();
    if (!name) { $('#rName').focus(); return toast('Please enter a name'); }
    if (!st.days.length) return toast('Pick at least one day');
    const times = [...new Set(st.times.filter(Boolean))].sort();
    const sectionId = $('#rSec')?.value || r?.sectionId || secId;
    if (r) Object.assign(r, { name, icon: st.icon, days: st.days, times, sectionId });
    else S.routines.push({ id: uid(), sectionId, name, icon: st.icon, days: st.days, times, created: Date.now() });
    save(); closeModal(); render();
    if (times.length && !S.settings.notify) toast('Turn on notifications in Settings to get reminders');
  };
  const drawTimes = () => {
    $('#rTimes').innerHTML = st.times.length ? st.times.map((t, i) => `
      <div class="time-row"><span>⏰</span><input type="time" class="input" data-i="${i}" value="${t}" /><button type="button" class="x" data-del="${i}" aria-label="Remove time">✕</button></div>`).join('')
      : '<div class="times-empty">No reminders — add as many times as you like</div>';
  };
  drawTimes();
  $('#rAddTime').addEventListener('click', () => {
    const last = st.times[st.times.length - 1];
    const h = last ? (+last.slice(0, 2) + 3) % 24 : new Date().getHours() + 1;
    st.times.push(`${pad(h % 24)}:${last ? last.slice(3) : '00'}`); drawTimes();
    $(`#rTimes input[data-i="${st.times.length - 1}"]`)?.focus();
  });
  $('#rTimes').addEventListener('change', (e) => { if (e.target.dataset.i !== undefined) st.times[+e.target.dataset.i] = e.target.value; });
  $('#rTimes').addEventListener('click', (e) => { const b = e.target.closest('[data-del]'); if (!b) return; st.times.splice(+b.dataset.del, 1); drawTimes(); });
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
  if (!sec) { sec = { id: uid(), name: 'Memo', icon: '📝', type: 'memo', created: Date.now() }; S.sections.push(sec); }
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
  'new-group': (el) => groupModal(el.dataset.sec),
  'edit-group': (el) => groupModal(el.dataset.sec, el.dataset.id),
  'move-section': (el) => {
    const i = S.sections.findIndex((s) => s.id === el.dataset.id); const j = i + +el.dataset.dir;
    if (j < 0 || j >= S.sections.length) return;
    [S.sections[i], S.sections[j]] = [S.sections[j], S.sections[i]]; save();
  },
  'del-section': async (el) => {
    const sec = S.sections.find((s) => s.id === el.dataset.id);
    closeModal();
    const n = S.memos.filter((m) => m.sectionId === sec.id).length + S.plans.filter((p) => p.sectionId === sec.id).length + S.routines.filter((r) => r.sectionId === sec.id).length + S.inspos.filter((x) => x.sectionId === sec.id).length;
    if (!(await ask('Delete this section?', `"${esc(sec.name)}"${n ? ` and its ${n} item${n === 1 ? '' : 's'}` : ''} will be removed.`, 'Delete', true))) return;
    S.sections = S.sections.filter((s) => s.id !== sec.id);
    S.memos = S.memos.filter((m) => m.sectionId !== sec.id);
    S.plans = S.plans.filter((p) => p.sectionId !== sec.id);
    S.routines = S.routines.filter((r) => r.sectionId !== sec.id);
    S.inspos = S.inspos.filter((x) => x.sectionId !== sec.id);
    save(); toast('Section deleted'); go('#today');
  },
  'modal-yes': () => closeModal(true),
  'modal-no': () => closeModal(false),

  'new-memo': (el) => openMemo(newMemo(el.dataset.sec).id),
  'open-memo': (el) => openMemo(el.dataset.id),
  'pin-memo': (el) => {
    const m = S.memos.find((x) => x.id === sheetCtx.id); m.pinned = !m.pinned; save(true);
    el.innerHTML = svgPin(m.pinned); el.style.color = m.pinned ? 'var(--g-600)' : 'inherit';
    toast(m.pinned ? 'Pinned to top' : 'Unpinned');
  },
  'del-memo': async () => {
    const id = sheetCtx.id;
    if (!(await ask('Delete this memo?', 'This can\'t be undone.', 'Delete', true))) return;
    S.memos = S.memos.filter((m) => m.id !== id); save(true); closeSheet(); toast('Memo deleted');
  },
  'close-sheet': () => closeSheet(),

  'open-plan': (el) => openPlan(el.dataset.id),
  'inspo-kind': (el) => { view.kind = el.dataset.k; render(); },
  'new-inspo': (el) => {
    const x = { id: uid(), sectionId: el.dataset.sec, kind: view.kind || 'quote', title: '', who: '', text: '', note: '', rating: 0, date: dkey(), created: Date.now(), updated: Date.now() };
    S.inspos.push(x); save(true); openInspo(x.id);
  },
  'open-inspo': (el) => openInspo(el.dataset.id),
  'del-inspo': async () => {
    const id = sheetCtx.id;
    if (!(await ask('Delete this item?', 'This can\'t be undone.', 'Delete', true))) return;
    S.inspos = S.inspos.filter((x) => x.id !== id); save(true); closeSheet(); toast('Deleted');
  },
  'toggle-plan': (el) => {
    const p = S.plans.find((x) => x.id === el.dataset.id); p.done = !p.done; p.doneAt = p.done ? Date.now() : 0;
    save(); if (p.done) toast('Done — nice work 👏'); render();
  },
  'del-plan': async () => {
    const id = sheetCtx.id;
    if (!(await ask('Delete this plan?', 'Its steps and notes will be removed too.', 'Delete', true))) return;
    S.plans = S.plans.filter((p) => p.id !== id); save(true); closeSheet(); toast('Plan deleted');
  },

  'new-routine': (el) => routineModal(null, el.dataset.sec),
  'edit-routine': (el) => routineModal(el.dataset.id),
  'toggle-routine': (el) => {
    const on = toggleCheck(el.dataset.id);
    if (on) {
      const rs = todayRoutines();
      if (rs.length && rs.every((r) => isChecked(r.id))) toast('All routines done today! 🎉');
      if (navigator.vibrate) try { navigator.vibrate(12); } catch (_) {}
    }
    render();
    const b = $(`[data-act="toggle-routine"][data-id="${el.dataset.id}"]`); if (b && on) b.classList.add('anim');
  },
  'del-routine': async (el) => {
    const id = el.dataset.id; closeModal();
    if (!(await ask('Delete this routine?', 'Its check-in history will be removed too.', 'Delete', true))) return;
    S.routines = S.routines.filter((r) => r.id !== id);
    Object.keys(S.checks).forEach((k) => { S.checks[k] = S.checks[k].filter((x) => x !== id); if (!S.checks[k].length) delete S.checks[k]; });
    save(); render(); toast('Routine deleted');
  },

  'toggle-notify': async () => {
    if (S.settings.notify) { S.settings.notify = false; save(); render(); return; }
    if (!('Notification' in window)) return toast(isIOS() ? 'Open Grove from your Home Screen to enable this' : 'This browser doesn\'t support notifications');
    let p = Notification.permission;
    if (p === 'default') p = await Notification.requestPermission();
    if (p !== 'granted') { render(); return toast('Notification permission is needed'); }
    S.settings.notify = true; save(); render(); registerPeriodic();
    toast('Routine reminders on 🔔');
  },
  'toggle-remind': () => { S.settings.remind = !S.settings.remind; save(); render(); },
  'test-notify': async () => {
    if (!('Notification' in window)) return toast('This browser doesn\'t support notifications');
    let p = Notification.permission;
    if (p === 'default') p = await Notification.requestPermission();
    if (p !== 'granted') return toast('Notification permission is needed');
    await notify('🌿 Grove', 'Notifications are working!', 'test');
    render();
  },
  install: async () => { if (!installEvt) return; installEvt.prompt(); await installEvt.userChoice; installEvt = null; render(); },
  export: () => {
    const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `grove-backup-${dkey()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('Backup saved');
  },
  reset: async () => {
    if (!(await ask('Erase everything?', 'All memos, plans, routines and check-ins will be deleted.', 'Erase all', true))) return;
    S = seed(); save(); toast('Reset complete'); go('#today');
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
    if (!sec) { sec = { id: uid(), name: 'Memo', icon: '📝', type: 'memo', created: Date.now() }; S.sections.push(sec); }
    const [first, ...rest] = v.split('\n');
    const m = newMemo(sec.id); m.title = first.slice(0, 60); m.body = rest.join('\n'); save();
    f.q.value = ''; toast(`Saved to ${sec.icon} ${sec.name}`); render();
  }
  if (f.dataset.form === 'quick-plan') {
    const v = f.title.value.trim(); if (!v) return;
    S.plans.push({ id: uid(), sectionId: f.dataset.sec, groupId: f.dataset.group || '', title: v, note: '', due: f.due.value || '', priority: 0, done: false, steps: [], created: Date.now() });
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
      if (!(await ask('Restore this backup?', `${data.sections.length} sections, ${(data.memos || []).length} memos, ${(data.plans || []).length} plans and ${(data.routines || []).length} routines will replace your current data.`, 'Restore'))) return;
      S = normalize(data); save(); toast('Backup restored'); go('#today');
    } catch (_) { toast('That doesn\'t look like a Grove backup'); }
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
    if (isChecked(r.id)) continue;
    for (const t of r.times || []) {
      const key = `${r.id}@${t}`;
      if (n.ids.includes(key)) continue;
      const diff = nowMin - toMin(t);
      if (diff >= 0 && diff <= 15) { notify(`${r.icon || '🌱'} ${r.name}`, `${t} · Time for your routine`, `r-${r.id}-${t}-${today}`); n.ids.push(key); changed = true; }
      else if (diff > 15) { n.ids.push(key); changed = true; }
    }
  }
  if (S.settings.remind && !n.reminded && S.settings.remindAt) {
    const diff = nowMin - toMin(S.settings.remindAt);
    if (diff >= 0) {
      const left = todayRoutines().filter((r) => !isChecked(r.id));
      if (left.length && diff <= 30) notify('🌙 Today\'s routines', `${left.length} left: ${left.slice(0, 3).map((r) => r.name).join(', ')}${left.length > 3 ? ' …' : ''}`, `remind-${today}`);
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
      routines: todayRoutinesAll().map(({ id, name, icon, times, days }) => ({ id, name, icon, times, days })),
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
    navigator.serviceWorker.register('sw.js').then(() => { if (S.settings.notify) registerPeriodic(); }).catch((e) => console.warn('SW registration failed', e));
  });
  navigator.serviceWorker.addEventListener('message', (e) => { if (e.data?.type === 'goto') go(e.data.hash || '#today'); });
}
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvt = e; if (view.name === 'settings') render(); });
window.addEventListener('appinstalled', () => { installEvt = null; toast('Grove installed 🌿'); });

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
