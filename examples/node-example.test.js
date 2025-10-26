/**
 * Example usage of test-anywhere in Node.js environment
 *
 * Run this test with:
 *   node --test examples/node-example.test.js
 *
 * Or using npm:
 *   npm test
 */

import { test, assert, getRuntime } from 'test-anywhere';

test('basic assertions work in Node.js', () => {
  assert.ok(true, 'ok assertion works');
  assert.equal(1 + 1, 2, 'equal assertion works');
  assert.deepEqual({ a: 1 }, { a: 1 }, 'deepEqual assertion works');
});

test('runtime detection works', () => {
  const runtime = getRuntime();
  assert.equal(runtime, 'node', 'should detect Node.js runtime');
});

test('assertion failures throw errors', () => {
  assert.throws(() => {
    assert.ok(false);
  }, 'should throw when assertion fails');
});

test('mathematical operations', () => {
  const result = Math.pow(2, 3);
  assert.equal(result, 8, '2^3 should equal 8');
});

test('array operations', () => {
  const arr = [1, 2, 3];
  arr.push(4);
  assert.deepEqual(arr, [1, 2, 3, 4], 'array should have 4 elements');
});
