# test-anywhere

[![npm version](https://img.shields.io/npm/v/test-anywhere.svg)](https://www.npmjs.com/package/test-anywhere)
[![npm downloads](https://img.shields.io/npm/dm/test-anywhere.svg)](https://www.npmjs.com/package/test-anywhere)
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
import { test, assert } from "npm:test-anywhere";
```

Or from your local installation:

```javascript
import { test, assert } from "./node_modules/test-anywhere/index.js";
```

## Usage

### Node.js

Create a test file (e.g., `example.test.js`):

```javascript
import { test, assert } from 'test-anywhere';

test('basic math works', () => {
  assert.equal(1 + 1, 2);
});

test('objects can be compared', () => {
  assert.deepEqual({ a: 1 }, { a: 1 });
});
```

Run tests:

```bash
node --test
# or
npm test
```

### Deno

Create a test file (e.g., `example.test.js`):

```javascript
import { test, assert } from "npm:test-anywhere";

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

### `test(name, fn)`

Creates a test with the given name and test function.

**Parameters:**
- `name` (string): The name/description of the test
- `fn` (function): The test function to execute

**Example:**

```javascript
test('my test name', () => {
  // test code here
});
```

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
