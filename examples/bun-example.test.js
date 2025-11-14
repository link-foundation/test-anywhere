/**
 * Example usage of test-anywhere in Bun environment
 *
 * Run this test with:
 *   bun test examples/bun-example.test.js
 */

import {
  test,
  assert,
  beforeAll,
  beforeEach,
  afterEach,
  afterAll,
} from '../src/index.js';

let setupValue = null;

beforeAll(() => {
  console.log('Setting up Bun test suite...');
});

beforeEach(() => {
  setupValue = 'initialized';
});

afterEach(() => {
  setupValue = null;
});

afterAll(() => {
  console.log('Cleaning up Bun test suite...');
});

test('basic assertions work in Bun', () => {
  assert.ok(true, 'ok assertion works');
  assert.equal(1 + 1, 2, 'equal assertion works');
  assert.deepEqual({ a: 1 }, { a: 1 }, 'deepEqual assertion works');
});

test('beforeEach hook sets up value', () => {
  assert.equal(setupValue, 'initialized', 'setup value should be initialized');
});

test('assertion failures throw errors', () => {
  assert.throws(() => {
    assert.ok(false);
  }, 'should throw when assertion fails');
});

test('async operations work', async () => {
  const promise = Promise.resolve(42);
  const result = await promise;
  assert.equal(result, 42, 'async/await works correctly');
});

test('JSON operations', () => {
  const obj = { key: 'value', number: 123 };
  const json = JSON.stringify(obj);
  const parsed = JSON.parse(json);
  assert.deepEqual(parsed, obj, 'JSON round-trip works');
});
