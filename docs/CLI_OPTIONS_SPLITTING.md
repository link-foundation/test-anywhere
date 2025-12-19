# CLI Options Splitting: Proposal for Separating Command and Subcommand Options

This document proposes syntax variants for splitting CLI options between the test-anywhere wrapper command and the underlying test runner (node, bun, deno).

## Problem Statement

When running tests with `test-anywhere`, users may need to pass options to both:

1. **The wrapper command** (e.g., test-anywhere-specific configuration)
2. **The underlying test runner** (e.g., `node --test`, `bun test`, `deno test`)

We need a syntax that:

- Works across all major shells (bash, zsh, fish, PowerShell, cmd.exe)
- Is intuitive and follows established conventions
- Avoids conflicts with existing option patterns

## Syntax Variants Proposal

### Variant 1: Double Dash Separator (`--`)

**The POSIX-standard approach used by most CLI tools.**

```bash
# Syntax: command [wrapper-options] -- [runner-options]

# Example for Node.js
npx test-anywhere --verbose -- --test-timeout=5000

# Example for Bun
bunx test-anywhere --config=custom.json -- --bail

# Example for Deno
deno run test-anywhere --format=json -- --allow-read
```

**Pros:**

- POSIX standard - widely recognized across Unix-like systems
- Used by npm, yarn, docker, git, and many other tools
- Works in bash, zsh, sh, dash, fish, and most Unix shells

**Cons:**

- Some Windows tools may not handle it well
- Fish shell handles `--` slightly differently in some edge cases

**Shell Compatibility:**

| Shell      | Support | Notes                               |
| ---------- | ------- | ----------------------------------- |
| bash       | Full    | Standard POSIX behavior             |
| zsh        | Full    | Standard POSIX behavior             |
| sh/dash    | Full    | POSIX baseline                      |
| fish       | Full    | Works but fish is not POSIX         |
| PowerShell | Partial | Works when calling native commands  |
| cmd.exe    | Partial | Depends on the receiving executable |

### Variant 2: Explicit Prefix for Runner Options (`-X` or `--pass`)

**A flag that marks subsequent options as pass-through.**

```bash
# Syntax using -X (similar to curl, java)
npx test-anywhere --verbose -X --test-timeout=5000 -X --bail

# Syntax using --pass (explicit)
npx test-anywhere --verbose --pass=--test-timeout=5000 --pass=--bail

# Syntax using --runner-args (descriptive)
npx test-anywhere --verbose --runner-args="--test-timeout=5000 --bail"
```

**Pros:**

- Explicit and self-documenting
- No ambiguity about which options go where
- Works well in Windows environments

**Cons:**

- More verbose
- Non-standard, requires user learning

**Shell Compatibility:**

| Shell      | Support | Notes                     |
| ---------- | ------- | ------------------------- |
| bash       | Full    | Standard flag handling    |
| zsh        | Full    | Standard flag handling    |
| fish       | Full    | Standard flag handling    |
| PowerShell | Full    | String quoting works well |
| cmd.exe    | Full    | Works with proper quoting |

### Variant 3: Environment Variable Approach

**Use environment variables instead of command-line options.**

```bash
# Bash/Zsh
TEST_RUNNER_ARGS="--test-timeout=5000" npx test-anywhere --verbose

# PowerShell
$env:TEST_RUNNER_ARGS="--test-timeout=5000"; npx test-anywhere --verbose

# cmd.exe
set TEST_RUNNER_ARGS=--test-timeout=5000 && npx test-anywhere --verbose
```

**Pros:**

- Separates concerns completely
- No parsing conflicts
- Works in CI/CD pipelines

**Cons:**

- Different syntax for each shell/OS
- Less visible in command history
- Harder to override per-invocation

**Shell Compatibility:**

| Shell      | Support | Syntax                      |
| ---------- | ------- | --------------------------- |
| bash       | Full    | `VAR=value command`         |
| zsh        | Full    | `VAR=value command`         |
| fish       | Full    | `env VAR=value command`     |
| PowerShell | Full    | `$env:VAR="value"; command` |
| cmd.exe    | Full    | `set VAR=value && command`  |

### Variant 4: Subcommand Style

**Use subcommands to clearly separate contexts.**

```bash
# Syntax: command [wrapper-options] run [runner-options]
npx test-anywhere --verbose run --test-timeout=5000

# Alternative with 'exec'
npx test-anywhere --config=custom.json exec -- node --test --experimental-test-coverage
```

**Pros:**

- Very clear separation
- Follows patterns from docker, kubectl, git
- Self-documenting

**Cons:**

- Changes the command structure
- May conflict with existing usage patterns

**Shell Compatibility:**

| Shell      | Support | Notes                      |
| ---------- | ------- | -------------------------- |
| All shells | Full    | Standard argument handling |

### Variant 5: Config File Approach

**Specify runner options in a configuration file.**

```javascript
// test-anywhere.config.js
export default {
  verbose: true,
  runnerOptions: {
    node: ['--test-timeout=5000', '--experimental-test-coverage'],
    bun: ['--bail', '--coverage'],
    deno: ['--allow-read', '--allow-net'],
  },
};
```

```bash
# All options from config file
npx test-anywhere

# Override specific options
npx test-anywhere --config=test-anywhere.config.js
```

**Pros:**

- Clean command line
- Runtime-specific configuration
- Reusable across invocations

**Cons:**

- Requires file management
- Less flexible for one-off changes

## Recommendations

### Primary Recommendation: Double Dash (`--`)

The double dash separator is recommended as the **primary syntax** because:

1. **Industry standard** - npm, yarn, docker, and most CLI tools use this pattern
2. **POSIX compliant** - works in all POSIX-compatible shells
3. **Zero learning curve** for developers familiar with other tools
4. **Simple implementation** - well-understood parsing behavior

```bash
# Recommended syntax
npx test-anywhere [wrapper-options] -- [runner-options]

# Examples
npx test-anywhere --verbose -- --test-timeout=5000
npx test-anywhere -- --experimental-test-coverage
```

### Secondary Recommendation: Environment Variable

For CI/CD and cross-platform scripting, environment variables provide the best compatibility:

```yaml
# GitHub Actions example
- name: Run tests
  env:
    TEST_RUNNER_ARGS: '--test-timeout=30000'
  run: npx test-anywhere --verbose
```

### Tertiary Recommendation: Config File

For complex, reusable configurations, a config file approach works best:

```bash
# Simple invocation with complex config
npx test-anywhere --config=test-anywhere.config.js
```

## Shell-Specific Examples

### Bash / Zsh / sh

```bash
# Double dash (recommended)
npx test-anywhere --verbose -- --test-timeout=5000

# Environment variable
TEST_RUNNER_ARGS="--test-timeout=5000" npx test-anywhere --verbose

# Quoting complex options
npx test-anywhere -- --test-name-pattern="my test"
```

### Fish

```fish
# Double dash (works the same)
npx test-anywhere --verbose -- --test-timeout=5000

# Environment variable (fish-specific syntax)
env TEST_RUNNER_ARGS="--test-timeout=5000" npx test-anywhere --verbose
```

### PowerShell

```powershell
# Double dash
npx test-anywhere --verbose -- --test-timeout=5000

# Environment variable
$env:TEST_RUNNER_ARGS="--test-timeout=5000"
npx test-anywhere --verbose

# Using splatting for complex cases
$runnerArgs = @("--test-timeout=5000", "--experimental-test-coverage")
npx test-anywhere --verbose -- @runnerArgs
```

### cmd.exe (Windows Command Prompt)

```batch
:: Double dash
npx test-anywhere --verbose -- --test-timeout=5000

:: Environment variable
set TEST_RUNNER_ARGS=--test-timeout=5000
npx test-anywhere --verbose

:: In a single line
set TEST_RUNNER_ARGS=--test-timeout=5000 && npx test-anywhere --verbose
```

## Runtime-Specific Considerations

### Node.js (`node --test`)

```bash
# Pass options to Node.js test runner
npx test-anywhere -- --test-timeout=5000 --experimental-test-coverage

# Common Node.js test options:
# --test-timeout=<ms>
# --test-concurrency=<num>
# --experimental-test-coverage
# --test-reporter=<reporter>
# --test-name-pattern=<pattern>
```

### Bun (`bun test`)

```bash
# Pass options to Bun test runner
bunx test-anywhere -- --bail --coverage

# Common Bun test options:
# --bail
# --coverage
# --timeout=<ms>
# --rerun-each=<n>
```

### Deno (`deno test`)

```bash
# Pass options to Deno test runner
deno run test-anywhere -- --allow-read --allow-net

# Common Deno test options:
# --allow-read
# --allow-write
# --allow-net
# --allow-env
# --coverage=<dir>
```

## Implementation Notes

When implementing the double-dash separator:

1. **Use standard argument parsing**: Libraries like `yargs`, `commander`, or manual `process.argv` parsing handle `--` automatically

2. **Everything after `--` is literal**: Do not interpret options after the separator

3. **Pass through verbatim**: Forward all post-separator arguments to the underlying test runner

```javascript
// Example implementation
const args = process.argv.slice(2);
const separatorIndex = args.indexOf('--');

const wrapperArgs = separatorIndex >= 0 ? args.slice(0, separatorIndex) : args;
const runnerArgs = separatorIndex >= 0 ? args.slice(separatorIndex + 1) : [];

// wrapperArgs: options for test-anywhere
// runnerArgs: options to pass to node/bun/deno
```

## References

- [npm run-script documentation](https://docs.npmjs.com/cli/v10/commands/npm-run-script/)
- [POSIX Utility Conventions](https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/V1_chap12.html)
- [Deno CLI documentation](https://docs.deno.com/runtime/reference/cli/run/)
- [PowerShell Parameter Handling](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_environment_variables)
- [cross-env for cross-platform environment variables](https://github.com/kentcdodds/cross-env)
