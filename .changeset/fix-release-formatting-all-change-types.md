---
"test-anywhere": patch
---

Fix release formatting script to handle Major/Minor/Patch changes

Previously, the script only handled "### Patch Changes" sections, causing it to fail on Minor and Major releases. The fix updates the regex pattern to match all changeset types (Major, Minor, and Patch), ensuring release notes are properly formatted for all release types.
