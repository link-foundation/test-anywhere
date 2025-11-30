/**
 * Test to simulate converting from bun:test to test-anywhere
 * Original would use: import { test, expect } from 'bun:test'
 * Converted to use: import { test, expect } from '../src/index.js'
 */

// Original Bun style (commented out)
// import { test, expect, describe, beforeAll } from 'bun:test';

// Converted to test-anywhere
import { test, expect, describe, beforeAll } from '../src/index.js';

let setupDone = false;

beforeAll(() => {
  setupDone = true;
});

describe('Converted test suite', () => {
  test('basic test works', () => {
    expect(setupDone).toBe(true);
  });

  test('expect assertions work', () => {
    expect(2 + 2).toBe(4);
    expect([1, 2, 3]).toContain(2);
  });
});

test('top-level test works', () => {
  expect(true).toBeTruthy();
});
