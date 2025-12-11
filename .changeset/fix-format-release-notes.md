---
'test-anywhere': patch
---

fix: replace lino-arguments in format-release-notes.mjs for reliable CI execution

The format-release-notes.mjs script was still using lino-arguments for CLI argument parsing, which was causing it to fail silently in GitHub Actions CI environments. This prevented release notes from being properly formatted with Related Pull Request links, markdown formatting, and shields.io badges.

Root Cause:

- PR #119 fixed create-github-release.mjs and format-github-release.mjs
- However, format-release-notes.mjs (called by format-github-release.mjs) was never fixed
- lino-arguments fails to parse CLI arguments in CI environments
- Script exited with code 1 without any output
- Release notes remained in raw changeset format

Changes:

- Replaced lino-arguments with manual parseArgs() function
- Supports both --arg=value and --arg value formats
- Falls back to environment variables
- Works reliably across all environments (local, CI, containers)

Impact:

- Release notes now properly formatted with markdown
- Related Pull Request section with PR links now included
- Shields.io npm badge now added to releases
- Script works reliably in all environments

Fixes #122
