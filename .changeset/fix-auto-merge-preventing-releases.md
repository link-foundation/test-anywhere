---
'test-anywhere': patch
---

Fix release automation by removing auto-merge workflow. The auto-merge workflow was causing version PRs merged by GitHub Actions to not trigger the CI/CD workflow, preventing releases from being published to NPM and GitHub. Version PRs should now be manually merged to ensure reliable releases.
