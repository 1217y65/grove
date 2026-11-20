/* Grove — Service Worker */
const VERSION = 'grove-v2.7.1';
const SHELL = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
  './icons/badge-96.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 앱 파일: 캐시 우선 + 백그라운드 갱신 / 페이지 이동: 네트워크 우선, 오프라인이면 캐시
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req, { cache: 'no-cache' }).then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put('./index.html', copy));
        return res;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  const sameOrigin = url.origin === self.location.origin;
  if (sameOrigin && url.pathname.startsWith('/api/')) return; // never cache sync traffic
  const isFont = ['cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname);
  if (!sameOrigin && !isFont) return;

  // App files: network first so a new deploy shows up on the very next open; cache only when offline.
  // Fonts: cache first (they never change).
  const put = (res) => { if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); } return res; };
  if (sameOrigin) {
    e.respondWith(fetch(req, { cache: 'no-cache' }).then(put).catch(() => caches.match(req, { ignoreSearch: true })));
  } else {
    e.respondWith(caches.match(req).then((cached) => cached || fetch(req).then(put)));
  }
});

// 알림 클릭 → 앱 열기
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const target = (e.notification.data && e.notification.data.url) || './#today';
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) {
      if ('focus' in c) {
        c.postMessage({ type: 'goto', hash: '#today' });
        return c.focus();
      }
    }
    return self.clients.openWindow(target);
  })());
});

/* ── 백그라운드 루틴 확인 (안드로이드 크롬, 설치된 앱에서만 동작) ── */
function idb() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('grove', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function kv(key, val) {
  const db = await idb();
  return new Promise((res) => {
    const tx = db.transaction('kv', val === undefined ? 'readonly' : 'readwrite');
    const st = tx.objectStore('kv');
    if (val === undefined) { const g = st.get(key); g.onsuccess = () => res(g.result); g.onerror = () => res(null); }
    else { st.put(val, key); tx.oncomplete = () => res(); tx.onerror = () => res(); }
  });
}
const pad = (n) => String(n).padStart(2, '0');
const dkey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

async function checkRoutines() {
  const s = await kv('sched');
  if (!s || !s.notify) return;
  const now = new Date();
  const today = dkey(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const done = (s.checks && s.checks[today]) || [];
  const page = s.notified && s.notified.date === today ? s.notified.ids || [] : [];
  let sent = (await kv('swNotified')) || {};
  if (sent.date !== today) sent = { date: today, ids: [], reminded: false };

  const todays = (s.routines || []).filter((r) => r.days.includes(now.getDay()));
  for (const r of todays) {
    if (done.includes(r.id)) continue;
    const times = r.times || (r.time ? [r.time] : []);
    // only the most recent due time, so a late wake-up doesn't fire a burst
    const due = times.filter((t) => { const d = nowMin - toMin(t); return d >= 0 && d <= 60; }).sort().pop();
    if (!due) continue;
    const key = `${r.id}@${due}`;
    if (page.includes(key) || sent.ids.includes(key)) continue;
    await self.registration.showNotification(`${r.icon || '🌱'} ${r.name}`, {
      body: `${due} · Time for your routine`, tag: `r-${r.id}-${due}-${today}`,
      icon: 'icons/icon-192.png', badge: 'icons/badge-96.png', data: { url: './#today' },
    });
    sent.ids.push(key);
  }
  if (s.remind && s.remindAt && !sent.reminded && !(s.notified && s.notified.date === today && s.notified.reminded)) {
    const diff = nowMin - toMin(s.remindAt);
    if (diff >= 0 && diff <= 90) {
      const left = todays.filter((r) => !done.includes(r.id));
      if (left.length) {
        await self.registration.showNotification('🌙 Today\'s routines', {
          body: `${left.length} left: ${left.slice(0, 3).map((r) => r.name).join(', ')}`,
          tag: `remind-${today}`, icon: 'icons/icon-192.png', badge: 'icons/badge-96.png', data: { url: './#today' },
        });
      }
      sent.reminded = true;
    }
  }
  await kv('swNotified', sent);
}

self.addEventListener('periodicsync', (e) => {
  if (e.tag === 'routine-check') e.waitUntil(checkRoutines());
});

// (선택) 나중에 푸시 서버를 붙이면 이 핸들러가 알림을 띄워요
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || '🌿 Grove', {
    body: d.body || 'Check today\'s routines', icon: 'icons/icon-192.png', badge: 'icons/badge-96.png', data: { url: './#today' },
  }));
});
