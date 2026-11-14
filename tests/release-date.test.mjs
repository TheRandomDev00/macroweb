import test from 'node:test';
import assert from 'node:assert/strict';
import { releaseAge } from '../src/lib/release-date.ts';

test('release ages use days below a month and months thereafter', () => {
  const now = Date.parse('2026-11-14T12:00:00Z');
  const age = days => releaseAge(new Date(now - days * 86400000).toISOString(), now);
  assert.equal(age(0), 'Today');
  assert.equal(age(1), '1 day ago');
  assert.equal(age(29), '29 days ago');
  assert.equal(age(30), '1 month ago');
  assert.equal(age(90), '3 months ago');
  assert.equal(age(-1), 'Today');
  assert.equal(releaseAge('invalid', now), 'Unknown date');
});
