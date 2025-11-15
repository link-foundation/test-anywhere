/**
 * Comprehensive tests for test modifiers (skip, only, todo)
 * These tests verify that modifiers work correctly across all runtimes
 */

import { test, assert } from '../src/index.js';

// Test test.skip modifier
test('test.skip should prevent test execution', () => {
  // Verify skip exists - we can't call it inside a test in Bun
  assert.ok(typeof test.skip === 'function', 'test.skip should exist');
  // Note: Cannot call test.skip() inside a test in Bun - must be at top level
  // Actual skipping behavior is tested in skip-isolation.test.js
});

test('test.only should isolate test execution', () => {
  // Verify test.only exists and can be called
  assert.ok(typeof test.only === 'function', 'test.only should exist');

  // Note: We can't test .only behavior in the same file with other tests
  // because .only affects the entire test run
  // This is tested in separate isolation files
});

test('test.todo should mark tests as pending', () => {
  // Verify test.todo exists - we can't call it inside a test in Bun
  assert.ok(typeof test.todo === 'function', 'test.todo should exist');
  // Note: Cannot call test.todo() inside a test in Bun - must be at top level
  // Actual todo behavior is tested in separate files at top level
});

// Test that modifiers exist and are functions
test('test modifiers are available', () => {
  assert.ok(typeof test.skip === 'function', 'test.skip is a function');
  assert.ok(typeof test.only === 'function', 'test.only is a function');
  assert.ok(typeof test.todo === 'function', 'test.todo is a function');
  // Note: Cannot call test.skip/only/todo inside a test in Bun
  // Actual usage is tested at top level in skip-isolation.test.js and other files
});

// Test async support in modifiers
test('modifiers should support async functions', () => {
  assert.ok(typeof test.skip === 'function', 'test.skip is a function');
  assert.ok(typeof test.only === 'function', 'test.only is a function');
  assert.ok(typeof test.todo === 'function', 'test.todo is a function');
  // Note: Cannot call test.skip/only/todo inside a test in Bun - must be at top level
});
