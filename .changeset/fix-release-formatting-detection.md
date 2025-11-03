---
'test-anywhere': patch
---

Fix release notes formatting script to properly detect and format GitHub releases. The script now correctly identifies formatted releases (checking for img.shields.io badge), handles literal \n characters, extracts full descriptions, and uses JSON input for proper special character handling.
