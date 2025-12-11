---
'test-anywhere': patch
---

Fix NPM publish check to properly detect unpublished versions. The script was incorrectly reporting versions as "already published" when they didn't exist on npm, causing the publish step to be skipped. This was caused by misunderstanding how command-stream's .run({ capture: true }) handles command failures - it returns a result object with a code property instead of throwing errors. Changed from try/catch error handling to explicit exit code checking.
