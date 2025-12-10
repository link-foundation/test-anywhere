#!/bin/bash
# Version packages and commit to main
# Usage: ./scripts/version-and-commit.sh [changeset|instant] [bump_type] [description]
#   changeset: Run changeset version
#   instant: Run instant version bump with bump_type (patch|minor|major) and optional description

set -e

MODE="${1:-changeset}"
BUMP_TYPE="${2:-}"
DESCRIPTION="${3:-}"

# Configure git
git config user.name "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"

# Get current version before bump
OLD_VERSION=$(node -p "require('./package.json').version")
echo "Current version: $OLD_VERSION"

if [ "$MODE" == "instant" ]; then
  echo "Running instant version bump..."
  # Run instant version bump script
  if [ -n "$DESCRIPTION" ]; then
    node scripts/instant-version-bump.mjs "$BUMP_TYPE" "$DESCRIPTION"
  else
    node scripts/instant-version-bump.mjs "$BUMP_TYPE"
  fi
  COMMIT_SUFFIX="Manual $BUMP_TYPE release"
else
  echo "Running changeset version..."
  # Run changeset version to bump versions and update CHANGELOG
  npm run changeset:version
  COMMIT_SUFFIX="🤖 Generated with [Claude Code](https://claude.com/claude-code)"
fi

# Get new version after bump
NEW_VERSION=$(node -p "require('./package.json').version")
echo "New version: $NEW_VERSION"
echo "new_version=$NEW_VERSION" >> $GITHUB_OUTPUT

# Check if there are changes to commit
if [[ -n $(git status --porcelain) ]]; then
  echo "Changes detected, committing..."

  # Stage all changes (package.json, package-lock.json, CHANGELOG.md, deleted changesets)
  git add -A

  # Commit with version number and suffix as message
  git commit -m "$NEW_VERSION"$'\n'$'\n'"$COMMIT_SUFFIX"

  # Push directly to main
  git push origin main

  echo "✅ Version bump committed and pushed to main"
  echo "version_committed=true" >> $GITHUB_OUTPUT
else
  echo "No changes to commit"
  echo "version_committed=false" >> $GITHUB_OUTPUT
fi
