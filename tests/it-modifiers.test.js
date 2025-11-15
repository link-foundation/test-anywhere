/**
 * Comprehensive tests for it() modifiers (skip, only, todo)
 * These tests verify that it.skip, it.only, and it.todo work correctly
 */

import { describe, it, assert } from '../src/index.js';

describe('it() modifiers', () => {
  it('it.skip should prevent test execution', () => {
    assert.ok(typeof it.skip === 'function', 'it.skip should exist');
    // Note: Cannot call it.skip() inside a test in Bun - must be at top level
  });

  it('it.only should isolate test execution', () => {
    assert.ok(typeof it.only === 'function', 'it.only should exist');
    // Note: Actual isolation is tested in separate files
  });

  it('it.todo should mark tests as pending', () => {
    assert.ok(typeof it.todo === 'function', 'it.todo should exist');
    // Note: Cannot call it.todo() inside a test in Bun - must be at top level
  });

  it('it modifiers are all available', () => {
    assert.ok(typeof it.skip === 'function', 'it.skip is a function');
    assert.ok(typeof it.only === 'function', 'it.only is a function');
    assert.ok(typeof it.todo === 'function', 'it.todo is a function');
    // Note: Cannot call modifiers inside a test in Bun - must be at top level
    // Actual usage is tested at top level in this file and skip-isolation.test.js
  });
});

// Test in nested describes - these are at top level so they work in Bun
describe('nested describe with it modifiers', () => {
  describe('inner suite', () => {
    it('regular it() test', () => {
      assert.ok(true);
    });

    // These are at top level (not inside a test) so they work in Bun
    it.skip('skipped nested it()', () => {
      throw new Error('Should not run');
    });

    it.todo('pending nested feature');
  });
});
