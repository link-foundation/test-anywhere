---
'test-anywhere': patch
---

Remove auto-approve step from manual release workflow. The auto-approve action fails because GitHub prohibits approving your own pull request when using the same token that created it. The auto-merge step remains and will work once branch protection requirements are met.
