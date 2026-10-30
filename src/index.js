/**
 * test-anywhere - A universal testing framework for Bun, Deno, and Node.js
 *
 * This framework provides a simple abstraction layer on top of the built-in
 * testing capabilities of Bun, Deno, and Node.js, allowing tests to run
 * seamlessly across all three runtimes.
 */

import {
  test,
  it,
  describe,
  beforeAll,
  beforeEach,
  afterEach,
  afterAll,
  before,
  after,
  getRuntime,
  setDefaultTimeout,
} from './runner.js';

export {
  test,
  it,
  describe,
  beforeAll,
  beforeEach,
  afterEach,
  afterAll,
  before,
  after,
  getRuntime,
  setDefaultTimeout,
};

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
  } catch {
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
    } catch {
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
  setDefaultTimeout,
  beforeAll,
  beforeEach,
  afterEach,
  afterAll,
  before,
  after,
};
