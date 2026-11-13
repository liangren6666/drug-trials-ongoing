const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../docs/app.js'), 'utf8').replace(/\nmain\(\);\s*$/, '\n');

function app(reduced = false) {
  const elements = new Map(), timers = new Map();
  let timerId = 0;
  const node = () => ({
    value: '', hidden: false, dataset: {}, textContent: '', innerHTML: '', events: {}, attributes: {},
    classList: { toggle() {} },
    addEventListener(type, fn) { this.events[type] = fn; },
    setAttribute(key, value) { this.attributes[key] = value; },
    toggleAttribute(key, value) { if (value) this.attributes[key] = ''; else delete this.attributes[key]; },
    querySelectorAll() { return []; }, querySelector() { return null; },
    focus() { this.focused = true; }, scrollIntoView() {}, contains() { return false; },
  });
  const el = key => { if (!elements.has(key)) elements.set(key, node()); return elements.get(key); };
  const slides = [node(), node(), node()];
  const dots = [node(), node(), node()];
  dots.forEach((dot, i) => dot.dataset.slide = String(i));
  const context = {
    console, Map, Set, Promise, URL, Blob,
    document: { hidden: false, querySelector: el, querySelectorAll: s => s === '.carousel-slide' ? slides : s === '[data-slide]' ? dots : [], addEventListener() {}, activeElement: null },
    window: { addEventListener() {}, scrollTo() {}, matchMedia: () => ({ matches: reduced, addEventListener() {} }), setTimeout(fn, delay) { const id = ++timerId; timers.set(id, {fn, delay}); return id; }, clearTimeout(id) { timers.delete(id); } },
    history: { pushState() {}, replaceState() {} }, location: { hash: '', pathname: '/', search: '' },
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  const run = code => vm.runInContext(code, context);
  const rows = JSON.parse(fs.readFileSync(path.join(__dirname, '../docs/data/index.json'), 'utf8')).rows;
  context.fixture = rows;
  run("state.meta={snapshot:'2026-11-12',shards:['a','b'],filters:{}};state.rows=fixture;applySearch()");
  return { context, run, el, timers, slides, dots };
}

test('combines keywords with recruitment filters and recovers from an empty query', () => {
  const {run, el} = app(true);
  run("filterSelects.push({dataset:{col:'recruit'},value:'招募中'});applySearch()");
  assert.equal(run('state.matches.length'), 6024);
  run("q.value='多替诺雷';applySearch()");
  assert.equal(run('state.matches.length'), 2);
  run("q.value='不存在的试验xyz';applySearch()");
  assert.equal(run('state.matches.length'), 0);
  assert.equal(el('#downloadBtn').disabled, true);
  assert.equal(el('#pagination').innerHTML, '');
  run("q.value='';filterSelects[0].value='';applySearch()");
  assert.equal(run('state.matches.length'), 12869);
});

test('paginates and changes registration ordering without losing rows', () => {
  const {run, el} = app(true);
  assert.equal((el('#results').innerHTML.match(/<tr>/g) || []).length, 20);
  run('goToPage(644)');
  assert.equal((el('#results').innerHTML.match(/<tr>/g) || []).length, 9);
  assert.equal(el('#resultsHeading').focused, true);
  run('goToPage(645)');
  assert.equal(run('state.page'), 644);
  run("state.sort='id-asc';applySearch()");
  assert.equal(run('state.matches[0][0]'), 'CTR20130013');
});

test('an older detail request cannot replace the current record', async () => {
  const {run} = app(true);
  run("state.matches=[['A','','','','','','','',0,'进行中',''],['B','','','','','','','',1,'进行中','']];globalThis.rendered=[];renderDetail=(row)=>rendered.push(row[0]);globalThis.pending={};fetch=(name)=>new Promise(resolve=>pending[name]=resolve);globalThis.a=openRow(0);globalThis.b=openRow(1)");
  run("pending.b({ok:true,json:async()=>({B:{}})})");
  await run('b');
  run("pending.a({ok:true,json:async()=>({A:{}})})");
  await run('a');
  assert.deepEqual(Array.from(run('rendered')), ['B']);
});

test('carousel advances one slide and keeps exactly one accessible image', () => {
  const {run, timers, slides} = app(false);
  const timer = [...timers.values()].find(t => t.delay === 6500);
  assert.ok(timer);
  timer.fn();
  assert.equal(run('carouselIndex'), 1);
  assert.deepEqual(slides.map(s => s.attributes['aria-hidden']), ['true', 'false', 'true']);
});

test('reduced motion disables autoplay; manual selection remains available', () => {
  const {run, timers, dots, el} = app(true);
  assert.equal(timers.size, 0);
  dots[2].events.click();
  assert.equal(run('carouselIndex'), 2);
  assert.equal(run('carouselPaused'), true);
  assert.equal(el('#carouselToggle').attributes['aria-label'], '播放轮播');
});

test('carousel stops while the pointer or keyboard is inside it', () => {
  const {el, timers} = app(false);
  el('.hero-carousel').events.mouseenter();
  assert.equal(timers.size, 0);
  el('.hero-carousel').events.mouseleave();
  assert.equal(timers.size, 1);
  el('.hero-carousel').events.focusin();
  assert.equal(timers.size, 0);
});
