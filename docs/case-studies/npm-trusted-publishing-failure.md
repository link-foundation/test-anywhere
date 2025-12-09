# Case Study: NPM Trusted Publishing Failure Analysis

## Issue Reference

- **Issue**: [#96 - Unable to publish package using trusted publishing](https://github.com/link-foundation/test-anywhere/issues/96)
- **Failed CI Runs**:
  - [#20080802494](https://github.com/link-foundation/test-anywhere/actions/runs/20080802494/job/57607164122) (v0.8.16 - initial failure)
  - [#20081643394](https://github.com/link-foundation/test-anywhere/actions/runs/20081643394) (v0.8.17 - after PR #97 fix, still failing)
- **Transition PR**: [#95 - Migrate to npm trusted publishing with OIDC](https://github.com/link-foundation/test-anywhere/pull/95)
- **Initial Fix PR**: [#97 - Fix npm trusted publishing configuration](https://github.com/link-foundation/test-anywhere/pull/97)

## Executive Summary

The npm trusted publishing feature failed due to **THREE compounding issues**:

1. ~~**Typo in NPM settings** - `mail.yml` instead of `main.yml` (FIXED by user)~~
2. ~~**Missing OIDC permissions** in caller workflow (FIXED by PR #97)~~
3. **npm CLI version too old** - Using 10.8.2, requires >= 11.5.1 (ROOT CAUSE - NOT FIXED)

## Timeline of Events

### Initial Failure (2025-12-09T22:38)

1. **2025-12-09T22:38:38Z**: CI/CD workflow triggered on main branch push (commit `851c922`)
2. **2025-12-09T22:39:12Z**: Release job started after successful lint and tests
3. **2025-12-09T22:39:19Z**: Version bump from 0.8.15 to 0.8.16 completed
4. **2025-12-09T22:39:22Z**: Version 0.8.16 committed and pushed to main
5. **2025-12-09T22:39:27Z**: `npm run changeset:publish` initiated with **npm 10.8.2**
6. **2025-12-09T22:39:28Z**: Publishing attempt for test-anywhere@0.8.16
7. **2025-12-09T22:39:29Z**: **FAILURE** - E404 Not Found with "Access token expired or revoked"

### After PR #97 Fix (2025-12-09T23:17)

1. **2025-12-09T23:09:32Z**: PR #97 merged with id-token permissions added
2. **2025-12-09T23:17:54Z**: New CI/CD workflow triggered (commit `f47089c`)
3. **2025-12-09T23:19:56Z**: Publishing attempt for test-anywhere@0.8.17
4. **2025-12-09T23:19:59Z**: **FAILURE** - Same E404 error with "Access token expired or revoked"

## Root Cause Analysis

### PRIMARY Root Cause: npm CLI Version Too Old

**npm trusted publishing requires npm >= 11.5.1**

| Current Version | Required Version | Gap                    |
| --------------- | ---------------- | ---------------------- |
| 10.8.2          | >= 11.5.1        | Major version mismatch |

**Evidence from CI logs** (`ci-logs/release-run-20081643394.log`):

```
Release / Release	UNKNOWN STEP	2025-12-09T23:19:47.3081614Z npm: 10.8.2
```

Node.js 20.x ships with npm 10.x. To use OIDC trusted publishing, you need either:

- Node.js 24 (which includes npm 11.6.0), OR
- Manually update npm to >= 11.5.1 in the workflow

**Sources**:

- [npm Trusted Publishing Documentation](https://docs.npmjs.com/trusted-publishers/)
- [npm CLI Issue #8730](https://github.com/npm/cli/issues/8730) - OIDC publish failing
- [Changesets Action Issue #515](https://github.com/changesets/action/issues/515)

### Secondary Issue: Workflow Filename Mismatch (FIXED)

The NPM Trusted Publisher configuration contained a typo:

| Setting       | Original Value | Corrected Value |
| ------------- | -------------- | --------------- |
| Workflow File | `mail.yml`     | `main.yml`      |

**Evidence**: Screenshots in `./npm-settings-screenshot-original.png` and `./npm-settings-screenshot-fixed.png`

This was fixed by the user before the second CI run attempt.

### Tertiary Issue: Missing OIDC Permissions (FIXED by PR #97)

PR #97 added `id-token: write` permissions to caller workflows:

**Before (main.yml)**:

```yaml
release:
  name: Release
  uses: ./.github/workflows/common.yml
  # No permissions block
```

**After (main.yml)**:

```yaml
release:
  name: Release
  permissions:
    contents: write
    pull-requests: write
    id-token: write # Added
  uses: ./.github/workflows/common.yml
```

However, **CI logs show the permission still wasn't being applied**:

```
##[group]GITHUB_TOKEN Permissions
Contents: write
Metadata: read
PullRequests: write
##[endgroup]
```

Note: `id-token: write` is NOT in the list. This could be a GitHub Actions limitation with permissions passing to reusable workflows, but **the primary blocker remains the npm version**.

## Error Details

Both failed runs show identical error patterns:

```
🦋  info Publishing "test-anywhere" at "0.8.17"
🦋  error an error occurred while publishing test-anywhere: E404 Not Found - PUT https://registry.npmjs.org/test-anywhere - Not found
🦋  error 'test-anywhere@0.8.17' is not in this registry.
🦋  error npm notice Publishing to https://registry.npmjs.org with tag latest and public access
🦋  error npm notice Access token expired or revoked. Please try logging in again.
🦋  error npm error code E404
🦋  error npm error 404 Not Found - PUT https://registry.npmjs.org/test-anywhere - Not found
```

The "Access token expired or revoked" message appears because:

1. npm 10.x doesn't support OIDC trusted publishing
2. Without a valid NPM_TOKEN, npm falls back to no authentication
3. npm interprets the lack of authentication as an "expired token"

## Solution

### Required Fix: Update npm CLI to >= 11.5.1

Add a step to update npm before publishing in `common.yml`:

```yaml
- name: Update npm for OIDC trusted publishing
  run: |
    # npm trusted publishing requires npm >= 11.5.1
    # Node.js 20.x ships with npm 10.x, so we need to update
    echo "Current npm version: $(npm --version)"
    npm install -g npm@latest
    echo "Updated npm version: $(npm --version)"
```

### Alternative: Use Node.js 24

Change the node-version input default from `'20.x'` to `'24.x'`:

```yaml
inputs:
  node-version:
    description: 'Node.js version to use'
    required: false
    type: string
    default: '24.x' # Node.js 24 includes npm 11.6.0
```

## Implementation Status

| Issue                                         | Status       | Fix                   |
| --------------------------------------------- | ------------ | --------------------- |
| NPM settings typo (`mail.yml` → `main.yml`)   | ✅ Fixed     | Manual update by user |
| Missing `id-token: write` in caller workflows | ✅ Fixed     | PR #97 merged         |
| npm CLI version too old (10.8.2 < 11.5.1)     | ❌ Not Fixed | **This PR**           |

## Verification Steps

After applying the npm version fix:

1. Trigger a release by merging to main
2. Verify in CI logs that npm version is >= 11.5.1:
   ```
   Current npm version: 10.8.2
   Updated npm version: 11.x.x
   ```
3. Verify successful OIDC token exchange (no "Access token expired" errors)
4. Verify package appears on npmjs.com with provenance attestation

## References

1. [npm Trusted Publishing Documentation](https://docs.npmjs.com/trusted-publishers/)
2. [GitHub Blog: npm trusted publishing with OIDC GA](https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available/)
3. [npm Adopts OIDC for Trusted Publishing](https://socket.dev/blog/npm-trusted-publishing)
4. [Reusable Workflows with Trusted Publishing](https://www.paigeniedringhaus.com/blog/run-multiple-npm-publishing-scripts-with-trusted-publishing-oidc-via-git-hub-reusable-workflows/)
5. [GitHub Discussion: NPM publish using OIDC](https://github.com/orgs/community/discussions/176761)
6. [Changesets Action OIDC Issue #515](https://github.com/changesets/action/issues/515)
7. [npm CLI Issue #8730](https://github.com/npm/cli/issues/8730) - OIDC publish failing
8. [npm CLI Issue #8816](https://github.com/npm/cli/issues/8816) - Access token expired notices

## Artifacts

| File                                               | Description                                       |
| -------------------------------------------------- | ------------------------------------------------- |
| `npm-settings-screenshot-original.png`             | Screenshot showing original typo (`mail.yml`)     |
| `npm-settings-screenshot-fixed.png`                | Screenshot showing corrected setting (`main.yml`) |
| `../ci-logs/release-run-20080802494.log`           | Full CI log from initial failed run (v0.8.16)     |
| `../ci-logs/release-run-20081643394.log`           | Full CI log from second failed run (v0.8.17)      |
| `../ci-logs/release-run-20080802494-metadata.json` | CI run metadata                                   |

---

**Last Updated**: 2025-12-10
**Status**: Root Cause Identified - Fix Implemented (awaiting CI verification)
