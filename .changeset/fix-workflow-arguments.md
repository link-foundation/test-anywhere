---
'test-anywhere': patch
---

Fix release workflow argument passing

Update GitHub Actions workflow to use named arguments (--version, --repository, --commit-sha) when calling release scripts, matching the changes made in PR #115 where scripts were updated to use lino-arguments library.

This fixes the failed release of version 0.8.33 where GitHub Release creation failed due to argument mismatch.
