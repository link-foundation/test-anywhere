#!/bin/bash

echo "Verifying the fix for auto-merge check..."
echo ""

# Get the actual value from gh api
PR_AUTO_MERGE=$(gh api repos/link-foundation/test-anywhere/pulls/48 --jq '.auto_merge')

echo "Current state of PR #48:"
echo "  Raw API value: [$PR_AUTO_MERGE]"
echo "  Length: ${#PR_AUTO_MERGE}"
echo "  Is empty: $([ -z "$PR_AUTO_MERGE" ] && echo YES || echo NO)"
echo ""

echo "OLD LOGIC (BUGGY):"
echo "  if [ \"\$PR_AUTO_MERGE\" != \"null\" ]; then"
if [ "$PR_AUTO_MERGE" != "null" ]; then
  echo "    ❌ Would skip enabling auto-merge (BUG!)"
else
  echo "    ✅ Would enable auto-merge"
fi
echo ""

echo "NEW LOGIC (FIXED):"
echo "  if [ -n \"\$PR_AUTO_MERGE\" ] && [ \"\$PR_AUTO_MERGE\" != \"null\" ]; then"
if [ -n "$PR_AUTO_MERGE" ] && [ "$PR_AUTO_MERGE" != "null" ]; then
  echo "    ❌ Would skip enabling auto-merge"
else
  echo "    ✅ Would enable auto-merge (CORRECT!)"
fi
echo ""

echo "EXPLANATION:"
echo "  - When auto_merge is null in GitHub API, gh api --jq returns empty string"
echo "  - Old logic: [ \"\" != \"null\" ] = TRUE (incorrectly skips)"
echo "  - New logic: [ -n \"\" ] && [ \"\" != \"null\" ] = FALSE (correctly enables)"
