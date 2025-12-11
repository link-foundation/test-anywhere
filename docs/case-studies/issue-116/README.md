# Case Study: Issue #116 - Release Failed

## Overview

This case study documents the investigation and resolution of a failed release in the test-anywhere repository. The release attempted to publish version 0.8.33 to npm but failed during the GitHub Release creation step.

**Issue:** https://github.com/link-foundation/test-anywhere/issues/116
**Failed CI Run:** https://github.com/link-foundation/test-anywhere/actions/runs/20116905860
**Date:** 2025-12-10
**Status:** Resolved

## Executive Summary

The release workflow failed at the "Create GitHub Release" step with the error:

```
Error: Missing required arguments
Usage: node scripts/create-github-release.mjs --version <version> --repository <repository>
```

**Root Cause:** Argument passing mismatch between the GitHub Actions workflow and the release scripts after PR #115 changed scripts from positional arguments to named arguments.

**Impact:**

- Version 0.8.33 was successfully published to npm
- However, the GitHub Release was not created
- The release notes formatting step was skipped as it depends on the release creation

## Timeline of Events

### 2025-12-10 23:43:26 UTC - Workflow Started

- Triggered by push to main branch (commit b14f693)
- All test jobs (9 matrix combinations) started

### 2025-12-10 23:44:08 UTC - Release Job Started

- Release job started after all tests passed
- Changeset `integrate-libraries.md` detected

### 2025-12-10 23:44:23 UTC - Version Bump Successful

- Changesets applied successfully
- Version bumped from 0.8.32 to 0.8.33
- CHANGELOG.md updated
- Changes committed to main branch

### 2025-12-10 23:44:36 UTC - npm Publish Successful

- Package successfully published to npm registry as version 0.8.33
- OIDC trusted publishing worked correctly

### 2025-12-10 23:44:37 UTC - GitHub Release Creation Failed

- Script `create-github-release.mjs` called with positional arguments
- Script expected named arguments (`--version` and `--repository`)
- Process exited with code 1

### 2025-12-10 23:44:37 UTC - Workflow Failed

- Release notes formatting step skipped (conditional dependency)
- Overall workflow marked as failed

## Root Cause Analysis

### Primary Cause: Argument Passing Mismatch

PR #115 (commit 4198a9a) integrated link-foundation libraries into the scripts folder, changing the argument parsing from manual `process.argv` handling to the `lino-arguments` library. This change introduced named arguments (using `yargs`), but the GitHub Actions workflow was not updated to match.

**Before PR #115:**
Scripts accepted positional arguments directly from `process.argv`.

**After PR #115:**
Scripts were updated to use `lino-arguments` with named parameters:

```javascript
const config = makeConfig({
  yargs: ({ yargs, getenv }) =>
    yargs
      .option('version', {
        type: 'string',
        default: getenv('VERSION', ''),
        describe: 'Version number (e.g., 1.0.0)',
      })
      .option('repository', {
        type: 'string',
        default: getenv('REPOSITORY', ''),
        describe: 'GitHub repository (e.g., owner/repo)',
      }),
});
```

**Workflow (unchanged):**

```yaml
run: node scripts/create-github-release.mjs "${{ steps.publish.outputs.published_version }}" "${{ github.repository }}"
```

### Contributing Factors

1. **Incomplete Update in PR #115:**
   - The PR updated 10 scripts but did not update the GitHub Actions workflow
   - The PR description mentioned "CI checks pass" as incomplete in the test plan
   - The actual CI run for PR #115 did not execute the release workflow (as it only runs on main branch)

2. **Lack of Integration Testing:**
   - The release workflow only runs on the main branch
   - No way to test the full release flow in PRs
   - The scripts were tested locally but not in the CI environment

3. **Similar Pattern in Multiple Locations:**
   - Two workflow steps affected:
     - Line 194: `create-github-release.mjs` in the automatic release job
     - Line 245: `create-github-release.mjs` in the instant release job
     - Lines 200 and 251: `format-github-release.mjs` in both jobs

## Impact Analysis

### Successful Operations

- ✅ All tests passed (9 matrix combinations)
- ✅ Lint and format checks passed
- ✅ Version bump completed (0.8.32 → 0.8.33)
- ✅ CHANGELOG.md updated
- ✅ Changes committed to main
- ✅ Package published to npm

### Failed Operations

- ❌ GitHub Release creation failed
- ❌ Release notes formatting skipped (conditional dependency)

### System State After Failure

**npm Registry:**

- Package test-anywhere@0.8.33 successfully published
- Available for installation

**GitHub Repository:**

- Version commit (b14f693) present on main
- No Git tag created for v0.8.33
- No GitHub Release for v0.8.33
- CHANGELOG.md contains entry for 0.8.33

**Implications:**

- Users can `npm install test-anywhere@0.8.33`
- No release notes visible on GitHub
- No downloadable artifacts on GitHub Releases page
- Inconsistent state between npm and GitHub

## Solution

### Fix Required

Update the GitHub Actions workflow to pass named arguments instead of positional arguments:

**File:** `.github/workflows/release.yml`

**Lines 194 and 245 - Before:**

```yaml
run: node scripts/create-github-release.mjs "${{ steps.publish.outputs.published_version }}" "${{ github.repository }}"
```

**Lines 194 and 245 - After:**

```yaml
run: node scripts/create-github-release.mjs --version "${{ steps.publish.outputs.published_version }}" --repository "${{ github.repository }}"
```

**Lines 200 and 251 - Before:**

```yaml
run: node scripts/format-github-release.mjs "${{ steps.publish.outputs.published_version }}" "${{ github.repository }}" "${{ github.sha }}"
```

**Lines 200 and 251 - After:**

```yaml
run: node scripts/format-github-release.mjs --version "${{ steps.publish.outputs.published_version }}" --repository "${{ github.repository }}" --commit-sha "${{ github.sha }}"
```

### Verification Steps

1. Update workflow file with named arguments
2. Commit and push changes
3. Trigger a new release (create a new changeset)
4. Verify all release steps complete successfully
5. Verify GitHub Release is created with proper formatting

## Lessons Learned

### What Went Well

- Comprehensive error messages in scripts made debugging straightforward
- Modular script design allowed isolation of the issue
- Version control allowed easy tracing of the change

### What Could Be Improved

1. **Workflow Testing:**
   - Consider adding a way to test release workflows in PR branches
   - Perhaps a dry-run mode that simulates the release process

2. **PR Review Process:**
   - When changing script interfaces, ensure all calling code is updated
   - Use GitHub code search to find all invocations of changed scripts

3. **Documentation:**
   - Document script interfaces in a central location
   - Add comments in workflow files explaining argument requirements

4. **CI/CD Best Practices:**
   - Consider using environment variables for script parameters
   - This would provide a consistent interface regardless of argument parsing library

5. **Atomicity:**
   - The partial success (npm published, GitHub release failed) created an inconsistent state
   - Consider implementing rollback mechanisms or idempotent operations

## Related Files

- `ci-logs/failed-run-20116905860.log` - Complete CI logs from the failed run
- `.github/workflows/release.yml` - GitHub Actions workflow (needs fixing)
- `scripts/create-github-release.mjs` - Script expecting named arguments
- `scripts/format-github-release.mjs` - Script expecting named arguments
- `.changeset/integrate-libraries.md` - Changeset that triggered the release

## References

- Issue #114: https://github.com/link-foundation/test-anywhere/issues/114
- PR #115: https://github.com/link-foundation/test-anywhere/pull/115
- Failed CI Run: https://github.com/link-foundation/test-anywhere/actions/runs/20116905860
- Commit 4198a9a: feat: integrate link-foundation libraries into ./scripts folder
- Commit b14f693: Version bump to 0.8.33 (failed release)

## Appendix: Error Messages

### Primary Error

```
Release	Create GitHub Release	2025-12-10T23:44:37.2981997Z Error: Missing required arguments
Release	Create GitHub Release	2025-12-10T23:44:37.2983207Z Usage: node scripts/create-github-release.mjs --version <version> --repository <repository>
Release	Create GitHub Release	2025-12-10T23:44:37.3037548Z ##[error]Process completed with exit code 1.
```

### Secondary Observation

During the "Publish to npm" step, there was a false positive message:

```
npm error 404 No match found for version 0.8.33
npm error 404  The requested resource 'test-anywhere@0.8.33' could not be found
```

This error occurred because the script was checking if the version was already published (before publishing it). The script correctly interpreted this as "not yet published" and proceeded with publishing. The log message "Version 0.8.33 is already published to npm" appears after the successful publish, confirming the operation completed.

This is expected behavior, not an error in the publish process.
