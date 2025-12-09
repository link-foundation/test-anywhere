---
'test-anywhere': patch
---

Migrate from NPM_TOKEN to OIDC trusted publishing for npm package releases. This change removes all NPM_TOKEN secret dependencies from GitHub Actions workflows and enables npm's recommended OIDC-based authentication for enhanced security and automatic provenance generation.
