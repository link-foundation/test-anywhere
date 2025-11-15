#!/bin/bash

# Test the current condition
PR_AUTHOR="app/github-actions"

echo "Testing with PR_AUTHOR=$PR_AUTHOR"

# Current condition (line 48)
if [[ "$PR_AUTHOR" != "github-actions"* && "$PR_AUTHOR" != "app/github-actions" ]]; then
  echo "Current condition (line 48): Would skip (WRONG)"
else
  echo "Current condition (line 48): Would NOT skip (correct)"
fi

# Fixed condition 
if [[ "$PR_AUTHOR" != github-actions* && "$PR_AUTHOR" != "app/github-actions" ]]; then
  echo "Fixed condition (unquoted pattern): Would skip (WRONG)"
else
  echo "Fixed condition (unquoted pattern): Would NOT skip (correct)"
fi

# Better approach using OR logic
if [[ "$PR_AUTHOR" == "app/github-actions" || "$PR_AUTHOR" == github-actions* ]]; then
  echo "OR logic: Is github-actions bot (correct)"
else
  echo "OR logic: Not github-actions bot (WRONG)"
fi
