# Case Study: NPM Trusted Publishing Failure Analysis

## Issue Reference

- **Issue**: [#96 - Unable to publish package using trusted publishing](https://github.com/link-foundation/test-anywhere/issues/96)
- **Failed CI Run**: [#20080802494](https://github.com/link-foundation/test-anywhere/actions/runs/20080802494/job/57607164122)
- **Transition PR**: [#95 - Migrate to npm trusted publishing with OIDC](https://github.com/link-foundation/test-anywhere/pull/95)

## Timeline of Events

### Event Sequence

1. **2025-12-09T22:38:38Z**: CI/CD workflow triggered on main branch push (commit `851c922`)
2. **2025-12-09T22:39:12Z**: Release job started after successful lint and tests
3. **2025-12-09T22:39:19Z**: Version bump from 0.8.15 to 0.8.16 completed
4. **2025-12-09T22:39:22Z**: Version 0.8.16 committed and pushed to main
5. **2025-12-09T22:39:27Z**: `npm run changeset:publish` initiated
6. **2025-12-09T22:39:28Z**: Publishing attempt for test-anywhere@0.8.16
7. **2025-12-09T22:39:29Z**: **FAILURE** - E404 Not Found with "Access token expired or revoked"

### Error Details

```
🦋  info Publishing "test-anywhere" at "0.8.16"
🦋  error an error occurred while publishing test-anywhere: E404 Not Found - PUT https://registry.npmjs.org/test-anywhere - Not found
🦋  error npm notice Access token expired or revoked. Please try logging in again.
🦋  error npm error code E404
🦋  error npm error 404 Not Found - PUT https://registry.npmjs.org/test-anywhere - Not found
```

## Root Cause Analysis

### Primary Root Cause: Workflow Filename Mismatch in NPM Settings

The NPM Trusted Publisher configuration contains a **typo in the workflow filename**:

| Setting       | Configured Value                | Expected Value                  |
| ------------- | ------------------------------- | ------------------------------- |
| Repository    | `link-foundation/test-anywhere` | `link-foundation/test-anywhere` |
| Workflow File | **`mail.yml`**                  | **`main.yml`**                  |

**Evidence**: Screenshot from npmjs.com settings (see `./npm-settings-screenshot.png`) shows:

- Trusted Publisher: `link-foundation/test-anywhere`
- Workflow: `mail.yml` (should be `main.yml`)

### Secondary Issue: Reusable Workflow Architecture

Even after fixing the typo, there's a potential architectural issue with the current setup:

#### Current Architecture

```
main.yml (caller workflow)
    └── calls → common.yml (reusable workflow with actual publish logic)
```

#### NPM Trusted Publishing Requirement

According to [official documentation](https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available/) and [community research](https://www.paigeniedringhaus.com/blog/run-multiple-npm-publishing-scripts-with-trusted-publishing-oidc-via-git-hub-reusable-workflows/):

> "When setting up a Trusted Publisher on npmjs for GitHub Actions, it's crucial to specify the workflow file that triggers the release process, not necessarily the one that contains the release logic itself."

**Key Insight**: NPM validates the **entry point workflow** (the caller), not the downstream reusable workflows.

#### Analysis of Current Configuration

| Component   | File         | Has `id-token: write`? | Role                   |
| ----------- | ------------ | ---------------------- | ---------------------- |
| Entry Point | `main.yml`   | No (not specified)     | Triggers release job   |
| Reusable    | `common.yml` | Yes (line 51)          | Contains publish logic |

**Problem**: The `id-token: write` permission in `common.yml` is correctly set, but NPM validates based on `main.yml` which is the entry point.

## Evidence Summary

### 1. CI Logs Evidence

From `ci-logs/release-run-20080802494.log`:

- Line 10563-10564: "npm notice Publishing to https://registry.npmjs.org with tag latest and public access"
- Line 10564: "npm notice Access token expired or revoked"

The "Access token expired" message appears even though no NPM_TOKEN is being used, indicating the OIDC token exchange failed.

### 2. Workflow Configuration Evidence

**common.yml** (lines 48-51):

```yaml
permissions:
  contents: write
  pull-requests: write
  id-token: write # OIDC permission present
```

**main.yml** (lines 117-127):

```yaml
release:
  name: Release
  needs: [lint, test]
  if: always() && github.ref == 'refs/heads/main' && ...
  uses: ./.github/workflows/common.yml # Delegates to reusable workflow
  with:
    node-version: '20.x'
    skip-changeset-check: false
  # NOTE: No explicit permissions block here
```

### 3. NPM Settings Evidence

Screenshot shows Trusted Publisher configured with:

- Repository: `link-foundation/test-anywhere`
- Workflow: `mail.yml` (typo - should be `main.yml`)

## Proposed Solutions

### Solution 1: Fix Workflow Filename Typo (Quick Fix)

**Action Required**: Update NPM settings on npmjs.com

- Navigate to package settings > Trusted Publisher
- Edit the workflow filename from `mail.yml` to `main.yml`

**Estimated Impact**: May resolve the issue if NPM correctly propagates OIDC tokens through reusable workflows.

### Solution 2: Add Permissions to Entry Point Workflow (Recommended)

Explicitly add `id-token: write` permission to `main.yml`:

```yaml
release:
  name: Release
  needs: [lint, test]
  if: always() && github.ref == 'refs/heads/main' && ...
  permissions:
    id-token: write # Add this
    contents: read # Add this
  uses: ./.github/workflows/common.yml
  with:
    node-version: '20.x'
    skip-changeset-check: false
```

### Solution 3: Move Publishing to Entry Point (Alternative)

If reusable workflow permissions don't propagate correctly, consider:

- Moving the `npm publish` command directly into `main.yml`
- OR Creating a dedicated `release.yml` that is not a reusable workflow

### Solution 4: Verify npm CLI Version

Ensure the workflow uses npm CLI >= 11.5.1 which is required for OIDC trusted publishing.

Current setup uses `actions/setup-node@v4` with `node-version: '20.x'`, which should provide a compatible npm version.

## Implementation Recommendations

### Immediate Actions

1. **Fix typo in NPM settings**: Change `mail.yml` to `main.yml`
2. **Add permissions to main.yml**: Ensure `id-token: write` is present
3. **Re-run the release workflow** to test the fix

### Verification Steps

1. After fixing, trigger a release by:
   - Creating a new changeset
   - Merging to main
2. Monitor the Release job for successful OIDC token exchange
3. Verify package appears on npmjs.com with provenance attestation

## References

1. [npm Trusted Publishing Documentation](https://docs.npmjs.com/trusted-publishers/)
2. [GitHub Blog: npm trusted publishing with OIDC GA](https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available/)
3. [npm Adopts OIDC for Trusted Publishing](https://socket.dev/blog/npm-trusted-publishing)
4. [Reusable Workflows with Trusted Publishing](https://www.paigeniedringhaus.com/blog/run-multiple-npm-publishing-scripts-with-trusted-publishing-oidc-via-git-hub-reusable-workflows/)
5. [GitHub Discussion: NPM publish using OIDC](https://github.com/orgs/community/discussions/176761)
6. [Changesets Action OIDC Issue #515](https://github.com/changesets/action/issues/515)

## Artifacts

| File                                               | Description                                               |
| -------------------------------------------------- | --------------------------------------------------------- |
| `npm-settings-screenshot.png`                      | Screenshot of NPM trusted publisher settings showing typo |
| `../ci-logs/release-run-20080802494.log`           | Full CI log from failed run                               |
| `../ci-logs/release-run-20080802494-metadata.json` | CI run metadata                                           |

---

**Last Updated**: 2025-12-10
**Status**: Analysis Complete - Awaiting Implementation
