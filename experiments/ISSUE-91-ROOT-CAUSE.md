# Issue #91 Root Cause Analysis

## Problem

Manual instant release failed - CI run showed success, but no version bump or release occurred.

## CI Run Analysis

Run: https://github.com/link-foundation/test-anywhere/actions/runs/19978687588/job/57300731147

Key log lines (from ci-logs-run-19978687588.log):

- Line 1815: `🦋 warn No unreleased changesets found, exiting.`
- Line 1836: `New version: 0.8.11` (no change from current version)
- Line 1837: `No changes to commit`

## Current Workflow Flow (Instant Mode)

1. **prepare-changeset job** (manual-release.yml:29-70)
   - Creates a changeset file using `create-manual-changeset.mjs`
   - Commits and pushes changeset to main branch

2. **instant-release job** (manual-release.yml:72-82)
   - Calls common.yml workflow
   - Passes `skip-changeset-check: true`

3. **release job** (common.yml:66-112)
   - Runs `npm run changeset:version` (line 79)
   - This runs `scripts/changeset-version.mjs`
   - Which runs `npx changeset version` (changeset-version.mjs:16)
   - **PROBLEM**: Changesets were already consumed by prepare-changeset job
   - So `changeset version` finds no changesets and exits without bumping version

## Root Cause

**Race condition / workflow design flaw**:

- The `prepare-changeset` job creates a changeset and **immediately commits it to main**
- Then `instant-release` job runs, which checks out main
- But the changeset was already committed and pushed in step 1
- So when `changeset version` runs, it finds the changeset, processes it... BUT WAIT!

Actually, looking more carefully at the logs and the prepare-changeset job:

- It creates the changeset (line 44-54)
- It commits the changeset to main (line 56-69)
- Then instant-release runs and should find that changeset...

Let me re-examine the logs more carefully. The issue says "it just didn't work at all" and the logs show "No unreleased changesets found".

## Actual Root Cause

Looking at manual-release.yml lines 56-69:

```yaml
- name: Commit changeset
  run: |
    git config user.name "github-actions[bot]"
    git config user.email "github-actions[bot]@users.noreply.github.com"
    git add .changeset/*.md
    git commit -m "chore: add changeset for manual ${{ github.event.inputs.bump_type }} release"
    git push origin main
```

The prepare-changeset job:

1. Creates changeset in .changeset/ folder
2. Commits it to main
3. Pushes to main

Then instant-release job:

1. Checks out the repo (actions/checkout@v4)
2. By default, this checks out the latest main... which now HAS the changeset
3. Runs `changeset version` which should consume the changeset...

But the logs show "No unreleased changesets found". This means:

- Either the changeset wasn't pushed properly
- Or the checkout didn't fetch the latest main
- Or there's a timing issue

Looking at the prepare-changeset job logs (lines 556-708 in ci-logs), I need to see if it successfully pushed.

## Insight from Manual Release Mode Description

From the issue:

> In instant mode we should directly increment version update changelog and so on, **bypassing `.changeset` folder**, and go with release to npm and github releases.

**THIS IS THE KEY**: In instant mode, the workflow should NOT use changesets at all. It should:

1. Directly bump the version in package.json
2. Update CHANGELOG.md
3. Commit and push
4. Publish to npm
5. Create GitHub release

But currently, it's using the changeset workflow which is designed for the normal PR-based flow.

## The Fix

For instant mode, we need to:

1. Skip the changeset creation entirely
2. Directly modify package.json version
3. Directly update CHANGELOG.md
4. Commit, push, publish, release

OR

2. Modify the workflow to handle instant mode differently - perhaps by accepting new inputs that allow direct version bumping without changesets.
