const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');
const root = path.resolve(__dirname, '..');
const tick = () => new Promise(resolve => setTimeout(resolve, 20));

test('reading, deep links, presentation, checkpoint, TP keys and templates', async () => {
  const failures = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => failures.push(e.message));
  const dom = new JSDOM(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), {
    url: 'https://example.test/code-agent-kv-pooling/',
    runScripts: 'outside-only', virtualConsole: vc
  });
  const w = dom.window, d = w.document;
  w.scrollTo = () => {};
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.requestAnimationFrame = fn => fn();
  w.fetch = async url => ({ok: true, json: async () => JSON.parse(fs.readFileSync(path.join(root, url), 'utf8'))});
  let copied = '';
  Object.defineProperty(w.navigator, 'clipboard', {value: {writeText: async s => {copied = s;}}});
  let fullscreen = false;
  d.documentElement.requestFullscreen = async () => {fullscreen = true;};
  w.eval(fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8'));
  await tick();
  assert.equal(d.querySelectorAll('.chapter').length, 10);
  assert.equal(d.querySelectorAll('#toc a').length, 10);
  assert.ok(d.getElementById('toolkit'));
  assert.ok(d.getElementById('evidence'));
  assert.equal(d.getElementById('deck-controls').hidden, true);

  async function route(hash) {w.location.hash = hash; await tick();}
  await route('read/checkpoint');
  assert.match(d.title, /8705/);
  d.getElementById('mode').click(); await tick();
  assert.equal(w.location.hash, '#present/checkpoint');
  assert.equal(d.querySelectorAll('.chapter').length, 1);
  const demo = d.querySelector('[data-demo="checkpoint"]');
  assert.match(demo.textContent, /\[False\]/);
  demo.querySelector('[data-checkpoint="1"]').click();
  assert.match(demo.querySelector('.checkpoint-display').textContent, /\[3, 0, 8\]/);
  demo.querySelector('[data-checkpoint="2"]').click();
  assert.match(demo.querySelector('.checkpoint-display').textContent, /\[True\]/);
  assert.match(demo.querySelector('.checkpoint-message').textContent, /热请求命中 4352/);

  d.dispatchEvent(new w.KeyboardEvent('keydown', {key:'ArrowRight',bubbles:true})); await tick();
  assert.equal(w.location.hash, '#present/shards');
  assert.equal(d.querySelectorAll('.shard-row.kda span').length, 4);
  d.querySelector('[data-tp="1"]').click();
  assert.equal(d.querySelectorAll('.shard-row.kda span').length, 1);
  d.querySelector('[data-tp="4"]').click();
  assert.equal(d.querySelectorAll('.shard-row:not(.kda) span').length, 1);
  assert.equal(d.querySelectorAll('.shard-row.kda span').length, 4);
  d.getElementById('notes-toggle').click();
  assert.equal(d.getElementById('speaker').hidden, false);
  assert.match(d.getElementById('speaker').textContent, /TP4/);
  d.getElementById('fullscreen').click(); await tick(); assert.equal(fullscreen, true);
  await route('present/opening'); assert.equal(d.getElementById('prev').disabled, true);
  await route('present/workflow'); assert.equal(d.getElementById('next').disabled, true);
  await route('read/toolkit');
  d.querySelector('[data-copy="0"]').click(); await tick();
  assert.match(copied, /验收/);
  d.getElementById('menu').click(); assert.equal(d.getElementById('menu').getAttribute('aria-expanded'), 'true');
  await route('read/evidence'); assert.equal(d.getElementById('menu').getAttribute('aria-expanded'), 'false');
  assert.deepEqual(failures, []);
  w.close();
});
