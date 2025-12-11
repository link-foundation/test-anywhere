# Case Study: Issue #126 - Instant Release Not Working

## Executive Summary

**Issue:** Manual instant release workflow triggered via GitHub Actions workflow_dispatch was not creating NPM releases or GitHub releases. Additionally, after the initial fix, the main release workflow also broke.

**Root Cause:** Argument parsing mismatch between workflow invocation and script implementation. The workflow passed positional arguments while the script expected named options.

**Impact:** Manual instant releases completely non-functional, and main changeset-based releases also broken after initial fix attempt.

**Resolution:** Update workflow files to use named arguments consistently across all jobs (instant release and main release).

## Timeline of Events

### Initial State (2025-12-11 14:13:49Z)

- Manual workflow triggered via workflow_dispatch
- Run ID: 20136036523
- Event type: `workflow_dispatch` with `release_mode=instant`
- Inputs: `bump_type=patch`, `description="Test patch release (instant)"`

### Workflow Execution (2025-12-11 14:13:52Z - 14:14:08Z)

1. **14:13:52Z** - Job "Instant Release" started
2. **14:13:53Z** - Checkout completed successfully
3. **14:14:03Z** - Version packages step invoked with command:
   ```bash
   node scripts/version-and-commit.mjs instant "patch" "Test patch release (instant)"
   ```
4. **14:14:06Z** - Script detected current version: 0.8.38
5. **14:14:06Z** - Script output: "Running changeset version..." ⚠️ **WRONG PATH**
6. **14:14:07Z** - Changeset version returned: "🦋 warn No unreleased changesets found, exiting."
7. **14:14:08Z** - Script detected new version: 0.8.38 (unchanged)
8. **14:14:08Z** - Script output: "No changes to commit"
9. **14:14:08Z** - Job completed successfully (but did nothing)

### Observed Behavior

- Workflow reported success (exit code 0)
- No version bump occurred
- No files were modified
- No commit was created
- No NPM publish was attempted
- No GitHub release was created
- Subsequent steps (Publish to npm, Create GitHub Release) were skipped due to conditions

### Second Failure - Main Release Workflow (2025-12-11 15:03:01Z)

After the initial fix (PR #127, commit 84f8dc7) which only fixed the instant release job:

- Run ID: 20137548471
- Event type: `push` to main branch
- Commit: 36b92a3 (merge of PR #127)

**Workflow Execution:**

1. **15:02:11Z** - Job "Release" started (triggered by push to main)
2. **15:02:24Z** - All lint and test jobs passed successfully
3. **15:04:20Z** - Version packages step invoked with command:
   ```bash
   node scripts/version-and-commit.mjs changeset
   ```
4. **15:04:22Z** - **Script failed with error:** "Positional arguments detected!"
5. **15:04:22Z** - Script exited with code 1
6. **15:04:22Z** - Job failed

**Root Cause of Second Failure:**

The initial fix (commit 84f8dc7) only updated line 233 (instant release job) but **missed line 182** (main release job). The main release job still used positional arguments:

```yaml
# Line 182 (still broken after initial fix)
run: node scripts/version-and-commit.mjs changeset
```

However, the script was updated to **detect and reject** positional arguments (lines 57-80 in version-and-commit.mjs), causing it to now fail fast instead of silently defaulting to wrong behavior.

This is actually an improvement - the script now fails loudly instead of silently doing the wrong thing, but it revealed that the fix was incomplete.

## Root Cause Analysis

### The Bug

The `scripts/version-and-commit.mjs` script is invoked with **positional arguments**:

```bash
node scripts/version-and-commit.mjs instant "patch" "Test patch release (instant)"
```

However, the script uses `lino-arguments` (which wraps `yargs`) and is configured to parse **named options**:

```javascript
const config = makeConfig({
  yargs: ({ yargs, getenv }) =>
    yargs
      .option('mode', {
        type: 'string',
        default: getenv('MODE', 'changeset'),  // ⚠️ DEFAULTS TO 'changeset'
        choices: ['changeset', 'instant'],
      })
      .option('bump-type', { ... })
      .option('description', { ... }),
});
```

### What Went Wrong

1. **Positional arguments ignored**: The arguments `"instant"`, `"patch"`, and `"Test patch release (instant)"` were passed as positional arguments but yargs was not configured to handle positional arguments.

2. **Defaults used instead**: Because the named options weren't provided:
   - `mode` defaulted to `'changeset'`
   - `bumpType` defaulted to `''`
   - `description` defaulted to `''`

3. **Wrong code path executed**: The script evaluated `if (mode === 'instant')` as false, so it executed the changeset version path instead of the instant version bump path.

4. **Changeset version failed gracefully**: The changeset version command found no changeset files and exited with a warning, leaving the version unchanged.

5. **No error thrown**: Because changeset version exits with code 0 (success) even when no changesets are found, the script continued and detected "no changes to commit".

6. **Publish steps skipped**: The workflow conditions checked for `version_committed == 'true'` or `already_released == 'true'`, both of which were false, so no publishing occurred.

## Technical Details

### Expected vs Actual Script Invocation

**Expected (based on script implementation):**

```bash
node scripts/version-and-commit.mjs --mode instant --bump-type patch --description "Test patch release (instant)"
```

**Actual (from workflow):**

```bash
node scripts/version-and-commit.mjs instant "patch" "Test patch release (instant)"
```

### Why yargs Didn't Parse Positional Arguments

The yargs configuration in the script only defined `.option()` calls, which handle named options (flags). To parse positional arguments, yargs requires `.positional()` or `.command()` definitions, or the arguments need to be defined in a specific way.

Without explicit positional argument configuration, yargs treats all non-flag arguments as unknown and ignores them.

### Workflow File Analysis

From `.github/workflows/release.yml` line 233:

```yaml
- name: Version packages and commit to main
  id: version
  run: node scripts/version-and-commit.mjs instant "${{ github.event.inputs.bump_type }}" "${{ github.event.inputs.description }}"
```

The workflow comment at line 205-204 states:

```yaml
# Manual Instant Release - triggered via workflow_dispatch with instant mode
# This job is in release.yml because npm trusted publishing
# only allows one workflow file to be registered as a trusted publisher
```

The workflow was designed to work with positional arguments, but the script implementation didn't match.

## Evidence from CI Logs

### Key Log Excerpts

**Workflow invocation (line 1203):**

```
node scripts/version-and-commit.mjs instant "patch" "Test patch release (instant)"
```

**Script output (line 2647-2648):**

```
Current version: 0.8.38
Running changeset version...
```

**Changeset warning (line 3288):**

```
🦋  warn No unreleased changesets found, exiting.
```

**Final outcome (line 4284 and later):**

```
New version: 0.8.38
No changes to commit
```

## Impact Assessment

### Severity: High

- Complete failure of instant release functionality
- No workaround available except manual releases or creating fake changeset files
- Silent failure - workflow reports success but does nothing

### Affected Functionality

**After Initial Issue:**

- ✗ Instant release via workflow_dispatch
- ✓ Normal changeset-based releases (not affected)
- ✓ PR changeset validation (not affected)
- ✓ Automated releases from main (not affected)

**After Initial Fix Attempt (PR #127):**

- ✓ Instant release via workflow_dispatch (fixed)
- ✗ Normal changeset-based releases (broken by incomplete fix)
- ✓ PR changeset validation (not affected)
- ✗ Automated releases from main (broken by incomplete fix)

### User Impact

- Manual instant releases were intended for emergency patches or quick releases
- Lack of functionality forced users to go through the full changeset PR workflow
- Confusing UX - workflow succeeds but nothing happens

## Solution Design

### Fix Options

#### Option 1: Update Script to Parse Positional Arguments (Recommended)

Modify `scripts/version-and-commit.mjs` to accept positional arguments:

```javascript
const config = makeConfig({
  yargs: ({ yargs, getenv }) =>
    yargs
      .positional('mode', {
        type: 'string',
        default: getenv('MODE', 'changeset'),
        describe: 'Version mode: changeset or instant',
        choices: ['changeset', 'instant'],
      })
      .positional('bumpType', {
        type: 'string',
        default: getenv('BUMP_TYPE', ''),
        describe: 'Version bump type for instant mode: major, minor, or patch',
      })
      .positional('description', {
        type: 'string',
        default: getenv('DESCRIPTION', ''),
        describe: 'Description for instant version bump',
      }),
});
```

**Pros:**

- Matches existing workflow call pattern
- No changes needed to workflow file
- Maintains backward compatibility if anyone is calling with named options

**Cons:**

- Requires understanding of yargs positional argument handling
- lino-arguments may not expose positional argument configuration

#### Option 2: Update Workflow to Use Named Arguments

Modify `.github/workflows/release.yml` line 233:

```yaml
run: node scripts/version-and-commit.mjs --mode instant --bump-type "${{ github.event.inputs.bump_type }}" --description "${{ github.event.inputs.description }}"
```

**Pros:**

- Script already supports named arguments
- Clearer intent - readers can see what each argument represents
- More robust - order doesn't matter

**Cons:**

- Changes workflow file
- Must update documentation

#### Option 3: Manual Argument Parsing in Script

Parse `process.argv` directly before using lino-arguments:

```javascript
// Check if positional arguments were provided
const args = process.argv.slice(2);
if (args.length > 0 && !args[0].startsWith('--')) {
  // Convert positional to named
  process.argv = [
    process.argv[0],
    process.argv[1],
    '--mode',
    args[0],
    '--bump-type',
    args[1] || '',
    '--description',
    args[2] || '',
  ];
}
```

**Pros:**

- Supports both calling patterns
- No workflow changes needed
- Backward compatible

**Cons:**

- Manual parsing is error-prone
- Mixing approaches is not ideal

### Recommended Solution: Option 2

Update the workflow to use named arguments. This is the cleanest solution because:

1. The script already fully supports this pattern
2. It's more maintainable and self-documenting
3. It's explicit about what each argument represents
4. It's the pattern already documented in the script's usage comment

## Implementation Plan

### Initial Fix (PR #127 - Incomplete)

1. ✓ **Updated workflow file** (`.github/workflows/release.yml` line 233 only)
2. ✓ **Added debug logging** to script to help diagnose similar issues
3. ✓ **Added positional argument detection** to fail fast instead of silently
4. ✓ **Created case study documentation**

**Problem:** Only fixed the instant release job, missed the main release job at line 182.

### Complete Fix (This PR)

1. **Update workflow file** (`.github/workflows/release.yml` line 182) to use named arguments
2. **Verify both workflow jobs** use consistent calling pattern
3. **Test the fix** by checking if there are any other positional argument calls
4. **Update case study** to document the second failure and complete fix

## Lessons Learned

### What Went Well

- Workflow structure was well-designed with proper separation of concerns
- Error handling in changeset version prevented catastrophic failure
- CI logs were detailed enough to diagnose the issue

### What Could Be Improved

- **Argument validation**: Script should validate required arguments and fail fast if missing
- **Explicit error messages**: Script should detect when running in instant mode but arguments are missing
- **Documentation**: Script usage comment should match actual calling pattern in workflow
- **Integration testing**: Should test both script patterns (positional and named args)
- **Debug logging**: Add verbose mode to help diagnose argument parsing issues

### Preventative Measures

1. Add unit tests for script argument parsing
2. Add integration tests that invoke scripts exactly as workflows do
3. Add schema validation for workflow inputs
4. Implement pre-commit hooks to catch workflow/script mismatches
5. Add explicit error message when mode defaults to 'changeset' unexpectedly
6. **When fixing issues, search for all occurrences** of the same pattern to avoid incomplete fixes
7. **Use grep/search tools** to find all invocations of a script before declaring the fix complete
8. **Test all affected workflows** after making changes, not just the one that was reported broken

## References

### External Resources

- [Changesets Documentation](https://github.com/changesets/changesets)
- [@changesets/cli on npm](https://www.npmjs.com/package/@changesets/cli)
- [Frontend Handbook | Changesets](https://infinum.com/handbook/frontend/changesets)
- [Automate NPM releases on GitHub using changesets](https://dev.to/ignace/automate-npm-releases-on-github-using-changesets-25b8)
- [Complete Guide: Publishing NPM Packages with Changesets](https://dtech.vision/guides/npm-changesets-complete-guide/)

### Internal Files

- Workflow: `.github/workflows/release.yml`
- Script: `scripts/version-and-commit.mjs`
- Helper: `scripts/instant-version-bump.mjs`
- CI Logs:
  - `ci-logs/instant-release-20136036523.log` (initial failure)
  - `ci-logs/main-release-20137548471.log` (second failure after incomplete fix)

### Related Issues

- Issue #126: Instant release not working

### Pull Requests

- PR #127: Fix instant release argument parsing (incomplete - only fixed instant release job)
- PR #128: Complete fix for both instant and main release workflows

## Appendix

### Full CI Log

See: `ci-logs/manual-release-20136036523.log`

### Workflow Configuration

See: `.github/workflows/release.yml` lines 205-251

### Script Implementation

See: `scripts/version-and-commit.mjs` lines 1-189
