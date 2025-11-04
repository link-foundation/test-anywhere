#!/bin/bash

# Test both conditions
PR_AUTHOR="app/github-actions"

echo "Testing with PR_AUTHOR=$PR_AUTHOR"

# Line 48-49 condition (in auto-merge job)
if [[ "$PR_AUTHOR" != "github-actions"* && "$PR_AUTHOR" != "app/github-actions" ]]; then
  echo "Line 48-49: Skipping (WRONG - this is the problem!)"
else
  echo "Line 48-49: NOT skipping (correct)"
fi

# Line 161 condition (in auto-merge-on-checks job) - THIS IS THE PROBLEMATIC ONE
if [[ "$PR_AUTHOR" != "github-actions"* && "$PR_AUTHOR" != "app/github-actions" ]]; then
  echo "Line 161: Skipping (WRONG - this is what's happening!)"
else
  echo "Line 161: NOT skipping (correct)"
fi

# But wait, the log shows it's skipping. Let me check if there's a difference
echo ""
echo "Checking individual conditions:"
if [[ "$PR_AUTHOR" != "github-actions"* ]]; then
  echo "  PR_AUTHOR != github-actions* : TRUE"
else
  echo "  PR_AUTHOR != github-actions* : FALSE"
fi

if [[ "$PR_AUTHOR" != "app/github-actions" ]]; then
  echo "  PR_AUTHOR != app/github-actions : TRUE"
else
  echo "  PR_AUTHOR != app/github-actions : FALSE"
fi

echo ""
echo "Combined with AND:"
if [[ "$PR_AUTHOR" != "github-actions"* && "$PR_AUTHOR" != "app/github-actions" ]]; then
  echo "  Result: TRUE (will skip)"
else
  echo "  Result: FALSE (will not skip)"
fi
