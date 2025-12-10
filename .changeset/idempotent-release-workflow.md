---
'test-anywhere': patch
---

Make release workflow idempotent to handle partial failures gracefully. The version-and-commit script now detects if the remote has advanced and skips re-versioning when the release was partially completed. The publish script adds retry logic and checks if the version is already published.
