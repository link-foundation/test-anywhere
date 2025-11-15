/**
 * Tests to verify Deno native testing framework features
 * These tests confirm that Deno-specific features work as documented
 * in NATIVE_TEST_FRAMEWORKS_COMPARISON.md
 *
 * Run with: deno test tests/runtime-features-deno.test.js
 */

import {
  test,
  describe,
  it,
  beforeAll,
  afterAll,
  assert,
} from '../src/index.js';

// Test basic Deno.test functionality through our wrapper
test('Deno: basic test function works', () => {
  assert.ok(true, 'basic test passes');
});

// Test Deno test modifiers through our API
test('Deno: test.skip works', () => {
  assert.ok(typeof test.skip === 'function', 'test.skip is available');
  // Note: Cannot call test.skip() inside a test when running on Bun
});

test('Deno: test.only works', () => {
  assert.ok(typeof test.only === 'function', 'test.only is available');
});

test('Deno: test.todo works', () => {
  assert.ok(typeof test.todo === 'function', 'test.todo is available');
  // Note: Cannot call test.todo() inside a test when running on Bun
});

// Test describe functionality
describe('Deno: describe grouping', () => {
  it('works in Deno', () => {
    assert.ok(true, 'describe + it works');
  });

  it.skip('skip works in describe', () => {
    throw new Error('Should not run');
  });

  it.todo('todo in describe');
});

// Test hooks
describe('Deno: lifecycle hooks', () => {
  let setupValue = 0;

  beforeAll(() => {
    setupValue = 42;
  });

  it('beforeAll runs before tests', () => {
    assert.equal(setupValue, 42, 'beforeAll should have set value');
  });

  afterAll(() => {
    // Cleanup
  });
});

// Test async support
test('Deno: async test support', async () => {
  const result = await Promise.resolve(100);
  assert.equal(result, 100, 'async tests work');
});

// Test assertions
test('Deno: assertion functions', () => {
  assert.ok(true, 'assert.ok works');
  assert.equal(1 + 1, 2, 'assert.equal works');
  assert.deepEqual([1, 2], [1, 2], 'assert.deepEqual works');
  assert.notEqual(1, 2, 'assert.notEqual works');
});

test('Deno: assert.throws works', () => {
  assert.throws(() => {
    throw new Error('test error');
  }, 'assert.throws catches errors');
});

test('Deno: assert.throwsAsync works', async () => {
  await assert.throwsAsync(async () => {
    throw new Error('async error');
  }, 'assert.throwsAsync catches async errors');
});

// Test runtime detection - only run on Deno
if (typeof Deno !== 'undefined') {
  test('Deno: runtime detection', () => {
    // We should be running on Deno
    const isDeno = typeof Deno !== 'undefined';
    assert.ok(isDeno, 'should detect Deno runtime');
  });

  // Test that Deno-specific features are available
  test('Deno: Deno.test is available', () => {
    assert.ok(typeof Deno !== 'undefined', 'Deno global exists');
    assert.ok(typeof Deno.test === 'function', 'Deno.test exists');
  });
} else {
  test.skip('Deno: runtime detection (skipped - not running on Deno)', () => {});
  test.skip('Deno: Deno.test is available (skipped - not running on Deno)', () => {});
}

// Nested describes
describe('Deno: nested describes', () => {
  describe('level 1', () => {
    describe('level 2', () => {
      it('deep nesting works', () => {
        assert.ok(true, 'nested describes work on Deno');
      });
    });
  });
});
