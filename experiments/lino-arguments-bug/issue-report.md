# Bug Report: `--version` Flag Conflicts with Custom Options

## Summary

The `makeConfig` function fails to parse custom `--version` options because yargs' built-in `--version` flag overrides user-defined options. This causes CLI arguments to return `false` instead of the provided value.

## Environment

- **lino-arguments version**: latest (from unpkg)
- **Node.js version**: v20.19.6
- **Platform**: Linux, macOS, GitHub Actions (CI)

## Bug Description

When using `makeConfig` with a custom `--version` option, the argument value is not parsed correctly. Instead of returning the provided string value, it returns `false` (the result of yargs' built-in `--version` flag).

## Minimal Reproduction

```javascript
#!/usr/bin/env node

// Load use-m dynamically
const { use } = eval(
  await (await fetch('https://unpkg.com/use-m/use.js')).text()
);

// Import lino-arguments
const { makeConfig } = await use('lino-arguments');

console.log('process.argv:', process.argv);

// Parse CLI arguments using lino-arguments
const config = makeConfig({
  yargs: ({ yargs, getenv }) =>
    yargs.option('version', {
      type: 'string',
      default: getenv('VERSION', ''),
      describe: 'Version number (e.g., 1.0.0)',
    }),
});

console.log('config.version:', JSON.stringify(config.version));

if (config.version === false) {
  console.error('❌ BUG: --version returned false instead of the value');
  process.exit(1);
} else {
  console.log('✅ --version parsed correctly:', config.version);
}
```

### Run the reproduction:

```bash
node minimal-repro.mjs --version "1.0.0"
```

### Expected Output:

```
process.argv: [ '/usr/bin/node', '/path/to/minimal-repro.mjs', '--version', '1.0.0' ]
config.version: "1.0.0"
✅ --version parsed correctly: 1.0.0
```

### Actual Output:

```
process.argv: [ '/usr/bin/node', '/path/to/minimal-repro.mjs', '--version', '1.0.0' ]
config.version: false
❌ BUG: --version returned false instead of the value
```

## Root Cause

In `src/index.js`, the `makeConfig` function creates two yargs instances:

1. **Initial parse** (lines 337-345): Disables built-in help/version with `.help(false)` and `.version(false)`
2. **Final parse** (lines 360-373): Does NOT disable built-in help/version

The second yargs instance (which produces the final result) has yargs' built-in `--version` flag enabled, which conflicts with custom `--version` options.

**Relevant code (src/index.js:360-373):**

```javascript
// Step 5: Configure yargs with user options + getenv helper
const yargsInstance = yargs(hideBin(argv)).option('configuration', {
  type: 'string',
  describe: 'Path to configuration .lenv file',
  alias: 'c',
});
// ⬆️ Missing .version(false) here (it was present in initial parse at line 344)

// Pass getenv helper if enabled
const getenvHelper = getenvEnabled ? getenv : () => '';
const configuredYargs = yargsConfigFn
  ? yargsConfigFn({ yargs: yargsInstance, getenv: getenvHelper })
  : yargsInstance;

// Step 6: Parse final configuration (CLI args have highest priority)
const parsed = configuredYargs.parseSync();
```

## Impact

This bug affects any script using `lino-arguments` with a custom `--version` option:

- ❌ Release scripts fail in CI (like GitHub Actions)
- ❌ CLI tools can't accept version arguments
- ❌ Scripts silently get wrong values (`false` instead of user input)

### Real-world example:

In the [test-anywhere](https://github.com/link-foundation/test-anywhere) repository, release scripts failed with:

```
Error: Missing required arguments
Usage: node scripts/create-github-release.mjs --version <version> --repository <repository>
```

Even though the workflow passed `--version "0.8.34"` correctly, `makeConfig` returned `version: false`.

## Proposed Fix

**Simple fix:** Add `.version(false)` to the final yargs instance to match the initial parse:

```diff
  // Step 5: Configure yargs with user options + getenv helper
  const yargsInstance = yargs(hideBin(argv))
+   .version(false)  // Disable built-in version to allow custom --version option
    .option('configuration', {
      type: 'string',
      describe: 'Path to configuration .lenv file',
      alias: 'c',
    });
```

### Why this fix works:

1. ✅ **Consistency**: Both initial and final parse behave the same way
2. ✅ **User control**: Users can define their own `--version` and `--help` options if needed
3. ✅ **Backwards compatible**: Doesn't break existing code
4. ✅ **Simple**: No complex detection logic required

### Alternative fix:

For completeness, you could also add `.help(false)` to prevent the same issue with `--help`:

```diff
  // Step 5: Configure yargs with user options + getenv helper
  const yargsInstance = yargs(hideBin(argv))
+   .help(false)     // Disable built-in help to allow custom --help option
+   .version(false)  // Disable built-in version to allow custom --version option
    .option('configuration', {
      type: 'string',
      describe: 'Path to configuration .lenv file',
      alias: 'c',
    });
```

## Workaround

Until this is fixed, avoid using `--version` and `--help` as option names. Use alternatives like:

- `--ver` instead of `--version`
- `--release-version` instead of `--version`
- `--show-help` instead of `--help`

## Test Case

After applying the fix, this test should pass:

```javascript
import { makeConfig } from 'lino-arguments';
import assert from 'assert';

// Test custom --version option
const config = makeConfig({
  argv: ['node', 'test.mjs', '--version', '1.0.0'],
  yargs: ({ yargs, getenv }) =>
    yargs.option('version', {
      type: 'string',
      default: getenv('VERSION', ''),
    }),
});

assert.strictEqual(config.version, '1.0.0', '--version should parse as "1.0.0"');
console.log('✅ Test passed: --version parsed correctly');
```

## Related Files

- Minimal reproduction: See attached `minimal-repro.mjs`
- Proposed fix: See attached `proposed-fix.md`
- Test demonstrating conflict: See attached `test-version-conflict.mjs`
