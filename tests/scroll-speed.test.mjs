import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createScrollSpeed,
  continuationDuration,
} from "../src/lib/scroll-speed.ts";
test("slow final input does not dominate the 200ms average", () => {
  const speed = createScrollSpeed();
  speed.record(190, 0, 190);
  assert.equal(speed.record(1, 190, 200), 191 / 200);
});
test("old samples expire and partial intervals are weighted by time", () => {
  const speed = createScrollSpeed();
  speed.record(200, 0, 100);
  assert.equal(speed.record(100, 100, 250), 200 / 200);
  assert.equal(speed.record(20, 250, 450), 0.1);
});
test("direction changes immediately and history can be reset", () => {
  const speed = createScrollSpeed();
  speed.record(100, 0, 100);
  assert.equal(speed.record(-10, 100, 120), -0.5);
  speed.clear();
  assert.equal(speed.record(2, 120, 140), 0.1);
});
test("three-second and slower crossings accelerate; faster motion is preserved", () => {
  assert.equal(continuationDuration(300, 0.1), 1000);
  assert.equal(continuationDuration(-300, -0.01), 1000);
  assert.equal(continuationDuration(300, 0.2), 1500);
  assert.equal(continuationDuration(300, 3), 100);
});
