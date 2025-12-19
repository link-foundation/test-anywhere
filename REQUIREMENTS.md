# test-anywhere Requirements

This document describes the functional requirements for the test-anywhere CLI tool.

## CLI Entry Point

**Issue**: [#144](https://github.com/link-foundation/test-anywhere/issues/144)

### Wrapper Options

The CLI supports the following wrapper options:

| Option      | Short | Description                                                  |
| ----------- | ----- | ------------------------------------------------------------ |
| `--help`    | `-h`  | Display help message with usage information                  |
| `--version` | `-v`  | Display the package version                                  |
| `--verbose` |       | Enable verbose output (shows runtime detection and commands) |

### Runtime Priority (Bun-first)

The CLI automatically detects and uses available runtimes in the following priority order:

1. **Bun** (preferred) - Fastest startup time and modern features
2. **Deno** - Secure by default with TypeScript support
3. **Node.js** - Fallback for maximum compatibility

This "Bun-first" approach ensures the best possible developer experience while maintaining compatibility with all major JavaScript runtimes.

### Executable Entry Point

The CLI is available as `test-anywhere` command when installed globally or via `npx`:

```bash
# Global installation
npm install -g test-anywhere
test-anywhere --help

# Using npx (no installation required)
npx test-anywhere --help

# Using bunx
bunx test-anywhere --help

# Using Deno
deno run npm:test-anywhere --help
```

## CLI Options Splitting

### Problem

Users need to pass options to both the test-anywhere wrapper command and the underlying test runner (node, bun, deno) with a clear and intuitive syntax.

### Solution

Support **two alternative syntax variants** that can be used one at a time (but not both simultaneously):

#### Syntax Variant 1: Double-dash Separator

```bash
$ [wrapper-options] -- [command-options]
```

Reads as: `start ... command` (referencing the package name "test-anywhere").

**Examples:**

```bash
# Node.js
npx test-anywhere --verbose -- --test-timeout=5000

# Bun
bunx test-anywhere --config=custom.json -- --bail --coverage

# Deno
deno run npm:test-anywhere -- --allow-read --allow-net
```

**Rationale:**

- POSIX standard convention used by npm, yarn, docker, and most CLI tools
- Zero learning curve for developers
- Works across all major shells (bash, zsh, fish, PowerShell, cmd.exe)
- Clear separation between wrapper and runner options

#### Syntax Variant 2: Explicit Command Separator

```bash
$ [wrapper-options] command [command-options]
```

Where `command` is the literal word "command" used as a separator/keyword.

**Examples:**

```bash
# Node.js
npx test-anywhere --verbose command --test-timeout=5000

# Bun
bunx test-anywhere --config=custom.json command --bail --coverage

# Deno
deno run npm:test-anywhere command --allow-read --allow-net
```

**Rationale:**

- Explicit and self-documenting keyword
- Reads naturally as "test-anywhere [options] command [runner-options]"
- No special shell characters that might need escaping
- Works consistently across all platforms

### Usage Rules

1. **One syntax at a time**: Users can use **either** the double-dash separator `--` **or** the `command` keyword, but **not both** in the same invocation.

2. **Clear error messages**: If users attempt to mix both syntaxes, the CLI should provide a clear error message explaining the correct usage.

3. **Cross-platform compatibility**: Both syntax variants must work on all supported platforms:
   - Unix/Linux shells (bash, zsh, sh, dash, fish)
   - Windows shells (PowerShell, cmd.exe)
   - All JavaScript runtimes (Node.js, Bun, Deno)

4. **Backward compatibility**: The implementation should not break existing usage patterns of the test-anywhere CLI.

### Implementation Considerations

- Parse `process.argv` to detect the presence of either `--` or `command` keyword
- Split arguments accordingly:
  - Everything before the separator → wrapper options
  - Everything after the separator → runner options
- Pass runner options verbatim to the underlying test runner
- Validate that only one separator syntax is used per invocation
- Provide helpful error messages for ambiguous or incorrect usage

## Current Requirements

### Universal Testing API

- Provide a single test API that works across Bun, Deno, and Node.js
- Support `test()` and `it()` functions for defining tests
- Support `describe()` for grouping related tests (BDD style)
- Support test modifiers: `.skip()`, `.only()`, `.todo()`
- Support lifecycle hooks: `beforeAll()`, `beforeEach()`, `afterEach()`, `afterAll()`
- Support Mocha-style aliases: `before()` and `after()`

### Assertion Styles

Support three assertion styles to maximize compatibility:

1. **Node.js/Classic Style**: `assert.ok()`, `assert.equal()`, `assert.deepEqual()`, etc.
2. **Bun/Jest Style**: `expect().toBe()`, `expect().toEqual()`, `expect().not.toBe()`, etc.
3. **Deno Style**: `assertEquals()`, `assertMatch()`, `assertArrayIncludes()`, etc.

### Runtime Detection

- Automatically detect the current JavaScript runtime (Bun, Deno, or Node.js)
- Delegate to the appropriate native testing framework:
  - Bun → `bun:test`
  - Deno → `Deno.test`
  - Node.js → `node:test`
- Provide `getRuntime()` function to query the current runtime

### Configuration

- Support `setDefaultTimeout(timeout)` for configuring test timeouts
- Maintain compatibility with runtime-specific configuration files:
  - Node.js: package.json scripts
  - Bun: bunfig.toml
  - Deno: deno.json/deno.jsonc

### Code Quality

- **Zero dependencies**: Built only on native testing frameworks
- **Type safety**: Written with modern JavaScript/ESM modules
- **No unused variables**: Strict enforcement of `no-unused-vars` ESLint rule without exceptions
- All declared variables, function parameters, and caught errors must be used
- No ignore patterns (like `^_` prefixes) allowed

### Coverage Support

- Support native coverage reporting for all three runtimes
- Provide npm scripts for running coverage: `npm run coverage`, `npm run coverage:node`, `npm run coverage:bun`, `npm run coverage:deno`
- Support coverage threshold enforcement via dedicated scripts:
  - Node.js: `scripts/check-node-coverage.mjs` (default 80%)
  - Bun: `scripts/check-bun-coverage.mjs` (default 75%)
  - Deno: `scripts/check-deno-coverage.mjs` (default 80%)
- Generate LCOV reports for CI/CD integration

### Platform Requirements

- **Node.js**: 20.0.0 or higher (for native test runner support)
- **Deno**: 1.x or higher (native Deno.test support)
- **Bun**: Any recent version (native bun:test support)

### Documentation

- Maintain comprehensive README.md with usage examples
- Document all API methods and assertion styles
- Provide working examples for each runtime in the `examples/` directory
- Document coverage configuration and threshold enforcement

## Testing Requirements

### Test Location

All tests must be placed in the `./tests` folder at the repository root.

### Self-Testing

The test-anywhere package uses itself as the testing framework (dogfooding). Tests are written using the test-anywhere API:

```javascript
import { test, describe, assert } from '../src/index.js';

describe('feature', () => {
  test('should work correctly', () => {
    assert.ok(true);
  });
});
```

### CI Testing

Tests run automatically in CI on:

- Every commit to pull requests
- Every commit to the main branch (before release)

The CI runs tests across all supported runtimes:

- **Node.js** on Ubuntu, macOS, Windows
- **Bun** on Ubuntu, macOS, Windows
- **Deno** on Ubuntu, macOS, Windows

### CLI Test Coverage

The CLI must have tests covering:

- `--version` / `-v` option
- `--help` / `-h` option
- `--verbose` option
- Double-dash (`--`) separator syntax
- Command keyword separator syntax
- Error handling for mixing both separators
- Runtime detection and priority

## References

- [Issue #144: CLI Options Splitting](https://github.com/link-foundation/test-anywhere/issues/144)
- [POSIX Utility Conventions](https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/V1_chap12.html)
- [npm run-script documentation](https://docs.npmjs.com/cli/v10/commands/npm-run-script/)
- [js-ai-driven-development-pipeline-template](https://github.com/link-foundation/js-ai-driven-development-pipeline-template)
