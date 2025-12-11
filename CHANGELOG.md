# test-anywhere

## 0.8.43

### Patch Changes

- 37a459c: Test patch release (changeset pull request)

## 0.8.42

### Patch Changes

- Test patch release (instant)

## 0.8.41

### Patch Changes

- 38326b9: fix: remove extra quotes from release notes

  Fixed an issue where manual instant releases were adding extra quotes around the release notes. When workflow_dispatch passes a description, the command-stream library was adding shell escaping by wrapping it in single quotes, which then became part of the actual value in CHANGELOG.md and GitHub releases.

  Implemented a three-layer defense approach:
  - Pass description via environment variable instead of command-line argument to avoid shell escaping
  - Add defensive quote stripping in instant-version-bump.mjs
  - Improve quote cleaning regex in format-release-notes.mjs to handle escaped quotes

## 0.8.40

### Patch Changes

- 'Test patch release (instant)'

## 0.8.39

### Patch Changes

- c6beece: fix: complete fix for release workflow argument parsing

  Fixed both instant release and main release workflows that were not working correctly. Both workflows were calling version-and-commit.mjs with positional arguments but the script expected named options (--mode, --bump-type, --description).

  Changes:
  - Updated instant release workflow (line 233) to use named arguments
  - Updated main release workflow (line 182) to use named arguments
  - Added validation to script to detect and reject positional arguments with helpful error messages
  - Updated case study documentation with detailed root cause analysis and timeline

  This completes the fix that was partially implemented in PR #127, which only fixed the instant release job but missed the main release job.

## 0.8.38

### Patch Changes

- 58e9694: fix: remove trailing single quote from release notes markdown

## 0.8.37

### Patch Changes

- 715382c: fix: replace lino-arguments in format-release-notes.mjs for reliable CI execution

  The format-release-notes.mjs script was still using lino-arguments for CLI argument parsing, which was causing it to fail silently in GitHub Actions CI environments. This prevented release notes from being properly formatted with Related Pull Request links, markdown formatting, and shields.io badges.

  Root Cause:
  - PR #119 fixed create-github-release.mjs and format-github-release.mjs
  - However, format-release-notes.mjs (called by format-github-release.mjs) was never fixed
  - lino-arguments fails to parse CLI arguments in CI environments
  - Script exited with code 1 without any output
  - Release notes remained in raw changeset format

  Changes:
  - Replaced lino-arguments with manual parseArgs() function
  - Supports both --arg=value and --arg value formats
  - Falls back to environment variables
  - Works reliably across all environments (local, CI, containers)

  Impact:
  - Release notes now properly formatted with markdown
  - Related Pull Request section with PR links now included
  - Shields.io npm badge now added to releases
  - Script works reliably in all environments

  Fixes #122

## 0.8.36

### Patch Changes

- 5d6c200: Simplify version bump commit messages

  Remove Claude Code attribution and quotes from automated version bump commit messages. Commit messages now show only the version number (e.g., "0.8.36") instead of the previous format with attribution text.

## 0.8.35

### Patch Changes

- f60d45d: fix: replace lino-arguments with manual CLI argument parsing for reliability

  The `lino-arguments` library's `makeConfig` function was failing to parse CLI arguments correctly in GitHub Actions, causing release scripts to fail with "Missing required arguments" errors even when arguments were provided correctly.

  This change replaces `lino-arguments` with a simple, reliable manual argument parser that:
  - Parses arguments directly from process.argv
  - Supports both `--arg=value` and `--arg value` formats
  - Falls back to environment variables
  - Works reliably across all environments

  Affected scripts:
  - scripts/create-github-release.mjs
  - scripts/format-github-release.mjs

  Fixes #118

## 0.8.34

### Patch Changes

- d9b8f0f: Fix release workflow argument passing

  Update GitHub Actions workflow to use named arguments (--version, --repository, --commit-sha) when calling release scripts, matching the changes made in PR #115 where scripts were updated to use lino-arguments library.

  This fixes the failed release of version 0.8.33 where GitHub Release creation failed due to argument mismatch.

## 0.8.33

### Patch Changes

- 3dd3f71: Integrate link-foundation libraries (use-m, command-stream, lino-arguments) into ./scripts folder

  All .mjs scripts in the ./scripts folder have been updated to use:
  - use-m: Dynamic package loading without package.json dependencies
  - command-stream: Modern shell command execution with streaming support (replaces execSync)
  - lino-arguments: Unified configuration from CLI args, env vars, and .lenv files

## 0.8.32

### Patch Changes

- 90df3ee: Convert shell scripts to cross-platform Node.js .mjs scripts

  All shell scripts (`.sh`) in the scripts folder have been converted to cross-platform Node.js `.mjs` scripts that use only built-in modules. This makes them work consistently across Windows, macOS, and Linux without requiring bash or external dependencies.

## 0.8.31

### Patch Changes

- 472aec5: Test patch release (changeset pull request)

## 0.8.30

### Patch Changes

- Test patch release (instant)

## 0.8.29

### Patch Changes

- 5f367e2: Make release workflow idempotent to handle partial failures gracefully. The version-and-commit script now detects if the remote has advanced and skips re-versioning when the release was partially completed. The publish script adds retry logic and checks if the version is already published.

## 0.8.28

### Patch Changes

- 2ea4945: Refactor GitHub Actions workflows: renamed main.yml to release.yml and consolidated common.yml into the main workflow file

## 0.8.27

### Patch Changes

- 3554280: Test patch release (changeset pull request)

## 0.8.26

### Patch Changes

- Test patch release (instant)

## 0.8.25

### Patch Changes

- f481813: Fix PR detection in release notes - properly look up PRs by commit hash via GitHub API instead of using fallback guessing. If no PR contains the commit, no PR link is shown.

## 0.8.24

### Patch Changes

- Test patch release

## 0.8.23

### Patch Changes

- 71adc8f: Fix manual instant release to work with npm trusted publishing by consolidating all release functionality into main.yml workflow

## 0.8.22

### Patch Changes

- Test patch release

## 0.8.21

### Patch Changes

- 772779f: Test patch release

## 0.8.20

### Patch Changes

- 826453b: Fix multiline formatting in GitHub release descriptions

  Release descriptions were being flattened from multiline to single line format. The issue was in the format-release-notes.mjs script which used an overly aggressive regex (.replace(/\s+/g, ' ')) that replaced ALL whitespace including newlines.

  Now properly preserves:
  - Paragraph breaks
  - Bullet point lists
  - Line breaks in changeset descriptions

  Only excessive blank lines (3+ consecutive) are normalized to 2.

## 0.8.19

### Patch Changes

- 9b8b39f: Fix npm trusted publishing by adding repository field to package.json

  The npm trusted publishing E422 error occurred because the package.json was missing the repository field. When npm publishes with provenance, it verifies that the repository.url in package.json matches the source repository URI from the GitHub Actions OIDC token.

  Changes:
  - Add repository field to package.json with correct GitHub URL
  - Update .gitignore to allow ci-logs/\*.log files
  - Update case study documentation with E422 error analysis

## 0.8.18

### Patch Changes

- 6d1ec17: Fix npm trusted publishing by updating npm CLI to >= 11.5.1

  npm OIDC trusted publishing requires npm >= 11.5.1, but Node.js 20.x ships with npm 10.x.
  This change adds a step to update npm to the latest version before publishing.

  Root cause: The "Access token expired or revoked" error was occurring because npm 10.x
  does not support OIDC trusted publishing. Without a valid token or OIDC support, npm
  interprets the lack of authentication as an expired token.

## 0.8.17

### Patch Changes

- d7abfad: Fix npm trusted publishing by adding OIDC permissions to caller workflows

## 0.8.16

### Patch Changes

- 83bd342: Migrate from NPM_TOKEN to OIDC trusted publishing for npm package releases. This change removes all NPM_TOKEN secret dependencies from GitHub Actions workflows and enables npm's recommended OIDC-based authentication for enhanced security and automatic provenance generation.

## 0.8.15

### Patch Changes

- Test patch release

## 0.8.14

### Patch Changes

- Test patch release

## 0.8.13

### Patch Changes

- 770dc25: Test patch release

## 0.8.12

### Patch Changes

- 2dcc18e: Fix instant release mode to bypass changesets as intended. Manual instant releases were failing because the workflow was using a two-step changeset approach instead of directly bumping version and updating changelog. Added new `scripts/instant-version-bump.mjs` script and updated workflows to support both instant and changeset release modes.

## 0.8.11

### Patch Changes

- 7f497a7: test patch release

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
