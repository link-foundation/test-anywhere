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

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "Current version to publish: $CURRENT_VERSION"

# Check if this version is already published on npm
echo "Checking if version $CURRENT_VERSION is already published..."
if npm view "test-anywhere@$CURRENT_VERSION" version 2>/dev/null; then
  echo "Version $CURRENT_VERSION is already published to npm"
  echo "published=true" >> $GITHUB_OUTPUT
  echo "published_version=$CURRENT_VERSION" >> $GITHUB_OUTPUT
  echo "already_published=true" >> $GITHUB_OUTPUT
  exit 0
fi

echo "Version $CURRENT_VERSION not found on npm, proceeding with publish..."

# Publish to npm using OIDC trusted publishing
# Add retry logic for transient failures
MAX_RETRIES=3
RETRY_DELAY=10

for i in $(seq 1 $MAX_RETRIES); do
  echo "Publish attempt $i of $MAX_RETRIES..."
  if npm run changeset:publish; then
    echo "published=true" >> $GITHUB_OUTPUT
    echo "published_version=$CURRENT_VERSION" >> $GITHUB_OUTPUT
    echo "✅ Published test-anywhere@$CURRENT_VERSION to npm"
    exit 0
  else
    if [ $i -lt $MAX_RETRIES ]; then
      echo "Publish failed, waiting ${RETRY_DELAY}s before retry..."
      sleep $RETRY_DELAY
    fi
  fi
done

echo "❌ Failed to publish after $MAX_RETRIES attempts"
exit 1
