#!/usr/bin/env node
/**
 * test-anywhere CLI
 *
 * A universal testing framework CLI that works across Bun, Deno, and Node.js.
 * Automatically detects and uses the available runtime for running tests.
 *
 * Supports two syntax variants for option splitting:
 *   1. Double-dash: $ [wrapper-options] -- [command-options]
 *   2. Command keyword: $ [wrapper-options] command [command-options]
 */

import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json for version
function getVersion() {
  try {
    const packageJsonPath = join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    return packageJson.version;
  } catch {
    return 'unknown';
  }
}

// Check if a runtime is available
function isRuntimeAvailable(runtime) {
  return new Promise((resolve) => {
    const command = runtime === 'node' ? 'node' : runtime;
    const child = spawn(command, ['--version'], {
      stdio: 'ignore',
      shell: process.platform === 'win32',
    });

    child.on('error', () => resolve(false));
    child.on('close', (code) => resolve(code === 0));
  });
}

// Find the best available runtime (Bun-first priority)
async function findBestRuntime(verbose) {
  const runtimes = ['bun', 'deno', 'node'];

  for (const runtime of runtimes) {
    const available = await isRuntimeAvailable(runtime);
    if (available) {
      if (verbose) {
        console.log(`[test-anywhere] Using runtime: ${runtime}`);
      }
      return runtime;
    }
  }

  return null;
}

// Parse CLI arguments
function parseArgs(args) {
  const wrapperOptions = {
    help: false,
    version: false,
    verbose: false,
  };
  let commandOptions = [];
  const testFiles = [];
  let separatorFound = null;

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    // Check for double-dash separator
    if (arg === '--') {
      if (separatorFound === 'command') {
        console.error(
          'Error: Cannot use both "--" and "command" separators in the same invocation.'
        );
        console.error(
          'Use either: test-anywhere [options] -- [runner-options]'
        );
        console.error(
          '       or: test-anywhere [options] command [runner-options]'
        );
        process.exit(1);
      }
      separatorFound = '--';
      commandOptions = args.slice(i + 1);
      break;
    }

    // Check for command keyword separator
    if (arg === 'command') {
      if (separatorFound === '--') {
        console.error(
          'Error: Cannot use both "--" and "command" separators in the same invocation.'
        );
        console.error(
          'Use either: test-anywhere [options] -- [runner-options]'
        );
        console.error(
          '       or: test-anywhere [options] command [runner-options]'
        );
        process.exit(1);
      }
      separatorFound = 'command';
      commandOptions = args.slice(i + 1);
      break;
    }

    // Parse wrapper options
    if (arg === '--help' || arg === '-h') {
      wrapperOptions.help = true;
    } else if (arg === '--version' || arg === '-v') {
      wrapperOptions.version = true;
    } else if (arg === '--verbose') {
      wrapperOptions.verbose = true;
    } else if (!arg.startsWith('-')) {
      // Treat as test file/directory
      testFiles.push(arg);
    } else {
      // Unknown wrapper option - could be a test file pattern or error
      testFiles.push(arg);
    }

    i++;
  }

  return { wrapperOptions, commandOptions, testFiles, separatorFound };
}

// Show help message
function showHelp() {
  console.log(`test-anywhere v${getVersion()}

A universal testing framework CLI that works across Bun, Deno, and Node.js.

USAGE:
  test-anywhere [wrapper-options] [test-files...] [-- | command] [runner-options]

WRAPPER OPTIONS:
  -h, --help      Show this help message
  -v, --version   Show version number
  --verbose       Enable verbose output

OPTION SPLITTING:
  Use one of two syntax variants to pass options to the underlying test runner:

  1. Double-dash separator (POSIX standard):
     test-anywhere --verbose -- --test-timeout=5000

  2. Command keyword separator:
     test-anywhere --verbose command --test-timeout=5000

  Note: Use only ONE separator style per invocation, not both.

EXAMPLES:
  # Run tests in current directory
  test-anywhere

  # Run specific test files
  test-anywhere tests/unit.test.js tests/integration.test.js

  # Run with verbose output
  test-anywhere --verbose tests/

  # Pass timeout option to runner (double-dash syntax)
  test-anywhere -- --test-timeout=5000

  # Pass timeout option to runner (command keyword syntax)
  test-anywhere command --test-timeout=5000

  # Combined wrapper and runner options
  test-anywhere --verbose tests/ -- --test-timeout=5000

RUNTIME PRIORITY:
  The CLI automatically detects and uses runtimes in this order:
  1. Bun (preferred)
  2. Deno
  3. Node.js

DOCUMENTATION:
  https://github.com/link-foundation/test-anywhere
`);
}

// Build runtime command
function buildCommand(runtime, testFiles, commandOptions, verbose) {
  const args = [];

  switch (runtime) {
    case 'bun':
      args.push('test');
      // Add test files
      args.push(...testFiles);
      // Add runner options
      args.push(...commandOptions);
      break;

    case 'deno':
      args.push('test');
      args.push('--allow-read');
      // Add test files
      args.push(...testFiles);
      // Add runner options
      args.push(...commandOptions);
      break;

    case 'node':
      args.push('--test');
      // Add test files (default to tests/ if none specified)
      if (testFiles.length === 0) {
        args.push('tests/');
      } else {
        args.push(...testFiles);
      }
      // Add runner options
      args.push(...commandOptions);
      break;
  }

  if (verbose) {
    console.log(`[test-anywhere] Command: ${runtime} ${args.join(' ')}`);
  }

  return args;
}

// Main entry point
async function main() {
  const args = process.argv.slice(2);
  const { wrapperOptions, commandOptions, testFiles } = parseArgs(args);

  // Handle help
  if (wrapperOptions.help) {
    showHelp();
    process.exit(0);
  }

  // Handle version
  if (wrapperOptions.version) {
    console.log(getVersion());
    process.exit(0);
  }

  // Find best runtime
  const runtime = await findBestRuntime(wrapperOptions.verbose);

  if (!runtime) {
    console.error(
      'Error: No supported JavaScript runtime found (bun, deno, or node).'
    );
    console.error('Please install one of these runtimes to use test-anywhere.');
    process.exit(1);
  }

  // Build and run command
  const commandArgs = buildCommand(
    runtime,
    testFiles,
    commandOptions,
    wrapperOptions.verbose
  );

  const child = spawn(runtime, commandArgs, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  child.on('error', (err) => {
    console.error(`Error: Failed to start ${runtime}: ${err.message}`);
    process.exit(1);
  });

  child.on('close', (code) => {
    process.exit(code ?? 0);
  });
}

main();
