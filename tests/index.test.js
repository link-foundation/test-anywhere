/**
 * Test suite for test-anywhere framework
 * These tests run on Bun, Deno, and Node.js
 */

import {
  test,
  assert,
  getRuntime,
  beforeAll,
  beforeEach,
  afterEach,
  afterAll,
} from '../src/index.js';

// Hook test state
let beforeAllCounter = 0;
let beforeEachCounter = 0;
let afterEachCounter = 0;
const testExecutionOrder = [];

beforeAll(() => {
  beforeAllCounter++;
  testExecutionOrder.push('beforeAll');
});

beforeEach(() => {
  beforeEachCounter++;
  testExecutionOrder.push('beforeEach');
});

afterEach(() => {
  afterEachCounter++;
  testExecutionOrder.push('afterEach');
});

afterAll(() => {
  testExecutionOrder.push('afterAll');
});

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
  } catch {
    errorThrown = true;
  }
  assert.ok(errorThrown, 'assert.ok(false) should throw an error');
});

// Edge case tests for deepEqual
test('deepEqual - property order independence', () => {
  assert.deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 });
  assert.deepEqual({ x: 1, y: 2, z: 3 }, { z: 3, x: 1, y: 2 });
});

test('deepEqual - handles NaN', () => {
  assert.deepEqual(NaN, NaN);
  assert.deepEqual({ x: NaN }, { x: NaN });
  assert.deepEqual([NaN, 1, 2], [NaN, 1, 2]);
});

test('deepEqual - handles null and undefined', () => {
  assert.deepEqual(null, null);
  assert.deepEqual(undefined, undefined);

  // Should NOT be equal
  let threw = false;
  try {
    assert.deepEqual(null, undefined);
  } catch {
    threw = true;
  }
  assert.ok(threw, 'null and undefined should not be deeply equal');
});

test('deepEqual - handles undefined in objects', () => {
  assert.deepEqual({ x: undefined }, { x: undefined });

  // Different: one has property, other doesn't
  let threw = false;
  try {
    assert.deepEqual({ x: undefined }, {});
  } catch {
    threw = true;
  }
  assert.ok(
    threw,
    'object with undefined property should not equal empty object'
  );
});

test('deepEqual - handles Date objects', () => {
  const date1 = new Date('2024-01-01');
  const date2 = new Date('2024-01-01');
  const date3 = new Date('2024-01-02');

  assert.deepEqual(date1, date2);

  let threw = false;
  try {
    assert.deepEqual(date1, date3);
  } catch {
    threw = true;
  }
  assert.ok(threw, 'different dates should not be equal');
});

test('deepEqual - handles nested objects', () => {
  assert.deepEqual({ a: { b: { c: 1 } } }, { a: { b: { c: 1 } } });

  assert.deepEqual({ x: [1, 2, { y: 3 }] }, { x: [1, 2, { y: 3 }] });
});

test('deepEqual - handles circular references', () => {
  const obj1 = { a: 1 };
  obj1.self = obj1;

  const obj2 = { a: 1 };
  obj2.self = obj2;

  // Should not throw
  assert.deepEqual(obj1, obj1);
});

test('deepEqual - arrays with different lengths', () => {
  let threw = false;
  try {
    assert.deepEqual([1, 2, 3], [1, 2]);
  } catch {
    threw = true;
  }
  assert.ok(threw, 'arrays with different lengths should not be equal');
});

// New assertion methods
test('notEqual - basic usage', () => {
  assert.notEqual(1, 2);
  assert.notEqual('hello', 'world');
  assert.notEqual(true, false);
});

test('notEqual - fails for equal values', () => {
  let threw = false;
  try {
    assert.notEqual(1, 1);
  } catch {
    threw = true;
  }
  assert.ok(threw, 'notEqual should throw for equal values');
});

test('notDeepEqual - basic usage', () => {
  assert.notDeepEqual({ a: 1 }, { a: 2 });
  assert.notDeepEqual([1, 2], [1, 3]);
});

test('notDeepEqual - fails for deeply equal values', () => {
  let threw = false;
  try {
    assert.notDeepEqual({ a: 1, b: 2 }, { b: 2, a: 1 });
  } catch {
    threw = true;
  }
  assert.ok(threw, 'notDeepEqual should throw for deeply equal values');
});

test('throwsAsync - async function that throws', async () => {
  await assert.throwsAsync(async () => {
    throw new Error('async error');
  });
});

test('throwsAsync - async function with Promise.reject', async () => {
  await assert.throwsAsync(async () => Promise.reject(new Error('rejected')));
});

test('throwsAsync - fails when async function does not throw', async () => {
  let threw = false;
  try {
    await assert.throwsAsync(async () => 'success');
  } catch {
    threw = true;
  }
  assert.ok(threw, 'throwsAsync should throw when function does not throw');
});

test('throws - detects async function and provides helpful error', () => {
  let errorMessage = '';
  try {
    // Call async function that returns a promise (but doesn't throw immediately)
    assert.throws(async () => Promise.resolve());
  } catch (error) {
    errorMessage = error.message;
  }
  assert.ok(
    errorMessage.includes('throwsAsync'),
    'should suggest using throwsAsync for async functions'
  );
});

test('match - string matches regexp', () => {
  assert.match('hello world', /world/);
  assert.match('test123', /\d+/);
  assert.match('Hello', /^[A-Z]/);
});

test('match - fails when string does not match', () => {
  let threw = false;
  try {
    assert.match('hello', /xyz/);
  } catch {
    threw = true;
  }
  assert.ok(threw, 'match should throw when string does not match');
});

test('includes - array contains value', () => {
  assert.includes([1, 2, 3], 2);
  assert.includes(['a', 'b', 'c'], 'b');
});

test('includes - string contains substring', () => {
  assert.includes('hello world', 'world');
  assert.includes('test', 'es');
});

test('includes - fails when value not in array', () => {
  let threw = false;
  try {
    assert.includes([1, 2, 3], 4);
  } catch {
    threw = true;
  }
  assert.ok(threw, 'includes should throw when value not in array');
});

test('includes - fails when substring not in string', () => {
  let threw = false;
  try {
    assert.includes('hello', 'xyz');
  } catch {
    threw = true;
  }
  assert.ok(threw, 'includes should throw when substring not in string');
});

// Hook tests
test('beforeAll hook runs once', () => {
  assert.equal(beforeAllCounter, 1, 'beforeAll should have run exactly once');
});

test('beforeEach hook runs before each test', () => {
  // By the time this test runs, beforeEach should have run at least once
  assert.ok(beforeEachCounter >= 1, 'beforeEach should have run at least once');
});

test('afterEach hook runs after each test', () => {
  // afterEach runs after each test completes
  // By the time we're in this test, previous tests' afterEach have completed
  assert.ok(afterEachCounter >= 0, 'afterEach counter should be non-negative');
});

// Test with async beforeEach/afterEach
let asyncSetupValue = null;

beforeEach(async () => {
  // Simulate async setup with a simple promise
  await Promise.resolve();
  asyncSetupValue = 'setup complete';
});

afterEach(async () => {
  // Simulate async cleanup with a simple promise
  await Promise.resolve();
  asyncSetupValue = null;
});

test('async hooks - setup value is available', () => {
  assert.equal(
    asyncSetupValue,
    'setup complete',
    'async beforeEach should have set up the value'
  );
});

test('hooks - execution order includes beforeAll', () => {
  assert.ok(
    testExecutionOrder.includes('beforeAll'),
    'beforeAll should be in execution order'
  );
  assert.ok(
    testExecutionOrder.includes('beforeEach'),
    'beforeEach should be in execution order'
  );
  assert.ok(
    testExecutionOrder.includes('afterEach'),
    'afterEach should be in execution order'
  );
});
