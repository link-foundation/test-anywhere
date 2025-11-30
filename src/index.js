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

// Import the appropriate test function and hooks based on runtime
let nativeTest;
let nativeDescribe;
let nativeBeforeEach;
let nativeAfterEach;
let nativeBeforeAll;
let nativeAfterAll;
let nativeSetDefaultTimeout;
let bunTest; // Store bunTest module for later use
let nodeTest; // Store nodeTest module for later use

if (runtime === 'bun') {
  // Bun test is imported from bun:test
  bunTest = await import('bun:test');
  nativeTest = bunTest.test;
  nativeDescribe = bunTest.describe;
  nativeBeforeEach = bunTest.beforeEach;
  nativeAfterEach = bunTest.afterEach;
  nativeBeforeAll = bunTest.beforeAll;
  nativeAfterAll = bunTest.afterAll;
  nativeSetDefaultTimeout = bunTest.setDefaultTimeout;
} else if (runtime === 'deno') {
  // Deno has Deno.test global but no built-in hooks
  // We'll implement hooks manually for Deno
  nativeTest = Deno.test;
  nativeDescribe = null; // Will import from @std/testing/bdd when needed
  nativeBeforeEach = null;
  nativeAfterEach = null;
  nativeBeforeAll = null;
  nativeAfterAll = null;
} else {
  // Node.js test from node:test
  nodeTest = await import('node:test');
  nativeTest = nodeTest.test;
  nativeDescribe = nodeTest.describe;
  nativeBeforeEach = nodeTest.beforeEach;
  nativeAfterEach = nodeTest.afterEach;
  // Node uses 'before' and 'after' instead of 'beforeAll' and 'afterAll'
  nativeBeforeAll = nodeTest.before;
  nativeAfterAll = nodeTest.after;
}

// Hook storage for manual implementation (used by Deno and as a unified interface)
const hooks = {
  beforeAll: [],
  beforeEach: [],
  afterEach: [],
  afterAll: [],
};

let beforeAllRun = false;
let testCount = 0;
let completedTestCount = 0;

/**
 * Register a function to run once before all tests
 * @param {Function} fn - Function to run before all tests
 */
export function beforeAll(fn) {
  if (runtime === 'deno') {
    // For Deno, store the hook to run manually
    hooks.beforeAll.push(fn);
  } else {
    // For Node and Bun, use native implementation
    nativeBeforeAll(fn);
  }
}

/**
 * Register a function to run before each test
 * @param {Function} fn - Function to run before each test
 */
export function beforeEach(fn) {
  if (runtime === 'deno') {
    // For Deno, store the hook to run manually
    hooks.beforeEach.push(fn);
  } else {
    // For Node and Bun, use native implementation
    nativeBeforeEach(fn);
  }
}

/**
 * Register a function to run after each test
 * @param {Function} fn - Function to run after each test
 */
export function afterEach(fn) {
  if (runtime === 'deno') {
    // For Deno, store the hook to run manually
    hooks.afterEach.push(fn);
  } else {
    // For Node and Bun, use native implementation
    nativeAfterEach(fn);
  }
}

/**
 * Register a function to run once after all tests
 * @param {Function} fn - Function to run after all tests
 */
export function afterAll(fn) {
  if (runtime === 'deno') {
    // For Deno, store the hook to run manually
    hooks.afterAll.push(fn);
  } else {
    // For Node and Bun, use native implementation
    nativeAfterAll(fn);
  }
}

/**
 * Universal test function that works across Bun, Deno, and Node.js
 * @param {string} name - Test name
 * @param {Function} fn - Test function
 */
export function test(name, fn) {
  if (runtime === 'deno') {
    // For Deno, wrap the test function to run hooks manually
    testCount++;
    return nativeTest(name, async () => {
      // Run beforeAll hooks once
      if (!beforeAllRun && hooks.beforeAll.length > 0) {
        beforeAllRun = true;
        for (const hook of hooks.beforeAll) {
          await hook();
        }
      }

      // Run beforeEach hooks
      for (const hook of hooks.beforeEach) {
        await hook();
      }

      // Run the actual test
      try {
        await fn();
      } finally {
        // Run afterEach hooks
        for (const hook of hooks.afterEach) {
          await hook();
        }

        // Track completed tests and run afterAll when all tests are done
        completedTestCount++;
        if (completedTestCount === testCount && hooks.afterAll.length > 0) {
          for (const hook of hooks.afterAll) {
            await hook();
          }
        }
      }
    });
  } else {
    // For Node and Bun, just use the native test function
    // (hooks are handled by the runtime)
    return nativeTest(name, fn);
  }
}

/**
 * Alias for test() - Mocha/Jest style
 * @param {string} name - Test name
 * @param {Function} fn - Test function
 */
export function it(name, fn) {
  return test(name, fn);
}

/**
 * Universal describe function for grouping tests (BDD style)
 * Works across Bun, Deno, and Node.js
 * @param {string} name - Suite name
 * @param {Function} fn - Suite function containing tests
 */
export function describe(name, fn) {
  if (runtime === 'bun') {
    return nativeDescribe(name, fn);
  } else if (runtime === 'deno') {
    // For Deno, use @std/testing/bdd module
    // Note: This requires Deno to have @std/testing/bdd available
    // We'll call the function directly since Deno doesn't require imports
    // Users should import from @std/testing/bdd in their test files
    // For now, we'll just execute the function (no native describe in core Deno.test)
    // The hooks will work within the function scope
    return fn();
  } else {
    return nativeDescribe(name, fn);
  }
}

// Test modifiers
test.skip = function (name, fn) {
  if (runtime === 'bun') {
    return bunTest.test.skip(name, fn);
  } else if (runtime === 'deno') {
    return Deno.test({ name, ignore: true, fn: fn || (() => {}) });
  } else {
    return nodeTest.test(name, { skip: true }, fn || (() => {}));
  }
};

test.only = function (name, fn) {
  if (runtime === 'bun') {
    return bunTest.test.only(name, fn);
  } else if (runtime === 'deno') {
    return Deno.test({ name, only: true, fn });
  } else {
    return nodeTest.test(name, { only: true }, fn);
  }
};

test.todo = function (name, fn) {
  if (runtime === 'bun') {
    return bunTest.test.todo(name);
  } else if (runtime === 'deno') {
    // Deno doesn't have native todo, simulate with skip and [TODO] prefix
    return Deno.test({
      name: `[TODO] ${name}`,
      ignore: true,
      fn: fn || (() => {}),
    });
  } else {
    return nodeTest.test(name, { todo: true }, fn);
  }
};

// it() modifiers (same as test modifiers)
it.skip = test.skip;
it.only = test.only;
it.todo = test.todo;

// describe() modifiers
describe.skip = function (name, fn) {
  if (runtime === 'bun') {
    return bunTest.describe.skip(name, fn);
  } else if (runtime === 'deno') {
    // For Deno, just don't execute the function (skip the entire suite)
    return;
  } else {
    return nodeTest.describe(name, { skip: true }, fn);
  }
};

describe.only = function (name, fn) {
  if (runtime === 'bun') {
    return bunTest.describe.only(name, fn);
  } else if (runtime === 'deno') {
    // For Deno, just execute normally (Deno doesn't have describe.only)
    return describe(name, fn);
  } else {
    return nodeTest.describe(name, { only: true }, fn);
  }
};

// Mocha-style hook aliases
export const before = beforeAll;
export const after = afterAll;

/**
 * Get the current runtime name
 * @returns {string} The runtime name ('bun', 'deno', or 'node')
 */
export function getRuntime() {
  return runtime;
}

/**
 * Set the default timeout for tests
 * @param {number} timeout - Timeout in milliseconds
 */
export function setDefaultTimeout(timeout) {
  if (runtime === 'bun') {
    // For Bun, use the native setDefaultTimeout
    if (nativeSetDefaultTimeout) {
      nativeSetDefaultTimeout(timeout);
    }
  } else if (runtime === 'node') {
    // For Node.js, this is not supported natively
    // Tests can use { timeout } option in individual test() calls
    console.warn(
      'setDefaultTimeout is not supported in Node.js runtime. Use { timeout } option in test() calls instead.'
    );
  } else if (runtime === 'deno') {
    // For Deno, this is not supported natively
    console.warn('setDefaultTimeout is not supported in Deno runtime.');
  }
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
 * Jest/Bun-style expect() assertion API
 * Provides chainable matchers for assertions
 */
export function expect(actual) {
  return {
    // Bun/Jest: expect(x).toBe(y) - strict equality
    toBe(expected, message) {
      if (actual !== expected) {
        const defaultMessage = `Expected ${JSON.stringify(actual)} to be ${JSON.stringify(expected)}`;
        throw new Error(message || defaultMessage);
      }
    },

    // Bun/Jest: expect(x).toEqual(y) - deep equality
    toEqual(expected, message) {
      if (!deepEqual(actual, expected)) {
        const defaultMessage = `Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`;
        throw new Error(message || defaultMessage);
      }
    },

    // Bun/Jest: expect(x).not.toBe(y)
    not: {
      toBe(expected, message) {
        if (actual === expected) {
          const defaultMessage = `Expected ${JSON.stringify(actual)} not to be ${JSON.stringify(expected)}`;
          throw new Error(message || defaultMessage);
        }
      },

      toEqual(expected, message) {
        if (deepEqual(actual, expected)) {
          const defaultMessage = `Expected ${JSON.stringify(actual)} not to equal ${JSON.stringify(expected)}`;
          throw new Error(message || defaultMessage);
        }
      },

      toBeNull(message) {
        if (actual === null) {
          throw new Error(message || 'Expected value not to be null');
        }
      },

      toBeUndefined(message) {
        if (actual === undefined) {
          throw new Error(message || 'Expected value not to be undefined');
        }
      },

      toBeTruthy(message) {
        if (actual) {
          throw new Error(message || 'Expected value not to be truthy');
        }
      },

      toBeFalsy(message) {
        if (!actual) {
          throw new Error(message || 'Expected value not to be falsy');
        }
      },

      toContain(expected, message) {
        const isIncluded = Array.isArray(actual)
          ? actual.includes(expected)
          : typeof actual === 'string'
            ? actual.includes(expected)
            : false;

        if (isIncluded) {
          const defaultMessage = `Expected ${JSON.stringify(actual)} not to contain ${JSON.stringify(expected)}`;
          throw new Error(message || defaultMessage);
        }
      },

      toMatch(regexp, message) {
        if (regexp.test(actual)) {
          const defaultMessage = `Expected ${JSON.stringify(actual)} not to match ${regexp}`;
          throw new Error(message || defaultMessage);
        }
      },

      toThrow(message) {
        if (typeof actual !== 'function') {
          throw new Error('Expected value to be a function');
        }

        let thrown = false;
        try {
          const result = actual();

          // Check if result is a promise (async function)
          if (result && typeof result.then === 'function') {
            throw new Error(
              'toThrow() does not support async functions. Use rejects or async/await instead.'
            );
          }
        } catch (error) {
          // If it's our "async not supported" error, re-throw it
          if (error.message.includes('does not support async functions')) {
            throw error;
          }
          thrown = true;
        }

        if (thrown) {
          throw new Error(message || 'Expected function not to throw');
        }
      },

      toBeGreaterThan(expected, message) {
        if (actual > expected) {
          const defaultMessage = `Expected ${JSON.stringify(actual)} not to be greater than ${JSON.stringify(expected)}`;
          throw new Error(message || defaultMessage);
        }
      },

      toBeGreaterThanOrEqual(expected, message) {
        if (actual >= expected) {
          const defaultMessage = `Expected ${JSON.stringify(actual)} not to be greater than or equal to ${JSON.stringify(expected)}`;
          throw new Error(message || defaultMessage);
        }
      },

      toBeLessThan(expected, message) {
        if (actual < expected) {
          const defaultMessage = `Expected ${JSON.stringify(actual)} not to be less than ${JSON.stringify(expected)}`;
          throw new Error(message || defaultMessage);
        }
      },

      toBeLessThanOrEqual(expected, message) {
        if (actual <= expected) {
          const defaultMessage = `Expected ${JSON.stringify(actual)} not to be less than or equal to ${JSON.stringify(expected)}`;
          throw new Error(message || defaultMessage);
        }
      },
    },

    // Bun/Jest: expect(x).toBeNull()
    toBeNull(message) {
      if (actual !== null) {
        throw new Error(
          message || `Expected ${JSON.stringify(actual)} to be null`
        );
      }
    },

    // Bun/Jest: expect(x).toBeUndefined()
    toBeUndefined(message) {
      if (actual !== undefined) {
        throw new Error(
          message || `Expected ${JSON.stringify(actual)} to be undefined`
        );
      }
    },

    // Bun/Jest: expect(x).toBeTruthy()
    toBeTruthy(message) {
      if (!actual) {
        throw new Error(
          message || `Expected ${JSON.stringify(actual)} to be truthy`
        );
      }
    },

    // Bun/Jest: expect(x).toBeFalsy()
    toBeFalsy(message) {
      if (actual) {
        throw new Error(
          message || `Expected ${JSON.stringify(actual)} to be falsy`
        );
      }
    },

    // Bun/Jest: expect(arr).toContain(value)
    toContain(expected, message) {
      const isIncluded = Array.isArray(actual)
        ? actual.includes(expected)
        : typeof actual === 'string'
          ? actual.includes(expected)
          : false;

      if (!isIncluded) {
        const defaultMessage = `Expected ${JSON.stringify(actual)} to contain ${JSON.stringify(expected)}`;
        throw new Error(message || defaultMessage);
      }
    },

    // Bun/Jest: expect(str).toMatch(regexp)
    toMatch(regexp, message) {
      if (!regexp.test(actual)) {
        const defaultMessage = `Expected ${JSON.stringify(actual)} to match ${regexp}`;
        throw new Error(message || defaultMessage);
      }
    },

    // Bun/Jest: expect(fn).toThrow()
    toThrow(message) {
      if (typeof actual !== 'function') {
        throw new Error('Expected value to be a function');
      }

      let thrown = false;
      try {
        const result = actual();

        // Check if result is a promise (async function)
        if (result && typeof result.then === 'function') {
          throw new Error(
            'toThrow() does not support async functions. Use rejects or async/await instead.'
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

    // Bun/Jest: expect(x).toBeGreaterThan(y)
    toBeGreaterThan(expected, message) {
      if (!(actual > expected)) {
        const defaultMessage = `Expected ${JSON.stringify(actual)} to be greater than ${JSON.stringify(expected)}`;
        throw new Error(message || defaultMessage);
      }
    },

    // Bun/Jest: expect(x).toBeGreaterThanOrEqual(y)
    toBeGreaterThanOrEqual(expected, message) {
      if (!(actual >= expected)) {
        const defaultMessage = `Expected ${JSON.stringify(actual)} to be greater than or equal to ${JSON.stringify(expected)}`;
        throw new Error(message || defaultMessage);
      }
    },

    // Bun/Jest: expect(x).toBeLessThan(y)
    toBeLessThan(expected, message) {
      if (!(actual < expected)) {
        const defaultMessage = `Expected ${JSON.stringify(actual)} to be less than ${JSON.stringify(expected)}`;
        throw new Error(message || defaultMessage);
      }
    },

    // Bun/Jest: expect(x).toBeLessThanOrEqual(y)
    toBeLessThanOrEqual(expected, message) {
      if (!(actual <= expected)) {
        const defaultMessage = `Expected ${JSON.stringify(actual)} to be less than or equal to ${JSON.stringify(expected)}`;
        throw new Error(message || defaultMessage);
      }
    },
  };
}

/**
 * Deno-style assertions (from @std/assert)
 * Provides assertEquals, assertNotEquals, etc.
 */
export function assertEquals(actual, expected, message) {
  if (!deepEqual(actual, expected)) {
    const defaultMessage = `Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`;
    throw new Error(message || defaultMessage);
  }
}

export function assertNotEquals(actual, expected, message) {
  if (deepEqual(actual, expected)) {
    const defaultMessage = `Expected ${JSON.stringify(actual)} to not equal ${JSON.stringify(expected)}`;
    throw new Error(message || defaultMessage);
  }
}

export function assertStrictEquals(actual, expected, message) {
  if (actual !== expected) {
    const defaultMessage = `Expected ${JSON.stringify(actual)} to strictly equal ${JSON.stringify(expected)}`;
    throw new Error(message || defaultMessage);
  }
}

export function assertNotStrictEquals(actual, expected, message) {
  if (actual === expected) {
    const defaultMessage = `Expected ${JSON.stringify(actual)} to not strictly equal ${JSON.stringify(expected)}`;
    throw new Error(message || defaultMessage);
  }
}

export function assertExists(actual, message) {
  if (actual === null || actual === undefined) {
    throw new Error(
      message || 'Expected value to exist (not null or undefined)'
    );
  }
}

export function assertMatch(actual, regexp, message) {
  if (!regexp.test(actual)) {
    const defaultMessage = `Expected ${JSON.stringify(actual)} to match ${regexp}`;
    throw new Error(message || defaultMessage);
  }
}

export function assertArrayIncludes(actual, expected, message) {
  if (!Array.isArray(actual)) {
    throw new Error('Expected actual to be an array');
  }
  if (!Array.isArray(expected)) {
    throw new Error('Expected expected to be an array');
  }

  for (const item of expected) {
    const found = actual.some((actualItem) => deepEqual(actualItem, item));
    if (!found) {
      const defaultMessage = `Expected ${JSON.stringify(actual)} to include ${JSON.stringify(item)}`;
      throw new Error(message || defaultMessage);
    }
  }
}

export function assertThrows(fn, message) {
  let thrown = false;
  try {
    const result = fn();

    // Check if result is a promise (async function)
    if (result && typeof result.then === 'function') {
      throw new Error(
        'assertThrows() does not support async functions. Use assertRejects() instead.'
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
}

export async function assertRejects(fn, message) {
  let thrown = false;
  try {
    await fn();
  } catch (_error) {
    thrown = true;
  }
  if (!thrown) {
    throw new Error(message || 'Expected async function to reject');
  }
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
  it,
  describe,
  assert,
  expect,
  assertEquals,
  assertNotEquals,
  assertStrictEquals,
  assertNotStrictEquals,
  assertExists,
  assertMatch,
  assertArrayIncludes,
  assertThrows,
  assertRejects,
  getRuntime,
  beforeAll,
  beforeEach,
  afterEach,
  afterAll,
  before,
  after,
};
