---
'test-anywhere': patch
---

fix: replace lino-arguments with manual CLI argument parsing for reliability

The `lino-arguments` library's `makeConfig` function was failing to parse CLI arguments correctly in GitHub Actions, causing release scripts to fail with "Missing required arguments" errors even when arguments were provided correctly.

This change replaces `lino-arguments` with a simple, reliable manual argument parser that:
- Parses arguments directly from process.argv
- Supports both `--arg=value` and `--arg value` formats  
- Falls back to environment variables
- Works reliably across all environments

Affected scripts:
- scripts/create-github-release.mjs
- scripts/format-github-release.mjs

Fixes #118
