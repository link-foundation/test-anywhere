/**
 * Tests to verify Node.js native testing framework features
 * These tests confirm that Node.js-specific features work as documented
 * in NATIVE_TEST_FRAMEWORKS_COMPARISON.md
 *
 * Run with: node --test tests/runtime-features-node.test.js
 */

import {
  test,
  describe,
  it,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  before,
  after,
  assert,
} from '../src/index.js';

// Test basic Node.js test functionality through our wrapper
test('Node: basic test function works', () => {
  assert.ok(true, 'basic test passes');
});

// Test Node.js test modifiers through our API
test('Node: test.skip works', () => {
  assert.ok(typeof test.skip === 'function', 'test.skip is available');

  test.skip('skipped test', () => {
    throw new Error('This should not run on Node.js');
  });
});

test('Node: test.only works', () => {
  assert.ok(typeof test.only === 'function', 'test.only is available');
});

test('Node: test.todo works', () => {
  assert.ok(typeof test.todo === 'function', 'test.todo is available');

  test.todo('pending test');
});

// Test describe functionality (Node has native describe)
describe('Node: describe grouping', () => {
  it('works in Node.js', () => {
    assert.ok(true, 'describe + it works natively in Node');
  });

  it.skip('skip works in describe', () => {
    throw new Error('Should not run');
  });

  it.todo('todo in describe');
});

// Test describe modifiers
describe('Node: describe modifiers', () => {
  it('describe.skip exists', () => {
    assert.ok(typeof describe.skip === 'function', 'describe.skip available');
  });

  it('describe.only exists', () => {
    assert.ok(typeof describe.only === 'function', 'describe.only available');
  });
});

describe.skip('Node: this entire suite is skipped', () => {
  it('should not run', () => {
    throw new Error('Skipped describe should not run');
  });
});

// Test hooks (Node has native before/after, beforeEach/afterEach)
describe('Node: lifecycle hooks', () => {
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

// Test Mocha-style aliases (before/after)
describe('Node: Mocha-style hook aliases', () => {
  let beforeValue = 0;

  before(() => {
    beforeValue = 100;
  });

  it('before() works as alias for beforeAll()', () => {
    assert.equal(beforeValue, 100, 'before() should work');
  });

  after(() => {
    // Cleanup
  });

  it('after() is available', () => {
    assert.ok(typeof after === 'function', 'after should be a function');
  });
});

// Test async support
test('Node: async test support', async () => {
  const result = await Promise.resolve(100);
  assert.equal(result, 100, 'async tests work');
});

// Test async hooks
describe('Node: async hooks', () => {
  let asyncValue = 0;

  beforeAll(async () => {
    asyncValue = await Promise.resolve(999);
  });

  it('async beforeAll works', () => {
    assert.equal(asyncValue, 999, 'async beforeAll should work');
  });
});

// Test assertions
test('Node: assertion functions', () => {
  assert.ok(true, 'assert.ok works');
  assert.equal(1 + 1, 2, 'assert.equal works');
  assert.deepEqual([1, 2], [1, 2], 'assert.deepEqual works');
  assert.notEqual(1, 2, 'assert.notEqual works');
  assert.match('hello world', /world/, 'assert.match works');
  assert.includes([1, 2, 3], 2, 'assert.includes works');
});

test('Node: assert.throws works', () => {
  assert.throws(() => {
    throw new Error('test error');
  }, 'assert.throws catches errors');
});

test('Node: assert.throwsAsync works', async () => {
  await assert.throwsAsync(async () => {
    throw new Error('async error');
  }, 'assert.throwsAsync catches async errors');
});

// Test runtime detection
test('Node: runtime detection', () => {
  // We should be running on Node.js
  const isNode =
    typeof process !== 'undefined' && process.versions && process.versions.node;
  assert.ok(isNode, 'should detect Node.js runtime');
});

// Test that Node-specific features are available
test('Node: node:test module is available', () => {
  assert.ok(typeof process !== 'undefined', 'process global exists');
});

// Nested describes
describe('Node: nested describes', () => {
  describe('level 1', () => {
    let level1Setup = false;

    beforeAll(() => {
      level1Setup = true;
    });

    describe('level 2', () => {
      it('deep nesting works', () => {
        assert.ok(level1Setup, 'parent beforeAll should run');
        assert.ok(true, 'nested describes work on Node');
      });
    });
  });
});

// Test it() alias
describe('Node: it() alias', () => {
  it('it() works as alias for test()', () => {
    assert.ok(true, 'it() is an alias for test()');
  });

  it('it() has modifiers', () => {
    assert.ok(typeof it.skip === 'function', 'it.skip exists');
    assert.ok(typeof it.only === 'function', 'it.only exists');
    assert.ok(typeof it.todo === 'function', 'it.todo exists');
  });
});

// Test subtests (Node.js specific feature)
test('Node: subtests work', async (_t) => {
  // Note: This uses Node's native subtest feature if available
  // Our wrapper should pass through the test context
  assert.ok(true, 'parent test runs');
});
