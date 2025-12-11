---
'test-anywhere': patch
---

Fix apostrophes appearing as triple quotes in GitHub release notes. When creating GitHub releases, apostrophes in release notes were being displayed as triple quotes (e.g., "didn't" appeared as "didn'''t"). This was caused by shell escaping issues when passing release notes as command-line arguments. Changed from using `gh release create` with CLI arguments to using `gh api` with JSON input via stdin, which properly handles all special characters without requiring shell escaping.
