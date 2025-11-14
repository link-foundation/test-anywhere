/**
 * test-anywhere - A universal testing framework for Bun, Deno, and Node.js
 *
 * This framework provides a simple abstraction layer on top of the built-in
 * testing capabilities of Bun, Deno, and Node.js, allowing tests to run
 * seamlessly across all three runtimes.
 */

// Detect the current runtime
const runtime = (() => {
  if (typeof Bun !== 'undefined') {
    return 'bun';
  }
  if (typeof Deno !== 'undefined') {
    return 'deno';
  }
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
 * Helper function for deep equality comparison
 * Handles NaN, Date objects, arrays, objects, and circular references
 */
function deepEqual(a, b, seen = new WeakSet()) {
  // Strict equality check (handles primitives, same reference)
  if (a === b) {
    return true;
  }

  // Handle null/undefined
  if (a === null || a === undefined || b === null || b === undefined) {
    return a === b;
  }

  // Type check
  if (typeof a !== typeof b) {
    return false;
  }

  // Handle NaN (NaN !== NaN but they should be considered equal)
  if (typeof a === 'number' && isNaN(a) && isNaN(b)) {
    return true;
  }

  // Handle Date objects
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  // Handle RegExp
  if (a instanceof RegExp && b instanceof RegExp) {
    return a.toString() === b.toString();
  }

  // Handle non-object types
  if (typeof a !== 'object') {
    return false;
  }

  // Circular reference detection
  if (seen.has(a)) {
    return true; // Assume equal if we've seen this object before
  }
  seen.add(a);

  // Handle arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }
    return a.every((val, i) => deepEqual(val, b[i], seen));
  }

  // One is array, other is not
  if (Array.isArray(a) !== Array.isArray(b)) {
    return false;
  }

  // Handle objects
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  // Check if they have the same number of keys
  if (keysA.length !== keysB.length) {
    return false;
  }

  // Check if all keys and values are equal
  return keysA.every(
    (key) => keysB.includes(key) && deepEqual(a[key], b[key], seen)
  );
}

/**
 * Universal assertion helper
 * Works across all runtimes by using simple comparisons
 */
export const assert = {
  /**
   * Assert that a value is truthy
   */
  ok(value, message) {
    if (!value) {
      throw new Error(message || 'Expected value to be truthy');
    }
  },

  /**
   * Assert that two values are equal (using strict equality ===)
   */
  equal(actual, expected, message) {
    if (actual !== expected) {
      const defaultMessage = `Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`;
      throw new Error(message || defaultMessage);
    }
  },

  /**
   * Assert that two values are not equal (using strict inequality !==)
   */
  notEqual(actual, expected, message) {
    if (actual === expected) {
      const defaultMessage = `Expected ${JSON.stringify(actual)} to not equal ${JSON.stringify(expected)}`;
      throw new Error(message || defaultMessage);
    }
  },

  /**
   * Assert that two values are deeply equal
   * Handles objects, arrays, dates, NaN, and circular references
   */
  deepEqual(actual, expected, message) {
    if (!deepEqual(actual, expected)) {
      const defaultMessage = `Expected ${JSON.stringify(actual)} to deeply equal ${JSON.stringify(expected)}`;
      throw new Error(message || defaultMessage);
    }
  },

  /**
   * Assert that two values are not deeply equal
   */
  notDeepEqual(actual, expected, message) {
    if (deepEqual(actual, expected)) {
      const defaultMessage = `Expected ${JSON.stringify(actual)} to not deeply equal ${JSON.stringify(expected)}`;
      throw new Error(message || defaultMessage);
    }
  },

  /**
   * Assert that a function throws an error (synchronous only)
   */
  throws(fn, message) {
    let thrown = false;
    try {
      const result = fn();

      // Check if result is a promise (async function)
      if (result && typeof result.then === 'function') {
        throw new Error(
          'throws() does not support async functions. Use throwsAsync() instead.'
        );
      }
    } catch (error) {
      // If it's our "async not supported" error, re-throw it
      if (error.message.includes('does not support async functions')) {
        throw error;
      }
      thrown = true;
    }
    if (!thrown) {
      throw new Error(message || 'Expected function to throw');
    }
  },

  /**
   * Assert that an async function throws an error
   */
  async throwsAsync(fn, message) {
    let thrown = false;
    try {
      await fn();
    } catch (_error) {
      thrown = true;
    }
    if (!thrown) {
      throw new Error(message || 'Expected async function to throw');
    }
  },

  /**
   * Assert that a string matches a regular expression
   */
  match(actual, regexp, message) {
    if (!regexp.test(actual)) {
      const defaultMessage = `Expected ${JSON.stringify(actual)} to match ${regexp}`;
      throw new Error(message || defaultMessage);
    }
  },

  /**
   * Assert that a value is included in an array or string
   */
  includes(container, value, message) {
    const isIncluded = Array.isArray(container)
      ? container.includes(value)
      : typeof container === 'string'
        ? container.includes(value)
        : false;

    if (!isIncluded) {
      const defaultMessage = `Expected ${JSON.stringify(container)} to include ${JSON.stringify(value)}`;
      throw new Error(message || defaultMessage);
    }
  },
};

// Export everything as default as well for convenience
export default {
  test,
  assert,
  getRuntime,
};
