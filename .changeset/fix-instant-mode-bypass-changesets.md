---
'test-anywhere': patch
---

Fix instant release mode to bypass changesets as intended. Manual instant releases were failing because the workflow was using a two-step changeset approach instead of directly bumping version and updating changelog. Added new `scripts/instant-version-bump.mjs` script and updated workflows to support both instant and changeset release modes.
