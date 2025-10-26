/**
 * Test suite for test-anywhere framework
 * These tests run on Bun, Deno, and Node.js
 */

import { test, assert, getRuntime } from './index.js';

test('basic assertion - ok', () => {
  assert.ok(true);
  assert.ok(1);
  assert.ok('hello');
});

test('basic assertion - equal', () => {
  assert.equal(1, 1);
  assert.equal('hello', 'hello');
  assert.equal(true, true);
});

test('basic assertion - deepEqual', () => {
  assert.deepEqual({ a: 1 }, { a: 1 });
  assert.deepEqual([1, 2, 3], [1, 2, 3]);
});

test('basic assertion - throws', () => {
  assert.throws(() => {
    throw new Error('Expected error');
  });
});

test('getRuntime returns valid runtime', () => {
  const runtime = getRuntime();
  const validRuntimes = ['bun', 'deno', 'node'];
  assert.ok(
    validRuntimes.includes(runtime),
    `Runtime ${runtime} should be one of: ${validRuntimes.join(', ')}`
  );
});

test('assertion failures throw errors', () => {
  let errorThrown = false;
  try {
    assert.ok(false);
  } catch (_e) {
    errorThrown = true;
  }
  assert.ok(errorThrown, 'assert.ok(false) should throw an error');
});
