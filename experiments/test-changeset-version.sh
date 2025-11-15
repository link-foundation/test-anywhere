#!/bin/bash
# Test script to understand what changeset version does

set -e

echo "=== Testing changeset version behavior ==="
echo ""

# Save current state
ORIGINAL_VERSION=$(node -p "require('./package.json').version")
echo "Current version: $ORIGINAL_VERSION"
echo ""

# Count changeset files (excluding README.md and config.json)
CHANGESET_COUNT=$(find .changeset -name "*.md" ! -name "README.md" | wc -l)
echo "Changeset files found: $CHANGESET_COUNT"

if [ "$CHANGESET_COUNT" -eq 0 ]; then
  echo "No changesets to process. Exiting."
  exit 0
fi

echo ""
echo "Changeset files:"
find .changeset -name "*.md" ! -name "README.md" -exec basename {} \;
echo ""

# Show what files will be modified
echo "=== Running changeset version (dry-run to understand changes) ==="
echo ""

# Run changeset version
npm run changeset:version

echo ""
echo "=== Changes made by changeset version ==="
echo ""

# Show what changed
echo "New version:"
NEW_VERSION=$(node -p "require('./package.json').version")
echo "$NEW_VERSION"
echo ""

echo "Git status after version bump:"
git status --short
echo ""

echo "Files that would be committed:"
git diff --name-only HEAD
echo ""

echo "=== Summary ==="
echo "Original version: $ORIGINAL_VERSION"
echo "New version: $NEW_VERSION"
echo "Changesets remaining: $(find .changeset -name "*.md" ! -name "README.md" | wc -l)"
echo ""
echo "This shows exactly what needs to be committed to main after version bump."
