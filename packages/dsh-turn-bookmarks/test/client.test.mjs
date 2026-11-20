// Offline harness for the hand-written browser bundle.
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import assert from 'node:assert/strict';

const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8');

function loadBundle() {
  let row;
  const store = new Map();
  const React = {
    createElement(type, props, ...children) {
      return { type, props: props ?? {}, children };
    },
    Fragment: Symbol('Fragment'),
    useState(initial) {
      return [typeof initial === 'function' ? initial() : initial, () => {}];
    },
    useEffect() {},
    useRef(initial) {
      return { current: initial };
    },
    useCallback(fn) {
      return fn;
    },
  };
  const ReactDom = {
    createPortal(value) {
      return value;
    },
  };
  const window = {
    __ModuleLoader__: {
      load(value) {
        row = value;
      },
    },
    localStorage: {
      getItem(key) {
        return store.has(key) ? store.get(key) : null;
      },
      setItem(key, value) {
        store.set(key, String(value));
      },
    },
    setInterval: () => 1,
    clearInterval: () => {},
    setTimeout: () => 1,
    clearTimeout: () => {},
    requestAnimationFrame: () => 1,
    cancelAnimationFrame: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    matchMedia: () => ({ matches: false }),
    getComputedStyle: () => ({ overflowY: 'visible' }),
    innerHeight: 800,
  };
  const document = {
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => ({ dataset: {}, textContent: '', style: {} }),
    head: { appendChild: () => {} },
    addEventListener: () => {},
    removeEventListener: () => {},
    body: {},
  };
  const context = createContext({
    window,
    document,
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    requestAnimationFrame: () => 1,
    cancelAnimationFrame: () => {},
    Date,
    Math,
    Number,
    Map,
    Set,
    Array,
    Object,
    String,
    Infinity,
  });
  runInContext(source, context, { filename: 'lib/client.js' });
  assert.equal(row.id, 'dsh-turn-bookmarks', 'bundle registers the package id');
  const module = row.factory((specifier) => {
    if (specifier === 'react') return React;
    if (specifier === 'react-dom') return ReactDom;
    throw new Error(`unexpected require: ${specifier}`);
  });
  return module;
}

const module = loadBundle();

function fakeMark({ turn = undefined, index = undefined, label = undefined } = {}) {
  const attrs = new Map();
  if (turn !== undefined) attrs.set('data-turn', String(turn));
  if (index !== undefined) attrs.set('data-index', String(index));
  if (label !== undefined) attrs.set('aria-label', label);
  return {
    getAttribute(name) {
      return attrs.has(name) ? attrs.get(name) : null;
    },
    setAttribute(name, value) {
      attrs.set(name, String(value));
    },
    removeAttribute(name) {
      attrs.delete(name);
    },
    hasAttribute(name) {
      return attrs.has(name);
    },
  };
}

// Turn extraction prefers the localized aria label, then falls back to index.
assert.equal(module.turnFromMark(fakeMark({ label: '跳转到第 12 轮', index: 99 })), 12);
assert.equal(module.turnFromMark(fakeMark({ label: 'Jump to turn 7' })), 7);
assert.equal(module.turnFromMark(fakeMark({ label: 'Load and jump to turn 4' })), 4);
assert.equal(module.turnFromMark(fakeMark({ index: 2 })), 3);
assert.equal(module.turnFromMark(fakeMark()), undefined);

// Bookmark persistence normalizes numbers/objects, deduplicates, and sorts.
assert.deepEqual([...module.readBookmarks('s1')], []);
module.writeBookmarks('s1', [
  { turn: 3, text: 'third' },
  { turn: 1, text: 'first' },
  { turn: 3, text: 'duplicate' },
  { turn: 0, text: 'invalid' },
]);
assert.deepEqual(JSON.parse(JSON.stringify(module.readBookmarks('s1'))), [
  { turn: 1, text: 'first' },
  { turn: 3, text: 'third' },
]);
assert.deepEqual([...module.readBookmarks('s2')], []);

// Gold marks are restricted to the rail and follow saved turns.
function railHost(buttons) {
  const nav = {
    querySelector(selector) {
      return selector === 'button[data-index]' ? buttons[0] ?? null : null;
    },
    querySelectorAll() {
      return buttons;
    },
  };
  return {
    querySelectorAll(selector) {
      return selector === 'nav' ? [nav] : [];
    },
  };
}
const mark3 = fakeMark({ label: '第 3 轮', index: 2 });
const mark4 = fakeMark({ label: '第 4 轮', index: 3 });
const host = railHost([mark3, mark4]);
module.syncMarks(host, [{ turn: 3, text: '' }]);
assert.equal(mark3.getAttribute('data-dsh-turn-bookmarked'), 'true');
assert.equal(mark4.getAttribute('data-dsh-turn-bookmarked'), null);
module.syncMarks(host, [{ turn: 4, text: '' }]);
assert.equal(mark3.getAttribute('data-dsh-turn-bookmarked'), null);
assert.equal(mark4.getAttribute('data-dsh-turn-bookmarked'), 'true');

// Preview reads the durable user prompt, not the assistant answer.
const prompt = { innerText: '  这是   一个问题  ' };
assert.equal(module.previewFor({ querySelector: () => prompt }, 2), '这是 一个问题');
assert.equal(module.previewFor({ querySelector: () => null }, 2), '');

// Registration: one invisible composer-dock row.
{
  const registrations = [];
  const injections = [];
  const ctx = {
    effect(fn) {
      fn();
    },
    locale: {
      register() {},
      bind() {
        return (key) => key;
      },
    },
    slots: {
      inject(name, register) {
        injections.push(name);
        register();
      },
      register(options, component) {
        registrations.push({ options, component });
      },
    },
  };
  module.apply(ctx);
  assert.deepEqual([...injections], ['conversation.composer.dock']);
  assert.equal(registrations.length, 1);
  assert.equal(registrations[0].options.name, 'conversation.composer.dock');
  assert.equal(registrations[0].options.id, 'turn-bookmarks');
  assert.equal(registrations[0].options.order, 20);
  assert.equal(registrations[0].options.locale, 'turnBookmarks');
  assert.equal(typeof registrations[0].component, 'function');
  assert.deepEqual([...module.inject], ['slots', 'locale']);
}

console.log('turn-bookmarks bundle checks passed');
