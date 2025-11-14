# API Analysis: test-anywhere vs Native Testing Frameworks

> Analysis of current test-anywhere API against Bun, Deno, and Node.js native testing framework syntax
>
> **Date:** 2025-11-14
> **Issue:** #65

## Executive Summary

This document analyzes the current `test-anywhere` public API to ensure it focuses on syntax that is supported by Bun, Deno, and Node.js native testing frameworks. The goal is to provide a unified API that maps directly to standard Jest/Mocha-style syntax while avoiding non-standard functions.

## Current API (v0.4.1)

### Test Definition
- `test(name, fn)` - Standard test definition

### Lifecycle Hooks
- `beforeAll(fn)` - Runs once before all tests
- `beforeEach(fn)` - Runs before each test
- `afterEach(fn)` - Runs after each test
- `afterAll(fn)` - Runs once after all tests

### Assertions
- `assert.ok(value, message?)` - Truthy assertion
- `assert.equal(actual, expected, message?)` - Strict equality
- `assert.notEqual(actual, expected, message?)` - Strict inequality
- `assert.deepEqual(actual, expected, message?)` - Deep equality
- `assert.notDeepEqual(actual, expected, message?)` - Deep inequality
- `assert.throws(fn, message?)` - Synchronous exception checking
- `assert.throwsAsync(fn, message?)` - Async exception checking
- `assert.match(actual, regexp, message?)` - Regex matching
- `assert.includes(container, value, message?)` - Array/string inclusion

### Utilities
- `getRuntime()` - Returns current runtime name

## Native Framework Support Analysis

### 1. Test Definition Functions

#### Current Status: ✅ GOOD - Needs Extension

**What we have:**
- `test(name, fn)` ✅

**What's standard in native frameworks:**

| Function | Bun | Deno | Node.js | Standard? |
|----------|-----|------|---------|-----------|
| `test()` | ✅ | ✅ (Deno.test) | ✅ | **YES - Core** |
| `it()` | ❌ | ✅ (via @std/testing/bdd) | ✅ | **YES - Mocha/Jest** |
| `describe()` | ✅ | ✅ (via @std/testing/bdd) | ✅ | **YES - BDD style** |

**Analysis:**
- `test()` is well-supported ✅
- **MISSING:** `it()` alias - Standard in Mocha/Jest, available in Node.js and Deno BDD
- **MISSING:** `describe()` - Standard grouping in all frameworks

**Recommendation:**
- ✅ **Add `it()` as an alias to `test()`** - This is standard Mocha/Jest/Node.js syntax
- ✅ **Add `describe()` for test grouping** - Supported by all three runtimes

### 2. Lifecycle Hooks

#### Current Status: ⚠️ NAMING INCONSISTENCY

**What we have:**
- `beforeAll()` ✅
- `beforeEach()` ✅
- `afterEach()` ✅
- `afterAll()` ✅

**Native framework mapping:**

| Our Hook | Bun | Deno | Node.js | Status |
|----------|-----|------|---------|--------|
| `beforeAll()` | `beforeAll()` | `Deno.test.beforeAll()` or BDD | `before()` | ⚠️ Node uses `before()` |
| `beforeEach()` | `beforeEach()` | `Deno.test.beforeEach()` or BDD | `beforeEach()` | ✅ Consistent |
| `afterEach()` | `afterEach()` | `Deno.test.afterEach()` or BDD | `afterEach()` | ✅ Consistent |
| `afterAll()` | `afterAll()` | `Deno.test.afterAll()` or BDD | `after()` | ⚠️ Node uses `after()` |

**Analysis:**
- Bun uses: `beforeAll`, `beforeEach`, `afterEach`, `afterAll` (Jest-style)
- Deno BDD module uses: `beforeAll`, `beforeEach`, `afterEach`, `afterAll` (Jest-style)
- Node.js uses: `before`, `beforeEach`, `afterEach`, `after` (Mocha-style)

**Current Implementation:**
Our library currently normalizes to the Jest-style names (`beforeAll`/`afterAll`) and internally maps to Node's `before`/`after`. This is **GOOD** as stated in the issue: "Normalization of before and after methods should stay."

**Recommendation:**
- ✅ **Keep current normalization** - This is explicitly approved in issue #65
- ✅ **Optionally add `before()` and `after()` aliases** for Mocha-style compatibility

### 3. Test Modifiers

#### Current Status: ❌ MISSING - Critical for Standard Compatibility

**What we have:**
- None

**What's standard across frameworks:**

| Modifier | Bun | Deno | Node.js | Jest/Mocha | Priority |
|----------|-----|------|---------|------------|----------|
| `test.skip()` / `it.skip()` | ✅ | `ignore: true` | `skip: true` | ✅ Jest/Mocha | **HIGH** |
| `test.only()` / `it.only()` | ✅ | `only: true` | `only: true` | ✅ Jest/Mocha | **HIGH** |
| `test.todo()` / `it.todo()` | ✅ | ❌ | `todo: true` | ✅ Jest | **MEDIUM** |
| `describe.skip()` | ✅ | Via BDD | ✅ | ✅ Jest/Mocha | **HIGH** |
| `describe.only()` | ✅ | Via BDD | ✅ | ✅ Jest/Mocha | **HIGH** |

**Analysis:**
Test modifiers are **standard features** in Jest and Mocha that are widely used:
- `skip()` - Temporarily disable tests
- `only()` - Run only specific tests (debugging)
- `todo()` - Mark tests as pending implementation

**Recommendation:**
- ✅ **Add `test.skip()`** - Standard in all frameworks
- ✅ **Add `test.only()`** - Standard in all frameworks
- ✅ **Add `test.todo()`** - Standard in Jest and Node.js
- ✅ **Add `it.skip()`, `it.only()`, `it.todo()`** - Same as test variants
- ✅ **Add `describe.skip()`, `describe.only()`** - For test suites

### 4. Assertions

#### Current Status: ✅ GOOD - Core assertions covered

**What we have:**
All our assertions use function-based syntax similar to Node.js assert and Deno's @std/assert:
- `assert.ok()` ✅
- `assert.equal()` ✅
- `assert.notEqual()` ✅
- `assert.deepEqual()` ✅
- `assert.notDeepEqual()` ✅
- `assert.throws()` ✅
- `assert.throwsAsync()` ✅
- `assert.match()` ✅
- `assert.includes()` ✅

**Native framework comparison:**

| Assertion Type | Node.js | Deno (@std/assert) | Bun | Our Implementation |
|----------------|---------|--------------------|----|-------------------|
| Truthy | `assert.ok()` | `assert()` | `expect().toBeTruthy()` | ✅ `assert.ok()` |
| Strict Equal | `assert.strictEqual()` | `assertStrictEquals()` | `expect().toBe()` | ✅ `assert.equal()` |
| Deep Equal | `assert.deepStrictEqual()` | `assertEquals()` | `expect().toEqual()` | ✅ `assert.deepEqual()` |
| Not Equal | `assert.notStrictEqual()` | `assertNotEquals()` | `expect().not.toBe()` | ✅ `assert.notEqual()` |
| Throws | `assert.throws()` | `assertThrows()` | `expect().toThrow()` | ✅ `assert.throws()` |
| Async Throws | `assert.rejects()` | `assertRejects()` | `expect().rejects` | ✅ `assert.throwsAsync()` |
| Regex Match | `assert.match()` | `assertMatch()` | `expect().toMatch()` | ✅ `assert.match()` |

**Analysis:**
- Our assertion API follows the Node.js/Deno function-based pattern ✅
- We do NOT use Bun's `expect()` chainable style - this is intentional for cross-runtime compatibility
- All our assertions map to standard Node.js assert methods

**Additional Standard Assertions to Consider:**

| Assertion | Node.js | Deno | Why Add? |
|-----------|---------|------|----------|
| `assert.strictEqual()` | ✅ | `assertStrictEquals()` | Explicit strict equality |
| `assert.deepStrictEqual()` | ✅ | `assertEquals()` | Explicit deep strict equality |
| `assert.rejects()` | ✅ | `assertRejects()` | More standard than `throwsAsync` |
| `assert.doesNotThrow()` | ✅ | ❌ | Less commonly used |
| `assert.ifError()` | ✅ | ❌ | Node.js specific |

**Recommendation:**
- ✅ **Keep current assertion API** - It's well-designed and standard
- ⚠️ **Consider adding `assert.strictEqual()` as alias to `equal()`** for Node.js compatibility
- ⚠️ **Consider adding `assert.deepStrictEqual()` as alias to `deepEqual()`** for Node.js compatibility
- ⚠️ **Consider renaming `throwsAsync()` to `rejects()`** to match Node.js/Deno naming (but keep alias)

### 5. Missing Standard Features

#### Test Context Object

**Status:** ❌ MISSING

Node.js provides a test context object with useful methods:

```javascript
test('my test', (t) => {
  t.diagnostic('debug message');  // Output diagnostic info
  t.skip('reason');                // Skip remaining test
  t.todo('reason');                // Mark as todo
  await t.test('subtest', () => {});  // Nested subtest
});
```

**Analysis:**
- Node.js subtests (`t.test()`) are a powerful feature
- Deno and Bun don't have direct equivalents
- We can provide this for Node.js only, or skip it for simplicity

**Recommendation:**
- ⚠️ **Optional:** Pass through Node.js test context for advanced users
- ❌ **Don't emulate for Deno/Bun** - Would be non-standard custom behavior

#### Parameterized Tests

**Status:** ❌ MISSING

Bun supports `test.each()` for parameterized tests (Jest-compatible):

```javascript
test.each([
  [1, 2, 3],
  [2, 3, 5],
])('adds %i + %i to equal %i', (a, b, expected) => {
  expect(a + b).toBe(expected);
});
```

**Analysis:**
- This is a Jest-standard feature
- Bun supports it natively
- Node.js and Deno don't have native support
- Users can implement with loops

**Recommendation:**
- ❌ **Don't add `test.each()`** - Not universally supported, users can use loops
- Can be added later if there's demand

## Summary of Recommendations

### ✅ HIGH PRIORITY - Add These (Standard Everywhere)

1. **`it()` function** - Alias for `test()`, standard Mocha/Jest syntax
2. **`describe()` function** - Test grouping, standard BDD syntax
3. **`test.skip()` / `it.skip()`** - Skip individual tests
4. **`test.only()` / `it.only()`** - Run only specific tests
5. **`describe.skip()` / `describe.only()`** - Skip/isolate test suites
6. **`test.todo()` / `it.todo()`** - Mark tests as pending (where supported)

### ⚠️ MEDIUM PRIORITY - Consider Adding

7. **`before()` / `after()` aliases** - Mocha-style hook names (in addition to beforeAll/afterAll)
8. **`assert.strictEqual()` / `assert.deepStrictEqual()`** - Aliases for explicit Node.js compatibility

### ❌ LOW PRIORITY / DON'T ADD

- `test.each()` - Not universally supported
- `expect()` API - Bun-specific, would duplicate assert API
- Test context object features - Complex to emulate
- Module mocking - Framework-specific implementations differ too much

## Implementation Plan

### Phase 1: Core BDD Syntax (Merging test/describe/it)

As noted in the issue: "We can merge `test`, `describe`, `it` methods, so we support both jest style and mocha style."

```javascript
// Add to index.js
export function it(name, fn) {
  return test(name, fn);  // Simple alias
}

export function describe(name, fn) {
  // Delegate to native describe implementations
  if (runtime === 'bun') {
    return bunTest.describe(name, fn);
  } else if (runtime === 'deno') {
    // Use @std/testing/bdd for Deno
    const { describe: denoDescribe } = await import('@std/testing/bdd');
    return denoDescribe(name, fn);
  } else {
    // Node.js native describe
    return nodeTest.describe(name, fn);
  }
}
```

### Phase 2: Test Modifiers

```javascript
// Add modifiers to test function
test.skip = function(name, fn) {
  if (runtime === 'bun') {
    return bunTest.test.skip(name, fn);
  } else if (runtime === 'deno') {
    return Deno.test({ name, ignore: true, fn });
  } else {
    return nodeTest.test(name, { skip: true }, fn);
  }
};

test.only = function(name, fn) {
  if (runtime === 'bun') {
    return bunTest.test.only(name, fn);
  } else if (runtime === 'deno') {
    return Deno.test({ name, only: true, fn });
  } else {
    return nodeTest.test(name, { only: true }, fn);
  }
};

test.todo = function(name, fn) {
  if (runtime === 'bun') {
    return bunTest.test.todo(name);
  } else if (runtime === 'deno') {
    // Deno doesn't have native todo, simulate with skip
    return Deno.test({ name: `[TODO] ${name}`, ignore: true, fn: fn || (() => {}) });
  } else {
    return nodeTest.test(name, { todo: true }, fn);
  }
};

// Same for it.skip, it.only, it.todo
it.skip = test.skip;
it.only = test.only;
it.todo = test.todo;
```

### Phase 3: Describe Modifiers

```javascript
describe.skip = function(name, fn) {
  if (runtime === 'bun') {
    return bunTest.describe.skip(name, fn);
  } else if (runtime === 'deno') {
    const { describe: denoDescribe } = await import('@std/testing/bdd');
    // BDD module describe doesn't have skip, wrap all tests
    return denoDescribe(name, () => {
      // Tests inside will be skipped via context
    });
  } else {
    return nodeTest.describe(name, { skip: true }, fn);
  }
};

describe.only = function(name, fn) {
  // Similar implementation
};
```

### Phase 4: Optional Hook Aliases

```javascript
// Mocha-style aliases
export const before = beforeAll;
export const after = afterAll;
```

### Phase 5: Optional Assert Aliases

```javascript
assert.strictEqual = assert.equal;
assert.deepStrictEqual = assert.deepEqual;
assert.rejects = assert.throwsAsync;  // More standard name
```

## Files That Need Updates

1. **`src/index.js`** - Add new functions and modifiers
2. **`src/index.d.ts`** - Update TypeScript definitions
3. **`tests/index.test.js`** - Add tests for new features
4. **`README.md`** - Document new API features
5. **`examples/`** - Add examples using describe/it syntax

## Backward Compatibility

All changes are **additive** - no breaking changes:
- Existing `test()` continues to work ✅
- Existing hooks continue to work ✅
- Existing assertions continue to work ✅
- New functions are additions, not replacements ✅

## Conclusion

The current `test-anywhere` API is well-designed and follows standard patterns. The main gaps are:

1. **Missing `it()` and `describe()`** - Core BDD syntax used universally
2. **Missing test modifiers** - `skip`, `only`, `todo` are standard Jest/Mocha features
3. **Naming is already good** - The normalization of beforeAll/afterAll is correct

By adding these features, we'll provide complete Jest and Mocha compatibility while maintaining our clean cross-runtime abstraction.

---

**Next Steps:**
1. Get approval on this analysis and recommendations
2. Implement Phase 1-3 (core BDD syntax + modifiers)
3. Update tests and documentation
4. Optionally implement Phase 4-5 (aliases)
