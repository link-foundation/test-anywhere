# Case Study: Issue #133 - No Actual NPM Publish Happens

## Issue Summary

**Issue:** [#133 - No actual NPM publish happens](https://github.com/link-foundation/test-anywhere/issues/133)

**Reported:** Package versions 0.8.43 and 0.8.44 were not published to NPM despite CI workflows showing completion.

**Example Runs:**

- https://github.com/link-foundation/test-anywhere/actions/runs/20147903696/job/57833241414 (0.8.44)
- https://github.com/link-foundation/test-anywhere/actions/runs/20147631655/job/57832362395 (0.8.43)

**Error Message:** Instead of publishing, the workflow displayed:

```
Version 0.8.43 is already published to npm
```

## Timeline of Events

### 1. Version 0.8.43 Release Attempt (Run 20147631655)

**Time:** 2025-12-11T21:15:54Z

1. **21:15:41** - Version packages and commit step runs successfully
   - New version: 0.8.43
   - Commit created: "0.8.43"
   - Pushed to main branch

2. **21:15:54** - Publish to npm step begins
   - Current version to publish: 0.8.43
   - Checking if version 0.8.43 is already published...
   - Runs: `npm view "test-anywhere@0.8.43" version`

3. **21:15:54.806Z** - npm returns E404 error

   ```
   npm error code E404
   npm error 404 No match found for version 0.8.43
   npm error 404  The requested resource 'test-anywhere@0.8.43' could not be found
   ```

   - Exit code: 1
   - Process exits with code 1

4. **21:15:54.820Z** - Script outputs incorrect message

   ```
   Version 0.8.43 is already published to npm
   ```

   - Sets `published=true`
   - Sets `already_published=true`
   - **Script returns early without publishing!**

5. **21:15:54** - Create GitHub Release step runs
   - Release is created on GitHub
   - But package was NEVER published to NPM

### 2. Version 0.8.44 Release Attempt (Run 20147903696)

**Time:** 2025-12-11T21:25:48Z

- Same exact pattern as 0.8.43
- `npm view "test-anywhere@0.8.44" version` returns E404
- Script incorrectly reports "Version 0.8.44 is already published to npm"
- No actual NPM publish occurs

### 3. Actual NPM State

**Verification:** `npm view test-anywhere versions --json`

Latest versions on NPM:

```json
["0.8.30", "0.8.31", "0.8.32"]
```

**Confirmed:** Versions 0.8.43 and 0.8.44 were NEVER published to NPM.

## Root Cause Analysis

### The Bug

Located in `scripts/publish-to-npm.mjs` lines 71-89:

```javascript
// Check if this version is already published on npm
console.log(`Checking if version ${currentVersion} is already published...`);
try {
  await $`npm view "test-anywhere@${currentVersion}" version`.run({
    capture: true,
  });
  console.log(`Version ${currentVersion} is already published to npm`);
  setOutput('published', 'true');
  setOutput('published_version', currentVersion);
  setOutput('already_published', 'true');
  return;
} catch {
  // Version not found on npm, proceed with publish
  console.log(
    `Version ${currentVersion} not found on npm, proceeding with publish...`
  );
}
```

### The Issue

The script assumes that `command-stream`'s `.run({ capture: true })` will **throw an error** when a command exits with a non-zero exit code. However, this is incorrect behavior for the `command-stream` library.

### command-stream Behavior

Testing reveals that `command-stream` does NOT throw errors on non-zero exit codes:

```javascript
// Test 1: npm view for non-existent version
const result = await $`npm view "test-anywhere@999.999.999" version`.run({
  capture: true,
});
// ✗ UNEXPECTED: No error thrown
// Result: { code: 1, stdout: '', stderr: '...npm error code E404...' }

// Test 2: Simple command that fails (exit code 1)
const result = await $`bash -c "exit 1"`.run({ capture: true });
// ✗ UNEXPECTED: No error thrown
// Result: { code: 1, stdout: '', stderr: '' }
```

**Key Finding:** `.run({ capture: true })` returns a result object with a `code` property, but does NOT throw an error even when `code !== 0`.

### What Actually Happened

1. Script runs `npm view "test-anywhere@0.8.43" version`
2. NPM returns E404 (version not found) with exit code 1
3. `command-stream` returns `{ code: 1, stderr: '...E404...' }` **without throwing**
4. The try block **succeeds** (no error thrown)
5. Script executes lines 79-83, incorrectly reporting "already published"
6. Script returns early, never reaching the actual publish code (lines 92-108)

### Why the Logic is Inverted

The script's logic is backwards:

- **Try block (lines 76-83):** Should run when version EXISTS (success case)
- **Catch block (lines 84-89):** Should run when version NOT FOUND (error case)

But since `command-stream` never throws, the try block ALWAYS executes, regardless of whether the version exists or not.

## Evidence

### CI Logs Analysis

From `ci-logs/run-20147631655.log`:

```
Line 17156: Checking if version 0.8.43 is already published...
Line 17382: Version 0.8.43 is already published to npm
```

Between these lines:

- `npm view` command runs (PID 2921)
- Returns E404 error: "No match found for version 0.8.43"
- Exit code: 1
- No actual publish attempt occurs

### NPM Registry Verification

```bash
$ npm view test-anywhere@0.8.43 version
npm error code E404
npm error 404 No match found for version 0.8.43
```

Confirms the version was never published.

### Experiment Results

Created `experiments/test-command-stream.mjs` to verify library behavior:

Results:

- Test 1: `npm view` with non-existent version → No error thrown, returns `{ code: 1 }`
- Test 2: `bash -c "exit 1"` → No error thrown, returns `{ code: 1 }`
- Test 3: `echo "success"` → No error thrown, returns `{ code: 0 }`

**Conclusion:** `command-stream` with `.run({ capture: true })` never throws errors based on exit codes.

## Related Issues and Context

### Similar Past Issues

- **Issue #129:** command-stream library adds shell escaping
- **Issue #118:** Script initialized successfully and loaded dependencies
- **Issue #124:** command-stream's quote wrapping behavior

The repository has a history of subtle issues with the `command-stream` library's behavior, particularly around how it handles command execution results and output formatting.

### Library Context

`command-stream` is a link-foundation library loaded dynamically via `use-m`:

- Modern shell command execution with streaming support
- Replaces `execSync` in the scripts
- Integrated in commit 3dd3f71

## Proposed Solutions

### Solution 1: Check Exit Code (Recommended)

Instead of relying on try/catch, check the `code` property of the result:

```javascript
// Check if this version is already published on npm
console.log(`Checking if version ${currentVersion} is already published...`);
const result = await $`npm view "test-anywhere@${currentVersion}" version`.run({
  capture: true,
});

if (result.code === 0) {
  // Command succeeded - version exists on npm
  console.log(`Version ${currentVersion} is already published to npm`);
  setOutput('published', 'true');
  setOutput('published_version', currentVersion);
  setOutput('already_published', 'true');
  return;
} else {
  // Command failed (E404) - version not found on npm
  console.log(
    `Version ${currentVersion} not found on npm, proceeding with publish...`
  );
}
```

**Pros:**

- Correct handling of command-stream's actual behavior
- Clear and explicit exit code checking
- Minimal code changes

**Cons:**

- None

### Solution 2: Use Different Method (Alternative)

Use `.run()` without capture, which might have different error handling:

```javascript
try {
  await $`npm view "test-anywhere@${currentVersion}" version`.run();
  // Version exists
  return;
} catch {
  // Version not found, proceed
}
```

**Pros:**

- Might align better with try/catch pattern

**Cons:**

- Needs verification of `.run()` behavior vs `.run({ capture: true })`
- Less explicit than checking exit code

### Solution 3: Parse stderr for E404 (Not Recommended)

Check stderr content for E404 error:

```javascript
const result = await $`npm view "test-anywhere@${currentVersion}" version`.run({
  capture: true,
});

if (result.stderr.includes('E404')) {
  // Version not found, proceed
} else {
  // Version exists
  return;
}
```

**Pros:**

- Works with current command-stream behavior

**Cons:**

- Fragile - relies on npm error message format
- Doesn't handle other error cases properly
- Less maintainable

## Recommended Fix

Implement **Solution 1** - checking the exit code directly. This is the most reliable and maintainable approach that correctly handles `command-stream`'s behavior.

## Testing Strategy

### 1. Unit Test (Experiment)

Create `experiments/test-npm-publish-check.mjs`:

- Test with non-existent version (should proceed to publish)
- Test with existing version (should return early)
- Verify correct exit code handling

### 2. Integration Test

- Trigger manual instant release with a patch version
- Verify version is actually published to NPM
- Check GitHub release is created
- Confirm CI logs show correct flow

### 3. Verification

After fix:

```bash
# Check latest version on NPM
npm view test-anywhere version

# Verify it matches latest git tag
git describe --tags --abbrev=0
```

## Lessons Learned

### Key Takeaways

1. **Library Behavior Assumptions:** Never assume error handling behavior without testing
   - Different libraries handle command execution results differently
   - `command-stream` returns result objects instead of throwing errors

2. **Exit Code Handling:** Always explicitly check exit codes when using command execution libraries
   - Don't rely solely on try/catch for error detection
   - Check both `code` property and error content

3. **Testing Third-Party Libraries:** When integrating new libraries, test their error handling behavior
   - Create experiments to verify assumptions
   - Document library-specific behaviors

4. **CI/CD Validation:** Add verification steps to ensure publish actually succeeded
   - Check NPM registry after publish
   - Verify version exists with `npm view`
   - Add retry logic for transient failures

### Prevention Measures

1. **Add Verification Step:** After publish, verify version exists on NPM

   ```javascript
   // After successful publish
   const verify =
     await $`npm view "test-anywhere@${currentVersion}" version`.run({
       capture: true,
     });
   if (verify.code !== 0) {
     console.error('Publish succeeded but version not found on NPM!');
     process.exit(1);
   }
   ```

2. **Improve Logging:** Add more detailed logging for debugging
   - Log exit codes explicitly
   - Log full stderr/stdout for failed commands
   - Add timestamps to all log messages

3. **Documentation:** Document command-stream behavior quirks
   - Add comments about exit code handling
   - Reference this case study in code

## Impact Assessment

### Affected Versions

- 0.8.43: Not published
- 0.8.44: Not published

### User Impact

- Users expecting these versions cannot install them from NPM
- Latest NPM version remains 0.8.32
- Git tags and GitHub releases exist for these versions but NPM packages don't

### Remediation

After fix is merged:

1. Manually trigger releases for missing versions (if needed)
2. Or allow natural release process to create next version
3. Verify fix works with next release

## References

### Related Files

- `scripts/publish-to-npm.mjs` - Main script with the bug (lines 71-89)
- `.github/workflows/release.yml` - Workflow that calls publish script
- `experiments/test-command-stream.mjs` - Test demonstrating library behavior

### Related Documentation

- [command-stream usage in other scripts](../../CHANGELOG.md)
- [Issue #129 - command-stream shell escaping](../issue-129/README.md)
- [Issue #124 - command-stream quote wrapping](../issue-124/case-study.md)

### CI Run Logs

- Stored in `ci-logs/run-20147631655.log` (2.3M)
- Stored in `ci-logs/run-20147903696.log` (1.4M)
- Extracted sections in `ci-logs/*-publish-section.log`

## Conclusion

The root cause is a misunderstanding of how `command-stream`'s `.run({ capture: true })` method handles command failures. The script incorrectly assumes it will throw an error when a command exits with a non-zero code, but the library actually returns a result object with a `code` property.

The fix is simple: check `result.code === 0` to determine if the version exists on NPM, rather than relying on try/catch error handling.

This issue highlights the importance of:

1. Testing library behavior assumptions
2. Explicit exit code checking
3. Comprehensive error handling
4. Post-publish verification

**Status:** Solution identified and ready for implementation.
