#!/bin/bash
set -e

echo "Testing changeset creation logic..."

# Simulate the workflow
CHANGESET_ID=$(openssl rand -hex 4)
CHANGESET_FILE=".changeset/test-manual-release-${CHANGESET_ID}.md"
BUMP_TYPE="patch"
DESCRIPTION="Manual patch release"

# Create the changeset file with single quotes
cat > "$CHANGESET_FILE" <<EOF
---
'test-anywhere': ${BUMP_TYPE}
---

${DESCRIPTION}
EOF

echo "Created changeset: $CHANGESET_FILE"
echo "Contents before Prettier:"
cat "$CHANGESET_FILE"

# Run Prettier
npx prettier --write "$CHANGESET_FILE"

echo ""
echo "Contents after Prettier:"
cat "$CHANGESET_FILE"

# Verify with format check
echo ""
echo "Running format check..."
npx prettier --check "$CHANGESET_FILE" && echo "✓ Format check passed" || echo "✗ Format check failed"

# Clean up
rm "$CHANGESET_FILE"
echo ""
echo "Test completed successfully!"
