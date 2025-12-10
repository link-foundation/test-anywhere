# Issue #91 Solution Design

## Confirmed Root Cause

The instant release workflow has a checkout timing issue:

1. **prepare-changeset job** creates a changeset and pushes it to main (commit 83525ff)
2. **instant-release job** has `needs: [prepare-changeset]`, so it waits for step 1
3. But when `actions/checkout@v4` runs in instant-release, it checks out commit **149f01c** (the commit BEFORE the changeset was pushed)
4. When `changeset version` runs, it finds no changesets in `.changeset/` directory
5. Result: No version bump, no changes, workflow succeeds but does nothing

## Why This Happens

The reusable workflow (`common.yml`) is referenced with `@refs/heads/main`, which means:

- The workflow DEFINITION is from main at the time the workflow run started
- But the code checkout should get latest... except there's a race condition or caching issue
- The `fetch-depth: 0` should fetch all history, but it's not fetching the latest commit

## The Real Problem

Looking at the issue description again:

> In instant mode we should directly increment version update changelog and so on, **bypassing `.changeset` folder**, and go with release to npm and github releases.

**The current workflow design is fundamentally wrong for instant mode.** It:

1. Creates a changeset file
2. Commits it to main
3. Then tries to consume it

This is overcomplicated and has timing issues. **Instant mode should bypass changesets entirely.**

## Solution Options

### Option 1: Fix the checkout timing (Band-aid)

Add `git pull` after checkout to ensure latest code, or add explicit ref/sha parameter.

**Pros**: Minimal changes
**Cons**: Still using changesets for instant mode (wrong approach), brittle

### Option 2: Bypass changesets for instant mode (Correct approach)

Modify the workflow to accept `release_mode` and `bump_type` inputs, and when `release_mode=instant`:

1. Skip changeset creation
2. Directly bump version in package.json using npm version
3. Directly update CHANGELOG.md
4. Commit, push, publish, release

**Pros**:

- Aligns with issue description
- Simpler, no timing issues
- True "instant" release

**Cons**:

- More changes required
- Need to handle CHANGELOG.md updates manually

### Option 3: Simplify to single job for instant mode

Combine everything into one job for instant mode:

1. Check out code
2. Run npm version patch/minor/major
3. Update CHANGELOG.md with input description
4. Commit and push
5. Publish to npm
6. Create GitHub release

**Pros**:

- Single atomic operation
- No timing issues
- Clean and simple

**Cons**:

- More duplication between instant and changeset-pr modes

## Recommended Solution

**Option 2 with refinements**: Modify `common.yml` to support direct version bumping:

1. Add new inputs to `common.yml`:
   - `release_mode` (instant vs changeset)
   - `bump_type` (patch, minor, major)
   - `description` (for changelog)

2. Modify the "Version packages" step to branch:
   - If `release_mode == 'instant'`: Use npm version + manual CHANGELOG update
   - Otherwise: Use existing changeset workflow

3. Remove the `prepare-changeset` job entirely from instant mode

This keeps the common publishing/release logic in one place while supporting both modes properly.

## Implementation Plan

1. Create a new script `scripts/instant-version-bump.mjs` that:
   - Takes bump_type and description as arguments
   - Runs `npm version {bump_type} --no-git-tag-version`
   - Updates CHANGELOG.md with new entry
   - Returns new version

2. Modify `.github/workflows/common.yml`:
   - Add new inputs: `release_mode`, `bump_type`, `description`
   - Update "Version packages" step to branch on release_mode
   - If instant mode, call instant-version-bump.mjs instead of changeset version

3. Modify `.github/workflows/manual-release.yml`:
   - Remove `prepare-changeset` job
   - Pass new inputs to `common.yml` for instant mode
   - Keep changeset-pr mode as-is

4. Test with experiments folder scripts
