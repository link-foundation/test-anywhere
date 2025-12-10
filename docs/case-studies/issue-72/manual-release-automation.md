# Case Study: Manual Release Automation Issue

## Issue Reference

- **Issue**: [#72 - We need to update manual release generation, so it will directly generate commit instead of pull request](https://github.com/link-foundation/test-anywhere/issues/72)
- **Date**: December 2, 2025
- **Status**: In Progress

## Executive Summary

This case study documents the investigation into why manual releases in the test-anywhere repository were not triggering properly, the root causes identified, and the proposed solutions.

## Timeline of Events

### Initial Problem Discovery

The user (@konard) discovered that manual releases were not working as expected. The goal was to have a fully automated release process triggered by a single button click.

### Attempted Solutions and Their Outcomes

#### Attempt 1: Auto-approve and Auto-merge PR Approach

**Workflow**: Created PR automatically, then tried to auto-approve and auto-merge it.

**Run ID**: `19867659425` (December 2, 2025 at 17:28 UTC)

**Outcome**: FAILED

**Error Message**:

```
##[error]Unprocessable Entity: "Can not approve your own pull request".
This typically happens when you try to approve the pull request with the
same user account that created the pull request.
```

**Root Cause**: GitHub does not allow the same account (github-actions[bot]) to both create AND approve a pull request. This is a security measure to prevent self-approval of changes.

#### Attempt 2: Remove Auto-approve, Keep Only Auto-merge

**Run IDs**:

- `19868371955` (December 2, 2025 at 17:53 UTC) - SUCCESS (workflow succeeded)
- `19868433785` (December 2, 2025 at 17:55 UTC) - SUCCESS (workflow succeeded)

**Outcome**: Workflow completed, but releases still not happening.

**Why**: The PRs were created and auto-merge was enabled, but:

1. PRs require passing CI checks before merge
2. After merge, the CI/CD pipeline runs the Release job
3. However, the Release job failed due to a race condition (see below)

#### Attempt 3: CI/CD Release Job After PR Merge

**Run ID**: `19868340610` (December 2, 2025 at 17:51 UTC)

**Outcome**: FAILED

**Error Message**:

```
! [rejected]        main -> main (non-fast-forward)
error: failed to push some refs to 'https://github.com/link-foundation/test-anywhere'
hint: Updates were rejected because the tip of your current branch is behind
```

**Root Cause**: Race condition - while the CI/CD workflow was running (which includes tests), another PR was merged to main, causing the local branch to be behind the remote. When the Release job tried to push the version bump commit, it failed because main had moved forward.

## Root Cause Analysis

### Problem 1: Self-Approval Limitation

GitHub's security model prevents accounts from approving their own PRs. Using `GITHUB_TOKEN` means the workflow creates and tries to approve with the same identity.

### Problem 2: Race Conditions in Release Process

The current workflow:

1. PR is created and auto-merged
2. CI/CD runs on main after merge
3. Release job runs AFTER all tests complete
4. If main moves forward during test execution, the release push fails

### Problem 3: Complexity and Multiple Steps

The multi-step approach (create PR → wait for CI → merge → wait for CI again → release) introduces multiple failure points and delays.

## Proposed Solutions

### Solution 1: Direct Release in Manual Workflow (Recommended)

Instead of creating a PR, the manual release workflow should:

1. Create the changeset
2. Run `changeset version` to bump version and update CHANGELOG
3. Commit directly to main
4. Publish to npm
5. Create GitHub release

**Pros**:

- Single workflow execution
- No race conditions
- No PR approval issues
- Fastest path to release

**Cons**:

- Bypasses PR-based code review (acceptable for version bumps only)
- Tests run in same workflow (can be added)

### Solution 2: Use Repository Dispatch to Trigger Release

Create a dedicated release workflow that:

1. Is triggered by `repository_dispatch` event
2. Handles the version bump, commit, publish, and release
3. Includes retry logic for push conflicts

**Pros**:

- Decouples release logic from PR workflow
- Can be triggered from multiple sources

**Cons**:

- Additional complexity
- Still needs to handle race conditions

### Solution 3: Use Personal Access Token (PAT) for Auto-Approval

Use a different token (PAT from a bot account) to approve PRs created by GITHUB_TOKEN.

**Pros**:

- Keeps PR-based workflow
- Allows auto-approval

**Cons**:

- Requires managing additional secrets
- Additional security considerations
- Still has race condition issues

## Recommended Implementation

Based on the analysis, **Solution 1 (Direct Release in Manual Workflow)** is recommended because:

1. It eliminates the self-approval problem entirely
2. It eliminates race conditions (single atomic operation)
3. It provides the fastest release path
4. It matches the user's original request: "directly generate commit instead of pull request"

### Implementation Details

The manual release workflow will:

```yaml
name: Manual Release

on:
  workflow_dispatch:
    inputs:
      bump_type:
        description: 'Release type'
        required: true
        type: choice
        options:
          - patch
          - minor
          - major
      description:
        description: 'Release description (optional)'
        required: false
        type: string

jobs:
  release:
    name: Create Release
    runs-on: ubuntu-latest
    permissions:
      contents: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: npm install

      - name: Create changeset and version
        run: |
          # Create changeset file
          node scripts/create-manual-changeset.mjs "${{ github.event.inputs.bump_type }}" "${{ github.event.inputs.description || 'Manual release' }}"

          # Run changeset version
          npm run changeset:version

      - name: Commit and push
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"

          NEW_VERSION=$(node -p "require('./package.json').version")

          git add -A
          git commit -m "$NEW_VERSION" -m "" -m "Manual ${{ github.event.inputs.bump_type }} release"
          git push origin main

      - name: Publish to npm
        run: npm run changeset:publish
        # Uses OIDC trusted publishing - no token needed

      - name: Create GitHub Release
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          VERSION=$(node -p "require('./package.json').version")
          TAG="v$VERSION"

          RELEASE_NOTES=$(awk "/## $VERSION/{flag=1; next} /## [0-9]/{flag=0} flag" CHANGELOG.md)

          if [ -z "$RELEASE_NOTES" ]; then
            RELEASE_NOTES="Release $VERSION"
          fi

          gh release create "$TAG" --title "$VERSION" --notes "$RELEASE_NOTES"
```

## Logs Archive

The following logs have been preserved for reference:

- `ci-logs/manual-release-19867659425.log` - Failed auto-approve attempt
- `ci-logs/manual-release-19868371955.log` - Auto-merge attempt #1
- `ci-logs/manual-release-19868433785.log` - Auto-merge attempt #2
- `ci-logs/cicd-main-19868340610.log` - Failed release due to race condition

## Lessons Learned

1. **GitHub Token Limitations**: The built-in GITHUB_TOKEN cannot be used to approve PRs it created.

2. **Race Conditions in CI**: When multiple workflows can modify the same branch, race conditions must be anticipated and handled.

3. **Simplicity Over Complexity**: A direct commit approach is simpler and more reliable than a multi-step PR-based approach for automated version bumps.

4. **Version Bumps are Low-Risk**: For automated version bumps that only change version numbers and changelogs, bypassing PR review is acceptable and even preferable.

## Next Steps

1. Implement the direct release workflow
2. Test with a patch release
3. Document the new release process
4. Consider adding optional pre-release testing if required
