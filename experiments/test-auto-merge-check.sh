#!/bin/bash
set -e

# Test the auto-merge check logic
PR_AUTO_MERGE=$(gh api repos/link-foundation/test-anywhere/pulls/48 --jq '.auto_merge')

echo "PR_AUTO_MERGE value: '$PR_AUTO_MERGE'"
echo "Type: $(echo "$PR_AUTO_MERGE" | wc -c) characters"

if [ "$PR_AUTO_MERGE" != "null" ]; then
  echo "  Auto-merge already enabled for PR #48"
else
  echo "  Auto-merge NOT enabled, should proceed"
fi

# Check commit SHA and check runs
COMMIT_SHA=$(gh api repos/link-foundation/test-anywhere/pulls/48 --jq '.head.sha')
echo "Commit SHA: $COMMIT_SHA"

CHECK_RUNS=$(gh api repos/link-foundation/test-anywhere/commits/$COMMIT_SHA/check-runs --jq '.check_runs')
TOTAL_CHECKS=$(echo "$CHECK_RUNS" | jq 'length')
COMPLETED_CHECKS=$(echo "$CHECK_RUNS" | jq '[.[] | select(.status == "completed")] | length')
SUCCESSFUL_CHECKS=$(echo "$CHECK_RUNS" | jq '[.[] | select(.status == "completed" and .conclusion == "success")] | length')
FAILED_CHECKS=$(echo "$CHECK_RUNS" | jq '[.[] | select(.status == "completed" and .conclusion != "success" and .conclusion != "skipped")] | length')

echo "Total checks: $TOTAL_CHECKS"
echo "Completed: $COMPLETED_CHECKS"
echo "Successful: $SUCCESSFUL_CHECKS"
echo "Failed: $FAILED_CHECKS"

# Test the skip conditions
if [ "$FAILED_CHECKS" -gt 0 ]; then
  echo "  Would skip: some checks failed"
elif [ "$TOTAL_CHECKS" -gt 0 ] && [ "$COMPLETED_CHECKS" -ne "$TOTAL_CHECKS" ]; then
  echo "  Would skip: checks still in progress"
else
  echo "  ✅ Would enable auto-merge!"
fi
