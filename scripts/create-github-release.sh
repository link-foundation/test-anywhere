#!/bin/bash
# Create GitHub Release from CHANGELOG.md
# Usage: ./scripts/create-github-release.sh <version> <repository>
#   version: Version number (e.g., 1.0.0)
#   repository: GitHub repository (e.g., owner/repo)

set -e

VERSION="$1"
REPOSITORY="$2"

if [ -z "$VERSION" ] || [ -z "$REPOSITORY" ]; then
  echo "Error: Missing required arguments"
  echo "Usage: ./scripts/create-github-release.sh <version> <repository>"
  exit 1
fi

TAG="v$VERSION"

echo "Creating GitHub release for $TAG..."

# Extract changelog entry for this version
# Read from CHANGELOG.md between this version header and the next version header
RELEASE_NOTES=$(awk "/## $VERSION/{flag=1; next} /## [0-9]/{flag=0} flag" CHANGELOG.md)

if [ -z "$RELEASE_NOTES" ]; then
  RELEASE_NOTES="Release $VERSION"
fi

# Create release
gh release create "$TAG" \
  --title "$VERSION" \
  --notes "$RELEASE_NOTES" \
  --repo "$REPOSITORY"

echo "✅ Created GitHub release: $TAG"
