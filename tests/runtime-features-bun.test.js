/**
 * Tests to verify Bun native testing framework features
 * These tests confirm that Bun-specific features work as documented
 * in NATIVE_TEST_FRAMEWORKS_COMPARISON.md
 *
 * Run with: bun test tests/runtime-features-bun.test.js
 */

import {
  test,
  describe,
  it,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  assert,
} from '../src/index.js';

// Test basic Bun test functionality through our wrapper
test('Bun: basic test function works', () => {
  assert.ok(true, 'basic test passes');
});

// Test Bun test modifiers through our API
test('Bun: test.skip works', () => {
  assert.ok(typeof test.skip === 'function', 'test.skip is available');

  test.skip('skipped test', () => {
    throw new Error('This should not run on Bun');
  });
});

test('Bun: test.only works', () => {
  assert.ok(typeof test.only === 'function', 'test.only is available');
});

test('Bun: test.todo works', () => {
  assert.ok(typeof test.todo === 'function', 'test.todo is available');

  test.todo('pending test');
});

// Test describe functionality (Bun has native describe)
describe('Bun: describe grouping', () => {
  it('works in Bun', () => {
    assert.ok(true, 'describe + it works natively in Bun');
  });

  it.skip('skip works in describe', () => {
    throw new Error('Should not run');
  });

  it.todo('todo in describe');
});

// Test describe modifiers
describe('Bun: describe modifiers', () => {
  it('describe.skip exists', () => {
    assert.ok(typeof describe.skip === 'function', 'describe.skip available');
  });

  it('describe.only exists', () => {
    assert.ok(typeof describe.only === 'function', 'describe.only available');
  });
});

describe.skip('Bun: this entire suite is skipped', () => {
  it('should not run', () => {
    throw new Error('Skipped describe should not run');
  });
});

// Test hooks (Bun has native hooks)
describe('Bun: lifecycle hooks', () => {
  let setupValue = 0;
  let eachCounter = 0;

  beforeAll(() => {
    setupValue = 42;
  });

  beforeEach(() => {
    eachCounter++;
  });

  it('beforeAll runs before tests', () => {
    assert.equal(setupValue, 42, 'beforeAll should have set value');
    assert.ok(eachCounter >= 1, 'beforeEach should have run');
  });

  it('beforeEach runs before each test', () => {
    assert.ok(eachCounter >= 2, 'beforeEach should run for each test');
  });

  afterEach(() => {
    // Runs after each test
  });

  afterAll(() => {
    // Cleanup
  });
});

// Test async support
test('Bun: async test support', async () => {
  const result = await Promise.resolve(100);
  assert.equal(result, 100, 'async tests work');
});

// Test async hooks
describe('Bun: async hooks', () => {
  let asyncValue = 0;

  beforeAll(async () => {
    asyncValue = await Promise.resolve(999);
  });

  it('async beforeAll works', () => {
    assert.equal(asyncValue, 999, 'async beforeAll should work');
  });
});

// Test assertions
test('Bun: assertion functions', () => {
  assert.ok(true, 'assert.ok works');
  assert.equal(1 + 1, 2, 'assert.equal works');
  assert.deepEqual([1, 2], [1, 2], 'assert.deepEqual works');
  assert.notEqual(1, 2, 'assert.notEqual works');
  assert.match('hello world', /world/, 'assert.match works');
  assert.includes([1, 2, 3], 2, 'assert.includes works');
});

test('Bun: assert.throws works', () => {
  assert.throws(() => {
    throw new Error('test error');
  }, 'assert.throws catches errors');
});

test('Bun: assert.throwsAsync works', async () => {
  await assert.throwsAsync(async () => {
    throw new Error('async error');
  }, 'assert.throwsAsync catches async errors');
});

// Test runtime detection
test('Bun: runtime detection', () => {
  // We should be running on Bun
  const isBun = typeof Bun !== 'undefined';
  assert.ok(isBun, 'should detect Bun runtime');
});

// Test that Bun-specific features are available
test('Bun: bun:test module is available', () => {
  assert.ok(typeof Bun !== 'undefined', 'Bun global exists');
});

// Nested describes
describe('Bun: nested describes', () => {
  describe('level 1', () => {
    let level1Setup = false;

    beforeAll(() => {
      level1Setup = true;
    });

    describe('level 2', () => {
      it('deep nesting works', () => {
        assert.ok(level1Setup, 'parent beforeAll should run');
        assert.ok(true, 'nested describes work on Bun');
      });
    });
  });
});

// Test it() alias
describe('Bun: it() alias', () => {
  it('it() works as alias for test()', () => {
    assert.ok(true, 'it() is an alias for test()');
  });

  it('it() has modifiers', () => {
    assert.ok(typeof it.skip === 'function', 'it.skip exists');
    assert.ok(typeof it.only === 'function', 'it.only exists');
    assert.ok(typeof it.todo === 'function', 'it.todo exists');
  });
});
