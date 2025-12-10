---
'test-anywhere': patch
---

Integrate link-foundation libraries (use-m, command-stream, lino-arguments) into ./scripts folder

All .mjs scripts in the ./scripts folder have been updated to use:

- use-m: Dynamic package loading without package.json dependencies
- command-stream: Modern shell command execution with streaming support (replaces execSync)
- lino-arguments: Unified configuration from CLI args, env vars, and .lenv files
