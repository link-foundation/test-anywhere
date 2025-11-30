# test-anywhere

[![npm version](https://img.shields.io/npm/v/test-anywhere.svg)](https://www.npmjs.com/package/test-anywhere)
[![npm downloads](https://img.shields.io/npm/dm/test-anywhere.svg)](https://www.npmjs.com/package/test-anywhere)
[![CI/CD](https://github.com/link-foundation/test-anywhere/actions/workflows/main.yml/badge.svg)](https://github.com/link-foundation/test-anywhere/actions/workflows/main.yml)
[![License](https://img.shields.io/npm/l/test-anywhere.svg)](https://github.com/link-foundation/test-anywhere/blob/main/LICENSE)

A universal JavaScript testing framework that works seamlessly across **Bun**, **Deno**, and **Node.js**. Write your tests once and run them anywhere.

## Features

- **Universal API** - Single test API that works across all three runtimes
- **Zero Dependencies** - Built on top of native testing frameworks
- **Runtime Detection** - Automatically uses the appropriate native test implementation
- **Simple Assertions** - Built-in assertion library for common testing needs
- **Type Safe** - Written with modern JavaScript/ESM modules

## Installation

### Node.js

```bash
npm install test-anywhere
```

### Bun

```bash
bun add test-anywhere
```

### Deno

No installation needed! Import directly from npm:

```javascript
import { test, assert } from 'npm:test-anywhere';
```

Or from your local installation:

```javascript
import { test, assert } from './node_modules/test-anywhere/index.js';
```

## Usage

### Basic Test Syntax

You can use either `test()` or `it()` (Mocha/Jest style):

```javascript
import { test, it, assert } from 'test-anywhere';

// Using test()
test('basic math works', () => {
  assert.equal(1 + 1, 2);
});

// Using it() - same as test()
it('should compare objects', () => {
  assert.deepEqual({ a: 1 }, { a: 1 });
});
```

### BDD-Style with describe()

Group related tests using `describe()` blocks:

```javascript
import { describe, it, assert } from 'test-anywhere';

describe('user module', () => {
  describe('creation', () => {
    it('should create a new user', () => {
      assert.ok(true);
    });

    it('should validate email format', () => {
      assert.match('user@example.com', /@/);
    });
  });

  describe('deletion', () => {
    it('should delete existing user', () => {
      assert.ok(true);
    });
  });
});
```

### Node.js

Run tests:

```bash
node --test
# or
npm test
```

### Deno

Create a test file (e.g., `example.test.js`):

```javascript
import { test, assert } from 'npm:test-anywhere';

test('basic math works', () => {
  assert.equal(1 + 1, 2);
});

test('strings work', () => {
  assert.ok('hello'.includes('ell'));
});
```

Run tests:

```bash
deno test --allow-read
```

The `--allow-read` permission is needed for Deno to import the module.

### Bun

Create a test file (e.g., `example.test.js`):

```javascript
import { test, assert } from 'test-anywhere';

test('basic math works', () => {
  assert.equal(1 + 1, 2);
});

test('async operations work', async () => {
  const result = await Promise.resolve(42);
  assert.equal(result, 42);
});
```

Run tests:

```bash
bun test
```

## API Reference

### Test Definition

#### `test(name, fn)` / `it(name, fn)`

Creates a test with the given name and test function. `it()` is an alias for `test()`.

**Parameters:**

- `name` (string): The name/description of the test
- `fn` (function): The test function to execute

**Example:**

```javascript
test('my test name', () => {
  // test code here
});

// or using it() - Mocha/Jest style
it('should do something', () => {
  // test code here
});
```

#### `describe(name, fn)`

Groups related tests together (BDD style).

**Parameters:**

- `name` (string): The suite name
- `fn` (function): Function containing tests and setup/teardown hooks

**Example:**

```javascript
describe('user authentication', () => {
  it('should login with valid credentials', () => {
    // test code
  });

  it('should reject invalid credentials', () => {
    // test code
  });
});
```

### Test Modifiers

#### `test.skip(name, fn)` / `it.skip(name, fn)`

Skip a test (won't be executed).

```javascript
test.skip('broken test', () => {
  // This test will be skipped
});
```

#### `test.only(name, fn)` / `it.only(name, fn)`

Run only this test (useful for debugging).

```javascript
test.only('debug this test', () => {
  // Only this test will run
});
```

#### `test.todo(name)` / `it.todo(name)`

Mark a test as pending/TODO.

```javascript
test.todo('implement this feature');
```

#### `describe.skip(name, fn)` / `describe.only(name, fn)`

Skip or isolate an entire test suite.

```javascript
describe.skip('integration tests', () => {
  // All tests in this suite will be skipped
});

describe.only('unit tests', () => {
  // Only tests in this suite will run
});
```

### Test Configuration

#### `setDefaultTimeout(timeout)`

Set the default timeout for all tests in milliseconds. This is useful when tests need more time to complete (e.g., integration tests, API calls).

**Parameters:**

- `timeout` (number): Timeout in milliseconds

**Example:**

```javascript
import { test, setDefaultTimeout } from 'test-anywhere';

// Set default timeout to 60 seconds
setDefaultTimeout(60000);

test('long running operation', async () => {
  // This test can take up to 60 seconds
  await someSlowOperation();
});
```

**Note:**

- For **Bun**: Uses the native `setDefaultTimeout` from `bun:test`
- For **Node.js** and **Deno**: Not supported natively. A warning will be logged, and you should use timeout options in individual test calls instead.

### Assertions

### `assert.ok(value, message?)`

Asserts that a value is truthy.

**Example:**

```javascript
assert.ok(true);
assert.ok(1 === 1, 'one should equal one');
```

### `assert.equal(actual, expected, message?)`

Asserts that two values are strictly equal (`===`).

**Example:**

```javascript
assert.equal(2 + 2, 4);
assert.equal('hello', 'hello');
```

### `assert.deepEqual(actual, expected, message?)`

Asserts that two values are deeply equal (compares object/array contents).

**Example:**

```javascript
assert.deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 });
assert.deepEqual([1, 2, 3], [1, 2, 3]);
```

### `assert.throws(fn, message?)`

Asserts that a function throws an error when called.

**Example:**

```javascript
assert.throws(() => {
  throw new Error('oops');
});
```

### Multiple Assertion Styles

`test-anywhere` supports three assertion styles to provide maximum compatibility and ease of migration:

#### 1. **Node.js/Classic Style** (`assert.*`)

Traditional Node.js-style assertions (see above sections for details):

```javascript
import { assert } from 'test-anywhere';

assert.ok(true);
assert.equal(1, 1);
assert.deepEqual([1, 2], [1, 2]);
assert.notEqual(1, 2);
assert.throws(() => {
  throw new Error();
});
assert.match('hello', /ell/);
assert.includes([1, 2, 3], 2);
```

#### 2. **Bun/Jest Style** (`expect()`)

Modern chainable API inspired by Jest and Bun:

```javascript
import { expect } from 'test-anywhere';

expect(value).toBe(expected); // Strict equality (===)
expect(value).toEqual(expected); // Deep equality
expect(value).not.toBe(expected); // Negation
expect(value).toBeNull(); // null check
expect(value).toBeUndefined(); // undefined check
expect(value).toBeTruthy(); // Truthy check
expect(value).toBeFalsy(); // Falsy check
expect(array).toContain(item); // Array/string contains
expect(string).toMatch(/pattern/); // Regex match
expect(fn).toThrow(); // Function throws
```

**Complete Example:**

```javascript
import { describe, it, expect } from 'test-anywhere';

describe('Calculator', () => {
  it('should add numbers', () => {
    expect(2 + 2).toBe(4);
    expect(2 + 2).toEqual(4);
  });

  it('should handle arrays', () => {
    expect([1, 2, 3]).toContain(2);
    expect([1, 2, 3]).toEqual([1, 2, 3]);
  });

  it('should validate strings', () => {
    expect('hello world').toMatch(/world/);
    expect('hello').not.toBe('goodbye');
  });
});
```

#### 3. **Deno Style** (`assertEquals`, etc.)

Deno-inspired assertion functions from `@std/assert`:

```javascript
import {
  assertEquals,
  assertNotEquals,
  assertStrictEquals,
  assertExists,
  assertMatch,
  assertArrayIncludes,
  assertThrows,
  assertRejects,
} from 'test-anywhere';

assertEquals(actual, expected); // Deep equality
assertNotEquals(actual, expected); // Not equal
assertStrictEquals(actual, expected); // Strict equality (===)
assertNotStrictEquals(actual, expected); // Strict inequality (!==)
assertExists(value); // Not null/undefined
assertMatch(string, /pattern/); // Regex match
assertArrayIncludes(arr, [items]); // Array includes items
assertThrows(() => {
  throw new Error();
}); // Sync throws
await assertRejects(async () => {
  throw new Error();
}); // Async rejects
```

**Complete Example:**

```javascript
import {
  test,
  assertEquals,
  assertMatch,
  assertArrayIncludes,
} from 'test-anywhere';

test('user validation', () => {
  const user = { name: 'Alice', email: 'alice@example.com' };

  assertEquals(user.name, 'Alice');
  assertMatch(user.email, /@/);
});

test('array operations', () => {
  const numbers = [1, 2, 3, 4, 5];

  assertArrayIncludes(numbers, [2, 4]);
  assertEquals(numbers.length, 5);
});
```

#### Mix and Match

All three styles can be used together in the same project:

```javascript
import { describe, it, assert, expect, assertEquals } from 'test-anywhere';

describe('Multi-style assertions', () => {
  it('supports all styles', () => {
    const value = 42;

    // Node style
    assert.equal(value, 42);

    // Bun/Jest style
    expect(value).toBe(42);

    // Deno style
    assertEquals(value, 42);
  });
});
```

### Lifecycle Hooks

Setup and teardown hooks for test initialization and cleanup.

#### `beforeAll(fn)` / `before(fn)`

Runs once before all tests. `before()` is a Mocha-style alias.

```javascript
import { beforeAll, describe, it } from 'test-anywhere';

describe('database tests', () => {
  beforeAll(() => {
    // Connect to database once
  });

  it('should query data', () => {
    // test code
  });
});
```

#### `beforeEach(fn)`

Runs before each test.

```javascript
beforeEach(() => {
  // Reset state before each test
});
```

#### `afterEach(fn)`

Runs after each test.

```javascript
afterEach(() => {
  // Clean up after each test
});
```

#### `afterAll(fn)` / `after(fn)`

Runs once after all tests. `after()` is a Mocha-style alias.

```javascript
afterAll(() => {
  // Disconnect from database
});
```

### `getRuntime()`

Returns the current runtime name.

**Returns:** `'node'`, `'bun'`, or `'deno'`

**Example:**

```javascript
import { getRuntime } from 'test-anywhere';

console.log(`Running on ${getRuntime()}`); // e.g., "Running on node"
```

## Examples

Check out the [examples](./examples) directory for complete working examples:

- **Node.js**: `examples/node-example.test.js`
- **Deno**: `examples/deno-example.test.js`
- **Bun**: `examples/bun-example.test.js`

## How It Works

`test-anywhere` automatically detects the JavaScript runtime (Bun, Deno, or Node.js) and delegates to the appropriate native testing framework:

- **Bun** → Uses `bun:test`
- **Deno** → Uses `Deno.test`
- **Node.js** → Uses `node:test`

This means you get the full performance and features of each runtime's native testing implementation while maintaining a consistent API across all platforms.

## Requirements

- **Node.js**: 20.0.0 or higher (for native test runner support)
- **Deno**: 1.x or higher (native Deno.test support)
- **Bun**: Any recent version (native bun:test support)

## License

[Unlicense](LICENSE) - Public Domain

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
