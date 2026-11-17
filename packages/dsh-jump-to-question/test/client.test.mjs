// Offline harness for the hand-written browser bundle.
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import assert from 'node:assert/strict';

const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8');

function loadBundle() {
  let row;
  const React = {
    createElement(type, props, ...children) {
      return { type, props: props ?? {}, children };
    },
    useState(initial) {
      return [typeof initial === 'function' ? initial() : initial, () => {}];
    },
    useEffect() {},
    useRef(initial) {
      return { current: initial };
    },
  };
  const window = {
    __ModuleLoader__: {
      load(value) {
        row = value;
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
    getComputedStyle: (element) => ({ overflowY: element?.__overflow ?? 'visible' }),
  };
  const document = {
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => ({ dataset: {}, textContent: '', style: {} }),
    head: { appendChild: () => {} },
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
    Array,
    Object,
    String,
    Infinity,
  });
  runInContext(source, context, { filename: 'lib/client.js' });
  assert.equal(row.id, 'dsh-jump-to-question', 'bundle registers the package id');
  const module = row.factory((specifier) => {
    if (specifier === 'react') return React;
    throw new Error(`unexpected require: ${specifier}`);
  });
  return module;
}

const module = loadBundle();

function fakeFlow({ nodes = [], tails = {}, prompt = null, rows = {}, answers = {} } = {}) {
  return {
    querySelectorAll(selector) {
      if (selector === '[data-chat-turn]') return nodes;
      const match = /data-chat-turn="(\d+)"/.exec(selector);
      if (match) {
        if (selector.includes('assistant-step')) return answers[match[1]] ?? [];
        return rows[match[1]] ?? [];
      }
      return [];
    },
    querySelector(selector) {
      const tail = /data-turn-tail="(\d+)"/.exec(selector);
      if (tail) return tails[tail[1]] ?? null;
      if (selector.includes('data-chat-flow-kind="user"')) return prompt;
      return null;
    },
  };
}

function node(turn) {
  return { getAttribute: (name) => (name === 'data-chat-turn' ? String(turn) : null) };
}

function rect(top, bottom, height = bottom - top) {
  return { top, bottom, height, left: 0, right: 100, width: 100 };
}

const flow = fakeFlow({ nodes: [node(1), node(2), node(2), node(3)] });
assert.equal(module.latestTurn(flow), 3);
assert.equal(module.latestTurn(fakeFlow()), undefined);

assert.equal(module.turnFinished(fakeFlow({ tails: { 3: { getAttribute: () => 'always' } } }), 3), true);
assert.equal(module.turnFinished(fakeFlow({ tails: { 3: { getAttribute: () => 'hover' } } }), 3), false);
assert.equal(module.turnFinished(fakeFlow({
  tails: { 3: { getAttribute: () => 'hover' } },
  answers: { 3: [{ textContent: 'an answer' }] },
}), 3), true);
assert.equal(module.turnFinished(fakeFlow({ tails: { 3: { getAttribute: () => null } }, answers: { 3: [{ textContent: 'an answer' }] } }), 3), false);
assert.equal(module.turnFinished(fakeFlow({ tails: { 3: { getAttribute: () => null } } }), 3), false);
assert.equal(module.turnFinished(fakeFlow(), 3), false);

const prompt = { getClientRects: () => [{}], getBoundingClientRect: () => rect(80, 120) };
assert.equal(module.promptFor(fakeFlow({ prompt }), 2), prompt);
const fallbackRow = { getAttribute: (name) => (name === 'data-chat-flow-kind' ? 'user' : null) };
assert.equal(module.promptFor(fakeFlow({ rows: { 2: [fallbackRow] } }), 2), fallbackRow);

const scroller = {
  scrollTop: 500,
  scrollHeight: 2000,
  clientHeight: 800,
  getBoundingClientRect: () => rect(100, 900),
};
assert.equal(module.isAbove({ getClientRects: () => [{}], getBoundingClientRect: () => rect(80, 120) }, scroller), false);
assert.equal(module.isAbove({ getClientRects: () => [{}], getBoundingClientRect: () => rect(0, 80) }, scroller), true);
assert.equal(module.isAbove({ getClientRects: () => [], getBoundingClientRect: () => rect(0, 80) }, scroller), false);

const nearTop = { getClientRects: () => [{}], getBoundingClientRect: () => rect(90, 130) };
assert.equal(module.shouldShow(nearTop, scroller, false), false);
assert.equal(module.shouldShow(nearTop, scroller, true), true);
const above = { getClientRects: () => [{}], getBoundingClientRect: () => rect(0, 80) };
assert.equal(module.shouldShow(above, scroller, false), true);
assert.equal(module.shouldShow(above, scroller, true), true);
const visible = { getClientRects: () => [{}], getBoundingClientRect: () => rect(160, 220) };
assert.equal(module.shouldShow(visible, scroller, false), false);
assert.equal(module.shouldShow(visible, scroller, true), false);

assert.equal(module.bottomDistance(scroller), 700);
assert.equal(module.nearBottom(scroller, 800), true);
assert.equal(module.nearBottom(scroller, 100), false);
assert.equal(module.bottomDistance(null), 0);

const promptAt300 = { getBoundingClientRect: () => rect(300, 400) };
assert.equal(module.scrollTopFor(promptAt300, scroller, 20), 680);
assert.equal(module.scrollTopFor({ getBoundingClientRect: () => rect(-600, -500) }, scroller, 20), 0);
assert.equal(module.scrollTopFor({ getBoundingClientRect: () => rect(5000, 5100) }, scroller, 20), 1200);

const scrollParent = { __overflow: 'auto', scrollHeight: 1000, clientHeight: 500, parentElement: null };
assert.equal(module.findScroller({ parentElement: scrollParent }), scrollParent);
const visibleParent = { __overflow: 'visible', scrollHeight: 1000, clientHeight: 500, parentElement: null };
assert.equal(module.findScroller({ parentElement: visibleParent }), null);

// Registration: one composer-dock row.
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
        return (key, params) => (params ? `${key}:${JSON.stringify(params)}` : key);
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
  assert.deepEqual(injections, ['conversation.composer.dock']);
  assert.equal(registrations.length, 1);
  assert.equal(registrations[0].options.name, 'conversation.composer.dock');
  assert.equal(registrations[0].options.id, 'jump-to-question');
  assert.equal(registrations[0].options.order, 10);
  assert.equal(registrations[0].options.locale, 'jumpToQuestion');
  assert.equal(typeof registrations[0].component, 'function');
  assert.deepEqual([...module.inject], ['slots', 'locale']);
}

console.log('jump-to-question bundle checks passed');
