---
'test-anywhere': patch
---

Fix PR detection in release notes - properly look up PRs by commit hash via GitHub API instead of using fallback guessing. If no PR contains the commit, no PR link is shown.
