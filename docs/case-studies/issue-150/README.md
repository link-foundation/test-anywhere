# Issues 150, 148 and 149: requirements and investigation

## Work plan

- [x] Read the parent, both native sub-issues, all issue comments and all three PR comment/review channels. No additional required sub-issues or PR feedback were present.
- [x] Verify the prepared branch and default-branch ancestry; preserve the existing history.
- [x] Download the initial failed CI log and identify its error.
- [x] Research native APIs and existing libraries, and probe runtime differences with finite fixtures.
- [x] Add regression tests and record their failures before implementation.
- [x] Implement the contract for every public test alias and modifier, suites, hooks and declarations.
- [x] Update documentation and add a release changeset.
- [x] Run lint, formatting, size checks, all runtime tests, contract subprocess tests and coverage sequentially.
- [ ] Review the complete PR diff, commit atomic changes and push only the prepared branch.
- [ ] Update PR 151, check fresh CI against the final SHA and mark it ready once verified.

## Requirement inventory and solution decisions

| Source | Requirement                                                                                              | Possible approaches and selected plan                                                                                                                                 | Verification                                                                   |
| ------ | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 150    | Address both 148 and 149 in one PR, without deferral                                                     | Implement shared registration instead of separate patches with inconsistent aliases                                                                                   | PR diff and this inventory                                                     |
| 150    | Read all comments and required issues                                                                    | Read issue bodies, paginated comments, native sub-issues, PR conversation, inline comments and reviews                                                                | Sources retrieved on 2026-10-30                                                |
| 150    | Separate positive closing reference for every issue                                                      | Put `Fixes #150`, `Fixes #148`, `Fixes #149` in PR description                                                                                                        | Final PR metadata                                                              |
| 150    | Explicitly report an already resolved or unreproducible issue                                            | Both issues reproduce on the starting revision; neither is already resolved                                                                                           | Baseline regression logs                                                       |
| 148    | Execute the actual third-argument callback exactly once                                                  | Normalize and validate `(name, fn)` and `(name, options, fn)` before native registration                                                                              | Control and options counters plus native result counts                         |
| 148    | Apply the contract to test and it                                                                        | Share registration and modifier implementations                                                                                                                       | Both aliases tested                                                            |
| 148    | Map meaningful timeout, skip, todo, signal and context behavior, or explicitly reject unsupported shapes | Use native Node and Bun APIs; use Deno's built-in Node compatibility layer for suites, hooks and cancellation. Validate unsupported options rather than dropping them | Success/failure fixtures and invalid argument tests on all runtimes            |
| 148    | Make setDefaultTimeout guidance truthful                                                                 | Keep Bun's native default setter and document valid per-test overloads and runtime limitations                                                                        | Guidance tests and README                                                      |
| 148    | Assert callback execution and native counts                                                              | Subprocess fixtures inspect markers, process status and native summaries                                                                                              | Runtime contract harness                                                       |
| 148    | Test async deadlines and rejected bodies                                                                 | Use native deadlines, never a wrapper Promise.race                                                                                                                    | Bounded failing subprocess fixtures                                            |
| 148    | Test skip/todo and invalid arguments                                                                     | Check skipped bodies do not run, preserve native TODO behavior, and require synchronous errors for invalid registration                                               | Runtime contract harness and unit tests                                        |
| 148    | Test nested suites and after-hook cleanup on every runtime                                               | Replace Deno's global manual hook counters with its native compatibility layer; preserve native Node/Bun hooks                                                        | Nested hooks and failing-body/deadline fixtures                                |
| 148    | Avoid false success or uncontrolled timeout fixture work                                                 | Use abort-aware fixture work and native cancellation; explicitly document that work must cooperate with cancellation                                                  | Cleanup markers, no late work, failure counts                                  |
| 149    | Report skipped suites on Deno                                                                            | One ignored suite entry is acceptable; use the native compatibility layer, which already supplies it                                                                  | Assert suite name and ignored count, including empty and nested skipped suites |
| 149    | Support an optional skip reason                                                                          | Prefer shared `(name, { skip: 'reason' }, fn)` and modifier overloads over a second incompatible API                                                                  | Test and suite reason fixtures                                                 |
| 149    | Pass Node reasons natively; show reasons in Bun/Deno names                                               | Use Node skip option and append `[skipped: reason]` where no reason is printed                                                                                        | Native output assertions                                                       |
| Both   | Apply changes throughout the codebase                                                                    | Audit test/it/modifiers/describe/default export/declarations/docs/examples                                                                                            | Search and complete diff review                                                |

The downstream issues linked by 149 explain the consumer impact; 149 does not request implementing changes in those other repositories.

## Root causes

`test` and `it` took only two parameters, so Node interpreted the options object as a valid native registration and never saw the supplied callback. Deno attempted to call that object. Modifiers had their own separate registration paths, bypassing Deno's hooks. Deno `describe.skip` returned without registering anything. Its manual hooks were global, unscoped and counted tests that might not run.

The initial PR workflow (run 41059716415, SHA 6dcd22a) failed at line 344 of `ci-logs/checks-and-release-41059716415.log`: no changeset was present. A changeset is the repository's release trigger, so no manual version bump is needed.

## Online research and reusable components

- [Node test runner](https://nodejs.org/api/test.html): native options-before-callback registration, context, AbortSignal, timeout, skip reasons and suite hooks. Reusing this API avoids inventing deadline semantics.
- [Bun writing tests](https://bun.sh/docs/test/writing-tests) and [Test interface](https://bun.sh/reference/bun/test/Test): Bun takes timeout after the callback, treats a callback parameter as a done callback, and supplies native skip/todo modifiers. It does not offer Node's signal/context contract.
- [Deno testing APIs](https://docs.deno.com/api/deno/testing/) and [testing guide](https://docs.deno.com/runtime/test/): native ignored registrations and test deadlines; Deno's built-in `node:test` compatibility supplies scoped suites, hooks and cancellation without a new dependency.
- [@std/testing/bdd](https://jsr.io/@std/testing/doc/bdd): an existing BDD component, now deprecated in favor of built-in `node:test`. Adding the deprecated library would introduce an unnecessary external dependency.
- [Vitest test context](https://vitest.dev/guide/recipes/cancellable): a useful cancellation design reference, but adopting another runner would defeat this package's native-runner purpose.

The finite probe `experiments/issue-150/native-node-compat.fixture.mjs` confirmed Deno 2.9.7 reports an ignored skipped suite, receives a native context with a signal, fails an async deadline and runs afterEach/afterAll. Bun 1.4.4 and Node 26.12.1 are also available locally. CI covers the repository's Node 20 and current Bun/Deno versions on Linux, macOS and Windows.

## Reproduction and verification

Before implementation, `node --test tests/options.test.js` failed its callback-execution guard. The subprocess execution fixture recorded four native passing tests, but the options callback counter was zero rather than two. On Deno, the options callbacks failed with `TypeError: fn is not a function`.

The original-signature skipped-suite fixture was also run against the original `6dcd22a` source snapshot. Deno reported only `control` and `legacy skipped test`, with `1 passed | 0 failed | 1 ignored`; `legacy visible suite` was absent. The fixed implementation reports that suite and two ignored entries. These are reproducible failures, not previously resolved reports.

`node experiments/issue-150/verify-runtime.mjs <node|bun|deno>` runs ten isolated acceptance fixtures per runtime. The harness saves native output under `ci-logs/contract-<runtime>-<fixture>.log`, checks callback markers, reporter counts, process status and cleanup markers, and applies a 15-second bound per fixture. Fixtures cover original signatures, options overloads, reasons, empty/nested skipped suites, defaults and zero deadlines, async rejection, native timeouts, context/subtests, focus, native TODO bodies and cancellation. An optional third argument selects an original-source file URL to re-run the baseline. CI runs the harness for each runtime/OS combination and uploads logs on failure.

The source passes the complete existing suites plus `tests/options.test.js`, which covers invalid shapes and values, hook scope, both aliases and options callbacks. `deno check --no-config experiments/issue-150/types.ts` checks the public declaration overloads, including expected type errors. Local lint, formatting and file-size checks pass. Local coverage reports exceed the repository thresholds: Node 88.92% lines / 86.34% branches / 88.14% functions, Bun 89.65% lines / 90.92% functions, and Deno 88.1% lines / 89.4% branches. The existing Deno coverage script does not parse the current Markdown reporter table; these Deno values are read directly from that table.

Runtime limitations are intentional and explicit: Bun rejects a `signal` option and callbacks declaring a context parameter because its native runner has a different callback contract. Node/Deno forward their native context and cancellation. Native TODO execution and native focus/reporting differences are documented. No external runner or timeout-race dependency is added, and resources in the timeout fixtures are aborted or cleared before the subprocess exits.
