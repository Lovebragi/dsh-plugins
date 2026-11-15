// Behaviour harness for the auto-jump effect, with a controlled fake chat DOM.
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import assert from 'node:assert/strict';

const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8');

function makeDom({ startFinished = false, startAtBottom = true, promptTop = -300 } = {}) {
  const nodes = [{ getAttribute: (name) => (name === 'data-chat-turn' ? '1' : null) }];
  const prompt = {
    getClientRects: () => [{}],
    getBoundingClientRect: () => ({ top: promptTop, bottom: promptTop + 100, height: 100, left: 0, right: 100, width: 100 }),
  };
  let tail = startFinished ? { getAttribute: () => 'always' } : null;
  let answer = startFinished ? [{ textContent: 'answer' }] : null;
  const calls = [];
  const scroller = {
    scrollTop: startAtBottom ? 1200 : 0,
    scrollHeight: 2000,
    clientHeight: 800,
    getBoundingClientRect: () => ({ top: 100, bottom: 900, height: 800, left: 0, right: 100, width: 100 }),
    scrollTo(options) {
      calls.push(options);
      this.scrollTop = options.top;
    },
    addEventListener() {},
    removeEventListener() {},
  };
  const flow = {
    parentElement: scroller,
    querySelectorAll(selector) {
      if (selector === '[data-chat-turn]') return nodes;
      if (selector.includes('assistant-step')) return answer ?? [];
      return [];
    },
    querySelector(selector) {
      if (selector.includes('data-turn-tail')) return tail;
      if (selector.includes('data-chat-flow-kind="user"')) return prompt;
      return null;
    },
  };
  const host = {
    querySelector(selector) {
      return selector === '[data-chat-flow]' ? flow : null;
    },
    addEventListener() {},
    removeEventListener() {},
  };
  const mount = { closest: () => host };
  return {
    mount,
    scroller,
    calls,
    finish() {
      tail = { getAttribute: () => 'always' };
      answer = [{ textContent: 'answer' }];
    },
    scrollUp() {
      scroller.scrollTop = 0;
    },
  };
}

function loadComponent(dom) {
  let component;
  let refIndex = 0;
  let interval = null;
  const timers = [];
  const React = {
    createElement(type, props, ...children) {
      return { type, props, children };
    },
    useState(initial) {
      return [initial, () => {}];
    },
    useEffect(fn) {
      fn();
    },
    useRef(initial) {
      const index = refIndex++;
      return { current: index === 0 ? dom.mount : initial };
    },
  };
  const window = {
    __ModuleLoader__: {
      load(value) {
        this.row = value;
      },
    },
    setInterval(fn) {
      interval = fn;
      return 1;
    },
    clearInterval() {},
    setTimeout(fn, delay) {
      timers.push({ fn, delay });
      return timers.length;
    },
    clearTimeout() {},
    requestAnimationFrame: () => 1,
    cancelAnimationFrame: () => {},
    addEventListener() {},
    removeEventListener() {},
    matchMedia: () => ({ matches: false }),
    getComputedStyle: () => ({ overflowY: 'auto' }),
  };
  const document = {
    querySelector: () => null,
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
  const row = window.__ModuleLoader__.row;
  const module = row.factory((specifier) => {
    if (specifier === 'react') return React;
    throw new Error(`unexpected require: ${specifier}`);
  });
  const ctx = {
    effect(fn) {
      fn();
    },
    locale: { register() {} },
    slots: {
      inject(name, register) {
        register();
      },
      register(options, value) {
        component = value;
      },
    },
  };
  module.apply(ctx);
  return { component, timers, interval: () => interval?.(), resetRefs: () => { refIndex = 0; } };
}

// A running turn completes while the reader is at the floor: auto-jump fires.
{
  const dom = makeDom({ startFinished: false, startAtBottom: true });
  const loaded = loadComponent(dom);
  loaded.component({ sessionId: 's1', t: (key) => key });
  assert.equal(dom.calls.length, 0, 'no jump while the turn is running');
  dom.finish();
  loaded.interval(); // next 500ms tick sees the completed tail
  assert.equal(loaded.timers.length, 1, 'completion schedules one jump');
  loaded.timers[0].fn();
  assert.equal(dom.calls.length, 1, 'auto-jump scrolls once');
  assert.equal(dom.calls[0].top, 780, 'prompt lands 20px below the scrollport top');
  assert.equal(dom.calls[0].behavior, 'auto');
}

// A reader who scrolled up during the answer is not yanked away.
{
  const dom = makeDom({ startFinished: false, startAtBottom: true });
  const loaded = loadComponent(dom);
  loaded.component({ sessionId: 's2', t: (key) => key });
  dom.finish();
  dom.scrollUp();
  loaded.interval();
  assert.equal(loaded.timers.length, 0, 'no timer is armed for a scrolled-up reader');
  assert.equal(dom.calls.length, 0, 'scrolled-up reader keeps their position');
}

// Loading an already completed turn must not jump as soon as the session opens.
{
  const dom = makeDom({ startFinished: true, startAtBottom: true });
  const loaded = loadComponent(dom);
  loaded.component({ sessionId: 's3', t: (key) => key });
  assert.equal(loaded.timers.length, 0, 'history load schedules nothing');
  assert.equal(dom.calls.length, 0, 'history load does not move the viewport');
}

// Opening a settled session whose tail renders a moment later must not jump.
{
  const dom = makeDom({ startFinished: false, startAtBottom: true });
  const loaded = loadComponent(dom);
  loaded.component({
    sessionId: 's5',
    useSession: (selector) => selector({ running: false }),
    t: (key) => key,
  });
  dom.finish();
  loaded.interval();
  assert.equal(loaded.timers.length, 0, 'settled history is marked done at mount');
  assert.equal(dom.calls.length, 0, 'settled history never moves the viewport');
}

// A short reply whose prompt is still visible schedules a check but never moves.
{
  const dom = makeDom({ startFinished: false, startAtBottom: true, promptTop: 300 });
  const loaded = loadComponent(dom);
  loaded.component({ sessionId: 's4', t: (key) => key });
  dom.finish();
  loaded.interval();
  assert.equal(loaded.timers.length, 1);
  loaded.timers[0].fn();
  assert.equal(dom.calls.length, 0, 'visible prompt means no jump');
}

console.log('jump-to-question effect checks passed');
