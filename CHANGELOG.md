# test-anywhere

## 0.8.10

### Patch Changes

- 883b7d0: Fix GITHUB_TOKEN collision error in reusable workflows

## 0.8.9

### Patch Changes

- 9ba1a4e: Ensure consistent release note style for both instant and changeset-pr modes

## 0.8.8

### Patch Changes

- Test patch release

## 0.8.7

### Patch Changes

- ca28b91: Test patch release

## 0.8.6

### Patch Changes

- 42f15d5: Test patch release

## 0.8.5

### Patch Changes

- 30dbc10: Add Release mode selector with Instant and Changeset PR options

## 0.8.4

### Patch Changes

- Test patch release

## 0.8.3

### Patch Changes

- 0559edd: Simplify manual release workflow to commit directly instead of creating PR

## 0.8.2

### Patch Changes

- 520265b: Update manual release workflow to use auto-approve and auto-merge instead of direct commit. This fixes the issue where commits pushed by GitHub Actions did not trigger subsequent workflows.

## 0.8.1

### Patch Changes

- 6934737: Update manual release workflow to commit directly to main instead of creating a PR

## 0.8.0

### Minor Changes

- 674275b: Add setDefaultTimeout support for Bun runtime (Fixes #69)
  - Added `setDefaultTimeout` export for setting default test timeout
  - Implemented native Bun timeout support via `bun:test`
  - Tests using test-anywhere can now call `setDefaultTimeout(ms)` to increase timeout
  - For Node.js and Deno, emits a warning as this feature is not natively supported
  - Verified fix works with deep-assistant/agent-cli test suite
  - Added test coverage for setDefaultTimeout functionality
  - Updated README with setDefaultTimeout documentation

## 0.7.1

### Patch Changes

- 852c0bc: Test manual release

## 0.7.0

### Minor Changes

- f622eea: Improve code maintainability and CI testing coverage
  - Convert shell scripts to mjs for better maintainability and cross-platform compatibility
  - Add comprehensive CI testing matrix: 3 runtimes (Node.js, Bun, Deno) across 3 operating systems (Ubuntu, macOS, Windows)
  - Add CI/CD status badge to README
  - Extract complex shell logic from husky hooks and GitHub workflows into dedicated mjs scripts
  - Improve error handling and debugging capabilities in automation scripts

## 0.6.0

### Minor Changes

- bebbc2c: Add missing comparison matchers and fix toThrow negation

  This release adds comprehensive comparison matchers to the expect() API:
  - `expect().toBeGreaterThan()` - Assert that a value is greater than another value
  - `expect().toBeGreaterThanOrEqual()` - Assert that a value is greater than or equal to another value
  - `expect().toBeLessThan()` - Assert that a value is less than another value
  - `expect().toBeLessThanOrEqual()` - Assert that a value is less than or equal to another value
  - `expect().not.toThrow()` - Assert that a function does not throw an error

  All matchers include both positive and negated forms (via `.not`) and work consistently across all runtimes (Node.js, Bun, and Deno). Comprehensive tests have been added to ensure compatibility.

  These additions address issues reported in the deduplino test suite where these matchers were missing.

## 0.5.0

### Minor Changes

- 18b6297: Add BDD-style syntax and test modifiers for full Jest/Mocha compatibility. This release adds comprehensive support for standard testing patterns used across Bun, Deno, and Node.js:

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

## 0.4.1

### Patch Changes

- 3b581b2: Add comprehensive comparison of native testing frameworks in Bun, Deno, and Node.js, including detailed documentation of test definition APIs, lifecycle hooks, assertion libraries, mocking capabilities, snapshot testing, coverage features, and migration recommendations.

## 0.4.0

### Minor Changes

- 680e610: Add standardized test hooks and reorganize project structure. This release adds comprehensive test lifecycle hook support and improves project organization:

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

## 0.3.0

### Minor Changes

- 4ec5689: Fix critical bugs and add new assertion methods. This release includes major improvements to the assertion library:

  **Critical Bug Fixes:**
  - Fixed `deepEqual()` implementation - replaced flawed JSON.stringify approach with proper deep equality algorithm that correctly handles property order, NaN, undefined, Date objects, circular references, and nested structures
  - Fixed `throws()` to detect async functions and provide helpful error messages directing users to use `throwsAsync()` instead
  - Fixed error message construction to use lazy evaluation, preventing unnecessary template literal evaluation and providing better error messages with JSON.stringify for objects

  **New Features:**
  - Added `throwsAsync()` method for properly testing async functions that throw errors
  - Added `notEqual()` assertion for strict inequality checks
  - Added `notDeepEqual()` assertion for deep inequality checks
  - Added `match()` assertion for regex pattern matching
  - Added `includes()` assertion for array/string inclusion checks
  - Added TypeScript definitions (.d.ts) for full type safety and autocomplete support

  **Improvements:**
  - Fixed example files to use relative imports for better local development experience
  - Added 23 comprehensive edge case tests covering property order, NaN, undefined, dates, circular references, and all new assertion methods
  - Improved error handling in build scripts with DEBUG mode support
  - Updated package.json with proper TypeScript exports configuration

  All tests pass and the code meets linting standards. This release significantly improves the reliability and usability of the testing framework.

## 0.2.7

### Patch Changes

- 5ed0be3: Fix GitHub release notes to include changeset descriptions and npm package links. Release notes will now properly display the changes from CHANGELOG.md along with shields.io badges and direct links to the npm package version.

## 0.2.6

### Patch Changes

- ab0b847: Simplify version commit message to just version number. Version bump commits will now have messages like "0.2.6" instead of "chore: version packages to 0.2.6".

## 0.2.5

### Patch Changes

- f221ec1: Fix release automation by implementing direct version commits to main. The release workflow now automatically detects changesets, bumps versions, commits changes directly to main, and publishes to NPM and GitHub releases in a single workflow run. This eliminates the need for separate version bump PRs and ensures fully automated releases without manual intervention.

## 0.2.4

### Patch Changes

- e288686: Simplify version PR title format to show only version number. Version bump PRs will now have titles like "0.2.4" instead of "chore: version packages (v0.2.4)". Auto-merge workflow updated to match the new simplified title format.

## 0.2.3

### Patch Changes

- 459eabb: Add automatic version PR title updates and package-lock.json synchronization. Version bump PRs will now have titles like "chore: version packages (v0.2.2)" instead of just "chore: version packages", and package-lock.json will be automatically synchronized with package.json version updates.

## 0.2.2

### Patch Changes

- 6df8569: Fix auto-merge workflow by enabling repository-level allow_auto_merge setting

## 0.2.1

### Patch Changes

- 99d78ba: Test patch release

## 0.2.0

### Minor Changes

- e4f897f: Add automatic merging of version bump pull requests created by Changesets. When the Changesets action creates a "chore: version packages" PR and all CI checks pass, it will now be automatically merged, streamlining the release process.

## 0.1.6

### Patch Changes

- a02b3f2: Fix release notes formatting script to properly detect and format GitHub releases. The script now correctly identifies formatted releases (checking for img.shields.io badge), handles literal \n characters, extracts full descriptions, and uses JSON input for proper special character handling.

## 0.1.5

### Patch Changes

- 0670481: Improve GitHub release notes formatting with proper newlines, PR links, and shields.io NPM version badges

## 0.1.4

### Patch Changes

- b5741a5: Fix changeset handling to enforce proper workflow: require exactly one changeset per PR with valid type (major/minor/patch) and description, ensure CHANGELOG.md updates on version bumps, create GitHub releases with npm package links, and automatically clean up consumed changesets after release.
