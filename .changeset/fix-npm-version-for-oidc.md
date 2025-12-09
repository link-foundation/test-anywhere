---
'test-anywhere': patch
---

Fix npm trusted publishing by updating npm CLI to >= 11.5.1

npm OIDC trusted publishing requires npm >= 11.5.1, but Node.js 20.x ships with npm 10.x.
This change adds a step to update npm to the latest version before publishing.

Root cause: The "Access token expired or revoked" error was occurring because npm 10.x
does not support OIDC trusted publishing. Without a valid token or OIDC support, npm
interprets the lack of authentication as an expired token.
