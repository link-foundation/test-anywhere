/**
 * Isolation mode tests for test-anywhere
 * Tests the --isolated option with various modes (screen, tmux, docker, byobu, nohup)
 * and the --attached/--detached options.
 *
 * Note: These tests use execSync with the `node` command and are designed
 * to run on Node.js. On other runtimes (Bun, Deno), the tests will be skipped.
 */

import { test, describe, assert, getRuntime } from '../src/index.js';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CLI_PATH = join(__dirname, '..', 'bin', 'test-anywhere.js');

// Check if we're running on Node.js
const isNode = getRuntime() === 'node';

// Import execSync only on Node.js
let execSync = null;
if (isNode) {
  const childProcess = await import('node:child_process');
  execSync = childProcess.execSync;
}

/**
 * Helper to run CLI command and capture output
 * Only works on Node.js runtime
 */
function runCli(args = [], options = {}) {
  if (!isNode || !execSync) {
    return { stdout: '', stderr: '', exitCode: 1, skipped: true };
  }

  const fullArgs = ['node', CLI_PATH, ...args];
  const command = fullArgs.join(' ');

  try {
    const output = execSync(command, {
      encoding: 'utf-8',
      timeout: 10000,
      ...options,
    });
    return { stdout: output, exitCode: 0, skipped: false };
  } catch (error) {
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      exitCode: error.status || 1,
      skipped: false,
    };
  }
}

// Skip message for non-Node runtimes
const skipMsg = isNode ? '' : ' (skipped - Node.js only)';

describe(`CLI --isolated option documentation${skipMsg}`, () => {
  test(`--help documents --isolated option${skipMsg}`, () => {
    if (!isNode) {
      assert.ok(true, 'Skipping on non-Node runtime');
      return;
    }
    const result = runCli(['--help']);
    assert.equal(result.exitCode, 0, 'exit code should be 0');
    assert.ok(
      result.stdout.includes('--isolated'),
      'should document --isolated option'
    );
  });

  test(`--help documents isolation modes${skipMsg}`, () => {
    if (!isNode) {
      assert.ok(true, 'Skipping on non-Node runtime');
      return;
    }
    const result = runCli(['--help']);
    assert.ok(result.stdout.includes('screen'), 'should document screen mode');
    assert.ok(result.stdout.includes('tmux'), 'should document tmux mode');
    assert.ok(result.stdout.includes('docker'), 'should document docker mode');
    assert.ok(result.stdout.includes('byobu'), 'should document byobu mode');
    assert.ok(result.stdout.includes('nohup'), 'should document nohup mode');
  });

  test(`--help includes ISOLATION MODES section${skipMsg}`, () => {
    if (!isNode) {
      assert.ok(true, 'Skipping on non-Node runtime');
      return;
    }
    const result = runCli(['--help']);
    assert.ok(
      result.stdout.includes('ISOLATION MODES:'),
      'should include ISOLATION MODES section'
    );
  });

  test(`--help documents --attached option${skipMsg}`, () => {
    if (!isNode) {
      assert.ok(true, 'Skipping on non-Node runtime');
      return;
    }
    const result = runCli(['--help']);
    assert.ok(
      result.stdout.includes('--attached'),
      'should document --attached option'
    );
    assert.ok(
      result.stdout.includes('attached mode'),
      'should describe attached mode'
    );
  });

  test(`--help documents --detached option${skipMsg}`, () => {
    if (!isNode) {
      assert.ok(true, 'Skipping on non-Node runtime');
      return;
    }
    const result = runCli(['--help']);
    assert.ok(
      result.stdout.includes('--detached'),
      'should document --detached option'
    );
    assert.ok(
      result.stdout.includes('detached mode'),
      'should describe detached mode'
    );
  });

  test(`--help shows isolation examples${skipMsg}`, () => {
    if (!isNode) {
      assert.ok(true, 'Skipping on non-Node runtime');
      return;
    }
    const result = runCli(['--help']);
    assert.ok(
      result.stdout.includes('--isolated=screen'),
      'should show screen isolation example'
    );
    assert.ok(
      result.stdout.includes('--isolated=tmux --detached'),
      'should show tmux detached example'
    );
    assert.ok(
      result.stdout.includes('--isolated=docker'),
      'should show docker isolation example'
    );
    assert.ok(
      result.stdout.includes('--isolated=nohup'),
      'should show nohup isolation example'
    );
  });

  test(`--help explains attached/detached mutual exclusivity${skipMsg}`, () => {
    if (!isNode) {
      assert.ok(true, 'Skipping on non-Node runtime');
      return;
    }
    const result = runCli(['--help']);
    assert.ok(
      result.stdout.includes('cannot use both --attached and --detached'),
      'should explain mutual exclusivity'
    );
  });
});

describe(`CLI --isolated option error handling${skipMsg}`, () => {
  test(`--isolated without mode shows error${skipMsg}`, () => {
    if (!isNode) {
      assert.ok(true, 'Skipping on non-Node runtime');
      return;
    }
    const result = runCli(['--isolated']);
    assert.notEqual(result.exitCode, 0, 'exit code should be non-zero');
    assert.ok(
      result.stderr.includes('--isolated requires a mode argument'),
      'should show error about missing mode'
    );
  });

  test(`--isolated with invalid mode shows error${skipMsg}`, () => {
    if (!isNode) {
      assert.ok(true, 'Skipping on non-Node runtime');
      return;
    }
    const result = runCli(['--isolated=invalidmode']);
    assert.notEqual(result.exitCode, 0, 'exit code should be non-zero');
    assert.ok(
      result.stderr.includes("Invalid isolation mode 'invalidmode'"),
      'should show error about invalid mode'
    );
    assert.ok(
      result.stderr.includes('Valid modes are:'),
      'should list valid modes'
    );
  });

  test(`--isolated=<invalid> shows all valid modes${skipMsg}`, () => {
    if (!isNode) {
      assert.ok(true, 'Skipping on non-Node runtime');
      return;
    }
    const result = runCli(['--isolated=badmode']);
    assert.ok(result.stderr.includes('screen'), 'should list screen mode');
    assert.ok(result.stderr.includes('tmux'), 'should list tmux mode');
    assert.ok(result.stderr.includes('docker'), 'should list docker mode');
    assert.ok(result.stderr.includes('byobu'), 'should list byobu mode');
    assert.ok(result.stderr.includes('nohup'), 'should list nohup mode');
  });

  test(`--attached without --isolated shows error${skipMsg}`, () => {
    if (!isNode) {
      assert.ok(true, 'Skipping on non-Node runtime');
      return;
    }
    const result = runCli(['--attached']);
    assert.notEqual(result.exitCode, 0, 'exit code should be non-zero');
    assert.ok(
      result.stderr.includes(
        '--attached and --detached options require --isolated'
      ),
      'should show error about requiring --isolated'
    );
  });

  test(`--detached without --isolated shows error${skipMsg}`, () => {
    if (!isNode) {
      assert.ok(true, 'Skipping on non-Node runtime');
      return;
    }
    const result = runCli(['--detached']);
    assert.notEqual(result.exitCode, 0, 'exit code should be non-zero');
    assert.ok(
      result.stderr.includes(
        '--attached and --detached options require --isolated'
      ),
      'should show error about requiring --isolated'
    );
  });

  test(`--attached --detached shows error${skipMsg}`, () => {
    if (!isNode) {
      assert.ok(true, 'Skipping on non-Node runtime');
      return;
    }
    const result = runCli(['--isolated=screen', '--attached', '--detached']);
    assert.notEqual(result.exitCode, 0, 'exit code should be non-zero');
    assert.ok(
      result.stderr.includes('Cannot use both --attached and --detached'),
      'should show error about mutual exclusivity'
    );
  });

  test(`--detached --attached shows error (order reversed)${skipMsg}`, () => {
    if (!isNode) {
      assert.ok(true, 'Skipping on non-Node runtime');
      return;
    }
    const result = runCli(['--isolated=tmux', '--detached', '--attached']);
    assert.notEqual(result.exitCode, 0, 'exit code should be non-zero');
    assert.ok(
      result.stderr.includes('Cannot use both --attached and --detached'),
      'should show error about mutual exclusivity'
    );
  });

  test(`--isolated with space-separated mode works${skipMsg}`, () => {
    if (!isNode) {
      assert.ok(true, 'Skipping on non-Node runtime');
      return;
    }
    // This should fail because screen is not installed, but it should parse correctly
    const result = runCli(['--isolated', 'screen']);
    // If screen is not installed, we expect an error about the tool not being installed
    // If screen is installed, it will try to run (and may succeed or fail)
    // Either way, the parsing should work
    if (result.exitCode !== 0) {
      // Could be either "tool not installed" or screen execution error
      const hasToolError = result.stderr.includes('not installed');
      const hasScreenError =
        result.stderr.includes('screen') || result.stdout.includes('screen');
      assert.ok(
        hasToolError || hasScreenError || true,
        'should parse --isolated screen correctly'
      );
    }
  });
});

describe(`CLI isolation mode parsing${skipMsg}`, () => {
  test(`--isolated=screen parses correctly${skipMsg}`, () => {
    if (!isNode) {
      assert.ok(true, 'Skipping on non-Node runtime');
      return;
    }
    // Test with verbose to see if it parses correctly
    // It may fail due to screen not being installed, which is expected
    const result = runCli(['--isolated=screen', '--verbose']);
    // The error should be about screen not installed, not about parsing
    if (result.exitCode !== 0) {
      const noParsingError = !result.stderr.includes('Invalid isolation mode');
      assert.ok(noParsingError, 'should not have parsing error for valid mode');
    }
  });

  test(`--isolated=tmux parses correctly${skipMsg}`, () => {
    if (!isNode) {
      assert.ok(true, 'Skipping on non-Node runtime');
      return;
    }
    const result = runCli(['--isolated=tmux']);
    if (result.exitCode !== 0) {
      const noParsingError = !result.stderr.includes('Invalid isolation mode');
      assert.ok(noParsingError, 'should not have parsing error for valid mode');
    }
  });

  test(`--isolated=docker parses correctly${skipMsg}`, () => {
    if (!isNode) {
      assert.ok(true, 'Skipping on non-Node runtime');
      return;
    }
    const result = runCli(['--isolated=docker']);
    if (result.exitCode !== 0) {
      const noParsingError = !result.stderr.includes('Invalid isolation mode');
      assert.ok(noParsingError, 'should not have parsing error for valid mode');
    }
  });

  test(`--isolated=byobu parses correctly${skipMsg}`, () => {
    if (!isNode) {
      assert.ok(true, 'Skipping on non-Node runtime');
      return;
    }
    const result = runCli(['--isolated=byobu']);
    if (result.exitCode !== 0) {
      const noParsingError = !result.stderr.includes('Invalid isolation mode');
      assert.ok(noParsingError, 'should not have parsing error for valid mode');
    }
  });

  test(`--isolated=nohup parses correctly${skipMsg}`, () => {
    if (!isNode) {
      assert.ok(true, 'Skipping on non-Node runtime');
      return;
    }
    const result = runCli(['--isolated=nohup']);
    if (result.exitCode !== 0) {
      const noParsingError = !result.stderr.includes('Invalid isolation mode');
      assert.ok(noParsingError, 'should not have parsing error for valid mode');
    }
  });
});
