/**
 * Tests for Mocha-style hook aliases (before/after)
 * Verifies that before/after work alongside beforeAll/afterAll
 */

import {
  describe,
  it,
  before,
  after,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  assert,
} from '../src/index.js';

describe('Mocha-style hook aliases', () => {
  let beforeValue = 0;
  let beforeAllValue = 0;

  // Use both before() and beforeAll() together
  before(() => {
    beforeValue = 100;
  });

  beforeAll(() => {
    beforeAllValue = 200;
  });

  after(() => {
    // Cleanup after all tests
  });

  afterAll(() => {
    // Cleanup after all tests
  });

  it('before() should work as alias for beforeAll()', () => {
    assert.equal(beforeValue, 100, 'before() should have set beforeValue');
  });

  it('beforeAll() should work alongside before()', () => {
    assert.equal(
      beforeAllValue,
      200,
      'beforeAll() should have set beforeAllValue'
    );
  });

  it('after() should be a function', () => {
    assert.ok(typeof after === 'function', 'after should be exported');
  });

  it('afterAll() should be a function', () => {
    assert.ok(typeof afterAll === 'function', 'afterAll should be exported');
  });

  it('before should be same reference as beforeAll', () => {
    assert.equal(before, beforeAll, 'before should alias beforeAll');
  });

  it('after should be same reference as afterAll', () => {
    assert.equal(after, afterAll, 'after should alias afterAll');
  });
});

describe('hook execution order', () => {
  const executionOrder = [];

  beforeAll(() => {
    executionOrder.push('beforeAll-1');
  });

  before(() => {
    executionOrder.push('before-1');
  });

  beforeEach(() => {
    executionOrder.push('beforeEach');
  });

  afterEach(() => {
    executionOrder.push('afterEach');
  });

  it('first test', () => {
    assert.ok(
      executionOrder.includes('beforeAll-1'),
      'beforeAll should have run'
    );
    assert.ok(executionOrder.includes('before-1'), 'before should have run');
    assert.ok(
      executionOrder.includes('beforeEach'),
      'beforeEach should have run'
    );
  });

  it('second test', () => {
    // beforeEach should have run twice now (once per test)
    const beforeEachCount = executionOrder.filter(
      (item) => item === 'beforeEach'
    ).length;
    assert.ok(beforeEachCount >= 2, 'beforeEach should run before each test');
  });

  after(() => {
    executionOrder.push('after-1');
  });

  afterAll(() => {
    executionOrder.push('afterAll-1');
  });
});

// Test that hooks work in nested describes with aliases
describe('nested hooks with aliases', () => {
  let outerSetup = false;

  before(() => {
    outerSetup = true;
  });

  describe('inner suite', () => {
    let innerSetup = false;

    beforeAll(() => {
      innerSetup = true;
    });

    it('should have both outer and inner setup', () => {
      assert.ok(outerSetup, 'outer before() should have run');
      assert.ok(innerSetup, 'inner beforeAll() should have run');
    });
  });
});
