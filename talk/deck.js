/* AGPL-3.0. Corresponding source: repository /talk and export_talk.py. */
(() => {
  'use strict';
  const data = JSON.parse(document.getElementById('speaker-data').textContent);
  const slides = [...document.querySelectorAll('#deck > .slide')];
  const deck = document.getElementById('deck');
  const nav = document.getElementById('nav');
  const overview = document.getElementById('overview');
  const panel = document.getElementById('speaker-panel');
  const prev = document.getElementById('previous');
  const next = document.getElementById('next');
  let current = 0, wheelLocked = false, touch = null;
  function stored() { try { return localStorage.getItem('agent-talk-static') === '1'; } catch { return false; } }
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  document.body.classList.toggle('low-power', stored() || reduced);
  function indexFromHash() {
    const id = location.hash.slice(1);
    const i = data.slides.findIndex(s => s.id === id);
    return i < 0 ? 0 : i;
  }
  function notes() {
    const s = data.slides[current];
    document.getElementById('note-title').textContent = `${current + 1}. ${s.title.replaceAll('\n', ' ')} · ${s.minutes} 分钟`;
    document.getElementById('note-body').textContent = s.notes;
    const links = document.getElementById('note-sources');
    links.replaceChildren();
    s.sources.forEach(id => {
      const source = data.sources[id], a = document.createElement('a');
      a.href = source.url; a.textContent = source.label; a.target = '_blank'; a.rel = 'noopener noreferrer';
      links.appendChild(a);
    });
  }
  function go(i, hash = true) {
    current = Math.max(0, Math.min(i, slides.length - 1));
    deck.style.transform = `translateX(${-current * 100}vw)`;
    slides.forEach((s, n) => {
      s.classList.toggle('active', n === current);
      s.setAttribute('aria-hidden', String(n !== current));
      s.inert = n !== current;
    });
    [...nav.children].forEach((b, n) => {
      b.classList.toggle('active', n === current);
      b.setAttribute('aria-current', n === current ? 'step' : 'false');
    });
    document.body.classList.toggle('dark-bg', slides[current].classList.contains('dark'));
    prev.disabled = current === 0; next.disabled = current === slides.length - 1;
    document.title = `${current + 1} / ${slides.length} · ${data.slides[current].title.replaceAll('\n', ' ')}`;
    if (hash) { try { history.replaceState(null, '', '#' + data.slides[current].id); } catch { location.hash = data.slides[current].id; } }
    notes();
  }
  function toggleOverview() {
    const show = !document.body.classList.contains('overview');
    panel.hidden = true;
    document.body.classList.toggle('overview', show);
    overview.setAttribute('aria-hidden', String(!show)); overview.inert = !show;
    overview.querySelectorAll('.thumb').forEach((b, i) => b.classList.toggle('active', i === current));
    if (show) overview.querySelectorAll('.thumb')[current].focus();
    else document.getElementById('index-toggle').focus();
  }
  function toggleNotes() { panel.hidden = !panel.hidden; document.getElementById('notes-toggle').setAttribute('aria-expanded', String(!panel.hidden)); }
  function toggleStatic() {
    const on = document.body.classList.toggle('low-power');
    try { localStorage.setItem('agent-talk-static', on ? '1' : '0'); } catch {}
    document.getElementById('static-toggle').setAttribute('aria-pressed', String(on));
  }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { document.getElementById('screen-toggle').textContent = '使用浏览器全屏'; }
  }
  data.slides.forEach((s, i) => {
    const number = document.createElement('span'); number.className = 'page-no';
    number.textContent = `${String(i + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    slides[i].appendChild(number);
    const dot = document.createElement('button'); dot.type = 'button';
    dot.setAttribute('aria-label', `第 ${i + 1} 页：${s.title.replaceAll('\n', ' ')}`);
    dot.addEventListener('click', () => go(i)); nav.appendChild(dot);
    const thumb = document.createElement('button'); thumb.type = 'button'; thumb.className = 'thumb';
    const index = document.createElement('small'); index.textContent = `${String(i + 1).padStart(2, '0')} / ${s.minutes} MIN`;
    const title = document.createElement('span'); title.textContent = s.title.replaceAll('\n', ' ');
    thumb.append(index, title);
    thumb.addEventListener('click', () => { toggleOverview(); go(i); }); overview.appendChild(thumb);
  });
  prev.addEventListener('click', () => go(current - 1)); next.addEventListener('click', () => go(current + 1));
  document.getElementById('index-toggle').addEventListener('click', toggleOverview);
  document.getElementById('notes-toggle').addEventListener('click', toggleNotes);
  document.getElementById('speaker-close').addEventListener('click', toggleNotes);
  document.getElementById('static-toggle').addEventListener('click', toggleStatic);
  document.getElementById('screen-toggle').addEventListener('click', fullscreen);
  document.getElementById('static-toggle').setAttribute('aria-pressed', String(document.body.classList.contains('low-power')));
  addEventListener('hashchange', () => go(indexFromHash(), false));
  addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || e.target.isContentEditable) return;
    if (e.key === 'Escape') { e.preventDefault(); if (!panel.hidden) { toggleNotes(); } else toggleOverview(); return; }
    if (e.key.toLowerCase() === 'n') { e.preventDefault(); if (!document.body.classList.contains('overview')) toggleNotes(); return; }
    if (e.key.toLowerCase() === 'b') { e.preventDefault(); toggleStatic(); return; }
    if (e.key.toLowerCase() === 'f') { e.preventDefault(); fullscreen(); return; }
    if (document.body.classList.contains('overview') || !panel.hidden) return;
    if (['ArrowRight', 'PageDown'].includes(e.key) || (e.key === ' ' && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A')) { e.preventDefault(); go(current + 1); }
    if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); go(current - 1); }
    if (e.key === 'Home') { e.preventDefault(); go(0); }
    if (e.key === 'End') { e.preventDefault(); go(slides.length - 1); }
  });
  addEventListener('wheel', e => {
    if (e.ctrlKey || wheelLocked || document.body.classList.contains('overview') || !panel.hidden || innerHeight > innerWidth || Math.abs(e.deltaY) < 24) return;
    e.preventDefault(); wheelLocked = true; go(current + (e.deltaY > 0 ? 1 : -1));
    setTimeout(() => { wheelLocked = false; }, 620);
  }, {passive: false});
  addEventListener('touchstart', e => {
    if (!panel.hidden || document.body.classList.contains('overview')) return;
    touch = {x: e.touches[0]?.clientX, y: e.touches[0]?.clientY};
  }, {passive: true});
  addEventListener('touchend', e => {
    if (!touch) return;
    const t = e.changedTouches[0], dx = (t?.clientX ?? touch.x) - touch.x, dy = (t?.clientY ?? touch.y) - touch.y;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.3) go(current + (dx < 0 ? 1 : -1));
    touch = null;
  }, {passive: true});
  go(indexFromHash(), false);
})();
