---
'test-anywhere': patch
---

fix: instant release workflow argument parsing

Fixed the instant release workflow that was not creating NPM or GitHub releases. The workflow was calling version-and-commit.mjs with positional arguments but the script expected named options (--mode, --bump-type, --description). Updated the workflow to use named arguments and added validation to catch this error in the future.
