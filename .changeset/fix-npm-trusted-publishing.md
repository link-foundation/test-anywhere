---
'test-anywhere': patch
---

Fix npm trusted publishing by adding repository field to package.json

The npm trusted publishing E422 error occurred because the package.json was missing the repository field. When npm publishes with provenance, it verifies that the repository.url in package.json matches the source repository URI from the GitHub Actions OIDC token.

Changes:

- Add repository field to package.json with correct GitHub URL
- Update .gitignore to allow ci-logs/\*.log files
- Update case study documentation with E422 error analysis
