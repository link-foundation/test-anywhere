---
'test-anywhere': patch
---

Add documentation for CLI options splitting syntax variants

This adds comprehensive documentation proposing multiple ways to split CLI options between the test-anywhere wrapper command and the underlying test runner. The proposal covers:

- Double-dash (`--`) separator (POSIX standard, recommended)
- Environment variable approach (cross-platform)
- Explicit prefix flags
- Subcommand style
- Config file approach

Includes shell compatibility matrix and working demo scripts.
