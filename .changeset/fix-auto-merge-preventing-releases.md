---
'test-anywhere': patch
---

Fix release automation by implementing direct version commits to main. The release workflow now automatically detects changesets, bumps versions, commits changes directly to main, and publishes to NPM and GitHub releases in a single workflow run. This eliminates the need for separate version bump PRs and ensures fully automated releases without manual intervention.
