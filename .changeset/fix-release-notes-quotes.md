---
'test-anywhere': patch
---

fix: remove extra quotes from release notes

Fixed an issue where manual instant releases were adding extra quotes around the release notes. When workflow_dispatch passes a description, the command-stream library was adding shell escaping by wrapping it in single quotes, which then became part of the actual value in CHANGELOG.md and GitHub releases.

Implemented a three-layer defense approach:

- Pass description via environment variable instead of command-line argument to avoid shell escaping
- Add defensive quote stripping in instant-version-bump.mjs
- Improve quote cleaning regex in format-release-notes.mjs to handle escaped quotes
