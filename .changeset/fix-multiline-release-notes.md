---
'test-anywhere': patch
---

Fix multiline formatting in GitHub release descriptions

Release descriptions were being flattened from multiline to single line format. The issue was in the format-release-notes.mjs script which used an overly aggressive regex (.replace(/\s+/g, ' ')) that replaced ALL whitespace including newlines.

Now properly preserves:

- Paragraph breaks
- Bullet point lists
- Line breaks in changeset descriptions

Only excessive blank lines (3+ consecutive) are normalized to 2.
