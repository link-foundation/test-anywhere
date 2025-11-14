# Native Testing Frameworks Comparison: Bun, Deno, and Node.js

> A comprehensive comparison of native testing capabilities in modern JavaScript runtimes
>
> **Last Updated:** January 2025

## Executive Summary

All three major JavaScript runtimes now provide built-in testing frameworks, eliminating the need for external dependencies like Jest, Mocha, or Vitest for many use cases. This document compares their APIs, features, and capabilities in detail.

| Runtime     | Native Testing Since | Stability Status | Import Path          |
| ----------- | -------------------- | ---------------- | -------------------- |
| **Bun**     | v0.1.4 (2022)        | Stable           | `bun:test`           |
| **Deno**    | v1.0 (2020)          | Stable           | Built-in `Deno.test` |
| **Node.js** | v18.0 (2022)         | Stable (v20+)    | `node:test`          |

---

## 1. Test Definition & Organization

### Bun

**Import:**

```javascript
import { test, describe, expect } from 'bun:test';
```

**Basic Test Definition:**

```javascript
test('my test', () => {
  expect(2 + 2).toBe(4);
});
```

**Test Modifiers:**

- `test(name, fn)` - Standard test
- `test.skip(name, fn)` - Skip a test
- `test.todo(name)` - Mark as pending/incomplete
- `test.only(name, fn)` - Run only this test
- `test.failing(name, fn)` - Expected to fail
- `test.concurrent(name, fn)` - Run in parallel
- `test.serial(name, fn)` - Force sequential execution

**Parameterized Tests:**

```javascript
test.each([
  [1, 2, 3],
  [2, 3, 5],
])('adds %i + %i to equal %i', (a, b, expected) => {
  expect(a + b).toBe(expected);
});
```

**Test Grouping:**

```javascript
describe('my suite', () => {
  test('test 1', () => {
    /* ... */
  });
  test('test 2', () => {
    /* ... */
  });
});
```

### Deno

**Import:** Not required (global API)

**Basic Test Definition:**

```javascript
Deno.test('my test', () => {
  // assertions here
});
```

**Alternative Syntax:**

```javascript
Deno.test({
  name: 'my test',
  fn: () => {
    /* ... */
  },
  ignore: false,
  only: false,
  permissions: { read: true },
});
```

**Test Modifiers:**

- `ignore: boolean` - Skip test
- `only: boolean` - Run only this test
- `permissions: PermissionsObject` - Granular permission control
- `sanitizeOps: boolean` - Check for pending async operations
- `sanitizeResources: boolean` - Check for resource leaks

**BDD-Style with @std/testing/bdd:**

```javascript
import { describe, it } from '@std/testing/bdd';

describe('my suite', () => {
  it('should work', () => {
    // test code
  });
});
```

### Node.js

**Import:**

```javascript
import { test, describe, it } from 'node:test';
```

**Basic Test Definition:**

```javascript
test('my test', () => {
  // assertions here
});

// Or using 'it' alias
it('my test', () => {
  // assertions here
});
```

**Test Options:**

```javascript
test(
  'my test',
  {
    skip: false,
    todo: false,
    only: false,
    timeout: 5000,
    concurrency: true,
    signal: abortSignal,
  },
  () => {
    // test code
  }
);
```

**Test Grouping:**

```javascript
describe('my suite', () => {
  test('test 1', () => {
    /* ... */
  });
  test('test 2', () => {
    /* ... */
  });
});
```

**Subtests:**

```javascript
test('parent test', async (t) => {
  await t.test('subtest 1', () => {
    /* ... */
  });
  await t.test('subtest 2', () => {
    /* ... */
  });
});
```

---

## 2. Lifecycle Hooks

### Bun

**Available Hooks:**

```javascript
import { beforeAll, beforeEach, afterEach, afterAll } from 'bun:test';

beforeAll(() => {
  // Runs once before all tests in the scope
});

beforeEach(() => {
  // Runs before each test
});

afterEach(() => {
  // Runs after each test
});

afterAll(() => {
  // Runs once after all tests complete
});
```

**Scope:** Hooks can be defined in test files or in separate files loaded via `--preload` flag.

**Execution Order:**

- `beforeAll` → `beforeEach` → test → `afterEach` → `afterAll`

### Deno

**Native Deno.test Hooks:**

```javascript
Deno.test.beforeAll(() => {
  // Setup before all tests
});

Deno.test.beforeEach(() => {
  // Setup before each test
});

Deno.test.afterEach(() => {
  // Cleanup after each test
});

Deno.test.afterAll(() => {
  // Cleanup after all tests
});
```

**BDD-Style Hooks (@std/testing/bdd):**

```javascript
import {
  beforeAll,
  beforeEach,
  afterEach,
  afterAll,
  describe,
} from '@std/testing/bdd';

describe('my suite', () => {
  beforeAll(() => {
    /* ... */
  });
  beforeEach(() => {
    /* ... */
  });
  afterEach(() => {
    /* ... */
  });
  afterAll(() => {
    /* ... */
  });
});
```

**Execution Order:** LIFO (Last In, First Out) for cleanup hooks
**Error Handling:** If a hook throws, remaining hooks are skipped and the test fails

### Node.js

**Available Hooks:**

```javascript
import { before, after, beforeEach, afterEach } from 'node:test';

before(() => {
  // Runs before suite executes
});

beforeEach(() => {
  // Runs before each test
});

afterEach(() => {
  // Runs after each test (even on failure)
});

after(() => {
  // Runs after suite (guaranteed execution)
});
```

**Hook Context:**
Hooks can also be defined within describe blocks or test functions:

```javascript
describe('suite', () => {
  before(() => {
    /* suite-level setup */
  });

  test('my test', async (t) => {
    t.before(() => {
      /* test-level setup */
    });
  });
});
```

**Guaranteed Execution:** `after` and `afterEach` hooks run even if tests fail

---

## 3. Assertions

### Bun

**Import:**

```javascript
import { expect } from 'bun:test';
```

**API:** Jest-compatible matchers

**Common Matchers:**

- `toBe(value)` - Strict equality (===)
- `toEqual(value)` - Deep equality
- `toBeTrue()` / `toBeFalse()` - Boolean checks
- `toBeNull()` / `toBeUndefined()` / `toBeDefined()`
- `toBeGreaterThan(n)` / `toBeLessThan(n)` / `toBeGreaterThanOrEqual(n)` / `toBeLessThanOrEqual(n)`
- `toContain(item)` - Array/string containment
- `toMatch(regex)` - Regular expression matching
- `toThrow()` / `toThrowError()` - Exception checking
- `toHaveLength(n)` - Length checking
- `toHaveProperty(path, value?)` - Object property checking
- `toMatchSnapshot()` - Snapshot testing

**Modifiers:**

- `.not` - Negation
- `.resolves` - Promise resolution
- `.rejects` - Promise rejection

**Example:**

```javascript
expect([1, 2, 3]).toContain(2);
expect(async () => await fetchData()).rejects.toThrow();
expect(obj).not.toHaveProperty('deleted');
```

### Deno

**Import:**

```javascript
import { assertEquals, assert, assertExists } from '@std/assert';
```

**API:** Function-based assertions (not chainable)

**Available Assertions:**

- `assert(expr, msg?)` - Truthy assertion
- `assertEquals(actual, expected, msg?)` - Deep equality
- `assertNotEquals(actual, expected, msg?)` - Deep inequality
- `assertStrictEquals(actual, expected, msg?)` - Strict equality (===)
- `assertAlmostEquals(actual, expected, epsilon?, msg?)` - Numeric approximation
- `assertExists(actual, msg?)` - Not null/undefined
- `assertArrayIncludes(actual, expected, msg?)` - Array subset
- `assertMatch(actual, regex, msg?)` - Regex matching
- `assertObjectMatch(actual, expected, msg?)` - Partial object matching
- `assertThrows(fn, ErrorClass?, msgIncludes?, msg?)` - Synchronous exception
- `assertRejects(fn, ErrorClass?, msgIncludes?, msg?)` - Async exception
- `assertFalse(expr, msg?)` - Falsy assertion
- `assertInstanceOf(actual, expectedType, msg?)` - Type checking

**Example:**

```javascript
assertEquals(2 + 2, 4);
assertExists(user);
assertArrayIncludes([1, 2, 3], [2]);
assertThrows(
  () => {
    throw new Error('fail');
  },
  Error,
  'fail'
);
```

**Behavior:** Throws `AssertionError` with helpful diff on failure

### Node.js

**Import:**

```javascript
import assert from 'node:assert';
// Or strict mode (recommended)
import assert from 'node:assert/strict';
```

**API:** Node.js assert module (legacy and modern)

**Recommended Assertions (strict mode):**

- `assert.ok(value, message?)` - Truthy
- `assert.equal(actual, expected, message?)` - Loose equality (==) in legacy, strict (===) in strict mode
- `assert.strictEqual(actual, expected, message?)` - Strict equality (===)
- `assert.deepEqual(actual, expected, message?)` - Deep equality
- `assert.deepStrictEqual(actual, expected, message?)` - Deep strict equality
- `assert.notEqual()` / `assert.notStrictEqual()` / `assert.notDeepEqual()` - Negations
- `assert.throws(fn, error?, message?)` - Exception checking
- `assert.rejects(asyncFn, error?, message?)` - Async exception
- `assert.doesNotThrow(fn, message?)` - No exception
- `assert.doesNotReject(asyncFn, message?)` - No async exception
- `assert.match(string, regexp, message?)` - Regex matching
- `assert.ifError(value)` - Error checking

**Custom Assertions:**

```javascript
import { test } from 'node:test';

test('with custom assertion', (t) => {
  t.assert.ok(value);
  t.assert.snapshot(obj); // Snapshot testing
});
```

**Example:**

```javascript
assert.strictEqual(2 + 2, 4);
assert.deepStrictEqual({ a: 1 }, { a: 1 });
assert.throws(() => {
  throw new Error('fail');
});
```

---

## 4. Mocking & Spying

### Bun

**Import:**

```javascript
import { mock, jest } from 'bun:test';
```

**Mock Functions:**

```javascript
// Native Bun syntax
const fn = mock((x) => x * 2);

// Jest-compatible syntax
const fn = jest.fn((x) => x * 2);

fn(5); // Returns 10

// Assertions
expect(fn).toHaveBeenCalled();
expect(fn).toHaveBeenCalledTimes(1);
expect(fn).toHaveBeenCalledWith(5);
```

**Mock Properties:**

- `mock.calls` - Array of call arguments
- `mock.results` - Array of return values
- `mock.mockReturnValue(value)` - Set return value
- `mock.mockImplementation(fn)` - Replace implementation
- `mock.mockReset()` - Clear call history
- `mock.mockRestore()` - Restore original

**Module Mocking:** Not explicitly documented (use jest-compatible patterns)

### Deno

**Import:**

```javascript
import { spy, stub, returnsNext, resolvesNext } from '@std/testing/mock';
```

**Test Spies:**

```javascript
// Spy on a function
const func = spy();
func(1, 2);
assertSpyCalls(func, 1);
assertSpyCall(func, 0, { args: [1, 2] });

// Spy on a method (keeps original behavior)
const user = { save: () => true };
const saveSpy = spy(user, 'save');
user.save();
assertSpyCalls(saveSpy, 1);
saveSpy.restore();
```

**Test Stubs:**

```javascript
// Stub a method (replaces behavior)
const user = { save: () => true };
const saveStub = stub(user, 'save', () => false);
user.save(); // Returns false
saveStub.restore();

// Using resource management (automatic cleanup)
using saveStub = stub(user, 'save', () => false);
// Automatically restores when scope exits
```

**Helper Functions:**

```javascript
// Return different values on consecutive calls
const fn = stub(obj, 'method', returnsNext([1, 2, 3]));

// Resolve promises with different values
const fn = stub(
  obj,
  'method',
  resolvesNext([Promise.resolve(1), Promise.resolve(2)])
);
```

**Assertions:**

```javascript
import { assertSpyCall, assertSpyCalls } from '@std/testing/mock';

assertSpyCalls(mySpy, 3); // Called exactly 3 times
assertSpyCall(mySpy, 0, { args: [1, 2], returned: 3 });
```

### Node.js

**Import:**

```javascript
import { mock } from 'node:test';
```

**MockTracker API:**

The `mock` object is a `MockTracker` instance providing:

**Function Mocks:**

```javascript
const fn = mock.fn((x) => x * 2);
fn(5); // Returns 10

// Check calls
fn.mock.calls.length; // 1
fn.mock.calls[0].arguments; // [5]
fn.mock.callCount(); // 1

// Change implementation
fn.mock.mockImplementation((x) => x * 3);
fn.mock.mockImplementationOnce((x) => x * 4); // One-time override

// Cleanup
fn.mock.resetCalls();
fn.mock.restore();
```

**Method Mocking:**

```javascript
const obj = { method: () => 'original' };
mock.method(obj, 'method', () => 'mocked');
obj.method(); // Returns 'mocked'
```

**Property Mocking:**

```javascript
const obj = { prop: 'original' };
mock.property(obj, 'prop', 'mocked');

// Getters and setters
mock.getter(obj, 'prop', () => 'value');
mock.setter(obj, 'prop', (value) => {
  /* setter logic */
});
```

**Module Mocking:**

```javascript
mock.module('module-name', {
  namedExport: mock.fn(),
  default: mock.fn(),
});
```

**Timer Mocking:**

```javascript
const timers = mock.timers;
timers.enable(['setTimeout', 'Date']);
timers.tick(1000); // Advance 1 second
timers.runAll(); // Execute all pending timers
timers.setTime(Date.now() + 5000); // Jump to future
timers.reset();
```

**Global Cleanup:**

```javascript
mock.reset(); // Reset all mocks
mock.restoreAll(); // Restore all mocks
```

---

## 5. Snapshot Testing

### Bun

**Usage:**

```javascript
import { expect, test } from 'bun:test';

test('snapshot test', () => {
  const data = { user: 'john', id: 123 };
  expect(data).toMatchSnapshot();
});
```

**Update Snapshots:**

```bash
bun test --update-snapshots
```

**Storage:** Snapshots stored in `__snapshots__` directory

### Deno

**Usage:**

```javascript
import { assertSnapshot } from '@std/testing/snapshot';

Deno.test('snapshot test', async (t) => {
  const data = { user: 'john', id: 123 };
  await assertSnapshot(t, data);
});
```

**Update Snapshots:**

```bash
deno test --allow-all -- --update
```

**Storage:** Snapshots stored inline in test files or separate `.snap` files

### Node.js

**Usage:**

```javascript
import { test } from 'node:test';

test('snapshot test', async (t) => {
  const data = { user: 'john', id: 123 };
  await t.assert.snapshot(data);

  // File-based snapshot
  await t.assert.fileSnapshot(data, 'snapshots/data.json');
});
```

**Custom Serialization:**

```javascript
await t.assert.snapshot(data, {
  serializer: (value) => JSON.stringify(value, null, 2),
});
```

**Update Snapshots:**

```bash
node --test --test-update-snapshots
```

**Storage:** In-memory or file-based with custom paths

---

## 6. Coverage & Reporting

### Bun

**Generate Coverage:**

```bash
bun test --coverage
```

**Coverage Options:**

- `--coverage` - Enable coverage collection
- `--coverage-reporter=text|lcov` - Output format
- `--coverage-dir=<path>` - Output directory (default: `coverage/`)
- `--coverage-threshold=<percent>` - Fail if below threshold

**Test Reporters:**

- `--reporter=junit` - JUnit XML output
- `--reporter=dots` - Compact dot output

**Output:**

- Text summary in terminal
- LCOV format for CI integration
- Compatible with standard coverage tools

### Deno

**Generate Coverage:**

```bash
# Collect coverage
deno test --coverage=cov_profile

# View coverage report
deno coverage cov_profile
```

**Coverage Options:**

```bash
# HTML report
deno coverage --html cov_profile

# LCOV format
deno coverage --lcov --output=coverage.lcov cov_profile

# Filter files
deno coverage --include="^file:" --exclude="test" cov_profile
```

**Ignore Coverage:**

```javascript
// Ignore entire file
// deno-coverage-ignore-file

// Ignore single line
// deno-coverage-ignore
const ignored = 'this line not counted';
```

**Coverage Source:** Acquired directly from V8 JavaScript engine

**Test Reporters:**

- `--reporter=pretty` - Default human-readable output
- `--reporter=dot` - Compact dots
- `--reporter=junit` - JUnit XML
- `--reporter=tap` - TAP format

### Node.js

**Generate Coverage:**

```bash
node --test --experimental-test-coverage
```

**Coverage Options:**

```bash
# Specify coverage directory
node --test --experimental-test-coverage --test-coverage-dir=coverage

# Coverage thresholds
node --test --experimental-test-coverage \
  --test-coverage-branches=80 \
  --test-coverage-functions=80 \
  --test-coverage-lines=80

# Exclude files
node --test --experimental-test-coverage --test-coverage-exclude="test/**"
```

**Test Reporters:**

Built-in reporters:

- `spec` - Human-readable (default)
- `tap` - TAP format
- `dot` - Compact representation
- `junit` - JUnit XML
- `lcov` - LCOV coverage format

**Custom Reporter:**

```javascript
import { run } from 'node:test';
import { spec } from 'node:test/reporters';

run({ files: ['test/**/*.js'] })
  .compose(spec)
  .pipe(process.stdout);
```

**Programmatic API:**

```javascript
import { run } from 'node:test';

const stream = run({
  files: ['test/**/*.js'],
  concurrency: 10,
  timeout: 5000,
  coverage: true,
});

stream.on('test:pass', (test) => {
  /* ... */
});
stream.on('test:fail', (test) => {
  /* ... */
});
```

---

## 7. Advanced Features

### Bun

**Watch Mode:**

```bash
bun test --watch
```

**Concurrency Control:**

```bash
bun test --concurrent # Run tests concurrently
bun test --max-concurrency=10 # Limit concurrent tests
```

**Test Randomization:**

```bash
bun test --randomize # Randomize test order
bun test --seed=12345 # Use specific seed
```

**Bail on Failure:**

```bash
bun test --bail=1 # Stop after 1 failure
```

**Flakiness Detection:**

```bash
bun test --rerun-each=3 # Run each test 3 times
```

**Name Filtering:**

```bash
bun test -t "user.*create" # Regex pattern matching
```

**Preload Scripts:**

```bash
bun test --preload=./setup.ts # Load before tests
```

**DOM Testing:**

- Compatible with HappyDOM
- Works with @testing-library

**TypeScript & JSX:**

- Native TypeScript support (no transpilation needed)
- JSX support out-of-the-box

### Deno

**Watch Mode:**

```bash
deno test --watch
```

**Permissions Testing:**

```javascript
Deno.test({
  name: 'file test',
  permissions: { read: true, write: false },
  fn: () => {
    // Test runs with specific permissions
  },
});
```

**Resource Sanitization:**

```javascript
Deno.test({
  name: 'resource test',
  sanitizeResources: true, // Check for resource leaks
  sanitizeOps: true, // Check for pending async ops
  fn: async () => {
    // Test async operations
  },
});
```

**Parallel Execution:**

```bash
deno test --parallel # Run test files in parallel
deno test --jobs=4 # Limit to 4 parallel jobs
```

**Test Filtering:**

```bash
deno test --filter "user" # Name-based filtering
deno test --ignore="integration" # Exclude tests
```

**Fail Fast:**

```bash
deno test --fail-fast # Stop on first failure
deno test --fail-fast=3 # Stop after 3 failures
```

**Type Checking:**

```bash
deno test --no-check # Skip type checking (faster)
deno test --check # Enable type checking
```

**Documentation Tests:**
Deno can run examples in JSDoc comments as tests

**Web Platform APIs:**

- Fetch, WebSocket, WebCrypto available
- Web-compatible from the start

### Node.js

**Watch Mode:**

```bash
node --test --watch
```

**Process Isolation:**

```bash
node --test --test-isolation=process # Each file in separate process
node --test --test-isolation=none # Share process
```

**Concurrency Control:**

```bash
node --test --test-concurrency=5 # Max 5 parallel tests
```

**Test Filtering:**

```bash
node --test --test-name-pattern="user.*" # Include pattern
node --test --test-skip-pattern="integration.*" # Exclude pattern
```

**Only Mode:**

```bash
node --test --test-only # Run only tests marked with 'only'
```

**Timeout:**

```bash
node --test --test-timeout=10000 # 10 second timeout
```

**Global Setup/Teardown:**

```javascript
// setup.js
export async function globalSetup() {
  // Runs once before all tests
}

export async function globalTeardown() {
  // Runs once after all tests
}
```

```bash
node --test --test-global-setup=./setup.js
```

**Programmatic Execution:**

```javascript
import { run } from 'node:test';

const stream = run({
  files: ['test/**/*.test.js'],
  concurrency: true,
  timeout: 5000,
});
```

**Test Context:**

```javascript
test('my test', (t) => {
  t.name; // Test name
  t.diagnostic('debug message'); // Output diagnostic
  t.skip('reason'); // Skip remaining test
  t.todo('reason'); // Mark as todo
  t.runOnly(true); // Enable only mode for subtests
});
```

**Mock Timers:**
Full control over time and timers for deterministic testing

---

## 8. Running Tests

### Bun

**Basic:**

```bash
bun test
```

**Specific Files:**

```bash
bun test ./test/unit.test.ts
bun test ./test/**/*.test.ts
```

**File Discovery:**
Automatically finds:

- `*.test.{js,jsx,ts,tsx}`
- `*_test.{js,jsx,ts,tsx}`
- `*.spec.{js,jsx,ts,tsx}`

### Deno

**Basic:**

```bash
deno test
```

**Specific Files:**

```bash
deno test ./test/unit.test.ts
deno test ./test/
```

**File Discovery:**
Automatically finds:

- `*test.{ts,tsx,js,mjs,jsx}`
- `*.test.{ts,tsx,js,mjs,jsx}`
- Files named `test.{ts,tsx,js,mjs,jsx}`

**Permissions:**

```bash
deno test --allow-read --allow-net
deno test --allow-all # All permissions
```

### Node.js

**Basic:**

```bash
node --test
```

**Specific Files:**

```bash
node --test ./test/unit.test.js
node --test './test/**/*.test.js'
```

**File Discovery:**
Automatically finds:

- `**/*.test.{js,cjs,mjs}`
- `**/test-*.{js,cjs,mjs}`
- `**/test.{js,cjs,mjs}`
- `**/test/**/*.{js,cjs,mjs}`

---

## 9. Feature Comparison Matrix

| Feature                   | Bun                    | Deno                    | Node.js                        |
| ------------------------- | ---------------------- | ----------------------- | ------------------------------ |
| **Maturity**              | Stable                 | Stable                  | Stable (v20+)                  |
| **API Style**             | Jest-like              | Native/BDD              | Native/Mocha-like              |
| **Import**                | `bun:test`             | Global `Deno.test`      | `node:test`                    |
| **Test Definition**       | `test()`, `describe()` | `Deno.test()`           | `test()`, `describe()`, `it()` |
| **Skip Tests**            | `test.skip()`          | `ignore: true`          | `skip: true`                   |
| **Only Mode**             | `test.only()`          | `only: true`            | `only: true`                   |
| **Todo/Pending**          | `test.todo()`          | ❌                      | `todo: true`                   |
| **Failing Tests**         | `test.failing()`       | ❌                      | ❌                             |
| **Parameterized**         | `test.each()`          | Manual loops            | Manual loops                   |
| **Concurrent Tests**      | `test.concurrent()`    | Default                 | `concurrency: true`            |
| **Serial Tests**          | `test.serial()`        | Default                 | Default                        |
| **beforeAll**             | ✅                     | ✅                      | `before()`                     |
| **beforeEach**            | ✅                     | ✅                      | ✅                             |
| **afterEach**             | ✅                     | ✅                      | ✅                             |
| **afterAll**              | ✅                     | ✅                      | `after()`                      |
| **Subtests**              | Via `describe()`       | Manual                  | `t.test()`                     |
| **Assertions**            | `expect()` matchers    | `@std/assert` functions | `node:assert`                  |
| **Assertion Style**       | Chainable              | Function-based          | Function-based                 |
| **Snapshot Testing**      | ✅                     | ✅ (@std/testing)       | ✅                             |
| **Mock Functions**        | `mock()`, `jest.fn()`  | `spy()`, `stub()`       | `mock.fn()`                    |
| **Method Mocking**        | Via jest API           | `spy(obj, "method")`    | `mock.method()`                |
| **Module Mocking**        | ❌ (use jest patterns) | Manual                  | `mock.module()`                |
| **Timer Mocking**         | ❌                     | Via external lib        | `mock.timers`                  |
| **Auto-mocking**          | ❌                     | ❌                      | ❌                             |
| **Coverage**              | ✅ `--coverage`        | ✅ V8-based             | ✅ Experimental                |
| **Coverage Format**       | text, lcov             | text, html, lcov        | spec, lcov                     |
| **HTML Reports**          | ❌                     | ✅                      | ❌                             |
| **Watch Mode**            | ✅                     | ✅                      | ✅                             |
| **Parallel Execution**    | ✅ Default             | ✅ Optional             | ✅ Optional                    |
| **Test Isolation**        | Per-file               | Per-test                | Configurable                   |
| **Reporters**             | junit, dots            | pretty, dot, junit, tap | spec, tap, dot, junit, lcov    |
| **Custom Reporters**      | ❌                     | ❌                      | ✅                             |
| **Timeout Control**       | ✅                     | ✅                      | ✅                             |
| **Bail on Failure**       | ✅ `--bail`            | ✅ `--fail-fast`        | ❌                             |
| **Randomization**         | ✅ `--randomize`       | ❌                      | ❌                             |
| **Flaky Test Detection**  | ✅ `--rerun-each`      | ❌                      | ❌                             |
| **Name Filtering**        | ✅ `-t` flag           | ✅ `--filter`           | ✅ `--test-name-pattern`       |
| **Permission Control**    | ❌                     | ✅ Granular             | ❌                             |
| **Resource Sanitization** | ❌                     | ✅                      | ❌                             |
| **TypeScript**            | Native                 | Native                  | Requires loader                |
| **JSX Support**           | Native                 | Native                  | Requires loader                |
| **DOM Testing**           | Via HappyDOM           | Via jsdom/happydom      | Via jsdom/happydom             |
| **Global Setup**          | Via `--preload`        | Manual                  | `--test-global-setup`          |
| **Programmatic API**      | ❌                     | ❌                      | ✅ `run()`                     |

---

## 10. Performance Characteristics

### Bun

**Strengths:**

- Fastest test runner among the three
- Concurrent by default
- Native TypeScript/JSX (no transpilation overhead)
- Optimized for speed

**Default Behavior:**

- Parallel test execution
- Shared process for all tests

### Deno

**Strengths:**

- Fast startup time
- Efficient V8-based coverage
- Parallel file execution available
- Type-checking built-in

**Default Behavior:**

- Sequential test execution (unless `--parallel`)
- Separate execution context per test file

### Node.js

**Strengths:**

- Process isolation for better test independence
- Efficient with `--test-concurrency`
- Part of Node core (no installation needed)

**Default Behavior:**

- Process isolation (each file in subprocess)
- Parallel test file execution
- Configurable concurrency limits

---

## 11. Ecosystem Integration

### Bun

**Compatible With:**

- Jest expectations
- Testing Library
- HappyDOM for DOM testing
- Most Jest plugins (via compatibility layer)

**Package Management:**

- Built-in package manager
- Fast dependency installation

### Deno

**Compatible With:**

- Standard library utilities (`@std/*`)
- JSR (JavaScript Registry)
- npm packages (via `npm:` specifier)

**Unique Features:**

- Permission system
- URL imports
- No node_modules

### Node.js

**Compatible With:**

- Entire npm ecosystem
- All Node.js modules
- TypeScript via loaders (tsx, ts-node)

**Strengths:**

- Largest ecosystem
- Mature tooling
- Wide adoption

---

## 12. Migration Paths

### From Jest to Bun

**Effort:** Low to Medium

**Changes Needed:**

- Change import from `jest` to `bun:test`
- Most `expect()` assertions work as-is
- Mock API is compatible
- Snapshot format compatible

**Example:**

```javascript
// Before (Jest)
import { expect, test } from '@jest/globals';

// After (Bun)
import { expect, test } from 'bun:test';
// Rest of code stays the same
```

### From Mocha/Chai to Deno

**Effort:** Medium

**Changes Needed:**

- Replace `describe()/it()` with `Deno.test()` or use BDD module
- Change assertion library to `@std/assert`
- Update mock library to `@std/testing/mock`
- Add permission flags

**Example:**

```javascript
// Before (Mocha + Chai)
import { expect } from 'chai';
describe('suite', () => {
  it('should work', () => {
    expect(2 + 2).to.equal(4);
  });
});

// After (Deno with BDD)
import { describe, it } from '@std/testing/bdd';
import { assertEquals } from '@std/assert';
describe('suite', () => {
  it('should work', () => {
    assertEquals(2 + 2, 4);
  });
});
```

### From Jest to Node.js

**Effort:** Medium

**Changes Needed:**

- Change import to `node:test`
- Replace `expect()` with `assert` module
- Update mock API to MockTracker
- Adjust configuration

**Example:**

```javascript
// Before (Jest)
import { expect } from '@jest/globals';
test('my test', () => {
  expect(2 + 2).toBe(4);
});

// After (Node.js)
import { test } from 'node:test';
import assert from 'node:assert/strict';
test('my test', () => {
  assert.strictEqual(2 + 2, 4);
});
```

---

## 13. Recommendations

### Choose **Bun** if:

- ✅ You want the fastest test execution
- ✅ You're already using Bun as your runtime
- ✅ You prefer Jest-like API
- ✅ You need native TypeScript/JSX support
- ✅ Performance is critical

### Choose **Deno** if:

- ✅ You need fine-grained permission control
- ✅ You want resource leak detection
- ✅ You prefer function-based assertions
- ✅ You're building secure applications
- ✅ You want modern, web-standard APIs
- ✅ TypeScript-first development

### Choose **Node.js** if:

- ✅ You're already using Node.js
- ✅ You need process isolation for tests
- ✅ You want the most mature ecosystem
- ✅ You need extensive npm package compatibility
- ✅ You require custom reporters
- ✅ You need timer mocking
- ✅ Enterprise/production stability is critical

---

## 14. Future Outlook

### Bun

- Rapidly evolving with frequent releases
- Focus on performance and developer experience
- Growing compatibility with Jest ecosystem
- Active development of testing features

### Deno

- Stable and mature testing API
- Regular improvements (test hooks added in v2.5)
- Strong focus on web standards
- Expanding standard library

### Node.js

- Test runner marked stable in v20
- Active development (new features in each release)
- Moving toward feature parity with Jest
- Strong backward compatibility commitment

---

## Conclusion

All three runtimes now offer capable native testing frameworks that can replace external dependencies for many use cases:

- **Bun** excels in performance and Jest compatibility
- **Deno** provides unique security features and web standards
- **Node.js** offers the most mature ecosystem and stability

The choice depends on your runtime, existing codebase, and specific requirements. For new projects, consider the runtime's testing capabilities as part of your technology selection criteria.

---

## Additional Resources

### Bun

- [Official Test Documentation](https://bun.sh/docs/test)
- [API Reference](https://bun.sh/docs/api/test)

### Deno

- [Testing Fundamentals](https://docs.deno.com/runtime/fundamentals/testing/)
- [Deno.test API](https://docs.deno.com/api/deno/~/Deno.test)
- [@std/assert](https://docs.deno.com/runtime/reference/std/assert/)
- [@std/testing](https://jsr.io/@std/testing)

### Node.js

- [Test Runner Documentation](https://nodejs.org/api/test.html)
- [Assert Module](https://nodejs.org/api/assert.html)
- [Coverage Documentation](https://nodejs.org/docs/latest/api/cli.html#--experimental-test-coverage)

---

_Document compiled from official documentation and web sources as of January 2025_
