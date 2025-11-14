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
 * Universal test function that works across Bun, Deno, and Node.js
 * @param name - Test name
 * @param fn - Test function (can be async)
 */
export function test(name: string, fn: () => void | Promise<void>): void;

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
  test: typeof test;
  assert: Assert;
  getRuntime: typeof getRuntime;
  beforeAll: typeof beforeAll;
  beforeEach: typeof beforeEach;
  afterEach: typeof afterEach;
  afterAll: typeof afterAll;
};

export default _default;
