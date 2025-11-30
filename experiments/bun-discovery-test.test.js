/**
 * Test to reproduce the Bun test discovery issue
 * Run with: bun test experiments/bun-discovery-test.test.js
 */

import { test, assert } from '../src/index.js';

test('simple test should be discovered by bun', () => {
  assert.ok(true, 'test should run');
  console.log('✓ Test is running!');
});

test('another test to verify discovery', () => {
  assert.equal(1 + 1, 2);
  console.log('✓ Second test is running!');
});
