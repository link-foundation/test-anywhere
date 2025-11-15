#!/bin/bash
set -x

PR_AUTHOR="app/github-actions"

# This is the EXACT condition from line 161
if [[ "$PR_AUTHOR" != "github-actions"* && "$PR_AUTHOR" != "app/github-actions" ]]; then
  echo "RESULT: Skipping (this means there's a BUG)"
  exit 1
else
  echo "RESULT: Not skipping (this is correct)"
  exit 0
fi
