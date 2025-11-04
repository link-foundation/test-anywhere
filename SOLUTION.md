# Solution for Issue #40: Auto-merge didn't work

## Problem Summary

The auto-merge workflow for version bump PRs was not working despite all permissions being granted to GitHub Actions. The workflow would run successfully but PRs were not being automatically merged.

## Root Cause Analysis

### Investigation Timeline

1. **First Failure (PR #39, Run ID: 19024721285)**
   - Workflow run: https://github.com/link-foundation/test-anywhere/actions/runs/19024721285
   - Time: 2025-11-03 05:19:43 UTC
   - Issue: The workflow skipped PR #39 with message "Skipping: not from github-actions bot"
   - Root cause: The workflow only checked for `"github-actions"*` pattern but the actual bot author was `app/github-actions`
   - **Fixed in PR #41** (merged 2025-11-03 05:55:09Z)

2. **Second Failure (PR #46)**
   - Issue: Repository setting `allow_auto_merge` was set to `false`
   - Root cause: Even with correct bot detection, the repository didn't allow auto-merge feature to be used
   - **Fixed in PR #47** (merged 2025-11-04 02:24:17Z)

3. **Third Failure (PR #48 - Current)**
   - Workflow run: https://github.com/link-foundation/test-anywhere/actions/runs/19056677844
   - Time: 2025-11-04 03:19:39 UTC
   - Issue: Workflow logged "Auto-merge already enabled for PR #48" but auto-merge was NOT actually enabled
   - Root cause: **Bug in null value checking**

### The Real Problem (This PR's Fix)

The workflow had a bug in how it checked if auto-merge was already enabled:

```yaml
PR_AUTO_MERGE=$(gh api repos/${{ github.repository }}/pulls/$PR_NUMBER --jq '.auto_merge')
if [ "$PR_AUTO_MERGE" != "null" ]; then
  echo "  Auto-merge already enabled for PR #$PR_NUMBER"
  continue
fi
```

**The Bug:**

When `auto_merge` is `null` in the GitHub API response, `gh api --jq '.auto_merge'` returns an **empty string** `""`, not the literal string `"null"`.

The comparison `[ "" != "null" ]` evaluates to **TRUE**, causing the workflow to incorrectly think auto-merge is already enabled and skip enabling it.

**Proof:**
```bash
$ gh api repos/link-foundation/test-anywhere/pulls/48 --jq '.auto_merge'
# Returns: (empty string)

$ PR_AUTO_MERGE=$(gh api repos/link-foundation/test-anywhere/pulls/48 --jq '.auto_merge')
$ echo "Value: [$PR_AUTO_MERGE]"
Value: []

$ if [ "$PR_AUTO_MERGE" != "null" ]; then echo "SKIP"; else echo "ENABLE"; fi
SKIP  # ❌ BUG! Should enable auto-merge!
```

## Solution

### Fix Applied

Changed the null check in `.github/workflows/auto-merge-version-pr.yml` to properly handle empty strings:

```yaml
# Before (buggy)
if [ "$PR_AUTO_MERGE" != "null" ]; then

# After (fixed)
if [ -n "$PR_AUTO_MERGE" ] && [ "$PR_AUTO_MERGE" != "null" ]; then
```

This ensures:
- Empty strings (from null API values) → proceed to enable auto-merge ✅
- Actual auto-merge objects → skip (already enabled) ✅

### Verification

Created test scripts in `experiments/` directory to validate the fix:

```bash
$ ./experiments/verify-fix.sh

OLD LOGIC (BUGGY):
  ❌ Would skip enabling auto-merge (BUG!)

NEW LOGIC (FIXED):
  ✅ Would enable auto-merge (CORRECT!)
```

## How the Workflow Works (Post-Fix)

1. **Trigger**: Workflow runs on:
   - `pull_request` events (opened, synchronize, reopened, ready_for_review)
   - `workflow_run` events (when CI/CD completes)
   - `check_suite` events (when checks complete)

2. **Job 1: auto-merge**
   - Runs on `pull_request` events for `changeset-release/*` branches
   - Verifies PR is from `github-actions` bot
   - Verifies PR title is "chore: version packages"
   - Verifies PR is not in draft state
   - Waits for all CI checks to complete successfully
   - Enables auto-merge with squash strategy

3. **Job 2: auto-merge-on-checks**
   - Runs on `workflow_run` or `check_suite` events
   - Finds all open PRs from `changeset-release/*` branches
   - For each PR, verifies:
     - Author is `github-actions` bot (checks both `github-actions*` and `app/github-actions`)
     - Title is "chore: version packages"
     - Not in draft state
     - Auto-merge not already enabled
     - All CI checks have completed successfully
   - Enables auto-merge with squash strategy

## Testing

The fix can be tested by:

1. Creating a new changeset in the repository
2. Triggering the release workflow to create a version bump PR
3. Observing that the PR gets automatically merged once all checks pass

## Additional Context: Why No CI Checks Run

Version PRs created by the changesets bot have zero CI checks due to GitHub's security policy:

**GitHub Actions Security Feature:**
- PRs created using `GITHUB_TOKEN` do NOT trigger `pull_request` workflows
- This prevents recursive workflow runs
- It's by design and expected behavior

**Evidence:**
```bash
$ gh run list --repo link-foundation/test-anywhere --workflow "CI/CD" --branch changeset-release/main
[]  # No CI/CD runs ever for version PRs

$ gh api repos/link-foundation/test-anywhere/commits/1caba63d.../check-runs
{"check_runs":[],"total_count":0}
```

The auto-merge workflow correctly handles PRs with zero checks (line 205 in the workflow allows this).

## Files Modified

- `.github/workflows/auto-merge-version-pr.yml` - Fixed null check bug at line 180
- `experiments/test-auto-merge-check.sh` - Test script for debugging
- `experiments/test-jq-null.sh` - Demonstrates jq null behavior
- `experiments/verify-fix.sh` - Validates fix correctness

## Related PRs and Issues

- Issue #40: https://github.com/link-foundation/test-anywhere/issues/40
- PR #41: Fixed bot author detection (merged 2025-11-03 05:55:09Z)
- PR #47: Enabled repository auto-merge setting (merged 2025-11-04 02:24:17Z)
- PR #48: Version PR waiting for this fix to auto-merge
- PR #49: This PR - fixes the null check bug

## Conclusion

The auto-merge feature required **three separate fixes**:

1. ✅ Bot author recognition (PR #41)
2. ✅ Repository setting enabled (PR #47)
3. ✅ Null check bug fixed (PR #49 - this PR)

With all three fixes in place, version PRs will now auto-merge successfully.
