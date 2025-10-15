/**
 * test-anywhere - A universal testing framework for Bun, Deno, and Node.js
 *
 * This framework provides a simple abstraction layer on top of the built-in
 * testing capabilities of Bun, Deno, and Node.js, allowing tests to run
 * seamlessly across all three runtimes.
 */

// Detect the current runtime
const runtime = (() => {
  if (typeof Bun !== 'undefined') return 'bun';
  if (typeof Deno !== 'undefined') return 'deno';
  return 'node';
})();

// Import the appropriate test function based on runtime
let nativeTest;
if (runtime === 'bun') {
  // Bun test is imported from bun:test
  const { test: bunTest } = await import('bun:test');
  nativeTest = bunTest;
} else if (runtime === 'deno') {
  // Deno has Deno.test global
  nativeTest = Deno.test;
} else {
  // Node.js test from node:test
  const { test: nodeTest } = await import('node:test');
  nativeTest = nodeTest;
}

/**
 * Universal test function that works across Bun, Deno, and Node.js
 * @param {string} name - Test name
 * @param {Function} fn - Test function
 */
export function test(name, fn) {
  return nativeTest(name, fn);
}

/**
 * Get the current runtime name
 * @returns {string} The runtime name ('bun', 'deno', or 'node')
 */
export function getRuntime() {
  return runtime;
}

/**
 * Universal assertion helper
 * Works across all runtimes by using simple comparisons
 */
export const assert = {
  /**
   * Assert that a value is truthy
   */
  ok(value, message = 'Expected value to be truthy') {
    if (!value) {
      throw new Error(message);
    }
  },

  /**
   * Assert that two values are equal
   */
  equal(actual, expected, message = `Expected ${actual} to equal ${expected}`) {
    if (actual !== expected) {
      throw new Error(message);
    }
  },

  /**
   * Assert that two values are deeply equal
   */
  deepEqual(actual, expected, message = 'Expected values to be deeply equal') {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(message);
    }
  },

  /**
   * Assert that a function throws an error
   */
  throws(fn, message = 'Expected function to throw') {
    let thrown = false;
    try {
      fn();
    } catch (e) {
      thrown = true;
    }
    if (!thrown) {
      throw new Error(message);
    }
  }
};

// Export everything as default as well for convenience
export default {
  test,
  assert,
  getRuntime
};
