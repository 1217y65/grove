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
  faith: { icon: '🙏', label: 'Faith', desc: 'QT · Prayer · Verses' },
  words: { icon: '📒', label: 'Words', desc: '한글 · English' },
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
const svgClose = '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
const svgMore = '<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="5" cy="12" r="1.8" fill="currentColor"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/><circle cx="19" cy="12" r="1.8" fill="currentColor"/></svg>';
const svgLeaf = '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 21v-8" stroke="#1C3528" stroke-width="2" stroke-linecap="round"/><path d="M12 13c0-4 2.5-7 7-7 0 4.5-3 7-7 7z" fill="#1C3528"/><path d="M12 15c0-3.3-2.2-5.5-6-5.5 0 3.5 2.4 5.5 6 5.5z" fill="#3F7454"/></svg>';

/* ───────── state ───────── */
let S = load();
let view = { name: 'today' };
let installEvt = null;
const navOpen = new Set(); // plan sections whose groups are expanded in the sidebar
let keepDrawer = false;
let animateOpen = null;

function seed() {
  const s = (name, icon, type) => ({ id: uid(), name, icon, type, created: Date.now() });
  const memo = s('Memo', '📝', 'memo');
  const plan = s('Plan', '🎯', 'plan');
  const routine = s('Routine', '🌱', 'routine');
  const inspo = s('Inspiration', '✨', 'inspo');
  const faith = s('Faith', '🙏', 'faith');
  const words = s('Words', '📒', 'words');
  const now = Date.now();
  return {
    v: 5,
    _pristine: true,
    sections: [memo, plan, routine, inspo, faith, words],
    faith: [],
    words: [],
    inspos: [
      { id: uid(), sectionId: inspo.id, kind: 'quote', text: 'The best time to plant a tree was 20 years ago. The second best time is now.', title: '', who: 'Proverb', note: '', rating: 0, date: dkey(), created: now, updated: now },
    ],
    memos: [
      {
        id: uid(), sectionId: memo.id, pinned: true, created: now, updated: now,
        title: 'Welcome to Grove 🌿',
        body: '• Six spaces to grow in:\n  - Memo: notes, thoughts, journaling, ideas\n  - Plan: tasks, goals, projects\n  - Routine: daily or weekly habits\n  - Inspiration: films, books, quotes\n  - Faith: QT, prayer, verses\n  - Words: 한글 · English 단어장\n\n• Give a routine a time and turn on notifications in Settings to get reminded.\n• On your phone, "Add to Home Screen" to use Grove like an app.\n\nFeel free to delete this memo.',
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
  let raw = null;
  try {
    raw = localStorage.getItem(KEY);
    if (raw) return normalize(JSON.parse(raw));
  } catch (e) {
    console.warn(e);
    // keep the unreadable copy instead of overwriting it with a fresh start
    try { if (raw) localStorage.setItem(`${KEY}-rescue-${Date.now()}`, raw); } catch (_) {}
  }
  return seed();
}
function normalize(d) {
  d.sections ||= []; d.memos ||= []; d.plans ||= []; d.routines ||= []; d.inspos ||= []; d.faith ||= []; d.words ||= []; d.checks ||= {};
  d.settings = Object.assign({ notify: false, remindAt: '21:00', remind: true, notified: {} }, d.settings || {});
  if ((d.v || 1) < 2) migrateV2(d);
  if (d.v < 3) {
    if (!d.sections.some((s) => s.type === 'inspo')) d.sections.push({ id: uid(), name: 'Inspiration', icon: '✨', type: 'inspo', created: Date.now() });
    d.v = 3;
  }
  if (d.v < 4) {
    if (!d.sections.some((s) => s.type === 'faith')) d.sections.push({ id: uid(), name: 'Faith', icon: '🙏', type: 'faith', created: Date.now() });
    d.v = 4;
  }
  if (d.v < 5) {
    if (!d.sections.some((s) => s.type === 'words')) d.sections.push({ id: uid(), name: 'Words', icon: '📒', type: 'words', created: 1763510000000 });
    d.v = 5;
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
  const changed = typeof stampChanges === 'function' ? stampChanges() : false;
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Storage is full'); }
  if (changed) schedulePush();
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
  const prev = view; view = parseHash(); if (prev.name === 'section' && view.name === 'section' && prev.id === view.id) { view.kind = prev.kind; view.ftab = prev.ftab; view.wlang = prev.wlang; view.wsort = prev.wsort; view.whide = prev.whide; view.wstar = prev.wstar; }
  if (view.name !== 'section' || !navOpen.has(view.id)) navOpen.clear();
  if (view.name === 'section' && view.group) navOpen.add(view.id);
  if (keepDrawer) keepDrawer = false; else closeDrawer();
  render(); window.scrollTo(0, 0);
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
    main.innerHTML = sec.type === 'memo' ? renderMemoSection(sec) : sec.type === 'plan' ? renderPlanSection(sec) : sec.type === 'inspo' ? renderInspoSection(sec) : sec.type === 'faith' ? renderFaithSection(sec) : sec.type === 'words' ? renderWordsSection(sec) : renderRoutineSection(sec);
  }
  hydrateImgs(main);
  $('#topbarTitle').textContent = title;
  document.title = title === 'Grove' ? 'Grove' : `${title} · Grove`;
  if (view.name === 'search') { const i = $('#searchInput'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }
}

function renderSidebar() {
  const active = (n, id, g) => (view.name === n && (!id || view.id === id) && (g === undefined || (view.group || null) === g) ? ' active' : '');
  const count = (s) => s.type === 'memo' ? S.memos.filter((m) => m.sectionId === s.id).length
    : s.type === 'inspo' ? S.inspos.filter((x) => x.sectionId === s.id).length
    : s.type === 'words' ? S.words.filter((x) => x.sectionId === s.id).length
    : s.type === 'faith' ? (S.faith.filter((x) => x.sectionId === s.id && x.kind === 'prayer' && !x.answered).length || '')
    : s.type === 'plan' ? S.plans.filter((p) => p.sectionId === s.id && !p.done).length
      : (() => { const rs = S.routines.filter((r) => r.sectionId === s.id && isOn(r)); return rs.length ? `${rs.filter((r) => isChecked(r.id)).length}/${rs.length}` : ''; })();
  $('#sidebar').innerHTML = `
    <div class="brand">
      <div class="brand-mark">${svgLeaf}</div>
      <div class="brand-name">Grove</div>
    </div>
    <button class="nav-item${active('today')}" data-act="go" data-to="#today"><span class="ni-icon">🏡</span><span class="ni-label">Today</span></button>
    <div class="nav-head"><span>SECTIONS</span></div>
    <div class="nav-sections">
      ${S.sections.map((s) => {
        const gs = s.type === 'plan' ? (s.groups || []) : [];
        const open = gs.length && navOpen.has(s.id);
        return `
        <button class="nav-item${active('section', s.id, s.type === 'plan' ? null : undefined)}${gs.length ? ' has-sub' : ''}${open ? ' expanded' : ''}" data-act="${gs.length ? 'nav-parent' : 'go'}" data-id="${s.id}" data-to="#s-${s.id}">
          <span class="ni-icon">${esc(s.icon)}</span><span class="ni-label">${esc(s.name)}</span>
          <span class="ni-count">${count(s)}</span>
          ${gs.length ? '<span class="ni-chev" aria-hidden="true">›</span>' : ''}
        </button>
        ${gs.length ? `<div class="nav-subs${open && animateOpen !== s.id ? ' open' : ''}" data-for="${s.id}"><div>${gs.map((g) => `
          <button class="nav-item nav-sub${active('section', s.id, g.id)}" data-act="go" data-to="#s-${s.id}-${g.id}">
            <span class="ni-icon">${esc(g.icon)}</span><span class="ni-label">${esc(g.name)}</span>
            <span class="ni-count">${S.plans.filter((p) => p.groupId === g.id && !p.done).length || ''}</span>
          </button>`).join('')}</div></div>` : ''}`;
      }).join('')}
    </div>
    <div class="nav-spacer"></div>
    <button class="nav-item${active('search')}" data-act="go" data-to="#search"><span class="ni-icon">🔍</span><span class="ni-label">Search</span></button>
    <button class="nav-item${active('settings')}" data-act="go" data-to="#settings"><span class="ni-icon">⚙️</span><span class="ni-label">Settings</span></button>
  `;
  if (animateOpen) { const el = $(`.nav-subs[data-for="${animateOpen}"]`); animateOpen = null; if (el) requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('open'))); }
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
      const secs = new Set(S.sections.filter((x) => x.type === 'faith').map((x) => x.id));
      const vs = S.faith.filter((x) => secs.has(x.sectionId) && x.kind === 'verse' && x.text);
      if (!vs.length) return '';
      const n = [...dkey()].reduce((a, c) => a * 17 + c.charCodeAt(0), 3) >>> 0;
      return `<div class="section-title">✝️ Verse for today</div>${verseCard(vs[n % vs.length], true)}`;
    })()}
    ${(() => {
      const secs = new Set(S.sections.filter((x) => x.type === 'inspo').map((x) => x.id));
      const pool = S.inspos.filter((x) => secs.has(x.sectionId) && x.text);
      if (!pool.length) return '';
      const seedN = [...dkey()].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0;
      return `<div class="section-title">✨ Inspiration</div>${quoteCard(pool[seedN % pool.length], true)}`;
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
/* images live in their own IndexedDB so localStorage stays small */
const IMG = { db: null, urls: new Map() };
function imgDB() {
  return IMG.db ||= new Promise((res, rej) => {
    const r = indexedDB.open('grove-img', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('img');
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
}
async function imgOp(mode, fn) {
  const db = await imgDB();
  return new Promise((res, rej) => {
    const tx = db.transaction('img', mode); const req = fn(tx.objectStore('img'));
    tx.oncomplete = () => res(req?.result); tx.onerror = () => rej(tx.error);
  });
}
const imgPut = (id, blob) => imgOp('readwrite', (st) => st.put(blob, id));
const imgGet = (id) => imgOp('readonly', (st) => st.get(id));
const imgDel = (id) => { if (!id) return; const u = IMG.urls.get(id); if (u) URL.revokeObjectURL(u); IMG.urls.delete(id); return imgOp('readwrite', (st) => st.delete(id)).catch(() => {}); };
async function imgURL(id) {
  if (IMG.urls.has(id)) return IMG.urls.get(id);
  const b = await imgGet(id).catch(() => null);
  if (!b) return '';
  const u = URL.createObjectURL(b); IMG.urls.set(id, u); return u;
}
function hydrateImgs(root = document) {
  $$('img[data-img]', root).forEach(async (el) => {
    const u = await imgURL(el.dataset.img);
    if (u) { el.src = u; el.closest('.poster')?.classList.add('has-img'); }
  });
}
async function shrinkImage(file, max = 900) {
  let img = await createImageBitmap(file).catch(() => null);
  if (!img) img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
  const sc = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement('canvas'); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('encode'))), 'image/jpeg', 0.85));
}
const blobToDataURL = (b) => new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(b); });

/* YouTube */
function ytId(url) {
  const m = String(url || '').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/|v\/))([\w-]{11})/);
  return m ? m[1] : '';
}
const ytThumb = (id) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
async function ytMeta(url) {
  const tries = [`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`, `https://noembed.com/embed?url=${encodeURIComponent(url)}`];
  for (const u of tries) {
    try { const r = await fetch(u); if (!r.ok) continue; const j = await r.json(); if (j.title) return { title: j.title, author: (j.author_name || '').replace(/ - Topic$/, '') }; } catch (_) {}
  }
  return null;
}

const stars = (n, size = 13) => n ? `<span class="stars" style="font-size:${size}px">${'★'.repeat(n)}<i>${'★'.repeat(5 - n)}</i></span>` : '';
function posterHTML(x, extra = '') {
  const k = KINDS[x.kind] || KINDS.other;
  const src = x.img ? `<img data-img="${x.img}" alt="" />` : x.yt ? `<img src="${ytThumb(x.yt)}" alt="" loading="lazy" onerror="this.remove()" />` : '';
  return `<div class="poster k-${x.kind}${x.yt && !x.img ? ' has-img' : ''} ${extra}">
    <div class="poster-ph"><span>${k.icon}</span><b>${esc(x.title || k.label)}</b></div>${src}
    ${x.yt ? '<span class="yt-badge">▶</span>' : ''}</div>`;
}
function posterCard(x) {
  const sub = [x.who, x.date ? x.date.slice(0, 4) : ''].filter(Boolean).join(' · ');
  return `<button class="pcard k-${x.kind}" data-act="open-inspo" data-id="${x.id}">
    ${posterHTML(x)}
    <div class="pc-title">${esc(x.title || 'Untitled')}</div>
    ${sub ? `<div class="pc-sub">${esc(sub)}</div>` : ''}
    ${x.rating ? `<div class="pc-rate">★ ${x.rating}.0</div>` : ''}
    ${x.note ? `<div class="pc-note">${esc(x.note)}</div>` : ''}
  </button>`;
}
function quoteCard(x, wide) {
  const k = KINDS[x.kind] || KINDS.other;
  return `<button class="card inspo quote${wide ? ' wide' : ''}" data-act="open-inspo" data-id="${x.id}">
    <div class="q-text">${esc(x.text || x.title)}</div>
    <div class="q-by">${x.who ? `— ${esc(x.who)}` : ''}${x.title && x.text ? `${x.who ? ', ' : '— '}${esc(x.title)}` : ''}</div>
    ${x.note ? `<div class="q-note">${esc(x.note)}</div>` : ''}
    ${x.kind !== 'quote' ? `<div class="i-kind">${k.icon} ${k.label}</div>` : ''}
  </button>`;
}
function inspoBlock(xs, headers) {
  const qs = xs.filter((x) => x.kind === 'quote');
  const ps = xs.filter((x) => x.kind !== 'quote');
  const both = headers && qs.length && ps.length;
  return `${ps.length ? `${both ? '<div class="section-title">🎞️ Collection</div>' : ''}<div class="poster-grid">${ps.map(posterCard).join('')}</div>` : ''}
    ${qs.length ? `${both ? '<div class="section-title">💬 Quotes</div>' : ''}<div class="quote-list">${qs.map((x) => quoteCard(x)).join('')}</div>` : ''}`;
}
function renderInspoSection(sec) {
  const all = S.inspos.filter((x) => x.sectionId === sec.id).sort((a, b) => b.created - a.created);
  const kind = view.kind && KINDS[view.kind] ? view.kind : '';
  const xs = kind ? all.filter((x) => x.kind === kind) : all;
  return `
    ${sectionHead(sec, `${all.length} saved · films, books, quotes & more`)}
    <div class="tabs">
      <button class="tab${kind ? '' : ' on'}" data-act="inspo-kind" data-k="">All <span>${all.length}</span></button>
      ${Object.entries(KINDS).map(([k, v]) => { const n = all.filter((x) => x.kind === k).length; return `<button class="tab${kind === k ? ' on' : ''}" data-act="inspo-kind" data-k="${k}">${v.icon} ${v.label}${n ? ` <span>${n}</span>` : ''}</button>`; }).join('')}
    </div>
    ${xs.length ? inspoBlock(xs, true)
      : `<div class="empty"><div class="e-icon">${kind ? KINDS[kind].icon : '✨'}</div>${kind ? `No ${KINDS[kind].label.toLowerCase()}s yet` : 'Save the films, books, songs and words that move you'}</div>`}
    <button class="fab" data-act="new-inspo" data-sec="${sec.id}"><span style="font-size:22px;line-height:1">＋</span>Add</button>`;
}

/* ── Faith ── */
const FKINDS = {
  qt: { icon: '📖', label: 'QT', add: 'New QT' },
  prayer: { icon: '🙏', label: 'Prayer', add: 'Prayer' },
  verse: { icon: '✝️', label: 'Verses', add: 'Verse' },
};
const fShortDate = (k) => { if (!k) return ''; const d = parseKey(k); return `${WD[d.getDay()]}, ${MON[d.getMonth()]} ${d.getDate()}${d.getFullYear() !== new Date().getFullYear() ? ', ' + d.getFullYear() : ''}`; };
const daysSince = (ts) => Math.max(0, Math.floor((Date.now() - ts) / 864e5));
function verseCard(v, wide) {
  return `<button class="card inspo quote verse${wide ? ' wide' : ''}" data-act="open-faith" data-id="${v.id}">
    <div class="q-text">${esc(v.text || v.ref)}</div>
    ${v.ref ? `<div class="q-by">${esc(v.ref)}</div>` : ''}
    ${v.note ? `<div class="q-note">${esc(v.note)}</div>` : ''}
  </button>`;
}
function qtCard(q) {
  return `<button class="card qt-card" data-act="open-faith" data-id="${q.id}">
    <div class="qt-top"><span class="qt-date">${fShortDate(q.date)}</span>${q.passage ? `<span class="qt-passage">${esc(q.passage)}</span>` : ''}</div>
    ${q.title ? `<div class="qt-title">${esc(q.title)}</div>` : ''}
    ${q.note ? `<div class="qt-body">${esc(q.note)}</div>` : ''}
    ${q.apply ? `<div class="qt-apply">✔︎ ${esc(q.apply)}</div>` : ''}
  </button>`;
}
function prayerRow(p) {
  return `<div class="card prayer${p.answered ? ' answered' : ''}">
    <button class="check${p.answered ? ' on' : ''}" data-act="toggle-prayer" data-id="${p.id}" aria-label="Mark answered">${svgCheck}</button>
    <button class="p-main" data-act="open-faith" data-id="${p.id}">
      <div class="p-title">${esc(p.title || 'Untitled')}</div>
      <div class="p-meta">
        ${p.who ? `<span class="chip">🤍 ${esc(p.who)}</span>` : ''}
        ${p.answered ? `<span class="chip today">🙌 Answered${p.answeredAt ? ' · ' + fShortDate(dkey(new Date(p.answeredAt))) : ''}</span>`
          : `<span class="chip">Praying ${daysSince(p.created) ? `· day ${daysSince(p.created) + 1}` : '· since today'}</span>`}
      </div>
    </button>
  </div>`;
}
function renderFaithSection(sec) {
  const all = S.faith.filter((x) => x.sectionId === sec.id);
  const tab = FKINDS[view.ftab] ? view.ftab : 'qt';
  const items = all.filter((x) => x.kind === tab);
  const n = (k) => all.filter((x) => x.kind === k && (k !== 'prayer' || !x.answered)).length;
  let body = '';
  if (tab === 'qt') {
    items.sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.created - a.created);
    const todayDone = items.some((q) => q.date === dkey());
    body = `${!todayDone ? `<button class="card qt-today" data-act="new-faith" data-sec="${sec.id}" data-k="qt"><span>📖</span><div><b>Today's QT</b><small>${fShortDate(dkey())} · tap to begin</small></div><em>＋</em></button>` : ''}
      ${items.length ? `<div class="list">${items.map(qtCard).join('')}</div>` : `<div class="empty"><div class="e-icon">📖</div>Your devotion notes will gather here</div>`}`;
  } else if (tab === 'prayer') {
    const open = items.filter((p) => !p.answered).sort((a, b) => b.created - a.created);
    const done = items.filter((p) => p.answered).sort((a, b) => (b.answeredAt || 0) - (a.answeredAt || 0));
    body = `<form class="card quick-add" data-form="quick-prayer" data-sec="${sec.id}">
        <span style="font-size:17px">🙏</span><input name="title" placeholder="Add a prayer request…" autocomplete="off" />
      </form>
      ${open.length ? `<div class="section-title">Praying <span class="count">${open.length}</span></div><div class="list">${open.map(prayerRow).join('')}</div>`
        : !done.length ? `<div class="empty" style="margin-top:14px"><div class="e-icon">🙏</div>Write down what you're praying for</div>` : ''}
      ${done.length ? `<details class="done-group"${view.showAnswered ? ' open' : ''} data-key="answered"><summary class="section-title">🙌 Answered <span class="count">${done.length}</span><span class="link">Show / hide</span></summary>
        <div class="list">${done.map(prayerRow).join('')}</div></details>` : ''}`;
  } else {
    items.sort((a, b) => b.created - a.created);
    body = items.length ? `<div class="quote-list">${items.map((v) => verseCard(v)).join('')}</div>` : `<div class="empty"><div class="e-icon">✝️</div>Keep the verses you want to hold onto</div>`;
  }
  const answered = all.filter((x) => x.kind === 'prayer' && x.answered).length;
  return `
    ${sectionHead(sec, `${all.filter((x) => x.kind === 'qt').length} QT · ${n('prayer')} praying${answered ? ` · ${answered} answered` : ''} · ${(() => { const v = all.filter((x) => x.kind === 'verse').length; return `${v} verse${v === 1 ? '' : 's'}`; })()}`)}
    <div class="tabs">${Object.entries(FKINDS).map(([k, v]) => `<button class="tab${tab === k ? ' on' : ''}" data-act="faith-tab" data-k="${k}">${v.icon} ${v.label}${n(k) ? ` <span>${n(k)}</span>` : ''}</button>`).join('')}</div>
    ${body}
    <button class="fab" data-act="new-faith" data-sec="${sec.id}" data-k="${tab}"><span style="font-size:22px;line-height:1">＋</span>${FKINDS[tab].add}</button>`;
}

const faithHas = (x) => [x.title, x.note, x.passage, x.apply, x.pray, x.text, x.ref, x.who, x.answer].some((v) => (v || '').trim());
function openFaith(id, draft) {
  const x = draft || S.faith.find((i) => i.id === id);
  if (!x) return;
  const isNew = !!draft;
  const k = FKINDS[x.kind];
  const upd = () => { x.updated = Date.now(); if (!isNew) save(true); };
  const grow = (el, min = 0.38) => growKeep(el, min);
  let form = '';
  if (x.kind === 'qt') {
    form = `
      <div class="qt-head">
        <input type="date" class="i-sub-in qt-date-in" id="fDate" value="${x.date || ''}" />
        <input class="i-title-in" id="fPassage" placeholder="Passage — e.g. 요한복음 15:1-8" value="${esc(x.passage)}" />
        <input class="i-sub-in" id="fTitle" placeholder="Title (optional)" value="${esc(x.title)}" />
      </div>
      <label class="thought-label" for="fNote">Reflection</label>
      <textarea class="thought-input" id="fNote" placeholder="What is God saying to me through this passage?">${esc(x.note)}</textarea>
      <div class="field" style="margin-top:18px"><label>Application</label><textarea class="textarea" id="fApply" style="min-height:70px" placeholder="One thing I'll live out today">${esc(x.apply)}</textarea></div>
      <div class="field"><label>Prayer</label><textarea class="textarea" id="fPray" style="min-height:70px" placeholder="My prayer">${esc(x.pray)}</textarea></div>`;
  } else if (x.kind === 'prayer') {
    form = `
      <input class="i-title-in" id="fTitle" placeholder="Prayer request" value="${esc(x.title)}" style="margin-bottom:6px" />
      <input class="i-sub-in" id="fWho" placeholder="For whom (optional)" value="${esc(x.who)}" />
      <div class="meta-line" style="margin-top:10px">Started ${fShortDate(dkey(new Date(x.created)))} · ${daysSince(x.created) + 1} day${daysSince(x.created) ? 's' : ''} of prayer</div>
      <label class="thought-label" for="fNote" style="margin-top:14px">Details</label>
      <textarea class="thought-input" id="fNote" placeholder="What's on your heart about this?">${esc(x.note)}</textarea>
      <div class="answer-box${x.answered ? ' on' : ''}" id="fAnsBox">
        <button class="answer-toggle" id="fAns"><span class="check${x.answered ? ' on' : ''}">${svgCheck}</span>🙌 Answered</button>
        <textarea class="textarea" id="fAnswer" style="min-height:70px;${x.answered ? '' : 'display:none'}" placeholder="How was it answered?">${esc(x.answer)}</textarea>
      </div>`;
  } else {
    form = `
      <textarea class="quote-input" id="fText" rows="2" placeholder="Write the verse…">${esc(x.text)}</textarea>
      <input class="i-sub-in" id="fRef" placeholder="Reference — e.g. 시편 23:1" value="${esc(x.ref)}" style="margin-bottom:20px" />
      <label class="thought-label" for="fNote">Thoughts</label>
      <textarea class="thought-input" id="fNote" placeholder="Why does this verse speak to you?">${esc(x.note)}</textarea>`;
  }
  openSheet(`
    <div class="sheet-bar">
      <button class="icon-btn" data-act="faith-cancel" aria-label="${isNew ? 'Cancel' : 'Back'}">${isNew ? svgClose : svgBack}</button>
      <div class="crumb crumb-strong">${k.icon} ${isNew ? (x.kind === 'qt' ? 'New QT' : `New ${k.add.toLowerCase()}`) : (x.kind === 'verse' ? 'Verse' : k.label)}</div>
      ${isNew ? '' : `<button class="icon-btn" data-act="del-faith" aria-label="Delete">${svgTrash}</button>`}
      <button class="done-btn" data-act="faith-done" aria-label="Save">${svgCheck}</button>
    </div>
    <div class="sheet-body"><div class="sheet-inner">${form}</div></div>`, {
    type: 'faith', id: x.id, isNew, item: x,
    onClose() {
      if (isNew) { if (faithHas(x) && !this.discard) S.faith.push(x); }
      else if (!faithHas(x)) S.faith = S.faith.filter((i) => i.id !== x.id);
      save(true);
    },
  });
  const bind = (sel, key, ev = 'input', after) => $(sel)?.addEventListener(ev, (e) => { x[key] = e.target.value; after?.(e.target); upd(); });
  bind('#fDate', 'date', 'change'); bind('#fPassage', 'passage'); bind('#fTitle', 'title'); bind('#fApply', 'apply'); bind('#fPray', 'pray');
  bind('#fWho', 'who'); bind('#fAnswer', 'answer'); bind('#fText', 'text'); bind('#fRef', 'ref');
  bind('#fNote', 'note', 'input', (el) => grow(el));
  grow($('#fNote'));
  $('#fAns')?.addEventListener('click', () => {
    x.answered = !x.answered; x.answeredAt = x.answered ? Date.now() : 0; upd();
    $('#fAnsBox').classList.toggle('on', x.answered); $('#fAns .check').classList.toggle('on', x.answered);
    $('#fAnswer').style.display = x.answered ? '' : 'none'; if (x.answered) $('#fAnswer').focus();
  });
  if (isNew) setTimeout(() => ($('#fPassage') || $('#fTitle') || $('#fText'))?.focus(), 280);
}

/* ── Words (vocabulary notebook) ── */
const WLANG = { ko: { flag: '🇰🇷', label: '한글', wordPh: '단어', meanPh: '뜻', exPh: '예문' }, en: { flag: '🇺🇸', label: 'English', wordPh: 'Word', meanPh: 'Meaning', exPh: 'Example sentence' } };
function wordRow(w, hide) {
  return `<div class="w-tile${w.star ? ' starred' : ''}${hide ? ' hidden-mean' : ''}" data-wid="${w.id}">
    <button class="w-body" data-act="${hide ? 'word-reveal' : 'open-word'}" data-id="${w.id}">
      <span class="w-word">${esc(w.word)}</span>
      ${w.pron ? `<span class="w-pron">${esc(w.pron)}</span>` : ''}
      <span class="w-mean">${esc(w.meaning) || '—'}</span>
    </button>
    <button class="w-star" data-act="word-star" data-id="${w.id}" aria-label="Star">${w.star ? '★' : '☆'}</button>
  </div>`;
}
function renderWordsSection(sec) {
  const lang = WLANG[view.wlang] ? view.wlang : 'ko';
  const L = WLANG[lang];
  const all = S.words.filter((w) => w.sectionId === sec.id);
  const mine = all.filter((w) => w.lang === lang);
  const sort = view.wsort || 'new';
  let ws = view.wstar ? mine.filter((w) => w.star) : mine;
  ws = [...ws].sort(sort === 'az' ? (a, b) => a.word.localeCompare(b.word, lang === 'ko' ? 'ko' : 'en', { sensitivity: 'base' }) : (a, b) => b.created - a.created);
  // group: by first letter for A–Z, by day for newest
  const groups = [];
  for (const w of ws) {
    const key = sort === 'az' ? `${lang === 'ko' ? '가나다' : 'A–Z'}` : dayLabel(w.created);
    const g = groups[groups.length - 1];
    if (g && g.key === key) g.items.push(w); else groups.push({ key, items: [w] });
  }
  const hide = !!view.whide;
  return `
    ${sectionHead(sec, `${all.filter((w) => w.lang === 'ko').length} 한글 · ${all.filter((w) => w.lang === 'en').length} English`)}
    <div class="tabs">${Object.entries(WLANG).map(([k, v]) => `<button class="tab${lang === k ? ' on' : ''}" data-act="word-lang" data-k="${k}">${v.flag} ${v.label} <span>${all.filter((w) => w.lang === k).length}</span></button>`).join('')}</div>
    <form class="card w-add" data-form="quick-word" data-sec="${sec.id}" data-lang="${lang}">
      <input name="word" placeholder="${L.wordPh}" autocomplete="off" autocapitalize="off" spellcheck="false" />
      <span class="w-add-sep"></span>
      <input name="meaning" placeholder="${L.meanPh}" autocomplete="off" />
      <button class="btn btn-primary btn-sm" type="submit">Add</button>
    </form>
    <div class="w-tools">
      <div class="seg"><button data-act="word-sort" data-v="new" class="${sort === 'new' ? 'on' : ''}">Newest</button><button data-act="word-sort" data-v="az" class="${sort === 'az' ? 'on' : ''}">${lang === 'ko' ? '가나다' : 'A–Z'}</button></div>
      <button class="chip-btn${view.wstar ? ' on' : ''}" data-act="word-starred">★ Starred</button>
      <button class="chip-btn${hide ? ' on' : ''}" data-act="word-hide">${hide ? '🙈 Meanings hidden' : '👁 Hide meanings'}</button>
    </div>
    ${ws.length ? groups.map((g) => `
        <div class="nb-key">${esc(g.key)} <span>${g.items.length}</span></div>
        <div class="w-grid">${g.items.map((w) => wordRow(w, hide)).join('')}</div>`).join('')
      : `<div class="empty"><div class="e-icon">📒</div>${view.wstar ? 'No starred words yet' : lang === 'ko' ? '새로 알게 된 단어를 적어보세요' : 'Write down a new word you learned'}</div>`}`;
}
function firstLetter(word, lang) {
  const c = (word || '').trim().charAt(0);
  if (!c) return '#';
  const code = c.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) return 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'[Math.floor((code - 0xac00) / 588)];
  return /[a-z]/i.test(c) ? c.toUpperCase() : '#';
}
function dayLabel(ts) {
  const k = dkey(new Date(ts)); const t = dkey();
  if (k === t) return 'Today';
  if (k === dkey(addDays(new Date(), -1))) return 'Yesterday';
  const d = new Date(ts); return `${MON[d.getMonth()]} ${d.getDate()}${d.getFullYear() !== new Date().getFullYear() ? ', ' + d.getFullYear() : ''}`;
}
const wordHas = (w) => [w.word, w.meaning, w.example, w.pron, w.note].some((v) => (v || '').trim());
function openWord(id, draft) {
  const w = draft || S.words.find((x) => x.id === id);
  if (!w) return;
  const isNew = !!draft;
  const L = WLANG[w.lang] || WLANG.ko;
  const upd = () => { w.updated = Date.now(); if (!isNew) save(true); };
  openSheet(`
    <div class="sheet-bar">
      <button class="icon-btn" data-act="word-cancel" aria-label="${isNew ? 'Cancel' : 'Back'}">${isNew ? svgClose : svgBack}</button>
      <div class="crumb crumb-strong">${L.flag} ${isNew ? 'New word' : L.label}</div>
      ${isNew ? '' : `<button class="icon-btn" data-act="del-word" aria-label="Delete">${svgTrash}</button>`}
      <button class="done-btn" data-act="word-done" aria-label="Save">${svgCheck}</button>
    </div>
    <div class="sheet-body"><div class="sheet-inner">
      <div class="w-card-edit">
        <input class="w-word-in" id="wWord" placeholder="${L.wordPh}" value="${esc(w.word)}" autocapitalize="off" spellcheck="false" />
        <input class="i-sub-in" id="wPron" placeholder="${w.lang === 'en' ? 'Pronunciation (optional) — e.g. /ˈserəndɪpɪti/' : '한자·발음 (선택)'}" value="${esc(w.pron)}" />
        <div class="w-line"></div>
        <textarea class="w-mean-in" id="wMean" rows="2" placeholder="${L.meanPh}">${esc(w.meaning)}</textarea>
      </div>
      <div class="field" style="margin-top:18px"><label>${L.exPh}</label><textarea class="textarea" id="wEx" style="min-height:70px" placeholder="${w.lang === 'en' ? 'Use it in a sentence' : '문장으로 써보기'}">${esc(w.example)}</textarea></div>
      <div class="field"><label>Notes</label><textarea class="textarea" id="wNote" style="min-height:70px" placeholder="${w.lang === 'en' ? 'Synonyms, where you saw it…' : '비슷한 말, 어디서 봤는지…'}">${esc(w.note)}</textarea></div>
    </div></div>`, {
    type: 'word', id: w.id, isNew, item: w,
    onClose() {
      if (isNew) { if (w.word.trim() && !this.discard) S.words.push(w); }
      else if (!w.word.trim() && !wordHas(w)) S.words = S.words.filter((x) => x.id !== w.id);
      save(true);
    },
  });
  [['#wWord', 'word'], ['#wPron', 'pron'], ['#wMean', 'meaning'], ['#wEx', 'example'], ['#wNote', 'note']].forEach(([sel, k]) => $(sel).addEventListener('input', (e) => { w[k] = e.target.value; upd(); }));
  if (isNew) setTimeout(() => $('#wWord')?.focus(), 280);
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
  const fs = S.faith.filter((x) => [x.title, x.note, x.passage, x.apply, x.pray, x.text, x.ref, x.who, x.answer].join(' ').toLowerCase().includes(lq));
  const wds = S.words.filter((x) => [x.word, x.meaning, x.example, x.note, x.pron].join(' ').toLowerCase().includes(lq));
  if (!ms.length && !ps.length && !rs.length && !xs.length && !fs.length && !wds.length) return `<div class="empty" style="margin-top:18px">No results for "${esc(q)}"</div>`;
  return `
    ${ms.length ? `<div class="section-title">📝 Memos <span class="count">${ms.length}</span></div><div class="list">${ms.map((m) => `
      <button class="card memo" style="min-height:0" data-act="open-memo" data-id="${m.id}">
        <div class="m-title"><span>${hl(m.title || 'Untitled', q)}</span></div>
        <div class="m-body" style="-webkit-line-clamp:2">${hl(snippet(m.body, q), q)}</div>
        <div class="m-date">${secName(m.sectionId)} · ${relTime(m.updated)}</div>
      </button>`).join('')}</div>` : ''}
    ${ps.length ? `<div class="section-title">🎯 Plans <span class="count">${ps.length}</span></div><div class="list">${ps.map((p) => planRow(p, true)).join('')}</div>` : ''}
    ${rs.length ? `<div class="section-title">🌱 Routines <span class="count">${rs.length}</span></div><div class="list">${rs.map((r) => routineRow(r, true)).join('')}</div>` : ''}
    ${xs.length ? `<div class="section-title">✨ Inspiration <span class="count">${xs.length}</span></div>${inspoBlock(xs)}` : ''}
    ${fs.length ? `<div class="section-title">🙏 Faith <span class="count">${fs.length}</span></div><div class="list">${fs.map((x) => x.kind === 'qt' ? qtCard(x) : x.kind === 'prayer' ? prayerRow(x) : verseCard(x, true)).join('')}</div>` : ''}
    ${wds.length ? `<div class="section-title">📒 Words <span class="count">${wds.length}</span></div><div class="w-grid">${wds.map((w) => wordRow(w)).join('')}</div>` : ''}`;
}

/* ── Settings ── */
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
function renderSettings() {
  const perm = 'Notification' in window ? Notification.permission : 'unsupported';
  const permText = perm === 'granted' ? 'allowed' : perm === 'denied' ? 'blocked — allow it in browser settings' : perm === 'unsupported' ? 'not supported in this browser' : 'not yet allowed';
  return `
    <div class="page-head"><div class="page-icon">⚙️</div><div class="grow"><h1 class="page-title">Settings</h1><div class="page-sub">Lock · Notifications · Install · Backup</div></div></div>

    <div class="section-title">☁️ Sync</div>
    <div class="card">
      <div class="set-row">
        <div class="s-text"><div class="s-title">${SY ? 'Cloud · signed in' : 'Cloud sync'}</div><div class="s-desc" id="syncStatus">${syncStatusText()}</div></div>
        ${SY ? '<button class="btn btn-ghost btn-sm" data-act="sync-now">Sync now</button>' : '<button class="btn btn-primary btn-sm" data-act="sync-setup">Sign in</button>'}
      </div>
      ${SY ? `<div class="set-row">
        <div class="s-text"><div class="s-title">Turn off sync on this device</div><div class="s-desc">Your records stay here and in the cloud</div></div>
        <button class="btn btn-ghost btn-sm" data-act="sync-off">Turn off</button>
      </div>` : ''}
    </div>
    <div class="note">${SY ? '☁️ Same phrase on every device = same Grove everywhere. Changes sync automatically when you open the app and a few seconds after you edit.' : '☁️ Turn this on to keep the same Grove on your phone, computer and every browser — records from each device are merged, nothing is lost.'}</div>

    <div class="section-title">🔒 App lock</div>
    <div class="card">
      <div class="set-row">
        <div class="s-text"><div class="s-title">Require a PIN</div><div class="s-desc">${lockOn() ? `On · ${S.settings.lock.len}-digit PIN` : 'Ask for a PIN every time Grove opens'}</div></div>
        <button class="switch${lockOn() ? ' on' : ''}" data-act="toggle-lock" aria-label="App lock"></button>
      </div>
      ${lockOn() ? `
      <div class="set-row wrap">
        <div class="s-text"><div class="s-title">Lock after leaving</div><div class="s-desc">When you come back after this long</div></div>
        <div class="seg" id="lockAfter">${LOCK_AFTER.map((o) => `<button data-act="lock-after" data-v="${o.v}" class="${(S.settings.lock.after ?? 1) === o.v ? 'on' : ''}">${o.l}</button>`).join('')}</div>
      </div>
      <div class="set-row">
        <div class="s-text"><div class="s-title">Change PIN</div></div>
        <button class="btn btn-ghost btn-sm" data-act="change-pin">Change</button>
      </div>` : ''}
    </div>
    <div class="note">🔒 The lock keeps others from opening Grove on your phone. It's a privacy screen, not encryption — keep regular backups, and note a forgotten PIN can only be reset by erasing this device's Grove data.</div>

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

function growKeep(el, frac) {
  if (!el) return;
  const body = el.closest('.sheet-body'); const st = body ? body.scrollTop : 0;
  const min = Math.round(window.innerHeight * frac);
  el.style.height = `${min}px`; // measure from a stable floor instead of collapsing to 'auto'
  const h = Math.max(el.scrollHeight, min);
  el.style.height = `${h}px`;
  if (body && body.scrollTop !== st) body.scrollTop = st;
}
function autoGrow(el) { growKeep(el, 0.5); }

function openMemo(id, draft) {
  const m = draft || S.memos.find((x) => x.id === id);
  if (!m) return;
  const isNew = !!draft;
  const memoSecs = S.sections.filter((s) => s.type === 'memo');
  openSheet(`
    <div class="sheet-bar">
      <button class="icon-btn" data-act="memo-cancel" aria-label="${isNew ? 'Cancel' : 'Back'}">${isNew ? svgClose : svgBack}</button>
      <div class="crumb crumb-strong">${isNew ? '📝 New memo' : secName(m.sectionId)}</div>
      <button class="icon-btn" data-act="pin-memo" aria-label="Pin" style="color:${m.pinned ? 'var(--g-600)' : 'inherit'}">${svgPin(m.pinned)}</button>
      ${isNew ? '' : `<button class="icon-btn" data-act="del-memo" aria-label="Delete">${svgTrash}</button>`}
      <button class="done-btn" data-act="memo-done" aria-label="Save">${svgCheck}</button>
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
    type: 'memo', id: m.id, isNew, item: m,
    onClose() {
      // back gestures / Escape keep what was written; only the ✕ button discards a new memo
      const has = m.title.trim() || m.body.trim();
      if (isNew) { if (has && !this.discard) S.memos.push(m); }
      else if (!has) S.memos = S.memos.filter((x) => x.id !== m.id);
      save(true);
    },
  });
  const t = $('#mTitle'), b = $('#mBody');
  autoGrow(b);
  let tm;
  const upd = () => {
    m.title = t.value; m.body = b.value; m.updated = Date.now();
    if (!isNew) { clearTimeout(tm); tm = setTimeout(() => save(true), 350); }
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
  $('#mSec')?.addEventListener('change', (e) => { m.sectionId = e.target.value; upd(); if (!isNew) $('.crumb').innerHTML = secName(m.sectionId); });
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
    type: 'plan', id, item: p,
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

const inspoHas = (x) => [x.title, x.text, x.note, x.who, x.url].some((v) => (v || '').trim()) || !!x.img;
function openInspo(id, draft) {
  const x = draft || S.inspos.find((i) => i.id === id);
  if (!x) return;
  const isNew = !!draft;
  const upd = () => { x.updated = Date.now(); save(true); };
  const grow = (el) => growKeep(el, 0.42);
  const draw = () => {
    if (!$('#inspoForm') || sheetCtx?.item !== x) return;
    const k = KINDS[x.kind];
    const isQ = x.kind === 'quote';
    const isM = x.kind === 'music';
    const hasPic = x.img || x.yt;
    $('#inspoForm').innerHTML = `
      ${isQ ? `
        <textarea class="quote-input" id="iText" rows="2" placeholder="Write the quote…">${esc(x.text)}</textarea>
        <div class="i-row">
          <input class="i-sub-in" id="iWho" value="${esc(x.who)}" placeholder="Said by" />
          <input class="i-sub-in" id="iTitle" value="${esc(x.title)}" placeholder="Source — book, film, speech…" />
        </div>` : `
        <div class="i-hero">
          <label class="poster-up" for="iFile">
            ${posterHTML(x, hasPic ? '' : 'empty-up')}
            <span class="poster-edit">${hasPic ? 'Change' : `＋ ${x.kind === 'book' ? 'Cover' : isM ? 'Cover' : 'Poster'}`}</span>
            <input type="file" id="iFile" accept="image/*" hidden />
          </label>
          <div class="i-meta">
            <input class="i-title-in" id="iTitle" placeholder="${k.label} title" value="${esc(x.title)}" />
            <input class="i-sub-in" id="iWho" value="${esc(x.who)}" placeholder="${k.who}" />
            <input class="i-sub-in" type="date" id="iDate" value="${x.date || ''}" />
            <div class="star-pick" id="iRate">${[1, 2, 3, 4, 5].map((n) => `<button data-v="${n}" class="${n <= x.rating ? 'on' : ''}" aria-label="${n} stars">★</button>`).join('')}</div>
            ${x.img ? '<button class="link-btn" id="iImgDel">Remove image</button>' : ''}
          </div>
        </div>
        ${isM ? `<div class="field yt-field"><label>YouTube link</label><input class="input" id="iUrl" inputmode="url" placeholder="Paste a YouTube or YouTube Music link" value="${esc(x.url || '')}" /></div>` : ''}
        ${x.yt ? `<div class="yt-embed"><iframe src="https://www.youtube-nocookie.com/embed/${x.yt}?rel=0&playsinline=1" title="YouTube" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>` : ''}`}
      <label class="thought-label" for="iNote">Thoughts</label>
      <textarea class="thought-input" id="iNote" placeholder="${isQ ? 'Why does this stay with you?' : 'What did it leave you with?'}">${esc(x.note)}</textarea>
      ${isQ ? '' : `<div class="field" style="margin-top:18px"><label>Favorite line (optional)</label><textarea class="textarea" id="iText" style="min-height:70px" placeholder="A line that stayed with you">${esc(x.text)}</textarea></div>`}`;
    hydrateImgs($('#inspoForm'));
    grow($('#iNote'));
    $('#iTitle')?.addEventListener('input', (e) => { x.title = e.target.value; upd(); });
    $('#iText')?.addEventListener('input', (e) => { x.text = e.target.value; upd(); });
    $('#iWho')?.addEventListener('input', (e) => { x.who = e.target.value; upd(); });
    $('#iNote').addEventListener('input', (e) => { x.note = e.target.value; grow(e.target); upd(); });
    $('#iDate')?.addEventListener('change', (e) => { x.date = e.target.value; upd(); });
    $('#iRate')?.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; const v = +b.dataset.v; x.rating = x.rating === v ? 0 : v; upd(); $$('#iRate button').forEach((y) => y.classList.toggle('on', +y.dataset.v <= x.rating)); });
    $('#iFile')?.addEventListener('change', async (e) => {
      const f = e.target.files[0]; if (!f) return;
      try {
        const blob = await shrinkImage(f);
        const nid = 'img-' + uid(); await imgPut(nid, blob);
        if (x.img) imgDel(x.img);
        x.img = nid; upd(); draw();
      } catch (_) { toast('Couldn\'t load that image'); }
    });
    $('#iImgDel')?.addEventListener('click', (e) => { e.preventDefault(); imgDel(x.img); x.img = ''; upd(); draw(); });
    $('#iUrl')?.addEventListener('input', async (e) => {
      const url = e.target.value.trim(); const vid = ytId(url);
      x.url = url;
      if (vid === (x.yt || '')) { upd(); return; }
      x.yt = vid; upd(); draw();
      if (vid && (!x.title || !x.who)) {
        const meta = await ytMeta(url);
        if (meta && x.yt === vid) {
          if (!x.title) x.title = meta.title;
          if (!x.who) x.who = meta.author;
          upd(); draw(); toast('Linked from YouTube 🎵');
        }
      }
    });
  };
  const kk = KINDS[x.kind] || KINDS.other;
  openSheet(`
    <div class="sheet-bar">
      <button class="icon-btn" data-act="inspo-cancel" aria-label="${isNew ? 'Cancel' : 'Back'}">${isNew ? svgClose : svgBack}</button>
      <div class="crumb crumb-strong">${kk.icon} ${isNew ? `New ${kk.label.toLowerCase()}` : kk.label}</div>
      ${isNew ? '' : `<button class="icon-btn" data-act="del-inspo" aria-label="Delete">${svgTrash}</button>`}
      <button class="done-btn" data-act="inspo-done" aria-label="Save">${svgCheck}</button>
    </div>
    <div class="sheet-body"><div class="sheet-inner" id="inspoForm"></div></div>`, {
    type: 'inspo', id: x.id, isNew, item: x,
    onClose() {
      // back gestures / Escape keep what was written; only the ✕ button discards a new draft
      if (isNew) { if (inspoHas(x) && !this.discard) S.inspos.push(x); else if (x.img) imgDel(x.img); }
      else if (!inspoHas(x)) S.inspos = S.inspos.filter((i) => i.id !== x.id);
      save(true);
    },
  });
  draw();
  if (!x.title && !x.text && !x.note) setTimeout(() => (x.kind === 'quote' ? $('#iText') : x.kind === 'music' ? $('#iUrl') : $('#iTitle'))?.focus(), 280);
}

/* ───────── Writing comfort: keep the line you're typing just above the keyboard ───────── */
const vv = window.visualViewport;
function caretY(ta) {
  const cs = getComputedStyle(ta);
  const m = document.createElement('div');
  for (const p of ['boxSizing', 'width', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'letterSpacing', 'lineHeight', 'textTransform', 'wordSpacing', 'wordBreak', 'overflowWrap', 'tabSize']) m.style[p] = cs[p];
  Object.assign(m.style, { position: 'absolute', visibility: 'hidden', top: '0', left: '-9999px', whiteSpace: 'pre-wrap', height: 'auto' });
  m.textContent = ta.value.slice(0, ta.selectionEnd);
  const mark = document.createElement('span'); mark.textContent = '​'; m.appendChild(mark);
  document.body.appendChild(m);
  const y = mark.offsetTop, h = parseFloat(cs.lineHeight) || 24;
  m.remove();
  return { y, h };
}
function keepCaretVisible(el) {
  const body = el?.closest('.sheet-body');
  if (!body || document.activeElement !== el || el.tagName !== 'TEXTAREA') return;
  // everything in layout-viewport coordinates; the visible band is what the keyboard leaves free
  const visTop = Math.max(body.getBoundingClientRect().top, vv ? vv.offsetTop : 0);
  const visBottom = vv ? vv.offsetTop + vv.height : window.innerHeight;
  const r = el.getBoundingClientRect(); const { y, h } = caretY(el);
  const top = r.top + y, bottom = top + h;
  const pad = 28;
  if (bottom > visBottom - pad) body.scrollTop += Math.ceil(bottom - (visBottom - pad));       // only as far as needed
  else if (top < visTop + 8) body.scrollTop -= Math.ceil(visTop + 8 - top);
}
let caretRaf = 0;
const queueCaret = (el) => { cancelAnimationFrame(caretRaf); caretRaf = requestAnimationFrame(() => requestAnimationFrame(() => keepCaretVisible(el))); };
document.addEventListener('input', (e) => { if (e.target?.tagName === 'TEXTAREA' && e.target.closest('#sheet')) queueCaret(e.target); });
document.addEventListener('focusin', (e) => { if (e.target?.tagName === 'TEXTAREA' && e.target.closest('#sheet')) setTimeout(() => queueCaret(e.target), 350); });
if (vv) vv.addEventListener('resize', () => { const a = document.activeElement; if (a?.tagName === 'TEXTAREA' && a.closest('#sheet')) queueCaret(a); });

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
function newMemo(secId, body = '', draft = false) {
  const m = { id: uid(), sectionId: secId, title: '', body, pinned: false, created: Date.now(), updated: Date.now() };
  if (!draft) { S.memos.push(m); save(true); }
  return m;
}
function quickNewMemo() {
  let sec = S.sections.find((s) => s.type === 'memo');
  if (!sec) { sec = { id: uid(), name: 'Memo', icon: '📝', type: 'memo', created: Date.now() }; S.sections.push(sec); }
  history.replaceState(null, '', `#s-${sec.id}`);
  view = { name: 'section', id: sec.id }; render();
  openMemo(null, newMemo(sec.id, '', true));
}

const actions = {
  go: (el) => go(el.dataset.to),
  'nav-parent': (el) => {
    const id = el.dataset.id;
    const here = view.name === 'section' && view.id === id;
    if (navOpen.has(id) && here) { navOpen.delete(id); return renderSidebar(); }
    navOpen.clear(); navOpen.add(id); animateOpen = id;
    if (here && !view.group) return renderSidebar();
    keepDrawer = true; go(el.dataset.to);
  },
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
    const n = S.memos.filter((m) => m.sectionId === sec.id).length + S.plans.filter((p) => p.sectionId === sec.id).length + S.routines.filter((r) => r.sectionId === sec.id).length + S.inspos.filter((x) => x.sectionId === sec.id).length + S.faith.filter((x) => x.sectionId === sec.id).length + S.words.filter((x) => x.sectionId === sec.id).length;
    if (!(await ask('Delete this section?', `"${esc(sec.name)}"${n ? ` and its ${n} item${n === 1 ? '' : 's'}` : ''} will be removed.`, 'Delete', true))) return;
    S.sections = S.sections.filter((s) => s.id !== sec.id);
    S.memos = S.memos.filter((m) => m.sectionId !== sec.id);
    S.plans = S.plans.filter((p) => p.sectionId !== sec.id);
    S.routines = S.routines.filter((r) => r.sectionId !== sec.id);
    S.inspos.filter((x) => x.sectionId === sec.id && x.img).forEach((x) => imgDel(x.img));
    S.inspos = S.inspos.filter((x) => x.sectionId !== sec.id);
    S.faith = S.faith.filter((x) => x.sectionId !== sec.id);
    S.words = S.words.filter((x) => x.sectionId !== sec.id);
    save(); toast('Section deleted'); go('#today');
  },
  'modal-yes': () => closeModal(true),
  'modal-no': () => closeModal(false),

  'new-memo': (el) => openMemo(null, newMemo(el.dataset.sec, '', true)),
  'memo-done': () => {
    const { item, isNew } = sheetCtx; const has = item.title.trim() || item.body.trim();
    closeSheet(); if (has) toast(isNew ? 'Memo saved ✓' : 'Saved ✓');
  },
  'memo-cancel': async () => {
    const ctx = sheetCtx;
    if (ctx.isNew && (ctx.item.title.trim() || ctx.item.body.trim())) {
      if (!(await ask('Discard this memo?', 'What you wrote won\'t be saved.', 'Discard', true))) return;
      ctx.discard = true;
    }
    closeSheet();
  },
  'open-memo': (el) => openMemo(el.dataset.id),
  'pin-memo': (el) => {
    const m = sheetCtx.item; m.pinned = !m.pinned; if (!sheetCtx.isNew) save(true);
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
    const secId = el.dataset.sec;
    const start = (kind) => openInspo(null, { id: uid(), sectionId: secId, kind, title: '', who: '', text: '', note: '', url: '', yt: '', img: '', rating: 0, date: dkey(), created: Date.now(), updated: Date.now() });
    if (view.kind && KINDS[view.kind]) return start(view.kind);
    openModal(`<h3>What are you adding?</h3><p class="desc">Pick a type to start writing</p>
      <div class="kind-pick">${Object.entries(KINDS).map(([k, v]) => `<button data-k="${k}"><span>${v.icon}</span>${v.label}</button>`).join('')}</div>
      <div class="modal-actions"><button class="btn btn-ghost" data-act="modal-no">Cancel</button></div>`);
    $('.kind-pick').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; closeModal(); start(b.dataset.k); });
  },
  'inspo-done': () => {
    const { item, isNew } = sheetCtx;
    const has = inspoHas(item);
    closeSheet();
    if (has) toast(isNew ? `Added to ${(KINDS[item.kind] || KINDS.other).label} ✓` : 'Saved ✓');
  },
  'inspo-cancel': async () => {
    const ctx = sheetCtx;
    if (ctx.isNew && inspoHas(ctx.item)) {
      if (!(await ask('Discard this entry?', 'What you wrote won\'t be saved.', 'Discard', true))) return;
      ctx.discard = true;
    }
    closeSheet();
  },
  'open-inspo': (el) => openInspo(el.dataset.id),
  'word-lang': (el) => { view.wlang = el.dataset.k; render(); },
  'word-sort': (el) => { view.wsort = el.dataset.v; render(); },
  'word-starred': () => { view.wstar = !view.wstar; render(); },
  'word-hide': () => { view.whide = !view.whide; render(); },
  'word-reveal': (el) => { el.closest('.w-tile').classList.toggle('revealed'); },
  'word-star': (el) => { const w = S.words.find((x) => x.id === el.dataset.id); w.star = !w.star; save(); render(); },
  'open-word': (el) => openWord(el.dataset.id),
  'word-done': () => { const { item, isNew } = sheetCtx; const ok = item.word.trim(); closeSheet(); if (ok) toast(isNew ? 'Word added 📒' : 'Saved ✓'); },
  'word-cancel': async () => {
    const ctx = sheetCtx;
    if (ctx.isNew && wordHas(ctx.item)) { if (!(await ask('Discard this word?', 'What you wrote won\'t be saved.', 'Discard', true))) return; ctx.discard = true; }
    closeSheet();
  },
  'del-word': async () => {
    const id = sheetCtx.id;
    if (!(await ask('Delete this word?', 'This can\'t be undone.', 'Delete', true))) return;
    S.words = S.words.filter((x) => x.id !== id); save(true); closeSheet(); toast('Deleted');
  },
  'faith-tab': (el) => { view.ftab = el.dataset.k; render(); },
  'new-faith': (el) => {
    const kind = el.dataset.k || 'qt';
    openFaith(null, { id: uid(), sectionId: el.dataset.sec, kind, title: '', note: '', passage: '', apply: '', pray: '', text: '', ref: '', who: '', answer: '', answered: false, answeredAt: 0, date: dkey(), created: Date.now(), updated: Date.now() });
  },
  'open-faith': (el) => openFaith(el.dataset.id),
  'toggle-prayer': (el) => {
    const p = S.faith.find((x) => x.id === el.dataset.id); p.answered = !p.answered; p.answeredAt = p.answered ? Date.now() : 0;
    save(); if (p.answered) toast('Answered prayer 🙌'); render();
  },
  'faith-done': () => {
    const { item, isNew } = sheetCtx; const has = faithHas(item);
    closeSheet(); if (has) toast(isNew ? 'Saved 🙏' : 'Saved ✓');
  },
  'faith-cancel': async () => {
    const ctx = sheetCtx;
    if (ctx.isNew && faithHas(ctx.item)) {
      if (!(await ask('Discard this entry?', 'What you wrote won\'t be saved.', 'Discard', true))) return;
      ctx.discard = true;
    }
    closeSheet();
  },
  'del-faith': async () => {
    const id = sheetCtx.id;
    if (!(await ask('Delete this entry?', 'This can\'t be undone.', 'Delete', true))) return;
    S.faith = S.faith.filter((x) => x.id !== id); save(true); closeSheet(); toast('Deleted');
  },
  'del-inspo': async () => {
    const id = sheetCtx.id;
    if (!(await ask('Delete this item?', 'This can\'t be undone.', 'Delete', true))) return;
    const it = S.inspos.find((x) => x.id === id); if (it?.img) imgDel(it.img);
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
  'sync-setup': () => { try { localStorage.removeItem('grove-gate-skip'); } catch (_) {} showGate(); },
  'sync-now': () => { syncNow(); },
  'sync-off': async () => {
    if (!(await ask('Turn off sync here?', 'This device stops syncing. Your records stay on this device and in the cloud; enter the same phrase again any time to reconnect.', 'Turn off'))) return;
    SY = null; syncCK = null; saveSY(); render(); toast('Sync off on this device');
  },
  'toggle-lock': () => pinModal(lockOn() ? 'off' : 'set'),
  'change-pin': () => pinModal('change'),
  'lock-after': (el) => { S.settings.lock.after = +el.dataset.v; save(); render(); },
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
  export: async () => {
    const images = {};
    for (const x of S.inspos) if (x.img) { const b = await imgGet(x.img).catch(() => null); if (b) images[x.img] = await blobToDataURL(b); }
    const blob = new Blob([JSON.stringify({ ...S, images }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `grove-backup-${dkey()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('Backup saved');
  },
  reset: async () => {
    if (!(await ask('Erase everything?', 'All memos, plans, routines and check-ins will be deleted.', 'Erase all', true))) return;
    imgOp('readwrite', (st) => st.clear()).catch(() => {}); IMG.urls.clear();
    SY = null; syncCK = null; saveSY();
    S = seed(); initStamps(); save(); toast('Reset complete'); go('#today');
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
  if (f.dataset.form === 'quick-word') {
    const word = f.word.value.trim(), meaning = f.meaning.value.trim();
    if (!word) { f.word.focus(); return; }
    S.words.push({ id: uid(), sectionId: f.dataset.sec, lang: f.dataset.lang, word, meaning, pron: '', example: '', note: '', star: false, created: Date.now(), updated: Date.now() });
    save(); render(); setTimeout(() => $('[data-form="quick-word"] input[name="word"]')?.focus(), 0);
    return;
  }
  if (f.dataset.form === 'quick-prayer') {
    const v = f.title.value.trim(); if (!v) return;
    S.faith.push({ id: uid(), sectionId: f.dataset.sec, kind: 'prayer', title: v, note: '', who: '', answer: '', answered: false, answeredAt: 0, date: dkey(), created: Date.now(), updated: Date.now() });
    save(); render(); setTimeout(() => $('[data-form="quick-prayer"] input')?.focus(), 0);
  }
  if (f.dataset.form === 'quick-plan') {
    const v = f.title.value.trim(); if (!v) return;
    S.plans.push({ id: uid(), sectionId: f.dataset.sec, groupId: f.dataset.group || '', title: v, note: '', due: f.due.value || '', priority: 0, done: false, steps: [], created: Date.now() });
    save(); render(); setTimeout(() => $('[data-form="quick-plan"] input[name="title"]')?.focus(), 0);
  }
});
document.addEventListener('input', (e) => {
  if (e.target.id === 'searchInput') { view.q = e.target.value; $('#searchResults').innerHTML = searchResults(view.q); hydrateImgs($('#searchResults')); }
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
      const images = data.images || {}; delete data.images;
      for (const [iid, url] of Object.entries(images)) { try { await imgPut(iid, await (await fetch(url)).blob()); } catch (_) {} }
      S = normalize(data); initStamps(); S._at = Date.now(); save(); schedulePush(); toast('Backup restored'); go('#today');
    } catch (_) { toast('That doesn\'t look like a Grove backup'); }
    e.target.value = '';
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { if ($('#modal').classList.contains('open')) closeModal(false); else if ($('#sheet').classList.contains('open')) closeSheet(); else closeDrawer(); }
});
document.addEventListener('toggle', (e) => { if (e.target.matches?.('details.done-group')) { if (e.target.dataset.key === 'answered') view.showAnswered = e.target.open; else view.showDone = e.target.open; } }, true);

let toastTm;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTm); toastTm = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ───────── Cloud sync (end-to-end encrypted, via /api/sync + Vercel Blob) ───────── */
const SYNC_KEY = 'grove-sync';
const SYNC_COLS = ['sections', 'memos', 'plans', 'routines', 'inspos', 'faith', 'words'];
const SAMPLE_TITLES = new Set(['Welcome to Grove 🌿', 'Explore Grove', 'Drink a glass of water', 'Daily reflection', 'The best time to plant a tree was 20 years ago. The second best time is now.']);
let SY = (() => { try { return JSON.parse(localStorage.getItem(SYNC_KEY)); } catch (_) { return null; } })();
const saveSY = () => { try { if (SY) localStorage.setItem(SYNC_KEY, JSON.stringify(SY)); else localStorage.removeItem(SYNC_KEY); } catch (_) {} };
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const toB64 = (buf) => { let s = ''; new Uint8Array(buf).forEach((b) => { s += String.fromCharCode(b); }); return btoa(s); };
const fromB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function syncDerive(pass) {
  const enc = new TextEncoder();
  const id = hex(await crypto.subtle.digest('SHA-256', enc.encode('grove-sync-id:' + pass)));
  const base = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode('grove-sync-salt:' + id), iterations: 250000, hash: 'SHA-256' }, base, 256);
  return { id, k: toB64(bits) };
}
let syncCK = null;
const sKey = async () => (syncCK ||= await crypto.subtle.importKey('raw', fromB64(SY.k), 'AES-GCM', false, ['encrypt', 'decrypt']));
async function seal(bytes) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await sKey(), bytes));
  const out = new Uint8Array(12 + ct.length); out.set(iv); out.set(ct, 12); return out;
}
async function unseal(buf) { const u = new Uint8Array(buf); return crypto.subtle.decrypt({ name: 'AES-GCM', iv: u.slice(0, 12) }, await sKey(), u.slice(12)); }

/* change tracking: every item gets _u (last change), deletions leave tombstones in S._t, check toggles in S._ck */
let seenItems = null, seenCk = null;
const itemJSON = (it) => { const { _u, ...rest } = it; return JSON.stringify(rest); };
const ckSet = () => { const s = new Set(); for (const [d, arr] of Object.entries(S.checks || {})) for (const r of arr) s.add(`${d}|${r}`); return s; };
function snapshotSeen() {
  seenItems = new Map(); for (const c of SYNC_COLS) for (const it of S[c] || []) seenItems.set(it.id, itemJSON(it));
  seenCk = ckSet();
}
function initStamps() {
  S._t ||= {}; S._ck ||= {};
  for (const c of SYNC_COLS) for (const it of S[c] || []) it._u ||= it.updated || it.created || 1;
  for (const k of ckSet()) if (!(k in S._ck)) S._ck[k] = 1;
  const old = Date.now() - 200 * 864e5; for (const [k, t] of Object.entries(S._t)) if (t < old) delete S._t[k];
  snapshotSeen();
}
function stampChanges() {
  if (!seenItems) { initStamps(); return false; }
  const now = Date.now(); let changed = false; const cur = new Set();
  for (const c of SYNC_COLS) for (const it of S[c] || []) {
    cur.add(it.id);
    const js = itemJSON(it);
    if (seenItems.get(it.id) !== js) { it._u = now; changed = true; seenItems.set(it.id, js); }
  }
  for (const id of [...seenItems.keys()]) if (!cur.has(id)) { S._t[id] = now; seenItems.delete(id); changed = true; }
  const ck = ckSet();
  for (const k of ck) if (!seenCk.has(k)) { S._ck[k] = now; changed = true; }
  for (const k of seenCk) if (!ck.has(k)) { S._ck[k] = -now; changed = true; }
  seenCk = ck;
  if (changed) { S._at = now; delete S._pristine; }
  return changed;
}

function mergeState(L, R) {
  const now = Date.now();
  const tomb = { ...(R._t || {}) }; for (const [id, t] of Object.entries(L._t || {})) tomb[id] = Math.max(tomb[id] || 0, t);
  const out = { ...L };
  for (const c of SYNC_COLS) {
    // local objects are kept (an open editor may be holding them); a newer remote copy is written INTO them
    const map = new Map();
    for (const it of L[c] || []) map.set(it.id, it);
    for (const it of R[c] || []) {
      const o = map.get(it.id);
      if (!o) map.set(it.id, it);
      else if ((it._u || 0) > (o._u || 0)) { for (const k of Object.keys(o)) if (!(k in it)) delete o[k]; Object.assign(o, it); }
    }
    out[c] = [...map.values()].filter((it) => !((tomb[it.id] || 0) >= (it._u || 0)));
  }
  // keep section order from whichever side changed last
  const order = ((R._at || 0) > (L._at || 0) ? R : L).sections || [];
  const pos = (id) => { const i = order.findIndex((s) => s.id === id); return i < 0 ? 1e9 : i; };
  out.sections.sort((a, b) => pos(a.id) - pos(b.id) || (a.created || 0) - (b.created || 0));
  // the same section created separately on two devices (e.g. "Memo") → fold into one
  const canon = new Map(), remap = {};
  for (const s of [...out.sections].sort((a, b) => (a.created || 0) - (b.created || 0))) {
    const key = `${s.type}|${s.name.trim().toLowerCase()}`;
    const keep = canon.get(key);
    if (!keep) { canon.set(key, s); continue; }
    remap[s.id] = keep.id; tomb[s.id] = now;
    if (s.type === 'plan') {
      keep.groups ||= [];
      for (const g of s.groups || []) {
        const same = keep.groups.find((x) => x.name.trim().toLowerCase() === g.name.trim().toLowerCase());
        if (same) remap[g.id] = same.id; else keep.groups.push(g);
      }
      keep._u = now;
    }
  }
  if (Object.keys(remap).length) {
    out.sections = out.sections.filter((s) => !remap[s.id]);
    for (const c of SYNC_COLS.slice(1)) for (const it of out[c]) {
      if (remap[it.sectionId]) { it.sectionId = remap[it.sectionId]; it._u = now; }
      if (it.groupId && remap[it.groupId]) { it.groupId = remap[it.groupId]; it._u = now; }
    }
  }
  // starter samples that exist on both devices → keep one
  for (const c of SYNC_COLS.slice(1)) {
    const seen = new Map();
    out[c] = out[c].filter((it) => {
      const t = it.title || it.name || it.text || '';
      if (!SAMPLE_TITLES.has(t)) return true;
      const key = `${it.sectionId}|${t}`;
      if (seen.has(key)) { tomb[it.id] = now; return false; }
      seen.set(key, it); return true;
    });
  }
  // routine check-ins: newest toggle wins
  const ck = { ...(R._ck || {}) }; for (const [k, t] of Object.entries(L._ck || {})) if (Math.abs(t) > Math.abs(ck[k] || 0)) ck[k] = t;
  for (const src of [L.checks || {}, R.checks || {}]) for (const [d, arr] of Object.entries(src)) for (const r of arr) if (!(`${d}|${r}` in ck)) ck[`${d}|${r}`] = 1;
  const checks = {};
  for (const [k, t] of Object.entries(ck)) if (t > 0) { const [d, r] = k.split('|'); (checks[d] ||= []).push(r); }
  Object.assign(out, { checks, _ck: ck, _t: tomb, _at: Math.max(L._at || 0, R._at || 0), v: Math.max(L.v || 0, R.v || 0) });
  return out;
}
const SHEET_COL = { memo: 'memos', plan: 'plans', inspo: 'inspos', faith: 'faith', word: 'words' };
function reattachOpenItem() {
  const ctx = sheetCtx; const col = ctx && SHEET_COL[ctx.type];
  if (!col || ctx.isNew || !ctx.item) return;
  const arr = S[col]; const i = arr.findIndex((x) => x.id === ctx.item.id);
  if (i < 0) arr.push(ctx.item); else if (arr[i] !== ctx.item) arr[i] = ctx.item;
  ctx.item._u = Date.now();
}
const syncPayload = () => { const p = { v: S.v, checks: S.checks, _t: S._t, _ck: S._ck, _at: S._at || 0 }; for (const c of SYNC_COLS) p[c] = S[c]; return p; };
const syncedJSON = (o) => JSON.stringify(SYNC_COLS.map((c) => o[c]).concat([o.checks]));

let syncBusy = false, syncAgain = false, pushTimer = null;
function setSyncStatus(st) {
  if (SY) { SY.state = st; }
  const el = $('#syncStatus'); if (el) el.innerHTML = syncStatusText();
  const dot = $('#syncDot'); if (dot) dot.className = `sync-dot ${st || ''}`;
}
function syncStatusText() {
  if (!SY) return 'Off';
  if (SY.state === 'syncing') return 'Syncing…';
  if (SY.err === 'storage-not-connected') return '⚠️ Cloud storage isn\'t connected yet';
  if (SY.err) return `⚠️ Couldn't sync (${esc(SY.err)}) — will retry`;
  return SY.last ? `Synced ${relTime(SY.last)}` : 'Waiting for first sync';
}
async function syncNow() {
  if (!SY || !navigator.onLine) return;
  if (syncBusy) { syncAgain = true; return; }
  syncBusy = true; setSyncStatus('syncing');
  try {
    const url = `/api/sync?id=${SY.id}`;
    const r = await fetch(url, { cache: 'no-store' });
    let etag = null;
    if (r.status === 503) throw new Error('storage-not-connected');
    if (r.status === 200) {
      etag = r.headers.get('x-grove-etag') || r.headers.get('etag');
      let remote;
      try { remote = JSON.parse(new TextDecoder().decode(await unseal(await r.arrayBuffer()))); } catch (_) { throw new Error('wrong-phrase'); }
      stampChanges();
      if (S._pristine) {
        // nothing was ever written on this device — take the cloud copy as is
        const settings = S.settings;
        S = normalize(remote); S.settings = settings; initStamps();
        try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (_) {}
        if (!$('#sheet').classList.contains('open') && !$('#modal').classList.contains('open')) render(); else renderSidebar();
        SY.fresh = false;
        await syncImages(); SY.last = Date.now(); SY.err = '';
        return;
      }
      if (SY.fresh) {
        // a device joining existing data: drop its untouched starter samples so they don't come back
        const untouched = (it) => SAMPLE_TITLES.has(it.title || it.name || it.text || '') && !(it.updated && it.updated !== it.created);
        for (const c of SYNC_COLS.slice(1)) S[c] = S[c].filter((it) => !untouched(it));
        snapshotSeen();
      }
      const merged = mergeState(S, remote);
      const changed = syncedJSON(merged) !== syncedJSON(S);
      S = { ...merged, settings: S.settings };
      reattachOpenItem();
      snapshotSeen();
      try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (_) {}
      if (changed && !$('#sheet').classList.contains('open') && !$('#modal').classList.contains('open')) render();
      else if (changed) renderSidebar();
    } else if (r.status !== 404) throw new Error(`HTTP ${r.status}`);
    const body = await seal(new TextEncoder().encode(JSON.stringify(syncPayload())));
    const p = await fetch(url, { method: 'PUT', body, headers: etag ? { 'if-match': etag } : {} });
    if (p.status === 412) syncAgain = true;
    else if (p.status === 503) throw new Error('storage-not-connected');
    else if (!p.ok) throw new Error(`HTTP ${p.status}`);
    await syncImages();
    SY.last = Date.now(); SY.err = ''; SY.fresh = false;
  } catch (e) {
    SY.err = e.message || String(e);
  } finally {
    syncBusy = false; pushTimer = null; saveSY(); setSyncStatus(SY?.err ? 'error' : 'ok');
    if (syncAgain && SY) { syncAgain = false; setTimeout(syncNow, 800); }
  }
}
async function syncImages() {
  SY.imgs ||= [];
  const ids = [...new Set(S.inspos.map((x) => x.img).filter(Boolean))];
  for (const id of ids) {
    const local = await imgGet(id).catch(() => null);
    if (local && !SY.imgs.includes(id)) {
      const body = await seal(new Uint8Array(await local.arrayBuffer()));
      const r = await fetch(`/api/sync?id=${SY.id}&img=${id}`, { method: 'PUT', body });
      if (r.ok) SY.imgs.push(id);
    } else if (!local) {
      const r = await fetch(`/api/sync?id=${SY.id}&img=${id}`, { cache: 'no-store' });
      if (r.ok) {
        try { await imgPut(id, new Blob([await unseal(await r.arrayBuffer())], { type: 'image/jpeg' })); if (!SY.imgs.includes(id)) SY.imgs.push(id); hydrateImgs(); } catch (_) {}
      }
    }
  }
}
function schedulePush() { if (!SY) return; clearTimeout(pushTimer); pushTimer = setTimeout(syncNow, 1000); }
document.addEventListener('visibilitychange', () => { if (document.hidden && SY && pushTimer) { clearTimeout(pushTimer); pushTimer = null; syncNow(); } });
window.addEventListener('pagehide', () => { if (SY && pushTimer) { clearTimeout(pushTimer); pushTimer = null; syncNow(); } });

function syncModal() {
  openModal(`
    <h3>Sync across devices</h3>
    <p class="desc">Pick a <b>sync phrase</b> and enter the same phrase on your phone, computer and every browser. Everything you write merges together and stays up to date.</p>
    <div class="field"><label>Sync phrase</label><input class="input" id="syP1" type="password" autocomplete="new-password" placeholder="At least 8 characters" /></div>
    <div class="field"><label>Type it again</label><input class="input" id="syP2" type="password" autocomplete="new-password" /></div>
    <div class="note" style="margin:0 0 12px">🔐 Your records are encrypted on this device with the phrase before they leave it — nobody, including the server, can read them. The phrase can't be recovered, so write it down somewhere safe.</div>
    <div class="modal-actions"><button class="btn btn-ghost" data-act="modal-no">Cancel</button><button class="btn btn-primary" id="sySave">Connect</button></div>`);
  setTimeout(() => $('#syP1')?.focus(), 50);
  $('#sySave').addEventListener('click', async () => {
    const a = $('#syP1').value, b = $('#syP2').value;
    if (a.length < 8) { $('#syP1').focus(); return toast('Use at least 8 characters'); }
    if (a !== b) { $('#syP2').value = ''; $('#syP2').focus(); return toast('The phrases don\'t match'); }
    const btn = $('#sySave'); btn.disabled = true; btn.textContent = 'Connecting…';
    try {
      const ping = await fetch('/api/sync?ping=1', { cache: 'no-store' }).then((r) => r.json()).catch(() => null);
      if (!ping?.ready) { btn.disabled = false; btn.textContent = 'Connect'; return toast('Cloud storage isn\'t connected to the site yet'); }
      SY = { ...(await syncDerive(a)), imgs: [], last: 0, err: '', fresh: true }; syncCK = null; saveSY();
      closeModal(); render(); toast('Syncing…');
      await syncNow();
      if (SY?.err === 'wrong-phrase') { toast('That phrase doesn\'t match your saved data'); }
      else if (SY && !SY.err) toast('Sync is on ☁️');
      render();
    } catch (e) { btn.disabled = false; btn.textContent = 'Connect'; toast('Couldn\'t connect — try again'); }
  });
}

/* ───────── Sign-in gate: one Grove password opens the same space everywhere ───────── */
function showGate() {
  let el = $('#gate');
  if (!el) { el = document.createElement('div'); el.id = 'gate'; document.body.appendChild(el); }
  document.body.classList.add('gated');
  el.innerHTML = `
    <form class="gate-inner" id="gateForm" autocomplete="on">
      <div class="brand-mark lock-mark">${svgLeaf}</div>
      <div class="lock-title">Grove</div>
      <div class="gate-sub">Enter your Grove password.<br/>Use the same one on your Mac, iPhone and any browser — everything is saved to your cloud.</div>
      <input type="text" name="username" value="grove" autocomplete="username" hidden />
      <input class="gate-in" id="gatePass" name="password" type="password" autocomplete="current-password" placeholder="Grove password" />
      <button class="gate-btn" id="gateGo" type="submit">Open Grove</button>
      <div class="gate-msg" id="gateMsg"></div>
      <button type="button" class="gate-skip" id="gateSkip">Not now — use only on this device</button>
    </form>`;
  setTimeout(() => $('#gatePass')?.focus(), 100);
  $('#gateSkip').onclick = () => hideGate(true);
  $('#gateForm').onsubmit = async (e) => {
    e.preventDefault();
    const pass = $('#gatePass').value; const msg = $('#gateMsg'); const btn = $('#gateGo');
    if (pass.length < 8) { msg.textContent = 'Your Grove password has at least 8 characters'; return; }
    btn.disabled = true; btn.textContent = 'Opening…'; msg.textContent = '';
    try {
      const ping = await fetch('/api/sync?ping=1', { cache: 'no-store' }).then((r) => r.json()).catch(() => null);
      if (!ping?.ready) throw new Error('offline');
      const keys = await syncDerive(pass);
      const head = await fetch(`/api/sync?id=${keys.id}`, { cache: 'no-store' });
      if (head.status === 404) {
        btn.disabled = false; btn.textContent = 'Open Grove';
        const ok = await ask('No Grove found for this password', 'Check for a typo. If this is your first time, create a new Grove with this password — then use exactly the same password on your other devices.', 'Create new Grove');
        if (!ok) { $('#gatePass').focus(); return; }
      } else if (!head.ok) throw new Error(`HTTP ${head.status}`);
      SY = { ...keys, imgs: [], last: 0, err: '', fresh: true }; syncCK = null; saveSY();
      await syncNow();
      if (SY?.err) throw new Error(SY.err);
      hideGate(); toast('Welcome back 🌿');
    } catch (err) {
      btn.disabled = false; btn.textContent = 'Open Grove';
      msg.textContent = err.message === 'offline' ? 'Can\'t reach the cloud — check your connection' : `Couldn't open (${err.message})`;
    }
  };
}
function hideGate(skipped) {
  if (skipped) { try { localStorage.setItem('grove-gate-skip', '1'); } catch (_) {} }
  document.body.classList.remove('gated');
  const el = $('#gate'); if (el) { el.classList.add('out'); setTimeout(() => el.remove(), 250); }
  render();
}

/* ───────── App lock (PIN) ───────── */
const LOCK_AFTER = [{ v: 0, l: 'Immediately' }, { v: 1, l: '1 min' }, { v: 5, l: '5 min' }, { v: 30, l: '30 min' }];
async function pinHash(pin, salt) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${pin}`));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
const lockOn = () => !!S.settings.lock?.hash;
let lockState = { pin: '', fails: 0, until: 0, open: false };
function showLock() {
  if (!lockOn()) return;
  lockState = { ...lockState, pin: '', open: true };
  document.body.classList.add('locked');
  const len = S.settings.lock.len || 4;
  let el = $('#lock');
  if (!el) { el = document.createElement('div'); el.id = 'lock'; document.body.appendChild(el); }
  el.innerHTML = `
    <div class="lock-inner">
      <div class="brand-mark lock-mark">${svgLeaf}</div>
      <div class="lock-title">Grove</div>
      <div class="lock-sub" id="lockMsg">Enter your PIN</div>
      <div class="lock-dots" id="lockDots">${Array.from({ length: len }, () => '<i></i>').join('')}</div>
      <div class="lock-pad">
        ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button data-k="${n}">${n}</button>`).join('')}
        <button class="ghost" data-k="forgot">Forgot?</button><button data-k="0">0</button><button class="ghost" data-k="del" aria-label="Delete">⌫</button>
      </div>
    </div>`;
  el.onclick = (e) => { const b = e.target.closest('button'); if (b) lockKey(b.dataset.k); };
}
function lockDots(err) {
  const d = $('#lockDots'); if (!d) return;
  $$('i', d).forEach((i, n) => i.classList.toggle('on', n < lockState.pin.length));
  if (err) { d.classList.remove('shake'); void d.offsetWidth; d.classList.add('shake'); }
}
async function lockKey(k) {
  if (!lockState.open) return;
  const msg = $('#lockMsg');
  if (k === 'forgot') return lockForgot();
  if (Date.now() < lockState.until) { msg.textContent = `Too many tries — wait ${Math.ceil((lockState.until - Date.now()) / 1000)}s`; return; }
  if (k === 'del') { lockState.pin = lockState.pin.slice(0, -1); return lockDots(); }
  const len = S.settings.lock.len || 4;
  if (lockState.pin.length >= len) return;
  lockState.pin += k; lockDots();
  if (lockState.pin.length < len) return;
  const ok = (await pinHash(lockState.pin, S.settings.lock.salt)) === S.settings.lock.hash;
  if (ok) { lockState.fails = 0; unlock(); return; }
  lockState.fails++; lockState.pin = '';
  if (lockState.fails >= 5) { lockState.until = Date.now() + 30000; lockState.fails = 0; msg.textContent = 'Too many tries — wait 30s'; }
  else msg.textContent = 'Wrong PIN — try again';
  if (navigator.vibrate) try { navigator.vibrate([30, 40, 30]); } catch (_) {}
  lockDots(true);
}
function unlock() {
  lockState.open = false;
  const el = $('#lock'); if (el) { el.classList.add('out'); setTimeout(() => el.remove(), 250); }
  document.body.classList.remove('locked');
}
async function lockForgot() {
  lockState.open = false;
  const ok = await ask('Forgot your PIN?', 'The PIN can\'t be recovered. The only way back in is to erase all Grove data on this device and start fresh. If you exported a backup, you can restore it afterwards.', 'Erase & reset', true);
  lockState.open = true;
  if (!ok) return;
  try { localStorage.removeItem(KEY); } catch (_) {}
  try { await imgOp('readwrite', (st) => st.clear()); } catch (_) {}
  SY = null; syncCK = null; saveSY();
  S = seed(); initStamps(); save(true); unlock(); go('#today'); toast('Grove was reset');
}
document.addEventListener('keydown', (e) => {
  if (!lockState.open || $('#modal').classList.contains('open')) return;
  if (/^[0-9]$/.test(e.key)) { e.preventDefault(); lockKey(e.key); }
  else if (e.key === 'Backspace') { e.preventDefault(); lockKey('del'); }
}, true);
let hiddenAt = 0;
document.addEventListener('visibilitychange', () => {
  if (!lockOn()) return;
  if (document.hidden) { hiddenAt = Date.now(); if ((S.settings.lock.after ?? 1) === 0) showLock(); }
  else if (!lockState.open && hiddenAt && Date.now() - hiddenAt >= (S.settings.lock.after ?? 1) * 60000) showLock();
});

/* PIN setup / change / off */
function pinModal(mode) {
  // mode: 'set' | 'change' | 'off'
  const needOld = mode !== 'set';
  const needNew = mode !== 'off';
  openModal(`
    <h3>${mode === 'set' ? 'Set a PIN' : mode === 'change' ? 'Change PIN' : 'Turn off app lock'}</h3>
    <p class="desc">${mode === 'off' ? 'Enter your current PIN to turn the lock off.' : 'Use 4–6 digits. Grove will ask for it whenever you open the app.'}</p>
    ${needOld ? '<div class="field"><label>Current PIN</label><input class="input pin-in" id="pinOld" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off" /></div>' : ''}
    ${needNew ? `<div class="field"><label>New PIN</label><input class="input pin-in" id="pinNew" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="new-password" /></div>
    <div class="field"><label>Confirm new PIN</label><input class="input pin-in" id="pinNew2" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="new-password" /></div>` : ''}
    <div class="modal-actions"><button class="btn btn-ghost" data-act="modal-no">Cancel</button>
    <button class="btn ${mode === 'off' ? 'btn-danger' : 'btn-primary'}" id="pinSave">${mode === 'off' ? 'Turn off' : 'Save PIN'}</button></div>`);
  $$('.pin-in').forEach((i) => i.addEventListener('input', () => { i.value = i.value.replace(/\D/g, '').slice(0, 6); }));
  $('#pinSave').addEventListener('click', async () => {
    if (needOld) {
      const old = $('#pinOld').value;
      if ((await pinHash(old, S.settings.lock.salt)) !== S.settings.lock.hash) { $('#pinOld').value = ''; $('#pinOld').focus(); return toast('Current PIN is wrong'); }
    }
    if (needNew) {
      const a = $('#pinNew').value, b = $('#pinNew2').value;
      if (a.length < 4) { $('#pinNew').focus(); return toast('Use at least 4 digits'); }
      if (a !== b) { $('#pinNew2').value = ''; $('#pinNew2').focus(); return toast('PINs don\'t match'); }
      const salt = uid() + uid();
      S.settings.lock = { hash: await pinHash(a, salt), salt, len: a.length, after: S.settings.lock?.after ?? 1 };
      save(); closeModal(); render(); toast(mode === 'set' ? 'App lock on 🔒' : 'PIN changed');
        } else {
      S.settings.lock = null; save(); closeModal(); render(); toast('App lock off');
    }
  });
  setTimeout(() => ($('#pinOld') || $('#pinNew'))?.focus(), 50);
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
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then((reg) => {
      if (S.settings.notify) registerPeriodic();
      document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
    }).catch((e) => console.warn('SW registration failed', e));
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
initStamps();
if (SY) setTimeout(syncNow, 600);
document.addEventListener('visibilitychange', () => { if (!document.hidden) syncNow(); });
window.addEventListener('online', () => syncNow());
setInterval(() => { if (!document.hidden) syncNow(); }, 120000);
try { navigator.storage?.persist?.(); } catch (_) {}
if (!SY && !localStorage.getItem('grove-gate-skip')) showGate();
if (lockOn()) showLock();
if (location.hash === '#new-memo') { render(); quickNewMemo(); }
else { view = parseHash(); render(); }
save(true);
tick();
