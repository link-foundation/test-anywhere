#!/usr/bin/env node

/**
 * Demo: Environment variable approach for CLI options splitting
 *
 * This script demonstrates how to use environment variables to pass
 * runner options, which is more cross-platform friendly.
 *
 * Usage:
 *   # Bash/Zsh
 *   TEST_RUNNER_ARGS="--test-timeout=5000 --bail" node demo-env-variable.mjs --verbose
 *
 *   # Fish
 *   env TEST_RUNNER_ARGS="--test-timeout=5000" node demo-env-variable.mjs --verbose
 *
 *   # PowerShell
 *   $env:TEST_RUNNER_ARGS="--test-timeout=5000"; node demo-env-variable.mjs --verbose
 *
 *   # cmd.exe
 *   set TEST_RUNNER_ARGS=--test-timeout=5000 && node demo-env-variable.mjs --verbose
 */

const args = process.argv.slice(2);

// Get runner args from environment variable
const runnerArgsEnv = process.env.TEST_RUNNER_ARGS || '';
const runnerArgs = runnerArgsEnv
  ? runnerArgsEnv.split(/\s+/).filter(Boolean)
  : [];

// Parse wrapper options from CLI
const wrapperConfig = {};
for (const arg of args) {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=');
    wrapperConfig[key] = value !== undefined ? value : true;
  }
}

console.log('='.repeat(60));
console.log('Environment Variable CLI Options Splitting Demo');
console.log('='.repeat(60));
console.log();
console.log('CLI arguments:', args);
console.log('TEST_RUNNER_ARGS env:', runnerArgsEnv || '(not set)');
console.log();
console.log('Parsed wrapper config:', wrapperConfig);
console.log('Runner args from env:', runnerArgs);
console.log();
console.log('='.repeat(60));

// Cross-platform usage examples
console.log();
console.log('Cross-platform usage examples:');
console.log();
console.log('  Bash/Zsh:');
console.log(
  '    TEST_RUNNER_ARGS="--test-timeout=5000" node demo-env-variable.mjs --verbose'
);
console.log();
console.log('  Fish:');
console.log(
  '    env TEST_RUNNER_ARGS="--test-timeout=5000" node demo-env-variable.mjs --verbose'
);
console.log();
console.log('  PowerShell:');
console.log(
  '    $env:TEST_RUNNER_ARGS="--test-timeout=5000"; node demo-env-variable.mjs --verbose'
);
console.log();
console.log('  cmd.exe:');
console.log(
  '    set TEST_RUNNER_ARGS=--test-timeout=5000 && node demo-env-variable.mjs --verbose'
);
console.log();
console.log('  GitHub Actions:');
console.log('    - name: Run tests');
console.log('      env:');
console.log("        TEST_RUNNER_ARGS: '--test-timeout=30000'");
console.log('      run: npx test-anywhere --verbose');
