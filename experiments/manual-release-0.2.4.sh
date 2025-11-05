#!/bin/bash
# Manual release script for version 0.2.4
# This script manually publishes version 0.2.4 to NPM and creates a GitHub release

set -e

echo "🚀 Starting manual release for version 0.2.4..."

# Check current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "Current package.json version: $CURRENT_VERSION"

if [ "$CURRENT_VERSION" != "0.2.4" ]; then
  echo "❌ Error: Expected version 0.2.4 but found $CURRENT_VERSION"
  exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the package (if there's a build step)
if grep -q '"build"' package.json; then
  echo "🔨 Building package..."
  npm run build
fi

# Run tests
echo "🧪 Running tests..."
npm test

# Publish to NPM
echo "📤 Publishing to NPM..."
npm publish

# Create GitHub release
echo "🏷️  Creating GitHub release..."
CHANGELOG_CONTENT=$(awk '/## 0.2.4/,/^## / {if (!/^## / || /## 0.2.4/) print}' CHANGELOG.md | tail -n +2 | head -n -1)

gh release create "v0.2.4" \
  --title "v0.2.4" \
  --notes "$CHANGELOG_CONTENT" \
  --repo link-foundation/test-anywhere

echo "✅ Release 0.2.4 completed successfully!"
echo "   - NPM: https://www.npmjs.com/package/test-anywhere/v/0.2.4"
echo "   - GitHub: https://github.com/link-foundation/test-anywhere/releases/tag/v0.2.4"
