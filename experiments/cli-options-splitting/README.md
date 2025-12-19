# CLI Options Splitting Experiments

This directory contains demo scripts that demonstrate different approaches to splitting CLI options between a wrapper command and the underlying test runner.

## Problem

When running tests through `test-anywhere`, users may need to pass options to:

1. The test-anywhere wrapper (e.g., `--verbose`, `--format=json`)
2. The underlying test runner (e.g., `--test-timeout=5000` for Node.js)

## Approaches Demonstrated

### 1. Double-Dash Separator (`--`)

The POSIX-standard approach used by npm, yarn, docker, and most CLI tools.

```bash
# Run the demo
node demo-double-dash.mjs --verbose --format=json -- --test-timeout=5000 --bail
```

**Output:**

```
Wrapper options (before --): [ '--verbose', '--format=json' ]
Runner options (after --):  [ '--test-timeout=5000', '--bail' ]
```

### 2. Environment Variable

Cross-platform approach using environment variables.

```bash
# Bash/Zsh
TEST_RUNNER_ARGS="--test-timeout=5000 --bail" node demo-env-variable.mjs --verbose

# Fish
env TEST_RUNNER_ARGS="--test-timeout=5000" node demo-env-variable.mjs --verbose

# PowerShell
$env:TEST_RUNNER_ARGS="--test-timeout=5000"; node demo-env-variable.mjs --verbose

# cmd.exe
set TEST_RUNNER_ARGS=--test-timeout=5000 && node demo-env-variable.mjs --verbose
```

## Shell Compatibility Matrix

| Approach           | bash | zsh | fish | PowerShell | cmd.exe |
| ------------------ | ---- | --- | ---- | ---------- | ------- |
| Double-dash (`--`) | Yes  | Yes | Yes  | Partial    | Partial |
| Environment var    | Yes  | Yes | Yes  | Yes        | Yes     |

## Recommendations

1. **Primary**: Use double-dash (`--`) for Unix/Linux/macOS
2. **Secondary**: Use environment variables for Windows and CI/CD
3. **Advanced**: Use a configuration file for complex setups

## Related Documentation

See [CLI_OPTIONS_SPLITTING.md](../../docs/CLI_OPTIONS_SPLITTING.md) for the full proposal and detailed analysis.
