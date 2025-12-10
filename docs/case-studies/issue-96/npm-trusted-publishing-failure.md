# Case Study: npm Trusted Publishing Failure with Manual Instant Release

## Issue Reference

- **Issue:** [#96 - Unable to publish package using trusted publishing](https://github.com/link-foundation/test-anywhere/issues/96)
- **Date:** 2025-12-10
- **Status:** Investigation Complete

## Executive Summary

The npm trusted publishing feature works correctly for push-triggered releases via `main.yml` but fails for manual instant releases triggered via `manual-release.yml`. This is because **npm only allows one workflow file to be registered as a trusted publisher**, and the configuration is set to `main.yml`.

## Timeline of Events

### Phase 1: Initial Failures (2025-12-09 22:38)

- **CI Run:** [#20080802494](https://github.com/link-foundation/test-anywhere/actions/runs/20080802494)
- **Error:** `E404 Not Found - Access token expired or revoked`
- **Initial diagnosis:** NPM settings typo (`mail.yml` instead of `main.yml`)

### Phase 2: Typo Fixed, Still Failing (2025-12-09 23:17)

- **CI Run:** [#20081643394](https://github.com/link-foundation/test-anywhere/actions/runs/20081643394)
- **Error:** Same E404 error
- **Diagnosis:** Missing `id-token: write` permissions in caller workflows
- **Fix:** PR #97 added permissions to `main.yml` and `manual-release.yml`

### Phase 3: npm CLI Version Issue (2025-12-09 23:53)

- **CI Run:** [#20082354362](https://github.com/link-foundation/test-anywhere/actions/runs/20082354362)
- **Error:** `E422 - Error verifying sigstore provenance bundle`
- **Diagnosis:** npm 10.8.2 doesn't support OIDC trusted publishing (requires >= 11.5.1)
- **Fix:** PR #98 added npm update step

### Phase 4: Missing Repository Field (2025-12-10 00:08)

- **CI Run:** After PR #98
- **Error:** `repository.url is "", expected to match "https://github.com/link-foundation/test-anywhere"`
- **Fix:** PR #99 added `repository` field to `package.json`

### Phase 5: Successful Push-Triggered Release (2025-12-10 01:55)

- **CI Run:** [#20084661098](https://github.com/link-foundation/test-anywhere/actions/runs/20084661098)
- **Result:** Successfully published version 0.8.21 via push to `main` (through `main.yml`)

### Phase 6: Manual Instant Release Still Failing (2025-12-10 02:02)

- **CI Run:** [#20084769337](https://github.com/link-foundation/test-anywhere/actions/runs/20084769337)
- **Error:** `E404 - Access token expired or revoked`
- **Workflow:** `manual-release.yml` → `common.yml` (instant mode)

## Root Cause Analysis

### The Core Problem

npm trusted publishing validates the OIDC token against the **workflow file name** registered in npm settings:

```
Repository: link-foundation/test-anywhere
Workflow: main.yml
```

When a release is triggered via `manual-release.yml`, npm receives an OIDC token with:

- `workflow_ref: link-foundation/test-anywhere/.github/workflows/manual-release.yml@refs/heads/main`

This **does not match** the registered trusted publisher (`main.yml`), causing npm to reject the token with the misleading error "Access token expired or revoked."

### Evidence from CI Logs

**Failed Run (manual-release.yml - Run #20084769337):**

```
GITHUB_TOKEN Permissions
Contents: write
Metadata: read
PullRequests: write

npm notice Access token expired or revoked. Please try logging in again.
npm error code E404
```

**Successful Run (main.yml - Run #20084661098):**

```
GITHUB_TOKEN Permissions
Contents: write
Metadata: read
PullRequests: write

🦋  success packages published successfully:
🦋  test-anywhere@0.8.21
```

### npm Trusted Publishing Limitation

From [npm documentation](https://docs.npmjs.com/trusted-publishers/):

> "Each package can only have one trusted publisher configured at a time, though you can update this configuration as needed."

From [Paige Niedringhaus's research](https://www.paigeniedringhaus.com/blog/run-multiple-npm-publishing-scripts-with-trusted-publishing-oidc-via-git-hub-reusable-workflows/):

> "npm validates the entry point workflow, not the workflow that actually runs the npm publish command."

## Solution Options

### Option 1: Single Entry Point Workflow (Recommended)

Create a unified workflow file (`publish.yml` or modify `main.yml`) that handles all publishing scenarios:

```yaml
name: Publish
on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      release_mode:
        type: choice
        options: [instant, changeset-pr]
      bump_type:
        type: choice
        options: [patch, minor, major]

permissions:
  contents: write
  pull-requests: write
  id-token: write

jobs:
  release:
    # Conditional logic based on trigger type
    uses: ./.github/workflows/common.yml
    with:
      release_mode: ${{ github.event_name == 'workflow_dispatch' && inputs.release_mode || 'changeset' }}
```

Then update npm trusted publisher settings to use this single workflow.

### Option 2: Update npm Trusted Publisher for Each Release Mode

Before each manual release, manually update the npm trusted publisher setting to `manual-release.yml`, then change it back to `main.yml` after. This is impractical and error-prone.

### Option 3: Use a Single Workflow with Multiple Jobs

Consolidate all release logic into `main.yml` with conditional jobs:

- Job 1: Push-triggered release (existing)
- Job 2: Manual instant release (new)
- Job 3: Manual changeset PR (new)

## Implemented Solution

The fix consolidates all release functionality into `main.yml` so that npm's trusted publisher configuration works for all release modes.

### Changes Made

#### 1. Modified `.github/workflows/main.yml`

Added `workflow_dispatch` trigger with the same inputs as the deprecated `manual-release.yml`:

```yaml
workflow_dispatch:
  inputs:
    release_mode:
      type: choice
      options: [instant, changeset-pr]
    bump_type:
      type: choice
      options: [patch, minor, major]
    description:
      type: string
```

Added two new jobs:

- `instant-release`: For immediate version bump and publish (when `release_mode == 'instant'`)
- `changeset-pr`: For creating a changeset PR for review (when `release_mode == 'changeset-pr'`)

#### 2. Deprecated `.github/workflows/manual-release.yml`

The old workflow now:

- Shows a deprecation warning
- Automatically triggers the `main.yml` workflow with the same inputs
- Provides clear instructions to use the CI/CD workflow instead

### How to Use the New Workflow

1. Go to the **Actions** tab in GitHub
2. Select **"CI/CD"** workflow (not "Manual Release")
3. Click **"Run workflow"**
4. Choose your options:
   - `release_mode`: `instant` or `changeset-pr`
   - `bump_type`: `patch`, `minor`, or `major`
   - `description`: Optional release description
5. Click **"Run workflow"** button

### Why This Works

Since npm trusted publishing is configured for `main.yml`, all publishing now goes through that workflow file. The OIDC token will have:

- `workflow_ref: link-foundation/test-anywhere/.github/workflows/main.yml@refs/heads/main`

This **matches** the npm trusted publisher configuration, allowing authentication to succeed.

## Files Affected

- `.github/workflows/main.yml` - Added workflow_dispatch support with instant-release and changeset-pr jobs
- `.github/workflows/manual-release.yml` - Deprecated with redirect to main.yml
- `.github/workflows/common.yml` - No changes needed
- `docs/case-studies/issue-96/` - Case study documentation

## References

- [npm Trusted Publishing Documentation](https://docs.npmjs.com/trusted-publishers/)
- [GitHub Blog: npm trusted publishing GA](https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available/)
- [Reusable Workflows with Trusted Publishing](https://www.paigeniedringhaus.com/blog/run-multiple-npm-publishing-scripts-with-trusted-publishing-oidc-via-git-hub-reusable-workflows/)
- [npm CLI Issue #8730](https://github.com/npm/cli/issues/8730) - OIDC publish failing

## CI Logs Archive

Referenced CI runs (logs can be downloaded from GitHub Actions):

- [Run #20084769337](https://github.com/link-foundation/test-anywhere/actions/runs/20084769337) - Failed instant release via `manual-release.yml`
- [Run #20084661098](https://github.com/link-foundation/test-anywhere/actions/runs/20084661098) - Successful release via `main.yml`
- npm trusted publisher settings screenshot: See [Issue #96 comment](https://github.com/link-foundation/test-anywhere/issues/96#issuecomment-2530855844)
