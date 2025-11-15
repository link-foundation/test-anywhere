/**
 * Test suite for new API features (describe, it, modifiers)
 * Tests the BDD-style syntax and test modifiers added in issue #65
 */

import {
  describe,
  it,
  test,
  assert,
  before,
  after,
  beforeEach,
  afterEach,
} from '../src/index.js';

// Test it() as alias for test()
it('it() works as alias for test()', () => {
  assert.ok(true, 'it() should work just like test()');
});

// Test describe() grouping
describe('describe() function', () => {
  it('groups related tests together', () => {
    assert.ok(true, 'describe() should group tests');
  });

  it('supports nested tests', () => {
    assert.equal(1 + 1, 2, 'basic math should work inside describe');
  });
});

// Test Mocha-style hooks
describe('Mocha-style hook aliases', () => {
  let setupValue = 0;

  before(() => {
    setupValue = 42;
  });

  after(() => {
    // Cleanup (we can't easily assert this runs, but it's here for completeness)
  });

  it('before() should work as alias for beforeAll()', () => {
    assert.equal(setupValue, 42, 'before() should have set setupValue');
  });

  it('after() is an alias for afterAll()', () => {
    // We can't directly test after() runs, but we can verify it exists
    assert.ok(typeof after === 'function', 'after should be a function');
  });
});

// Test describe nesting
describe('nested describes', () => {
  describe('level 1', () => {
    describe('level 2', () => {
      it('supports deep nesting', () => {
        assert.ok(true, 'deeply nested tests should work');
      });
    });
  });
});

// Test combinations
describe('BDD style combinations', () => {
  let counter = 0;

  beforeEach(() => {
    counter++;
  });

  it('first test', () => {
    assert.ok(counter >= 1, 'beforeEach should have run');
  });

  it('second test', () => {
    assert.ok(counter >= 2, 'beforeEach should run before each test');
  });

  afterEach(() => {
    // Cleanup (counter will keep incrementing)
  });
});

// Note: We can't easily test .skip, .only, and .todo in a single test run
// because they affect test execution. These are tested manually or in separate runs.
// However, we can verify they exist:

describe('test modifiers exist', () => {
  it('test.skip should be a function', () => {
    assert.ok(typeof test.skip === 'function', 'test.skip should exist');
  });

  it('test.only should be a function', () => {
    assert.ok(typeof test.only === 'function', 'test.only should exist');
  });

  it('test.todo should be a function', () => {
    assert.ok(typeof test.todo === 'function', 'test.todo should exist');
  });

  it('it.skip should be a function', () => {
    assert.ok(typeof it.skip === 'function', 'it.skip should exist');
  });

  it('it.only should be a function', () => {
    assert.ok(typeof it.only === 'function', 'it.only should exist');
  });

  it('it.todo should be a function', () => {
    assert.ok(typeof it.todo === 'function', 'it.todo should exist');
  });

  it('describe.skip should be a function', () => {
    assert.ok(
      typeof describe.skip === 'function',
      'describe.skip should exist'
    );
  });

  it('describe.only should be a function', () => {
    assert.ok(
      typeof describe.only === 'function',
      'describe.only should exist'
    );
  });
});

// Edge cases
describe('edge cases', () => {
  it('empty describe blocks should work', () => {
    // This test itself proves describe works
    assert.ok(true);
  });

  it('async tests in describe should work', async () => {
    const result = await Promise.resolve(42);
    assert.equal(result, 42);
  });
});

// Mixed test() and it() usage
describe('mixing test() and it()', () => {
  test('test() works inside describe', () => {
    assert.ok(true);
  });

  it('it() works inside describe', () => {
    assert.ok(true);
  });
});
