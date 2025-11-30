# Bun Test Discovery Investigation

## Issue
GitHub Issue #69: "It actually does not work with Bun"
Description: "We need to investigate why when we used https://github.com/deep-assistant/agent-cli `bun test` lost ability to detect tests."

## Investigation Summary

I have thoroughly investigated the claim that `bun test` cannot detect tests when using `test-anywhere`.

### Test Scenarios Performed

#### 1. Testing within test-anywhere repository ✅ PASSED
```bash
bun test tests/
```
**Result:** All 174 tests discovered and passed (12 skipped, 4 todo)

#### 2. Testing examples ✅ PASSED
```bash
bun test examples/
```
**Result:** All 15 tests discovered and passed across 3 files

#### 3. Using test-anywhere as a local file dependency ✅ PASSED
Created `/tmp/test-anywhere-consumer` with:
```json
{
  "dependencies": {
    "test-anywhere": "file:/tmp/gh-issue-solver-1764503993669"
  }
}
```
**Result:** Tests discovered and run successfully

#### 4. Using test-anywhere from npm (v0.7.0) ✅ PASSED
Created `/tmp/bun-npm-test` with:
```bash
bun add test-anywhere@0.7.0
```
**Result:** Tests discovered and run successfully

#### 5. Test discovery mechanism analysis ✅ PASSED
Created `experiments/bun-detailed-test.test.js` to compare:
- `test` from `test-anywhere`
- `test` from `bun:test` directly

**Findings:**
- Both functions are different objects (testAnywhere is "test", bunTest is "bound test")
- Both register tests successfully
- Both are discovered by Bun's test runner
- test-anywhere correctly delegates to native Bun test function

#### 6. Conversion from bun:test to test-anywhere ✅ PASSED
Created `experiments/conversion-test.test.js` simulating a project migrating from `bun:test` to `test-anywhere`.
**Result:** All tests discovered and run successfully

#### 7. Simple test files ✅ PASSED
Multiple simple test files created in `experiments/` directory.
**Result:** All discovered and run successfully

### Code Analysis

#### How test-anywhere works with Bun (src/index.js:169-173)
```javascript
export function test(name, fn) {
  if (runtime === 'deno') {
    // Deno-specific wrapping...
  } else {
    // For Node and Bun, just use the native test function
    return nativeTest(name, fn);
  }
}
```

For Bun, test-anywhere simply calls the native `test` function from `bun:test`, which means:
- No wrapping or transformation
- Direct delegation to Bun's native test runner
- Full compatibility with Bun's test discovery mechanism

#### Runtime Detection (src/index.js:10-18)
```javascript
const runtime = (() => {
  if (typeof Bun !== 'undefined') {
    return 'bun';
  }
  if (typeof Deno !== 'undefined') {
    return 'deno';
  }
  return 'node';
})();
```

The runtime is correctly detected as 'bun' when running under Bun.

### Investigation of deep-assistant/agent-cli

Cloned and analyzed the referenced repository:
- ✅ Has `test-anywhere@^0.7.0` in dependencies
- ❌ Does NOT use test-anywhere in any test files
- ✅ All test files use `import { test } from 'bun:test'` directly

**Conclusion:** The agent-cli repository lists test-anywhere as a dependency but doesn't actually use it. All tests use `bun:test` directly.

### Environment Details
- Bun version: 1.3.3 (274e01c7)
- test-anywhere version: 0.7.0
- Platform: Linux

## Findings

**I was unable to reproduce the issue.** In all test scenarios:
1. Tests using test-anywhere are discovered by `bun test`
2. Tests run successfully
3. All test features work (describe, beforeAll, afterAll, etc.)
4. Test modifiers work (skip, only, todo)

## Possible Explanations

1. **Issue was already fixed**: The current version (0.7.0) may have already addressed the problem
2. **Specific configuration needed**: The issue may only occur with specific bunfig.toml settings
3. **Different Bun version**: The issue may be specific to a different Bun version
4. **Misunderstanding**: The issue reporter may have encountered a different problem
5. **Specific import pattern**: There may be a specific import pattern that causes issues

## Request for Clarification

Posted comment on issue #69 requesting:
- Specific scenario where tests aren't detected
- Sample test file that doesn't work
- Error messages or warnings
- Output from `bun test` when it fails

## Next Steps

Waiting for issue reporter to provide:
1. Reproducible test case
2. Specific error messages
3. Environment details (Bun version, OS, configuration)

## Files Created During Investigation
- `experiments/bun-discovery-test.test.js`
- `experiments/bun-detailed-test.test.js`
- `experiments/conversion-test.test.js`
- `/tmp/test-anywhere-consumer/` (test project)
- `/tmp/bun-npm-test/` (test project with npm version)

All test files passed successfully.
