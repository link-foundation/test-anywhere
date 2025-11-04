#!/bin/bash

# Test what gh api returns when auto_merge is null
echo "Testing auto_merge check logic..."
echo ""

# Get the actual value from the API
PR_AUTO_MERGE=$(gh api repos/link-foundation/test-anywhere/pulls/48 --jq '.auto_merge')

echo "Raw value from gh api --jq '.auto_merge': [$PR_AUTO_MERGE]"
echo "Length of value: ${#PR_AUTO_MERGE}"
echo ""

# Test the current workflow condition
echo "Current workflow condition: [ \"\$PR_AUTO_MERGE\" != \"null\" ]"
if [ "$PR_AUTO_MERGE" != "null" ]; then
  echo "  Result: TRUE (would skip enabling auto-merge) ❌ BUG!"
else
  echo "  Result: FALSE (would enable auto-merge) ✅"
fi
echo ""

# Show what the value actually is
echo "Checking if value is empty string:"
if [ -z "$PR_AUTO_MERGE" ]; then
  echo "  Value is empty string ✅"
else
  echo "  Value is NOT empty string"
fi
echo ""

echo "Checking if value equals literal 'null':"
if [ "$PR_AUTO_MERGE" = "null" ]; then
  echo "  Value equals 'null' ✅"
else
  echo "  Value does NOT equal 'null'"
fi
