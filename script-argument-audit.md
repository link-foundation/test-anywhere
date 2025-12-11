# Script Argument Usage Audit

## Executive Summary

Comprehensive audit of all `.mjs` scripts in the `./scripts` folder and their invocations across the codebase to ensure correct argument format usage.

**Date:** 2025-12-11
**Issue:** #126 - Ensuring consistent argument passing to all scripts
**PR:** #128

## Findings Overview

**Total scripts audited:** 12
**Total issues found:** 3
**Scripts with issues:** 2

### Issues Found

1. ❌ **create-manual-changeset.mjs** - Called with positional arguments instead of named arguments
2. ❌ **publish-to-npm.mjs** - Called with positional boolean values instead of named arguments

## Detailed Analysis

### Scripts Using lino-arguments (Named Arguments Required)

These scripts use `lino-arguments` library and **expect named arguments** with `--` prefix:

#### 1. ✅ version-and-commit.mjs

- **Expected format:** `--mode <changeset|instant> [--bump-type <type>] [--description <desc>]`
- **Workflow calls:**
  - ✅ Line 182: `node scripts/version-and-commit.mjs --mode changeset`
  - ✅ Line 233: `node scripts/version-and-commit.mjs --mode instant --bump-type "${{ github.event.inputs.bump_type }}" --description "${{ github.event.inputs.description }}"`
- **Status:** ✅ CORRECT (fixed in PR #127 and #128)

#### 2. ❌ create-manual-changeset.mjs

- **Expected format:** `--bump-type <major|minor|patch> [--description <description>]`
- **Workflow calls:**
  - ❌ Line 275: `node scripts/create-manual-changeset.mjs "${{ github.event.inputs.bump_type }}" "${{ github.event.inputs.description }}"`
- **Status:** ❌ INCORRECT - Using positional arguments
- **Impact:** Script will fail or use incorrect values
- **Fix required:** Change to `--bump-type "${{ github.event.inputs.bump_type }}" --description "${{ github.event.inputs.description }}"`

#### 3. ❌ publish-to-npm.mjs

- **Expected format:** `[--should-pull]`
- **Workflow calls:**
  - ❌ Line 188: `node scripts/publish-to-npm.mjs true`
  - ❌ Line 239: `node scripts/publish-to-npm.mjs false`
- **Status:** ❌ INCORRECT - Using positional boolean values
- **Impact:** Script will not recognize the argument, defaults to false
- **Fix required:**
  - Line 188: `node scripts/publish-to-npm.mjs --should-pull`
  - Line 239: `node scripts/publish-to-npm.mjs` (omit flag when false)

#### 4. ✅ instant-version-bump.mjs

- **Expected format:** `--bump-type <major|minor|patch> [--description <description>]`
- **Workflow calls:**
  - ✅ Line 191 (in version-and-commit.mjs): Uses named arguments
  - ✅ Line 193 (in version-and-commit.mjs): Uses named arguments
- **Status:** ✅ CORRECT

#### 5. ✅ create-github-release.mjs

- **Expected format:** `--release-version <version> --repository <repository>`
- **Workflow calls:**
  - ✅ Line 194: `node scripts/create-github-release.mjs --release-version "${{ steps.publish.outputs.published_version }}" --repository "${{ github.repository }}"`
  - ✅ Line 245: `node scripts/create-github-release.mjs --release-version "${{ steps.publish.outputs.published_version }}" --repository "${{ github.repository }}"`
- **Status:** ✅ CORRECT

#### 6. ✅ format-github-release.mjs

- **Expected format:** `--release-version <version> --repository <repository> --commit-sha <commit_sha>`
- **Workflow calls:**
  - ✅ Line 200: `node scripts/format-github-release.mjs --release-version "${{ steps.publish.outputs.published_version }}" --repository "${{ github.repository }}" --commit-sha "${{ github.sha }}"`
  - ✅ Line 251: `node scripts/format-github-release.mjs --release-version "${{ steps.publish.outputs.published_version }}" --repository "${{ github.repository }}" --commit-sha "${{ github.sha }}"`
  - ✅ Line 77 (in format-github-release.mjs): Uses named arguments
- **Status:** ✅ CORRECT

### Scripts NOT Using lino-arguments (No Arguments or Simple Parsing)

#### 7. ✅ setup-npm.mjs

- **Arguments:** None
- **Workflow calls:**
  - ✅ Line 169: `node scripts/setup-npm.mjs`
  - ✅ Line 229: `node scripts/setup-npm.mjs`
- **Status:** ✅ CORRECT

#### 8. ✅ validate-changeset.mjs

- **Arguments:** None
- **Workflow calls:**
  - ✅ Line 65: `node scripts/validate-changeset.mjs`
- **Status:** ✅ CORRECT

#### 9. ✅ check-file-size.mjs

- **Arguments:** None
- **Workflow calls:**
  - ✅ package.json line 20: `node scripts/check-file-size.mjs`
- **Status:** ✅ CORRECT

#### 10. ✅ changeset-version.mjs

- **Arguments:** None
- **Workflow calls:**
  - ✅ package.json line 24: `node scripts/changeset-version.mjs`
- **Status:** ✅ CORRECT

#### 11. ✅ format-release-notes.mjs

- **Arguments:** Internal use only (called by format-github-release.mjs with named arguments)
- **Status:** ✅ CORRECT

#### 12. ✅ prepare-commit-msg.mjs

- **Arguments:** Uses process.argv directly (Git hook pattern)
- **Workflow calls:**
  - ✅ .husky/prepare-commit-msg: `node scripts/prepare-commit-msg.mjs "$@"`
- **Status:** ✅ CORRECT (special case for Git hooks)

## Required Fixes

### Fix 1: create-manual-changeset.mjs call

**File:** `.github/workflows/release.yml`
**Line:** 275

**Current (INCORRECT):**

```yaml
run: node scripts/create-manual-changeset.mjs "${{ github.event.inputs.bump_type }}" "${{ github.event.inputs.description }}"
```

**Fixed (CORRECT):**

```yaml
run: node scripts/create-manual-changeset.mjs --bump-type "${{ github.event.inputs.bump_type }}" --description "${{ github.event.inputs.description }}"
```

### Fix 2: publish-to-npm.mjs calls

**File:** `.github/workflows/release.yml`
**Lines:** 188, 239

**Current (INCORRECT):**

```yaml
# Line 188
run: node scripts/publish-to-npm.mjs true

# Line 239
run: node scripts/publish-to-npm.mjs false
```

**Fixed (CORRECT):**

```yaml
# Line 188 (main release - should pull changes)
run: node scripts/publish-to-npm.mjs --should-pull

# Line 239 (instant release - no pull needed)
run: node scripts/publish-to-npm.mjs
```

## Impact Assessment

### create-manual-changeset.mjs Issue

**Severity:** HIGH
**Workflow affected:** Manual Release
**Impact:**

- Script will receive empty `bumpType` and `description`
- Will use defaults which may not match user intent
- Changeset may be created with incorrect version bump type

### publish-to-npm.mjs Issue

**Severity:** MEDIUM
**Workflow affected:** Main Release, Instant Release
**Impact:**

- Main release (line 188): Script won't pull latest changes before publishing
  - Expected behavior: Pull changes then publish
  - Actual behavior: Publish without pulling (may cause issues)
- Instant release (line 239): No impact (already doesn't pull)
  - Expected behavior: Don't pull
  - Actual behavior: Don't pull (correct, but argument ignored)

## Testing Verification

After fixes are applied, verify:

1. ✅ Manual release workflow creates changeset with correct bump type
2. ✅ Main release workflow pulls changes before publishing
3. ✅ Instant release workflow publishes without pulling
4. ✅ All scripts use consistent argument format

## Lessons Learned

1. **Consistency is key:** All scripts using `lino-arguments` should use named arguments exclusively
2. **Grep is your friend:** Always search entire codebase for all invocations when making changes
3. **Documentation matters:** Each script should clearly document expected argument format in header comments
4. **Validation helps:** Consider adding argument validation to catch these errors early

## References

- Issue: https://github.com/link-foundation/test-anywhere/issues/126
- PR: https://github.com/link-foundation/test-anywhere/pull/128
- Related: PR #127 (incomplete fix for version-and-commit.mjs)
