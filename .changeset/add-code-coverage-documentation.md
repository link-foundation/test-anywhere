---
'test-anywhere': minor
---

Add code coverage support with threshold enforcement for all runtimes (Bun, Deno, Node.js)

- Add npm scripts for running coverage: `coverage`, `coverage:node`, `coverage:bun`, `coverage:deno`
- Add npm scripts for coverage threshold checks: `coverage:check`, `coverage:check:node`, `coverage:check:bun`, `coverage:check:deno`
- Add npm scripts for running tests on specific runtimes: `test:node`, `test:bun`, `test:deno`
- Add Node.js coverage threshold script (`scripts/check-node-coverage.mjs`)
- Add Bun coverage threshold script (`scripts/check-bun-coverage.mjs`)
- Add Deno coverage threshold script (`scripts/check-deno-coverage.mjs`)
- Configure Bun coverage thresholds in `bunfig.toml` (75% default for lines, functions, statements)
- Add CI coverage checks for all three runtimes (Node.js/Deno: 80%, Bun: 75%)
- Update documentation with comprehensive coverage guide including programmatic usage
