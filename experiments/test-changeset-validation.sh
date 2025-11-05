#!/bin/bash
# Test script to validate changeset validation logic

echo "=== Testing Changeset Validation Logic ==="

# Count changeset files (excluding README.md and config.json)
CHANGESET_COUNT=$(find .changeset -name "*.md" ! -name "README.md" | wc -l)

echo "Found $CHANGESET_COUNT changeset file(s)"

# Ensure exactly one changeset file exists
if [ "$CHANGESET_COUNT" -eq 0 ]; then
  echo "ERROR: No changeset found"
  exit 1
elif [ "$CHANGESET_COUNT" -gt 1 ]; then
  echo "ERROR: Multiple changesets found ($CHANGESET_COUNT)"
  find .changeset -name "*.md" ! -name "README.md" -exec basename {} \;
  exit 1
fi

# Get the changeset file
CHANGESET_FILE=$(find .changeset -name "*.md" ! -name "README.md" | head -1)
echo "Validating changeset: $CHANGESET_FILE"

# Check if changeset has a valid type (major, minor, or patch)
if ! grep -qE "^['\"]test-anywhere['\"]:\s+(major|minor|patch)" "$CHANGESET_FILE"; then
  echo "ERROR: Changeset must specify a version type: major, minor, or patch"
  cat "$CHANGESET_FILE"
  exit 1
fi

# Extract description (everything after the closing ---) and check it's not empty
DESCRIPTION=$(awk '/^---$/{count++; next} count==2' "$CHANGESET_FILE" | sed '/^[[:space:]]*$/d')

if [ -z "$DESCRIPTION" ]; then
  echo "ERROR: Changeset must include a description"
  cat "$CHANGESET_FILE"
  exit 1
fi

echo "✅ Changeset validation passed"
echo "   Type: $(grep -E "^['\"]test-anywhere['\"]:" "$CHANGESET_FILE" | sed "s/.*: //")"
echo "   Description: $DESCRIPTION"
