import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { buildSceneLayout } from '../src/lib/scene-layout.ts';
import * as transitions from '../src/lib/scene-transitions.ts';

const compiled = ts.transpileModule(
  readFileSync(new URL('../src/lib/scene-motion.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;

function fixture() {
  const layout = buildSceneLayout([1000, 1000, 1000], 900);
  let now = 1000, id = 0, position = 0;
  const frames = new Map(), timers = new Map(), listeners = new Map();
  const port = {
    dataset: { mode: 'pinned' },
    get scrollTop() { return position; },
    set scrollTop(value) { position = Math.round(Math.max(0, Math.min(layout.maxScroll, value))); },
    addEventListener(name, listener) { listeners.set(name, listener); },
    removeEventListener(name) { listeners.delete(name); },
    removeAttribute() {},
  };
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require: () => transitions,
    performance: { now: () => now },
    requestAnimationFrame: callback => { frames.set(++id, callback); return id; },
    cancelAnimationFrame: key => frames.delete(key),
    setTimeout: (callback, delay) => { timers.set(++id, { callback, at: now + delay }); return id; },
    clearTimeout: key => timers.delete(key),
  });
  const motion = exports.createSceneMotion({ port, getLayout: () => layout, render() {} });
  function step(elapsed = 16) {
    const before = position;
    now += elapsed;
    const batch = [...frames];
    frames.clear();
    for (const [, callback] of batch) callback(now);
    for (const [key, timer] of [...timers]) {
      if (timer.at <= now) { timers.delete(key); timer.callback(); }
    }
    // Browser scroll events also fire for our own writes. They must not requeue distance.
    if (position !== before) motion.observeScroll();
  }
  function input(delta) {
    listeners.get('wheel')({ deltaY: delta, deltaX: 0, ctrlKey: false });
    port.scrollTop += delta;
    motion.observeScroll();
  }
  function finish() {
    for (let count = 0; count < 600 && (frames.size || timers.size); count++) step();
    assert.equal(frames.size, 0, 'Momentum must finish');
    assert.equal(timers.size, 0, 'Settling must finish');
  }
  return { layout, port, motion, step, input, finish, listeners };
}

test('large and small gestures both finish the current transition', () => {
  const fast = fixture(), slow = fixture();
  const start = fast.layout.scenes[0].hold;
  const target = fast.layout.scenes[1].start - 40;
  for (const state of [fast, slow]) state.input(start);
  fast.step(32);
  fast.input(target - start);
  assert.ok(fast.port.scrollTop < fast.layout.scenes[1].start);
  for (let remaining = target - start; remaining > 0;) {
    if (slow.port.scrollTop >= slow.layout.scenes[1].start) break;
    slow.step(20);
    if (slow.port.scrollTop >= slow.layout.scenes[1].start) break;
    const delta = Math.min(10, remaining);
    slow.input(delta);
    remaining -= delta;
  }
  fast.finish();
  slow.finish();
  assert.equal(fast.port.scrollTop, fast.layout.scenes[1].start);
  assert.equal(slow.port.scrollTop, slow.layout.scenes[1].start);
});

test('additional gestures add momentum while crossing speed stays capped', () => {
  const state = fixture();
  state.input(state.layout.scenes[0].hold);
  const target = state.layout.scenes[1].start + 100;
  state.input(200);
  state.input(target - state.layout.scenes[0].hold - 200);
  let previous = state.port.scrollTop;
  while (state.port.scrollTop < state.layout.scenes[1].start) {
    state.step();
    assert.ok(state.port.scrollTop - previous <= 0.8 * 16 + 1);
    previous = state.port.scrollTop;
  }
  state.finish();
  assert.equal(state.port.scrollTop, state.layout.scenes[1].start);
});

test('excess momentum stops at the current crossing in either direction', () => {
  const state = fixture();
  state.input(state.layout.maxScroll);
  state.finish();
  assert.equal(state.port.scrollTop, state.layout.scenes[1].start);
  for (let frame = 0; frame < 20; frame++) state.step();
  assert.equal(state.port.scrollTop, state.layout.scenes[1].start);
  // Fresh input still scrolls normally inside the chapter.
  state.input(100);
  assert.equal(state.port.scrollTop, state.layout.scenes[1].start + 100);
  state.input(-state.layout.maxScroll);
  state.finish();
  assert.equal(state.port.scrollTop, state.layout.scenes[0].hold);
  for (let frame = 0; frame < 20; frame++) state.step();
  assert.equal(state.port.scrollTop, state.layout.scenes[0].hold);
  state.input(-100);
  assert.equal(state.port.scrollTop, state.layout.scenes[0].hold - 100);
});

test('reversing cancels queued forward momentum immediately', () => {
  const state = fixture();
  state.input(state.layout.scenes[1].start + 100);
  state.step();
  const before = state.port.scrollTop;
  state.input(-10);
  assert.ok(state.port.scrollTop <= before);
  state.finish();
  assert.equal(state.port.scrollTop, state.layout.scenes[0].hold);
});

test('reaching the reading boundary does not start a transition without crossing it', () => {
  const state = fixture();
  state.input(state.layout.scenes[0].hold);
  for (let frame = 0; frame < 30; frame++) state.step();
  assert.equal(state.port.scrollTop, state.layout.scenes[0].hold);
  assert.equal(state.port.dataset.transition, 'idle');
  state.input(1);
  state.finish();
  assert.equal(state.port.scrollTop, state.layout.scenes[1].start);
});

test('touch contact suppresses completion until release', () => {
  const state = fixture();
  state.input(state.layout.scenes[0].hold);
  state.listeners.get('touchstart')();
  state.input(1);
  for (let frame = 0; frame < 100; frame++) state.step();
  assert.ok(state.port.scrollTop < state.layout.scenes[1].start);
  state.listeners.get('touchend')();
  state.finish();
  assert.equal(state.port.scrollTop, state.layout.scenes[1].start);
});

test('navigation, pointer interaction, and teardown discard stale momentum', () => {
  for (const interrupt of ['navigate', 'pointerdown', 'destroy']) {
    const state = fixture();
    state.input(state.layout.maxScroll);
    if (interrupt === 'navigate') state.motion.navigate(0, false);
    else if (interrupt === 'destroy') state.motion.destroy();
    else state.listeners.get('pointerdown')();
    state.finish();
    assert.ok(state.port.scrollTop < state.layout.scenes[1].start);
  }
});
