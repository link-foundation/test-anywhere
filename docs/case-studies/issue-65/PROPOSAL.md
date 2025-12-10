# API Enhancement Proposal for Issue #65

## Overview

After analyzing our current API against the native testing frameworks (Bun, Deno, Node.js), I've identified that our API is **well-designed and follows standard patterns**. However, we're missing some **core Jest/Mocha syntax** that would make the library more familiar and complete.

## Current API Status: ✅ GOOD Foundation

**What we have that's correct:**

- ✅ `test()` function - Standard across all frameworks
- ✅ Lifecycle hooks with normalized names (`beforeAll`, `afterAll`, etc.) - As requested in issue
- ✅ Function-based assertions compatible with Node.js assert and Deno @std/assert
- ✅ No non-standard functions - Everything maps to native features

## Recommended Additions (All Standard Jest/Mocha Syntax)

### Priority 1: Core BDD Syntax (HIGH - Most Important)

As mentioned in the issue: _"We can merge `test`, `describe`, `it` methods, so we support both jest style and mocha style."_

**Add these core functions:**

1. **`it(name, fn)`** - Alias for `test()`
   - Standard in: Jest ✅, Mocha ✅, Node.js ✅, Deno BDD ✅
   - Usage: `it('should work', () => { ... })`

2. **`describe(name, fn)`** - Group related tests
   - Standard in: Jest ✅, Mocha ✅, Bun ✅, Deno BDD ✅, Node.js ✅
   - Usage: `describe('user module', () => { it('creates user', ...) })`

### Priority 2: Test Modifiers (HIGH - Debugging Essential)

**Add these standard modifiers:**

3. **`test.skip()` / `it.skip()`** - Skip individual tests
   - Standard in: Jest ✅, Mocha ✅, Bun ✅, Node.js ✅, Deno ✅
   - Usage: `test.skip('broken test', () => { ... })`

4. **`test.only()` / `it.only()`** - Run only specific tests
   - Standard in: Jest ✅, Mocha ✅, Bun ✅, Node.js ✅, Deno ✅
   - Usage: `test.only('debug this test', () => { ... })`

5. **`test.todo()` / `it.todo()`** - Mark as pending
   - Standard in: Jest ✅, Bun ✅, Node.js ✅
   - Usage: `test.todo('implement feature X')`

6. **`describe.skip()` / `describe.only()`** - Skip/isolate test suites
   - Standard in: Jest ✅, Mocha ✅, Bun ✅, Node.js ✅
   - Usage: `describe.skip('integration tests', () => { ... })`

### Priority 3: Optional Aliases (MEDIUM - Mocha Compatibility)

7. **`before()` / `after()`** - Mocha-style hook names
   - Aliases for `beforeAll` / `afterAll`
   - Standard in: Mocha ✅, Node.js ✅
   - Note: Keep `beforeAll`/`afterAll` as primary (per issue requirement)

## Implementation Approach

### For `describe()` and `it()`:

```javascript
// Delegate to native implementations
export function describe(name, fn) {
  if (runtime === 'bun') {
    return bunTest.describe(name, fn);
  } else if (runtime === 'deno') {
    const { describe: denoDescribe } = await import('@std/testing/bdd');
    return denoDescribe(name, fn);
  } else {
    return nodeTest.describe(name, fn);
  }
}

export function it(name, fn) {
  return test(name, fn);  // Simple alias
}
```

### For modifiers:

```javascript
test.skip = function (name, fn) {
  if (runtime === 'bun') return bunTest.test.skip(name, fn);
  if (runtime === 'deno') return Deno.test({ name, ignore: true, fn });
  return nodeTest.test(name, { skip: true }, fn);
};

test.only = function (name, fn) {
  if (runtime === 'bun') return bunTest.test.only(name, fn);
  if (runtime === 'deno') return Deno.test({ name, only: true, fn });
  return nodeTest.test(name, { only: true }, fn);
};

test.todo = function (name, fn) {
  if (runtime === 'bun') return bunTest.test.todo(name);
  if (runtime === 'deno')
    return Deno.test({
      name: `[TODO] ${name}`,
      ignore: true,
      fn: fn || (() => {}),
    });
  return nodeTest.test(name, { todo: true }, fn);
};
```

## What We're NOT Adding (Non-Standard)

- ❌ `test.each()` - Only Bun supports it natively
- ❌ `expect()` API - Bun-specific, would duplicate our assert API
- ❌ Custom test context features - Too complex to emulate consistently
- ❌ Module mocking - Each framework has different approaches

## Benefits

1. **Full Jest/Mocha compatibility** - Users can write familiar syntax
2. **Better test organization** - `describe()` blocks group related tests
3. **Essential debugging tools** - `only` and `skip` are critical for development
4. **100% backward compatible** - All existing code continues to work
5. **No non-standard functions** - Everything maps to native framework features

## Example: Before vs After

### Before (Current - Works but limited):

```javascript
import { test, assert } from 'test-anywhere';

test('user creation works', () => {
  assert.ok(true);
});

test('user deletion works', () => {
  assert.ok(true);
});
```

### After (Proposed - Full BDD style):

```javascript
import { describe, it, assert } from 'test-anywhere';

describe('user module', () => {
  describe('creation', () => {
    it('should create a new user', () => {
      assert.ok(true);
    });

    it.skip('should validate email', () => {
      // TODO: implement validation
    });
  });

  describe.only('deletion', () => {
    it('should delete existing user', () => {
      assert.ok(true);
    });
  });
});
```

## Files to Update

1. `src/index.js` - Add new functions and modifiers
2. `src/index.d.ts` - TypeScript definitions
3. `tests/index.test.js` - Test new features
4. `README.md` - Document new API
5. `examples/` - Add BDD-style examples

## Next Steps

1. **Get feedback** on this proposal
2. **Implement** if approved (estimated ~2-3 hours)
3. **Test** across all three runtimes
4. **Document** the new features
5. **Update version** for release

## Questions for Review

1. Should we implement all Priority 1 + Priority 2 features? (Recommended: YES)
2. Should we add Priority 3 Mocha aliases (`before`/`after`)? (Recommended: OPTIONAL)
3. Any other standard Jest/Mocha features we should consider?

---

**Summary:** Our current API is solid. Adding `describe`, `it`, and test modifiers (`skip`, `only`, `todo`) will make test-anywhere feature-complete for standard Jest/Mocha workflows while maintaining our clean cross-runtime abstraction.
