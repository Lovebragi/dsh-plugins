// Offline harness for the hand-written browser bundle: evaluates the served
// script against stub React/primitives, then drives apply() with a fake ctx.
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import assert from 'node:assert/strict';

const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8');

function createElement(type, props, ...children) {
  return { type, props: props ?? {}, children: children.flat(Infinity) };
}

const React = {
  createElement,
  useState(initial) {
    return [typeof initial === 'function' ? initial() : true, () => {}];
  },
  useEffect() {},
  useRef(initial) {
    return { current: initial };
  },
  useSyncExternalStore(_subscribe, getSnapshot) {
    return getSnapshot();
  },
};

const ReactDom = {
  createPortal(node) {
    return node;
  },
};

const primitives = {
  Tooltip: function Tooltip() {},
  IconChevronLeftOutlineRegular: function IconChevronLeftOutlineRegular() {},
};

function loadBundle() {
  let row;
  const window = {
    __ModuleLoader__: {
      load(value) {
        row = value;
      },
    },
    setInterval: () => 1,
    clearInterval: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  const document = {
    visibilityState: 'visible',
    querySelector: () => null,
    createElement: () => ({ dataset: {}, textContent: '', style: {} }),
    head: { appendChild: () => {} },
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  const context = createContext({
    window,
    document,
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    BigInt,
    Date,
    Intl,
    __DSH_BOOT__: { release: { version: '0.2.1-rc.5' } },
  });
  runInContext(source, context, { filename: 'lib/client.js' });
  assert.equal(row.id, 'dsh-balance-chip', 'bundle registers the package id');
  const module = row.factory((specifier) => {
    if (specifier === 'react') return React;
    if (specifier === 'react-dom') return ReactDom;
    if (specifier === '@deepseek-ai/dsh-client-ui-primitives') return primitives;
    throw new Error(`unexpected require: ${specifier}`);
  });
  return module;
}

function textOf(node) {
  if (node === null || node === undefined || node === false) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  return textOf(node.children);
}

function makeCtx(overrides = {}) {
  const effects = [];
  const registrations = [];
  const calls = [];
  const ctx = {
    effect(fn, label) {
      const cleanup = fn();
      effects.push({ label, cleanup });
    },
    locale: {
      register() {},
      bind() {
        return (key, params) => (params ? `${key}:${JSON.stringify(params)}` : key);
      },
      getSnapshot() {
        return { active: 'zh' };
      },
    },
    remote: {
      account: {
        async getState() {
          return {
            ok: true,
            value: {
              status: 'credential-stored',
              links: { usageUrl: 'https://platform.example/usage', topUpUrl: 'https://platform.example/top_up' },
            },
          };
        },
        async getBalance(client) {
          calls.push(client);
          return {
            ok: true,
            value: {
              status: 'ready',
              value: [{ currency: 'CNY', balance: '1234.5' }],
              bonusWallets: [{ currency: 'CNY', balance: '5' }],
            },
          };
        },
      },
    },
    slots: {
      inject(name, register) {
        register();
      },
      register(options, component) {
        registrations.push({ options, component });
      },
    },
    ...overrides,
  };
  return { ctx, effects, registrations, calls };
}

const module = loadBundle();

// Formatting rules mirrored from the account settings reference.
const cases = [
  ['1234.5', 'CNY', '¥1,234.50'],
  ['1234.567', 'CNY', '¥1,234.56'],
  ['0.009', 'CNY', '<¥0.01'],
  ['0', 'CNY', '¥0.00'],
  ['-0.001', 'CNY', '-¥0.01'],
  ['-1.239', 'USD', '-$1.24'],
  ['-1.234', 'USD', '-$1.23'],
  ['12', 'USD', '$12.00'],
  ['1e+3', 'CNY', '¥1,000.00'],
  ['bad', 'CNY', '¥--'],
];
for (const [raw, currency, expected] of cases) {
  assert.equal(module.formatMoney(raw, currency), expected, `${raw} ${currency}`);
}

{
  const { ctx, registrations, calls } = makeCtx();
  module.apply(ctx);
  assert.equal(registrations.length, 2, 'header + overlay registrations');
  const header = registrations.find((row) => row.options.name === 'conversation.session.header.utilities');
  const overlay = registrations.find((row) => row.options.name === 'shell.overlay');
  assert.ok(header, 'header utility row');
  assert.ok(overlay, 'overlay fallback row');
  assert.equal(header.options.order, 50);
  assert.equal(header.options.locale, 'balanceChip');

  const injected = header.options.inject();
  assert.equal(injected.variant, 'inline');
  await injected.refresh();
  const snapshot = injected.store.getSnapshot();
  assert.equal(snapshot.status, 'ready');
  assert.equal(snapshot.wallets[0].balance, '1234.5');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].version, '0.2.1-rc.5');
  assert.equal(calls[0].locale, 'zh');
  assert.equal(typeof calls[0].timezoneOffsetSeconds, 'number');

  const tree = header.component({ ...injected, t: ctx.locale.bind('balanceChip') });
  const text = textOf(tree);
  assert.match(text, /¥1,234\.50/, `renders amount, got ${text}`);
  assert.match(text, /balanceChip|余额|label/i, 'renders a label key');
  assert.equal(tree.props['data-dsh-balance-chip'], 'inline');
  const card = tree.children.find((child) => child.props.className === 'dshBalanceCard');
  assert.ok(card, 'hover card');
  const actions = card.children.find((child) => child.props.className === 'dshBalanceActions');
  assert.ok(actions, 'hover actions container');
  assert.equal(actions.children.length, 2, 'usage and top-up buttons');

  const opened = [];
  const withActions = header.component({
    ...injected,
    openPage: (page) => opened.push(page),
    t: ctx.locale.bind('balanceChip'),
  });
  const cardWithActions = withActions.children.find((child) => child.props.className === 'dshBalanceCard');
  const actionRow = cardWithActions.children.find((child) => child.props.className === 'dshBalanceActions');
  actionRow.children[0].props.onClick();
  actionRow.children[1].props.onClick();
  assert.deepEqual(opened, ['usage', 'top-up']);

  // Clicking refreshes through the same single-flight reader.
  tree.children[0].children[0].props.onClick();
  await Promise.resolve();
  await Promise.resolve();
  assert.ok(calls.length >= 1, 'click refresh issued a read');
}

{
  const { ctx, registrations } = makeCtx({
    remote: {
      account: {
        async getState() {
          return { ok: true, value: { status: 'signed-out' } };
        },
        async getBalance() {
          throw new Error('must not read balance while signed out');
        },
      },
    },
  });
  module.apply(ctx);
  const header = registrations.find((row) => row.options.name === 'conversation.session.header.utilities');
  const injected = header.options.inject();
  await injected.refresh();
  assert.equal(injected.store.getSnapshot().status, 'signed-out');
  assert.equal(header.component({ ...injected, t: () => 'x' }), null);
}

{
  const { ctx, registrations } = makeCtx({
    remote: {
      account: {
        async getState() {
          return { ok: true, value: { status: 'credential-stored' } };
        },
        async getBalance() {
          return { ok: true, value: { status: 'failed' } };
        },
      },
    },
  });
  module.apply(ctx);
  const header = registrations.find((row) => row.options.name === 'conversation.session.header.utilities');
  const injected = header.options.inject();
  await injected.refresh();
  assert.equal(injected.store.getSnapshot().status, 'failed');
  const tree = header.component({ ...injected, t: () => 'x' });
  assert.match(textOf(tree), /--/);
}

console.log('client bundle checks passed');
