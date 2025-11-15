#!/bin/bash

# Simulate the exact scenario from the log
PR_NUMBER=39
PR_TITLE="chore: version packages"
PR_AUTHOR="app/github-actions"
PR_DRAFT="false"

echo "Found PR #$PR_NUMBER: $PR_TITLE (author: $PR_AUTHOR, draft: $PR_DRAFT)"

# Line 161-164: Skip if not from github-actions bot
if [[ "$PR_AUTHOR" != "github-actions"* && "$PR_AUTHOR" != "app/github-actions" ]]; then
  echo "  Skipping: not from github-actions bot"
  echo "  >>> This branch was taken in the actual workflow!"
  echo "  >>> BUT IT SHOULDN'T HAVE BEEN!"
else
  echo "  >>> Not skipping - author IS from github-actions bot"
fi

echo ""
echo "Let me check each part of the condition:"
echo "  PR_AUTHOR = '$PR_AUTHOR'"
echo ""

if [[ "$PR_AUTHOR" != "github-actions"* ]]; then
  echo "  ✓ PR_AUTHOR != \"github-actions\"* is TRUE"
  echo "    (because 'app/github-actions' doesn't match 'github-actions*')"
else
  echo "  ✗ PR_AUTHOR != \"github-actions\"* is FALSE"
fi

if [[ "$PR_AUTHOR" != "app/github-actions" ]]; then
  echo "  ✓ PR_AUTHOR != \"app/github-actions\" is TRUE"
else
  echo "  ✗ PR_AUTHOR != \"app/github-actions\" is FALSE"
  echo "    (because they are exactly equal)"
fi

echo ""
echo "Combined with AND: TRUE && FALSE = FALSE"
echo "So the if condition should be FALSE, meaning it should NOT skip!"
echo ""
echo "BUT THE LOG SHOWS IT DID SKIP!"
echo "This suggests there's something wrong with my understanding..."
