---
'test-anywhere': minor
---

Add BDD-style syntax and test modifiers for full Jest/Mocha compatibility. This release adds comprehensive support for standard testing patterns used across Bun, Deno, and Node.js:

**New Functions:**

- Added `describe(name, fn)` - Group related tests together (BDD style)
- Added `it(name, fn)` - Alias for `test()` (Mocha/Jest style)
- Added `before()` / `after()` - Mocha-style aliases for `beforeAll()` / `afterAll()`

**Test Modifiers:**

- Added `test.skip()` / `it.skip()` - Skip individual tests
- Added `test.only()` / `it.only()` - Run only specific tests (debugging)
- Added `test.todo()` / `it.todo()` - Mark tests as pending/TODO
- Added `describe.skip()` - Skip entire test suite
- Added `describe.only()` - Run only specific test suite

**Implementation Details:**

All features map directly to native framework capabilities:

- **Bun**: Uses native `describe()`, `test.skip/only/todo`, `describe.skip/only`
- **Deno**: Uses `Deno.test` with options (`ignore`, `only`)
- **Node.js**: Uses native `describe()`, test options (`skip`, `only`, `todo`)

**Benefits:**

- ✅ Full Jest and Mocha compatibility
- ✅ Better test organization with `describe()` blocks
- ✅ Essential debugging tools (`skip`, `only`) for focused testing
- ✅ 100% backward compatible - all existing code continues to work
- ✅ No non-standard functions - everything maps to native framework features

**Tests:**

- Added 12 new comprehensive tests covering all new API features
- All 53 tests pass across Node.js, Bun, and Deno
- Tests verify BDD syntax, modifiers, hook aliases, and edge cases

**Documentation:**

- Updated README with BDD-style examples and complete API reference
- Added sections for test modifiers and lifecycle hooks
- Included practical examples for all new features

This release completes the implementation of issue #65, ensuring our public API focuses on syntax supported by all three native testing frameworks.
