/**
 * Isolated test file to verify test.skip behavior
 * This file tests that skipped tests don't execute
 */

import { test, assert } from '../src/index.js';

let skipTestExecuted = false;

test('regular test should run', () => {
  assert.ok(true, 'regular test runs normally');
});

test.skip('this test should be skipped', () => {
  skipTestExecuted = true;
  throw new Error('Skipped test should not execute');
});

test('verify skip actually skipped the test', () => {
  assert.equal(
    skipTestExecuted,
    false,
    'skipped test should not have executed'
  );
});
