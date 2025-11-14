---
'test-anywhere': minor
---

Add standardized test hooks and reorganize project structure. This release adds comprehensive test lifecycle hook support and improves project organization:

**New Features:**

- Added `beforeAll()` hook - runs once before all tests
- Added `beforeEach()` hook - runs before each test
- Added `afterEach()` hook - runs after each test
- Added `afterAll()` hook - runs once after all tests
- All hooks support both synchronous and asynchronous functions
- Hooks work consistently across Node.js, Deno, and Bun runtimes

**Implementation Details:**

- Node.js and Bun use native hook implementations from their test modules
- Deno uses a custom implementation that wraps test functions to execute hooks (since Deno doesn't have built-in global hooks)
- Hook execution order is guaranteed: beforeAll → beforeEach → test → afterEach → afterAll

**Project Structure Improvements:**

- Reorganized project to use `src/` directory for source files
- Moved tests to `tests/` directory for better separation of concerns
- Updated all import paths in examples to demonstrate new structure
- Updated package.json exports to reference new file locations
- Updated deno.json configuration to include tests directory

**Tests:**

- Added comprehensive tests for all hook functionality
- Tests verify hook execution order and async support
- All 33 tests pass on Node.js and 48 tests pass on Bun (including examples)

**Breaking Changes:**

- None - all changes are backward compatible. The package.json exports configuration ensures imports still work correctly.

This release significantly improves the testing experience by providing standard lifecycle hooks that developers expect from modern testing frameworks.
