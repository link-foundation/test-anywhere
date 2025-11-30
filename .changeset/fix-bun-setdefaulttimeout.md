---
'test-anywhere': minor
---

Add setDefaultTimeout support for Bun runtime (Fixes #69)

- Added `setDefaultTimeout` export for setting default test timeout
- Implemented native Bun timeout support via `bun:test`
- Tests using test-anywhere can now call `setDefaultTimeout(ms)` to increase timeout
- For Node.js and Deno, emits a warning as this feature is not natively supported
- Verified fix works with deep-assistant/agent-cli test suite
- Added test coverage for setDefaultTimeout functionality
- Updated README with setDefaultTimeout documentation
