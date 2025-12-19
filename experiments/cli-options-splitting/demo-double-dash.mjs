#!/usr/bin/env node

/**
 * Demo: Double-dash (--) separator for CLI options splitting
 *
 * This script demonstrates how to parse CLI arguments using the POSIX-standard
 * double-dash separator to split wrapper options from runner options.
 *
 * Usage:
 *   node demo-double-dash.mjs --verbose --format=json -- --test-timeout=5000 --bail
 *
 * In this example:
 *   - Wrapper options: --verbose, --format=json
 *   - Runner options: --test-timeout=5000, --bail
 */

const args = process.argv.slice(2);

// Find the double-dash separator
const separatorIndex = args.indexOf('--');

// Split arguments at the separator
const wrapperArgs = separatorIndex >= 0 ? args.slice(0, separatorIndex) : args;
const runnerArgs = separatorIndex >= 0 ? args.slice(separatorIndex + 1) : [];

console.log('='.repeat(60));
console.log('Double-Dash CLI Options Splitting Demo');
console.log('='.repeat(60));
console.log();
console.log('Raw arguments:', args);
console.log('Separator index:', separatorIndex);
console.log();
console.log('Wrapper options (before --):', wrapperArgs);
console.log('Runner options (after --):', runnerArgs);
console.log();

// Parse wrapper options (simple example)
const wrapperConfig = {};
for (const arg of wrapperArgs) {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=');
    wrapperConfig[key] = value !== undefined ? value : true;
  }
}

console.log('Parsed wrapper config:', wrapperConfig);
console.log('Runner args to pass through:', runnerArgs.join(' '));
console.log();
console.log('='.repeat(60));

// Example of how this would be used in practice
console.log();
console.log('Example usage with different runtimes:');
console.log();
console.log('  Node.js:');
console.log(
  `    node --test ${runnerArgs.length ? runnerArgs.join(' ') : '--test-timeout=5000'} tests/`
);
console.log();
console.log('  Bun:');
console.log(
  `    bun test ${runnerArgs.length ? runnerArgs.join(' ') : '--bail'}`
);
console.log();
console.log('  Deno:');
console.log(
  `    deno test ${runnerArgs.length ? runnerArgs.join(' ') : '--allow-read'}`
);
