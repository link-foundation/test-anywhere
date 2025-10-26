/**
 * Example usage of test-anywhere in Deno environment
 *
 * Run this test with:
 *   deno test --allow-read examples/deno-example.test.js
 *
 * The --allow-read permission is needed for Deno to import the module
 */

import { test, assert, getRuntime } from '../index.js';

test('basic assertions work in Deno', () => {
  assert.ok(true, 'ok assertion works');
  assert.equal(1 + 1, 2, 'equal assertion works');
  assert.deepEqual({ a: 1 }, { a: 1 }, 'deepEqual assertion works');
});

test('runtime detection works', () => {
  const runtime = getRuntime();
  assert.equal(runtime, 'deno', 'should detect Deno runtime');
});

test('assertion failures throw errors', () => {
  assert.throws(() => {
    assert.ok(false);
  }, 'should throw when assertion fails');
});

test('string operations', () => {
  const str = 'hello world';
  assert.equal(str.toUpperCase(), 'HELLO WORLD', 'uppercase should work');
});

test('object operations', () => {
  const obj = { name: 'test', value: 42 };
  assert.ok(obj.name === 'test', 'object property access works');
  assert.equal(obj.value, 42, 'object value is correct');
});
