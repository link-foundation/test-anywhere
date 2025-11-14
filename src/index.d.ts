/**
 * TypeScript definitions for test-anywhere
 * A universal testing framework for Bun, Deno, and Node.js
 */

/**
 * Assertion interface
 */
export interface Assert {
  /**
   * Assert that a value is truthy
   * @param value - Value to check
   * @param message - Optional error message
   */
  ok(value: any, message?: string): void;

  /**
   * Assert that two values are strictly equal (===)
   * @param actual - Actual value
   * @param expected - Expected value
   * @param message - Optional error message
   */
  equal<T>(actual: T, expected: T, message?: string): void;

  /**
   * Assert that two values are not strictly equal (!==)
   * @param actual - Actual value
   * @param expected - Expected value
   * @param message - Optional error message
   */
  notEqual<T>(actual: T, expected: T, message?: string): void;

  /**
   * Assert that two values are deeply equal
   * Handles objects, arrays, dates, NaN, and circular references
   * @param actual - Actual value
   * @param expected - Expected value
   * @param message - Optional error message
   */
  deepEqual<T>(actual: T, expected: T, message?: string): void;

  /**
   * Assert that two values are not deeply equal
   * @param actual - Actual value
   * @param expected - Expected value
   * @param message - Optional error message
   */
  notDeepEqual<T>(actual: T, expected: T, message?: string): void;

  /**
   * Assert that a synchronous function throws an error
   * Note: Does not support async functions. Use throwsAsync instead.
   * @param fn - Function that should throw
   * @param message - Optional error message
   */
  throws(fn: () => void, message?: string): void;

  /**
   * Assert that an async function throws an error
   * @param fn - Async function that should throw
   * @param message - Optional error message
   */
  throwsAsync(fn: () => Promise<void>, message?: string): Promise<void>;

  /**
   * Assert that a string matches a regular expression
   * @param actual - String to test
   * @param regexp - Regular expression to match
   * @param message - Optional error message
   */
  match(actual: string, regexp: RegExp, message?: string): void;

  /**
   * Assert that an array or string includes a value
   * @param container - Array or string to search
   * @param value - Value to find
   * @param message - Optional error message
   */
  includes<T>(
    container: T[] | string,
    value: T | string,
    message?: string
  ): void;
}

/**
 * Test function interface with modifiers
 */
export interface TestFunction {
  (name: string, fn: () => void | Promise<void>): void;
  skip(name: string, fn?: () => void | Promise<void>): void;
  only(name: string, fn: () => void | Promise<void>): void;
  todo(name: string, fn?: () => void | Promise<void>): void;
}

/**
 * Describe function interface with modifiers
 */
export interface DescribeFunction {
  (name: string, fn: () => void): void;
  skip(name: string, fn: () => void): void;
  only(name: string, fn: () => void): void;
}

/**
 * Universal test function that works across Bun, Deno, and Node.js
 * @param name - Test name
 * @param fn - Test function (can be async)
 */
export const test: TestFunction;

/**
 * Alias for test() - Mocha/Jest style
 * @param name - Test name
 * @param fn - Test function (can be async)
 */
export const it: TestFunction;

/**
 * Universal describe function for grouping tests (BDD style)
 * Works across Bun, Deno, and Node.js
 * @param name - Suite name
 * @param fn - Suite function containing tests
 */
export const describe: DescribeFunction;

/**
 * Register a function to run once before all tests
 * @param fn - Function to run before all tests (can be async)
 */
export function beforeAll(fn: () => void | Promise<void>): void;

/**
 * Register a function to run before each test
 * @param fn - Function to run before each test (can be async)
 */
export function beforeEach(fn: () => void | Promise<void>): void;

/**
 * Register a function to run after each test
 * @param fn - Function to run after each test (can be async)
 */
export function afterEach(fn: () => void | Promise<void>): void;

/**
 * Register a function to run once after all tests
 * @param fn - Function to run after all tests (can be async)
 */
export function afterAll(fn: () => void | Promise<void>): void;

/**
 * Mocha-style alias for beforeAll()
 * @param fn - Function to run before all tests (can be async)
 */
export const before: typeof beforeAll;

/**
 * Mocha-style alias for afterAll()
 * @param fn - Function to run after all tests (can be async)
 */
export const after: typeof afterAll;

/**
 * Get the current runtime name
 * @returns The runtime name ('bun', 'deno', or 'node')
 */
export function getRuntime(): 'bun' | 'deno' | 'node';

/**
 * Universal assertion helper
 */
export const assert: Assert;

/**
 * Default export containing all exports
 */
declare const _default: {
  test: TestFunction;
  it: TestFunction;
  describe: DescribeFunction;
  assert: Assert;
  getRuntime: typeof getRuntime;
  beforeAll: typeof beforeAll;
  beforeEach: typeof beforeEach;
  afterEach: typeof afterEach;
  afterAll: typeof afterAll;
  before: typeof beforeAll;
  after: typeof afterAll;
};

export default _default;
