#!/bin/bash

# Script to enable auto-merge for the repository

REPO="link-foundation/test-anywhere"

echo "Checking current auto-merge setting..."
CURRENT=$(gh api repos/$REPO --jq '.allow_auto_merge')
echo "Current allow_auto_merge: $CURRENT"

if [ "$CURRENT" == "false" ]; then
  echo ""
  echo "Auto-merge is currently DISABLED."
  echo "To enable auto-merge for this repository, run:"
  echo ""
  echo "  gh api repos/$REPO -X PATCH -f allow_auto_merge=true"
  echo ""
  echo "This requires admin permissions on the repository."
else
  echo "Auto-merge is already enabled!"
fi
