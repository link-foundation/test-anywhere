#!/bin/bash
# Publish to npm using OIDC trusted publishing
# Usage: ./scripts/publish-to-npm.sh [should_pull]
#   should_pull: Optional flag to pull latest changes before publishing (for release job)

set -e

SHOULD_PULL="${1:-false}"

if [ "$SHOULD_PULL" == "true" ]; then
  # Pull the latest changes we just pushed
  git pull origin main
fi

# Publish to npm using OIDC trusted publishing
npm run changeset:publish

echo "published=true" >> $GITHUB_OUTPUT

# Get published version
PUBLISHED_VERSION=$(node -p "require('./package.json').version")
echo "published_version=$PUBLISHED_VERSION" >> $GITHUB_OUTPUT
echo "✅ Published test-anywhere@$PUBLISHED_VERSION to npm"
