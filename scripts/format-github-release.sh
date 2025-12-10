#!/bin/bash
# Format GitHub release notes using the format-release-notes.mjs script
# Usage: ./scripts/format-github-release.sh <version> <repository> <commit_sha>
#   version: Version number (e.g., 1.0.0)
#   repository: GitHub repository (e.g., owner/repo)
#   commit_sha: Commit SHA for PR detection

set -e

VERSION="$1"
REPOSITORY="$2"
COMMIT_SHA="$3"

if [ -z "$VERSION" ] || [ -z "$REPOSITORY" ] || [ -z "$COMMIT_SHA" ]; then
  echo "Error: Missing required arguments"
  echo "Usage: ./scripts/format-github-release.sh <version> <repository> <commit_sha>"
  exit 1
fi

TAG="v$VERSION"

# Get the release ID for this version
RELEASE_ID=$(gh api "repos/$REPOSITORY/releases/tags/$TAG" --jq '.id' 2>/dev/null || echo "")

if [ -n "$RELEASE_ID" ]; then
  echo "Formatting release notes for $TAG..."
  # Pass the trigger commit SHA for PR detection
  # This allows proper PR lookup even if the changelog doesn't have a commit hash
  node scripts/format-release-notes.mjs "$RELEASE_ID" "$TAG" "$REPOSITORY" --commit-sha="$COMMIT_SHA"
  echo "✅ Formatted release notes for $TAG"
else
  echo "⚠️ Could not find release for $TAG"
fi
