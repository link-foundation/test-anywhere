#!/bin/bash
set -e

echo "=== Verifying the fix ==="
echo ""

# Get auto_merge value the same way the workflow does
PR_AUTO_MERGE=$(gh api repos/link-foundation/test-anywhere/pulls/48 --jq '.auto_merge')

echo "PR_AUTO_MERGE value: [$PR_AUTO_MERGE]"
echo ""

echo "OLD LOGIC (BUGGY):"
if [ "$PR_AUTO_MERGE" != "null" ]; then
  echo "  ❌ Would skip enabling auto-merge (BUG!)"
else
  echo "  ✅ Would enable auto-merge"
fi
echo ""

echo "NEW LOGIC (FIXED):"
if [ -n "$PR_AUTO_MERGE" ] && [ "$PR_AUTO_MERGE" != "null" ]; then
  echo "  ❌ Would skip enabling auto-merge"
else
  echo "  ✅ Would enable auto-merge (CORRECT!)"
fi
echo ""

# Test with different values
echo "=== Testing with different values ==="
echo ""

test_value() {
  local value="$1"
  echo "Testing value: [$value]"
  
  if [ -n "$value" ] && [ "$value" != "null" ]; then
    echo "  NEW LOGIC: Would skip (auto-merge already enabled)"
  else
    echo "  NEW LOGIC: Would enable auto-merge"
  fi
}

test_value ""  # Empty (null from API)
test_value "null"  # String "null"
test_value '{"enabled_by":{"login":"konard"},"merge_method":"squash"}'  # Real auto-merge object
