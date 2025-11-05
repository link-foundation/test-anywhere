# Issue #56 Analysis: Version 0.2.4 Not Released

## Problem Statement

Version 0.2.4 was merged to main in PR #55 (commit 2362ea6) but was never published to NPM or released on GitHub.

## Root Cause

The issue is caused by a **GitHub Actions limitation**: When a workflow uses the default `GITHUB_TOKEN` to merge a PR, it **intentionally does NOT trigger other workflows** to prevent recursive workflow execution.

### Evidence

1. **PR #53 (v0.2.3 - Successful Release)**
   - Merged by: `konard` (human user)
   - CI/CD workflow: ✅ Triggered
   - Result: Published to NPM and GitHub

2. **PR #55 (v0.2.4 - Failed Release)**
   - Merged by: `app/github-actions` (bot via auto-merge workflow)
   - CI/CD workflow: ❌ NOT triggered
   - Result: NOT published to NPM or GitHub

### Technical Details

- The auto-merge workflow (`auto-merge-version-pr.yml`) uses `GITHUB_TOKEN` to merge version PRs
- When this token is used to merge, GitHub prevents triggering the CI/CD workflow
- This is by design to prevent infinite workflow loops
- The CI/CD workflow's `release` job never runs because the workflow itself never triggers

## Solution Options

### Option 1: Use a Personal Access Token (PAT) - RECOMMENDED

Create a PAT with appropriate permissions and use it instead of `GITHUB_TOKEN` in the auto-merge workflow.

**Pros:**

- Simple to implement
- Allows workflows to trigger other workflows
- Maintains automated workflow

**Cons:**

- Requires creating and managing a PAT
- PAT needs to be associated with a user account
- Requires repository secret configuration

### Option 2: Use a GitHub App Token

Create a GitHub App and use its token for merging.

**Pros:**

- More secure than PAT
- Not tied to a specific user
- Better audit trail

**Cons:**

- More complex setup
- Requires creating and configuring a GitHub App

### Option 3: Remove Auto-Merge, Require Manual Merge

Remove the auto-merge workflow and require manual merging of version PRs.

**Pros:**

- Simple, no token management
- Works immediately
- More control over releases

**Cons:**

- Requires manual intervention
- Less automated

### Option 4: Trigger Release Workflow Manually

Keep auto-merge but manually trigger releases when needed.

**Pros:**

- Maintains automation
- Simple workaround

**Cons:**

- Still requires manual intervention for releases
- Doesn't fully solve the automation goal

## Recommended Solution

**Remove the auto-merge workflow** and require manual merging of version PRs. This is the simplest and most reliable solution that:

1. Ensures the CI/CD workflow always triggers
2. Gives maintainers control over when releases happen
3. Requires no additional secret management
4. Works immediately without configuration

The version PRs are already clearly labeled (e.g., "0.2.4") and easy to identify. The maintainer can review and merge them when ready, which will automatically trigger the release process.

## Immediate Action Required: Release 0.2.4

Version 0.2.4 is already merged to main but was never published. To release it manually:

### Option 1: Use the provided script (Recommended)

```bash
cd /path/to/test-anywhere
git checkout main
git pull
./experiments/manual-release-0.2.4.sh
```

The script will:

1. Verify the version is 0.2.4
2. Install dependencies
3. Run tests
4. Publish to NPM
5. Create a GitHub release

### Option 2: Manual steps

```bash
# Checkout main and ensure it's up to date
git checkout main
git pull

# Install dependencies
npm install

# Publish to NPM (requires NPM_TOKEN)
npm publish

# Create GitHub release
gh release create "v0.2.4" \
  --title "v0.2.4" \
  --notes "$(awk '/## 0.2.4/,/^## / {if (!/^## / || /## 0.2.4/) print}' CHANGELOG.md | tail -n +2 | head -n -1)" \
  --repo link-foundation/test-anywhere
```

### Option 3: Trigger via GitHub Actions

Since the fix removes the auto-merge workflow, you could also:

1. Create an empty commit on main: `git commit --allow-empty -m "chore: trigger release"`
2. Push to main
3. The CI/CD workflow will run and create the release automatically

**Note:** After this PR is merged, future version PRs should be manually merged to avoid this issue.
