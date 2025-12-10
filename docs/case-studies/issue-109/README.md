# Case Study: Issue #109 - Unable to Make Release

## Executive Summary

This case study analyzes the CI/CD workflow failure documented in [issue #109](https://github.com/link-foundation/test-anywhere/issues/109). The failure occurred in workflow run [#20114126884](https://github.com/link-foundation/test-anywhere/actions/runs/20114126884) triggered by the merge of PR #108.

**Primary Root Cause:** npm authentication failure during the "Publish to npm" step in Attempt 1, followed by a non-idempotent retry (Attempt 2) that failed due to a git push conflict.

**Secondary Issue:** The release workflow is not idempotent - re-running a failed release workflow can cause additional failures if partial work was committed.

## Timeline of Events

### Attempt 1 (21:40:41Z - 21:42:05Z UTC)

| Time (UTC) | Event                                        |
| ---------- | -------------------------------------------- |
| 21:40:38Z  | PR #108 merged to main (commit `4d28336`)    |
| 21:40:41Z  | Workflow run created and started             |
| 21:40:44Z  | Test jobs started                            |
| 21:41:37Z  | All test jobs completed successfully         |
| 21:41:39Z  | Release job started                          |
| 21:41:52Z  | Version bump commit `fcfa098` pushed to main |
| 21:42:01Z  | npm publish failed - authentication error    |
| 21:42:04Z  | Release job failed                           |
| 21:42:05Z  | Attempt 1 completed with failure             |

### Attempt 2 (22:10:40Z - 22:11:06Z UTC)

| Time (UTC) | Event                                               |
| ---------- | --------------------------------------------------- |
| 22:10:40Z  | Workflow re-run started (Attempt 2)                 |
| 22:10:46Z  | Release job started (test jobs used cached results) |
| 22:10:57Z  | Version bump script ran, created local commit       |
| 22:11:02Z  | Git push failed - non-fast-forward error            |
| 22:11:05Z  | Release job failed                                  |
| 22:11:06Z  | Attempt 2 completed with failure                    |

## Root Cause Analysis

### Primary Root Cause: npm Authentication Failure

The npm publish step in Attempt 1 failed with:

```
npm error 404 Not Found - PUT https://registry.npmjs.org/test-anywhere - Not found
npm notice Access token expired or revoked. Please try logging in again.
npm notice Security Notice: Classic tokens have been revoked. Granular tokens are now limited to 90 days and require 2FA by default.
```

This indicates an issue with npm's OIDC trusted publishing configuration. The workflow uses `id-token: write` permission for OIDC authentication, but the token exchange or configuration may have had an issue.

### Secondary Issue: Non-Idempotent Release Workflow

The release workflow performs these sequential steps:

1. Run `changeset version` to bump version and update CHANGELOG
2. Commit and push changes to main
3. Publish to npm
4. Create GitHub release

When Attempt 1 failed at step 3 (npm publish), steps 1-2 had already completed successfully. This left the repository in a partially-released state:

- Version `0.8.28` was committed and pushed to main
- npm package was NOT published
- GitHub release was NOT created

When Attempt 2 ran, it:

1. Checked out commit `4d28336` (the original trigger commit)
2. Ran changeset version again (creating version 0.8.28 again)
3. Tried to push, but failed because main was already at `fcfa098`

## Error Messages

### Attempt 1 - npm Publish Error

```
npm error code E404
npm error 404 Not Found - PUT https://registry.npmjs.org/test-anywhere - Not found
npm error 404 The requested resource 'test-anywhere@0.8.28' could not be found or you do not have permission to access it.
npm notice Access token expired or revoked. Please try logging in again.
```

### Attempt 2 - Git Push Error

```
! [rejected]        main -> main (non-fast-forward)
error: failed to push some refs to 'https://github.com/link-foundation/test-anywhere'
hint: Updates were rejected because the tip of your current branch is behind
hint: its remote counterpart. If you want to integrate the remote changes,
hint: use 'git pull' before pushing again.
```

## Evidence Files

The following log files are preserved in this directory:

- `ci-cd-20114126884-attempt1.log` - Full logs from Attempt 1
- `ci-cd-20114126884.log` - Full logs from Attempt 2

## Proposed Solutions

### Immediate Fix: Recover the Release

Since the version bump was committed but not published:

1. **Option A - Complete the release manually:**

   ```bash
   git checkout main
   git pull origin main
   npm publish --provenance --access public
   gh release create v0.8.28 --title "v0.8.28" --notes "See CHANGELOG.md"
   ```

2. **Option B - Retry with workflow dispatch:**
   Use the "instant" release mode with workflow_dispatch to force a new release.

### Long-term Fixes

#### 1. Make the Release Workflow Idempotent

Modify `scripts/version-and-commit.sh` to check if the version was already released:

```bash
# Before running changeset version
CURRENT_REMOTE_HEAD=$(git ls-remote origin main | cut -f1)
if [ "$CURRENT_REMOTE_HEAD" != "$(git rev-parse HEAD)" ]; then
  echo "Warning: Remote main has advanced. Fetching and rebasing..."
  git fetch origin main
  git rebase origin/main
fi
```

#### 2. Add Retry Logic for npm Publish

The npm publish step could benefit from retry logic:

```bash
MAX_RETRIES=3
for i in $(seq 1 $MAX_RETRIES); do
  if npm publish --provenance --access public; then
    echo "Published successfully"
    break
  else
    echo "Publish failed, attempt $i of $MAX_RETRIES"
    sleep 10
  fi
done
```

#### 3. Verify npm OIDC Configuration

Ensure the npm trusted publishing is properly configured:

1. Check the npm package's "Publishing access" settings
2. Verify the GitHub repository and workflow file are correctly configured
3. Consider adding diagnostic logging for OIDC token exchange

#### 4. Add Pre-flight Checks

Before the release job runs:

1. Verify npm authentication is working
2. Check that the version being released doesn't already exist on npm
3. Ensure main branch is at the expected commit

## Lessons Learned

1. **Partial state is dangerous:** The workflow left the repository in a partially-released state when npm publish failed.

2. **Re-runs need special handling:** GitHub Actions re-runs don't account for state changes from previous attempts.

3. **npm authentication can be fragile:** OIDC trusted publishing, while more secure, requires careful configuration and can fail silently.

4. **Concurrency doesn't prevent re-runs:** The concurrency group prevents parallel runs but doesn't prevent sequential re-runs from causing conflicts.

## Current State

As of this analysis:

- **Git repository:** version 0.8.28 (commit `fcfa098`)
- **npm registry:** version 0.8.27 (0.8.28 was NOT published)
- **GitHub releases:** No release for 0.8.28

This is a **partially-released state** that needs recovery.

## npm OIDC Known Issues

Based on research, this E404 error with npm OIDC trusted publishing is a known issue. Key findings from the npm CLI bug tracker:

1. **[OIDC publish failing from GitHub Actions](https://github.com/npm/cli/issues/8730)** - Users report E404 errors with "Most of the time that a user gets a 404, it's because of that confusing Trusted Publisher NPM form."

2. **[Publishing with OIDC fails to find earlier versions](https://github.com/npm/cli/issues/8678)** - Issues with scoped packages and OIDC authentication.

3. **npm CLI version requirement:** npm >= 11.5.1 is required (the workflow correctly uses 11.7.0)

4. **Workflow file configuration:** The trusted publisher settings must exactly match the workflow filename (`.github/workflows/release.yml`)

The error message "Access token expired or revoked" combined with "Classic tokens have been revoked" suggests the npm trusted publishing configuration may need to be verified or updated in the npm registry settings.

## References

- [Failed CI Run](https://github.com/link-foundation/test-anywhere/actions/runs/20114126884)
- [Issue #109](https://github.com/link-foundation/test-anywhere/issues/109)
- [PR #108 that triggered the workflow](https://github.com/link-foundation/test-anywhere/pull/108)
- [npm Trusted Publishing Documentation](https://docs.npmjs.com/trusted-publishers/)
- [GitHub Actions Concurrency](https://docs.github.com/en/actions/using-jobs/using-concurrency)
- [npm CLI Issue #8730 - OIDC publish failing](https://github.com/npm/cli/issues/8730)
- [npm CLI Issue #8678 - OIDC publishing issues](https://github.com/npm/cli/issues/8678)
- [GitHub Discussion #176761 - NPM publish using OIDC](https://github.com/orgs/community/discussions/176761)
- [npm OIDC Generally Available Announcement](https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available/)
