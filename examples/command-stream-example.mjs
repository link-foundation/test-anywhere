#!/usr/bin/env node

/**
 * Example usage of command-stream for CLI command execution
 *
 * command-stream provides a concise syntax for running CLI commands
 * with proper handling of stdout, stderr, exit codes, and cross-platform
 * built-in commands.
 *
 * Run this example with:
 *   node examples/command-stream-example.mjs
 *
 * @see https://github.com/link-foundation/command-stream
 */

// Download use-m dynamically to load command-stream without package.json
const { use } = eval(
  await (await fetch('https://unpkg.com/use-m/use.js')).text()
);

// Import command-stream using use-m
const { $ } = await use('command-stream');

console.log('=== command-stream Example ===\n');

// Example 1: Basic command execution
console.log('--- Basic Command Execution ---');
const lsResult = await $`ls -la`;
console.log(`Exit code: ${lsResult.code}`);

// Example 2: Capture output silently
console.log('\n--- Silent Capture Mode ---');
const $silent = $({ mirror: false, capture: true });
const pwdResult = await $silent`pwd`;
console.log(`Current directory: ${pwdResult.stdout.trim()}`);

// Example 3: Get node version
console.log('\n--- Node Version ---');
const nodeVersion = await $silent`node --version`;
console.log(`Node version: ${nodeVersion.stdout.trim()}`);

// Example 4: Check git status (if in a git repo)
console.log('\n--- Git Status ---');
try {
  const gitStatus = await $silent`git status --short`;
  if (gitStatus.stdout.trim()) {
    console.log('Git status:');
    console.log(gitStatus.stdout);
  } else {
    console.log('Working directory is clean');
  }
} catch {
  console.log('(Not a git repository)');
}

// Example 5: Environment variables
console.log('\n--- Environment Variables ---');
const $withEnv = $({
  env: { ...process.env, EXAMPLE_VAR: 'Hello from command-stream!' },
  capture: true,
  mirror: false,
});
const envResult =
  await $withEnv`node -e "console.log(process.env.EXAMPLE_VAR)"`;
console.log(`EXAMPLE_VAR: ${envResult.stdout.trim()}`);

// Example 6: Working with different directories
console.log('\n--- Working Directory ---');
const $inTmp = $({ cwd: '/tmp', capture: true, mirror: false });
const tmpPwd = await $inTmp`pwd`;
console.log(`Temporary directory: ${tmpPwd.stdout.trim()}`);

console.log('\n✅ command-stream example completed successfully!');
