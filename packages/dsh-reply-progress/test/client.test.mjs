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
    Math,
    Number,
    Map,
    Array,
    Object,
    String,
    Infinity,
  });
  runInContext(source, context, { filename: 'lib/client.js' });
  assert.equal(row.id, 'dsh-reply-progress', 'bundle registers the package id');
  const module = row.factory((specifier) => {
    if (specifier === 'react') return React;
    throw new Error(`unexpected require: ${specifier}`);
  });
  return module;
}

function fakeNode({ turn, text = '', innerText, hidden = false, processHidden = false, visible = true }) {
  return {
    hidden,
    textContent: text,
    ...(innerText === undefined ? {} : { innerText }),
    getAttribute(name) {
      return name === 'data-chat-turn' ? String(turn) : null;
    },
    hasAttribute(name) {
      return name === 'data-turn-process-hidden' ? processHidden : false;
    },
    getClientRects() {
      return visible ? [{}] : [];
    },
  };
}

const module = loadBundle();

// Estimate curve: bounded, monotonic, and never claims 100 while running.
assert.equal(module.estimatePercent({ chars: 0, target: 1000, elapsedMs: 0 }), 1);
assert.equal(module.estimatePercent({ chars: 1000, target: 1000, elapsedMs: 0 }), 85);
assert.equal(module.estimatePercent({ chars: 2000, target: 1000, elapsedMs: 0 }), 91);
assert.equal(module.estimatePercent({ chars: 10000, target: 1000, elapsedMs: 0 }), 96);
assert.equal(module.estimatePercent({ chars: 0, target: 1000, elapsedMs: 30000 }), 60);
assert.ok(module.estimatePercent({ chars: 0, target: 1000, elapsedMs: 1e9 }) <= 97);
for (const [chars, elapsed] of [[0, 0], [200, 1000], [800, 5000], [2000, 12000], [5000, 30000], [9000, 60000]]) {
  const value = module.estimatePercent({ chars, target: 1200, elapsedMs: elapsed });
  assert.ok(value >= 1 && value <= 97);
}

// Learned target: neutral default, ignores tiny replies, and clamps extremes.
assert.equal(module.averageTarget([]), 1600);
assert.equal(module.averageTarget([80]), 1600);
assert.equal(module.averageTarget([1000, 2000]), 1650);
assert.equal(module.averageTarget([100000]), 8000);
assert.equal(module.averageTarget([120]), 400);

// DOM length helpers honour hidden rows and unrendered rows.
assert.equal(module.sumLengths([fakeNode({ turn: 1, innerText: 'abcd' })]), 4);
assert.equal(module.sumLengths([fakeNode({ turn: 1, innerText: 'abcd', processHidden: true })]), 0);
assert.equal(module.sumLengths([fakeNode({ turn: 1, innerText: 'abcd', visible: false })]), 0);
assert.equal(module.sumLengths([fakeNode({ turn: 1, text: 'text-content' })]), 12);
assert.equal(module.sumLengths([]), 0);

// Baseline uses earlier turns only and applies the learned target.
const baseline = module.baselineFor([
  fakeNode({ turn: 1, innerText: 'x'.repeat(1000) }),
  fakeNode({ turn: 2, innerText: 'x'.repeat(2000) }),
  fakeNode({ turn: 3, innerText: 'x'.repeat(5000) }),
], 3);
assert.equal(baseline, 1650);

// Turn detection: latest turn, closed tail, and current-turn characters.
function fakeFlow(nodes, tails = {}) {
  return {
    querySelectorAll(selector) {
      if (selector === '[data-chat-turn]') return nodes;
      const match = /data-chat-turn="(\d+)"/.exec(selector);
      if (selector.startsWith('[data-chat-flow-kind="assistant-step"]') && match) {
        return nodes.filter((node) => node.getAttribute('data-chat-turn') === match[1]);
      }
      return [];
    },
    querySelector(selector) {
      const match = /data-turn-tail="(\d+)"/.exec(selector);
      return match ? tails[match[1]] ?? null : null;
    },
  };
}

const turnNodes = [
  fakeNode({ turn: 1, innerText: 'a'.repeat(100) }),
  fakeNode({ turn: 2, innerText: 'b'.repeat(200) }),
  fakeNode({ turn: 3, innerText: 'c'.repeat(300) }),
  fakeNode({ turn: 3, innerText: 'd'.repeat(400) }),
];
const closedTail = { hasAttribute: (name) => name === 'data-actions-reveal' };
const openTail = { hasAttribute: () => false };

assert.equal(module.latestTurn(fakeFlow(turnNodes)), 3);
assert.equal(module.turnFinished(fakeFlow(turnNodes, { 3: closedTail }), 3), true);
assert.equal(module.turnFinished(fakeFlow(turnNodes, { 3: openTail }), 3), false);
assert.equal(module.turnFinished(fakeFlow(turnNodes), 3), false);
assert.equal(module.turnLength(fakeFlow(turnNodes), 3), 700);
assert.equal(module.turnLength(fakeFlow(turnNodes), 2), 200);

// Registration: one composer-dock row, nothing else.
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
  assert.equal(registrations[0].options.id, 'reply-progress');
  assert.equal(registrations[0].options.order, -1);
  assert.equal(registrations[0].options.locale, 'replyProgress');
  assert.equal(typeof registrations[0].component, 'function');
}

console.log('reply-progress bundle checks passed');
