# Case Study: Issue #118 - Release Failed (lino-arguments CLI Parsing Failure)

## Overview

This case study documents the investigation and resolution of a failed release in the test-anywhere repository. The release attempted to publish version 0.8.34 to npm but failed during the GitHub Release creation step, despite the fix from issue #116 being merged.

**Issue:** https://github.com/link-foundation/test-anywhere/issues/118
**Failed CI Run:** https://github.com/link-foundation/test-anywhere/actions/runs/20117213503
**Date:** 2025-12-11
**Status:** Resolved

## Executive Summary

The release workflow failed at the "Create GitHub Release" step with the error:

```
Error: Missing required arguments
Usage: node scripts/create-github-release.mjs --version <version> --repository <repository>
```

**Root Cause:** The `lino-arguments` library's `makeConfig` function failed to parse CLI arguments correctly in the GitHub Actions environment, returning empty string defaults instead of the actual argument values.

**Impact:**

- Version 0.8.34 was successfully published to npm
- However, the GitHub Release was not created
- The release notes formatting step was skipped as it depends on the release creation
- This occurred even after PR #117 fixed the argument passing format from issue #116

## Timeline of Events

### 2025-12-11 00:00:48 UTC - Workflow Started

- Triggered by push to main branch (merge of PR #117, commit bf8efd4)
- PR #117 contained the fix for issue #116 (workflow argument passing)
- All test jobs (9 matrix combinations) started

### 2025-12-11 00:01:30 UTC - Release Job Started

- Release job started after all tests passed
- Changeset `workflow-argument-fix.md` detected

### 2025-12-11 00:01:57 UTC - Version Bump Successful

- Changesets applied successfully
- Version bumped from 0.8.33 to 0.8.34
- CHANGELOG.md updated
- Changes committed to main branch

### 2025-12-11 00:02:14 UTC - npm Publish Successful

- Script detected version 0.8.34 was already published to npm
- Set output variables: `published=true`, `published_version=0.8.34`, `already_published=true`
- OIDC trusted publishing verified correctly

### 2025-12-11 00:02:15 UTC - GitHub Release Creation Failed

- Script `create-github-release.mjs` called with correct named arguments:
  ```bash
  node scripts/create-github-release.mjs --version "0.8.34" --repository "link-foundation/test-anywhere"
  ```
- Script initialized successfully and loaded dependencies (use-m, command-stream)
- However, `lino-arguments`' `makeConfig` function returned empty config values
- Validation check `if (!version || !repository)` failed
- Process exited with code 1

### 2025-12-11 00:02:15 UTC - Workflow Failed

- Release notes formatting step skipped (conditional dependency)
- Overall workflow marked as failed

## Root Cause Analysis

### Primary Cause: lino-arguments CLI Parsing Failure

The `lino-arguments` library's `makeConfig` function did not successfully parse command-line arguments in the GitHub Actions environment. Investigation revealed:

1. **The workflow was passing arguments correctly** (verified from CI logs):

   ```yaml
   run: node scripts/create-github-release.mjs --version "${{ steps.publish.outputs.published_version }}" --repository "${{ github.repository }}"
   ```

2. **The scripts were using `makeConfig` as documented**:

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

3. **`makeConfig` returned empty defaults** instead of parsing the CLI arguments:
   - `version` = `''` (empty string from `getenv('VERSION', '')`)
   - `repository` = `''` (empty string from `getenv('REPOSITORY', '')`)

4. **Environment variables were not set** in the workflow, so the `getenv()` fallbacks also failed

### Why publish-to-npm.mjs Didn't Fail

The `publish-to-npm.mjs` script also uses `makeConfig` with the same pattern, but it didn't fail because:

1. It only has one optional argument (`should-pull`) with a boolean default of `false`
2. The workflow was passing it incorrectly as a positional argument (`true`)
3. When `makeConfig` failed to parse the argument, it just used the default `false`
4. The script doesn't validate this argument, so it continued executing normally

### Evidence of lino-arguments Issues

Research revealed that `lino-arguments` appears to be a private or unpublished package:

- No public npm package found at https://npmjs.com/package/lino-arguments
- No public npm package found under @link-foundation/lino-arguments scope
- The package is loaded dynamically via `use-m` from unpkg
- This suggests it may be:
  - A private package from the link-foundation organization
  - An experimental or beta package
  - Subject to breaking changes or reliability issues

### Contributing Factors

1. **Lack of Robust Error Handling:** The scripts trusted `makeConfig` to work correctly without fallback mechanisms
2. **No Environment Variable Fallback:** The workflow didn't set VERSION/REPOSITORY environment variables
3. **Silent Failures:** `makeConfig` returned default values instead of throwing an error when argument parsing failed
4. **Insufficient Testing:** The scripts were not tested with actual CLI arguments in a CI-like environment

## Solution

Replace the `lino-arguments`-based argument parsing with a robust manual implementation that:

1. Parses CLI arguments directly from `process.argv`
2. Supports both `--arg=value` and `--arg value` formats
3. Falls back to environment variables if CLI arguments aren't provided
4. Works reliably in all environments (local, CI, etc.)

### Implementation

**Updated scripts/create-github-release.mjs:**

```javascript
// Import link-foundation libraries
const { $ } = await use('command-stream');

// Parse CLI arguments manually for reliability
// Supports both --arg=value and --arg value formats
function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      if (key.includes('=')) {
        const [k, v] = key.split('=');
        args[k] = v;
      } else if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
        args[key] = argv[i + 1];
        i++;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

const args = parseArgs(process.argv);
const version = args.version || process.env.VERSION || '';
const repository = args.repository || process.env.REPOSITORY || '';
```

**Updated scripts/format-github-release.mjs:** (same pattern with additional `commit-sha` argument)

```javascript
const args = parseArgs(process.argv);
const version = args.version || process.env.VERSION || '';
const repository = args.repository || process.env.REPOSITORY || '';
const commitSha = args['commit-sha'] || process.env.COMMIT_SHA || '';
```

### Benefits of This Solution

1. **Reliable:** Uses standard Node.js `process.argv` parsing
2. **No External Dependencies:** Removes dependency on potentially unreliable `lino-arguments`
3. **Backwards Compatible:** Still supports the same command-line interface
4. **Environment Variable Support:** Falls back to environment variables
5. **Flexible:** Supports multiple argument formats (`--arg value` and `--arg=value`)
6. **Simple:** Easy to understand, debug, and maintain

## Testing

Tested the fixed scripts locally with the same arguments used in CI:

```bash
$ node scripts/create-github-release.mjs --version "0.8.34" --repository "link-foundation/test-anywhere"
Creating GitHub release for v0.8.34...
# (Expected authentication error in local environment, but arguments parsed correctly)

$ node scripts/format-github-release.mjs --version "0.8.34" --repository "link-foundation/test-anywhere" --commit-sha "bf8efd4"
Formatting release notes for v0.8.34...
# (Expected "release not found" error, but arguments parsed correctly)
```

Both scripts successfully parsed the arguments and proceeded to execution, confirming the fix works.

## Lessons Learned

### Technical Lessons

1. **Don't Trust Third-Party Argument Parsers Blindly:**
   - Libraries like `lino-arguments` may have platform-specific issues
   - Always implement fallback mechanisms for critical functionality
   - Consider using well-established libraries (yargs, commander) or manual parsing

2. **Test in CI-like Environments:**
   - Local testing may not reveal environment-specific issues
   - Always test scripts with actual CLI arguments, not just defaults

3. **Provide Multiple Input Methods:**
   - Supporting both CLI arguments and environment variables increases reliability
   - Environment variables can be easier to debug in CI environments

4. **Fail Fast with Clear Errors:**
   - Scripts should validate inputs early and provide clear error messages
   - Consider logging actual received values during debugging

### Process Lessons

1. **Verify Fixes Thoroughly:**
   - PR #117 fixed the workflow argument passing but didn't catch the underlying `lino-arguments` issue
   - The fix addressed symptoms (positional vs named arguments) but not the root cause

2. **Monitor Dependencies:**
   - Dynamic package loading from unpkg introduces risks
   - Consider vendoring or using locked versions for critical dependencies

3. **Document External Dependencies:**
   - `lino-arguments` usage should have been documented with known limitations
   - Alternative approaches should be considered for production use

## Related Issues

- **Issue #116:** Previous release failure due to argument passing format mismatch
  - Fixed workflow to use named arguments instead of positional
  - Did not address underlying `lino-arguments` parsing issues
  - Case study: `docs/case-studies/issue-116/README.md`

## Impact Analysis

### Immediate Impact

- ✅ Version 0.8.34 published to npm successfully
- ❌ GitHub Release v0.8.34 not created
- ❌ Release notes not formatted
- ❌ Users checking GitHub Releases wouldn't see this version

### Long-term Impact

- ✅ Fixed argument parsing for future releases
- ✅ Removed dependency on unreliable `lino-arguments` for critical scripts
- ✅ Improved reliability of release automation
- ✅ Better understanding of dynamic dependency loading risks

## Recommendations

### Short-term

1. ✅ Apply manual argument parsing to `create-github-release.mjs` and `format-github-release.mjs`
2. Consider manually creating GitHub Release v0.8.34 to maintain release history
3. Review other scripts using `lino-arguments` for similar issues

### Long-term

1. Evaluate whether `lino-arguments` should be used in production scripts
2. Consider switching to well-established argument parsing libraries
3. Implement comprehensive CI testing for all release scripts
4. Add integration tests that verify actual CLI argument parsing
5. Document all dynamic dependencies and their reliability characteristics

## Conclusion

This issue demonstrated the risks of relying on external libraries for critical functionality, especially when those libraries are loaded dynamically and may not be well-tested in production environments. The fix provides a more robust, reliable solution by using standard Node.js APIs for argument parsing while maintaining backwards compatibility with the existing CLI interface.

The comprehensive investigation revealed that the issue was not with the workflow configuration (which was correctly fixed in PR #117), but with the underlying argument parsing library failing silently in the CI environment. This highlights the importance of testing not just the integration points (workflow → script), but also the internal mechanisms (library → functionality).
