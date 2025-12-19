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
 *
 * Supports isolation modes for running tests in isolated environments:
 *   - screen: GNU Screen terminal multiplexer
 *   - tmux: tmux terminal multiplexer
 *   - docker: Docker container isolation
 *   - byobu: Byobu terminal multiplexer (wraps tmux/screen)
 *   - nohup: Simple background execution with nohup
 */

import { spawn, execSync } from 'node:child_process';
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

// Valid isolation modes
const VALID_ISOLATION_MODES = ['screen', 'tmux', 'docker', 'byobu', 'nohup'];

// Check if a runtime is available
function isRuntimeAvailable(runtime) {
  return new Promise((resolvePromise) => {
    const command = runtime === 'node' ? 'node' : runtime;
    const child = spawn(command, ['--version'], {
      stdio: 'ignore',
      shell: process.platform === 'win32',
    });

    child.on('error', () => resolvePromise(false));
    child.on('close', (code) => resolvePromise(code === 0));
  });
}

// Check if an isolation tool is available
function isIsolationToolAvailable(tool) {
  try {
    execSync(`which ${tool}`, { stdio: 'ignore' });
    return true;
  } catch {
    // On Windows, try where command
    if (process.platform === 'win32') {
      try {
        execSync(`where ${tool}`, { stdio: 'ignore' });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
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
    isolated: null, // null means no isolation, string for isolation mode
    attached: false,
    detached: false,
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
    } else if (arg === '--attached') {
      wrapperOptions.attached = true;
    } else if (arg === '--detached') {
      wrapperOptions.detached = true;
    } else if (arg.startsWith('--isolated=')) {
      // --isolated=<mode> syntax
      const mode = arg.substring('--isolated='.length);
      if (!VALID_ISOLATION_MODES.includes(mode)) {
        console.error(`Error: Invalid isolation mode '${mode}'.`);
        console.error(`Valid modes are: ${VALID_ISOLATION_MODES.join(', ')}`);
        process.exit(1);
      }
      wrapperOptions.isolated = mode;
    } else if (arg === '--isolated') {
      // --isolated <mode> syntax (space-separated)
      const nextArg = args[i + 1];
      if (!nextArg || nextArg.startsWith('-')) {
        console.error('Error: --isolated requires a mode argument.');
        console.error(`Valid modes are: ${VALID_ISOLATION_MODES.join(', ')}`);
        process.exit(1);
      }
      if (!VALID_ISOLATION_MODES.includes(nextArg)) {
        console.error(`Error: Invalid isolation mode '${nextArg}'.`);
        console.error(`Valid modes are: ${VALID_ISOLATION_MODES.join(', ')}`);
        process.exit(1);
      }
      wrapperOptions.isolated = nextArg;
      i++; // Skip the mode argument
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

// Validate wrapper options
function validateOptions(wrapperOptions) {
  // Check for mutually exclusive --attached and --detached
  if (wrapperOptions.attached && wrapperOptions.detached) {
    console.error(
      'Error: Cannot use both --attached and --detached at the same time.'
    );
    console.error('Please choose only one of these options.');
    process.exit(1);
  }

  // --attached and --detached only make sense with --isolated
  if (
    (wrapperOptions.attached || wrapperOptions.detached) &&
    !wrapperOptions.isolated
  ) {
    console.error(
      'Error: --attached and --detached options require --isolated to be set.'
    );
    console.error('Example: test-anywhere --isolated=screen --detached tests/');
    process.exit(1);
  }

  // Check if isolation tool is available
  if (wrapperOptions.isolated) {
    const tool = wrapperOptions.isolated;
    if (!isIsolationToolAvailable(tool)) {
      console.error(
        `Error: Isolation tool '${tool}' is not installed or not in PATH.`
      );
      console.error(`Please install ${tool} to use this isolation mode.`);
      process.exit(1);
    }
  }
}

// Show help message
function showHelp() {
  console.log(`test-anywhere v${getVersion()}

A universal testing framework CLI that works across Bun, Deno, and Node.js.

USAGE:
  test-anywhere [wrapper-options] [test-files...] [-- | command] [runner-options]

WRAPPER OPTIONS:
  -h, --help              Show this help message
  -v, --version           Show version number
  --verbose               Enable verbose output
  --isolated=<mode>       Run tests in isolated environment
                          Modes: screen, tmux, docker, byobu, nohup
  --attached              Run isolated session in attached mode (foreground)
  --detached              Run isolated session in detached mode (background)

OPTION SPLITTING:
  Use one of two syntax variants to pass options to the underlying test runner:

  1. Double-dash separator (POSIX standard):
     test-anywhere --verbose -- --test-timeout=5000

  2. Command keyword separator:
     test-anywhere --verbose command --test-timeout=5000

  Note: Use only ONE separator style per invocation, not both.

ISOLATION MODES:
  Isolation modes run tests in separate environments for better reproducibility
  and to prevent test interference.

  screen    - GNU Screen terminal multiplexer
              Supports --attached (default) and --detached modes
  tmux      - tmux terminal multiplexer
              Supports --attached (default) and --detached modes
  docker    - Docker container isolation
              Supports --attached (default) and --detached modes
  byobu     - Byobu terminal multiplexer (wraps tmux/screen)
              Supports --attached (default) and --detached modes
  nohup     - Simple background execution with nohup
              Always runs in detached mode

  Note: You cannot use both --attached and --detached at the same time.
        Default behavior is --attached for all modes except nohup.

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

  # Run tests in screen (attached mode)
  test-anywhere --isolated=screen tests/

  # Run tests in tmux (detached mode)
  test-anywhere --isolated=tmux --detached tests/

  # Run tests in docker container
  test-anywhere --isolated=docker tests/

  # Run tests in background with nohup
  test-anywhere --isolated=nohup tests/

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

// Build the full command string to run
function buildFullCommand(runtime, commandArgs) {
  return `${runtime} ${commandArgs.join(' ')}`;
}

// Generate a unique session name for isolation
function generateSessionName() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `test-anywhere-${timestamp}-${random}`;
}

// Run tests in screen isolation mode
function runWithScreen(fullCommand, detached, verbose, sessionName) {
  const args = [];

  if (detached) {
    // Detached mode: start screen session in background
    args.push('-dmS', sessionName, 'bash', '-c', fullCommand);
    if (verbose) {
      console.log(
        `[test-anywhere] Starting detached screen session: ${sessionName}`
      );
      console.log(`[test-anywhere] Attach with: screen -r ${sessionName}`);
    }
  } else {
    // Attached mode: start screen session in foreground
    args.push('-S', sessionName, 'bash', '-c', fullCommand);
  }

  if (verbose) {
    console.log(`[test-anywhere] Screen command: screen ${args.join(' ')}`);
  }

  return { command: 'screen', args, detached };
}

// Run tests in tmux isolation mode
function runWithTmux(fullCommand, detached, verbose, sessionName) {
  const args = [];

  if (detached) {
    // Detached mode: create new session in background
    args.push(
      'new-session',
      '-d',
      '-s',
      sessionName,
      'bash',
      '-c',
      fullCommand
    );
    if (verbose) {
      console.log(
        `[test-anywhere] Starting detached tmux session: ${sessionName}`
      );
      console.log(`[test-anywhere] Attach with: tmux attach -t ${sessionName}`);
    }
  } else {
    // Attached mode: create new session in foreground
    args.push('new-session', '-s', sessionName, 'bash', '-c', fullCommand);
  }

  if (verbose) {
    console.log(`[test-anywhere] tmux command: tmux ${args.join(' ')}`);
  }

  return { command: 'tmux', args, detached };
}

// Run tests in docker isolation mode
function runWithDocker(fullCommand, detached, verbose, sessionName) {
  const args = ['run', '--rm'];

  if (detached) {
    args.push('-d');
    args.push('--name', sessionName);
  } else {
    args.push('-it');
  }

  // Use a reasonable default image with Node.js
  // Users can override this via environment variable
  const dockerImage =
    process.env.TEST_ANYWHERE_DOCKER_IMAGE || 'node:20-alpine';

  // Mount current working directory
  const cwd = process.cwd();
  args.push('-v', `${cwd}:/app`, '-w', '/app');

  args.push(dockerImage);
  args.push('sh', '-c', fullCommand);

  if (verbose) {
    console.log(`[test-anywhere] Docker command: docker ${args.join(' ')}`);
    if (detached) {
      console.log(`[test-anywhere] Container name: ${sessionName}`);
      console.log(`[test-anywhere] View logs: docker logs -f ${sessionName}`);
      console.log(`[test-anywhere] Stop with: docker stop ${sessionName}`);
    }
  }

  return { command: 'docker', args, detached };
}

// Run tests in byobu isolation mode
function runWithByobu(fullCommand, detached, verbose, sessionName) {
  const args = [];

  if (detached) {
    // Byobu uses screen/tmux underneath - use new-session for tmux backend
    args.push(
      'new-session',
      '-d',
      '-s',
      sessionName,
      '--',
      'bash',
      '-c',
      fullCommand
    );
    if (verbose) {
      console.log(
        `[test-anywhere] Starting detached byobu session: ${sessionName}`
      );
      console.log(
        `[test-anywhere] Attach with: byobu attach -t ${sessionName}`
      );
    }
  } else {
    // Attached mode
    args.push(
      'new-session',
      '-s',
      sessionName,
      '--',
      'bash',
      '-c',
      fullCommand
    );
  }

  if (verbose) {
    console.log(`[test-anywhere] Byobu command: byobu ${args.join(' ')}`);
  }

  return { command: 'byobu', args, detached };
}

// Run tests with nohup (always detached)
function runWithNohup(fullCommand, verbose, sessionName) {
  // nohup always runs in detached mode
  // Output goes to nohup.out by default or to a named log file
  const logFile = `${sessionName}.log`;
  const args = ['bash', '-c', `${fullCommand} > ${logFile} 2>&1 &`];

  if (verbose) {
    console.log(`[test-anywhere] Running with nohup in background`);
    console.log(`[test-anywhere] Output will be written to: ${logFile}`);
    console.log(`[test-anywhere] View logs: tail -f ${logFile}`);
  }

  return { command: 'nohup', args, logFile, detached: true };
}

// Execute isolated command
function executeIsolated(isolationConfig) {
  const { command, args, detached, logFile } = isolationConfig;

  if (command === 'nohup') {
    // Special handling for nohup - use shell to background the process
    const child = spawn('bash', ['-c', `nohup ${args.slice(1).join(' ')}`], {
      stdio: detached ? 'ignore' : 'inherit',
      detached: true,
      shell: false,
    });

    if (detached) {
      child.unref();
      console.log(`[test-anywhere] Tests running in background.`);
      console.log(`[test-anywhere] Check ${logFile} for output.`);
      process.exit(0);
    }

    return child;
  }

  const child = spawn(command, args, {
    stdio: detached ? 'ignore' : 'inherit',
    detached,
    shell: process.platform === 'win32',
  });

  if (detached) {
    child.unref();
    console.log(`[test-anywhere] Tests running in detached session.`);
    process.exit(0);
  }

  return child;
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

  // Validate options
  validateOptions(wrapperOptions);

  // Find best runtime
  const runtime = await findBestRuntime(wrapperOptions.verbose);

  if (!runtime) {
    console.error(
      'Error: No supported JavaScript runtime found (bun, deno, or node).'
    );
    console.error('Please install one of these runtimes to use test-anywhere.');
    process.exit(1);
  }

  // Build command arguments
  const commandArgs = buildCommand(
    runtime,
    testFiles,
    commandOptions,
    wrapperOptions.verbose
  );

  // Handle isolation modes
  if (wrapperOptions.isolated) {
    const fullCommand = buildFullCommand(runtime, commandArgs);
    const sessionName = generateSessionName();
    // Default to attached mode unless explicitly set to detached
    // nohup is always detached
    const detached =
      wrapperOptions.isolated === 'nohup' ? true : wrapperOptions.detached;
    const verbose = wrapperOptions.verbose;

    let isolationConfig;

    switch (wrapperOptions.isolated) {
      case 'screen':
        isolationConfig = runWithScreen(
          fullCommand,
          detached,
          verbose,
          sessionName
        );
        break;
      case 'tmux':
        isolationConfig = runWithTmux(
          fullCommand,
          detached,
          verbose,
          sessionName
        );
        break;
      case 'docker':
        isolationConfig = runWithDocker(
          fullCommand,
          detached,
          verbose,
          sessionName
        );
        break;
      case 'byobu':
        isolationConfig = runWithByobu(
          fullCommand,
          detached,
          verbose,
          sessionName
        );
        break;
      case 'nohup':
        isolationConfig = runWithNohup(fullCommand, verbose, sessionName);
        break;
      default:
        console.error(
          `Error: Unknown isolation mode '${wrapperOptions.isolated}'`
        );
        process.exit(1);
    }

    const child = executeIsolated(isolationConfig);

    child.on('error', (err) => {
      console.error(
        `Error: Failed to start ${wrapperOptions.isolated}: ${err.message}`
      );
      process.exit(1);
    });

    child.on('close', (code) => {
      process.exit(code ?? 0);
    });

    return;
  }

  // Standard execution (no isolation)
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
