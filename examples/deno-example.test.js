/**
 * Example usage of test-anywhere in Deno environment
 *
 * Run this test with:
 *   deno test --allow-read examples/deno-example.test.js
 *
 * The --allow-read permission is needed for Deno to import the module
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
  console.log('Setting up Deno test suite...');
});

beforeEach(() => {
  setupValue = 'initialized';
});

afterEach(() => {
  setupValue = null;
});

afterAll(() => {
  console.log('Cleaning up Deno test suite...');
});

test('basic assertions work in Deno', () => {
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

test('string operations', () => {
  const str = 'hello world';
  assert.equal(str.toUpperCase(), 'HELLO WORLD', 'uppercase should work');
});

test('object operations', () => {
  const obj = { name: 'test', value: 42 };
  assert.ok(obj.name === 'test', 'object property access works');
  assert.equal(obj.value, 42, 'object value is correct');
});
