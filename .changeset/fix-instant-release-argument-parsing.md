---
'test-anywhere': patch
---

fix: complete fix for release workflow argument parsing

Fixed both instant release and main release workflows that were not working correctly. Both workflows were calling version-and-commit.mjs with positional arguments but the script expected named options (--mode, --bump-type, --description).

Changes:
- Updated instant release workflow (line 233) to use named arguments
- Updated main release workflow (line 182) to use named arguments
- Added validation to script to detect and reject positional arguments with helpful error messages
- Updated case study documentation with detailed root cause analysis and timeline

This completes the fix that was partially implemented in PR #127, which only fixed the instant release job but missed the main release job.
