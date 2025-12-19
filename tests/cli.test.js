/**
 * CLI tests for test-anywhere
 * Tests the CLI entry point functionality including --help, --version, --verbose,
 * and the two syntax variants for option splitting.
 */

import { test, describe, assert } from '../src/index.js';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CLI_PATH = join(__dirname, '..', 'bin', 'test-anywhere.js');

/**
 * Helper to run CLI command and capture output
 */
function runCli(args = [], options = {}) {
  const fullArgs = ['node', CLI_PATH, ...args];
  const command = fullArgs.join(' ');

  try {
    const output = execSync(command, {
      encoding: 'utf-8',
      timeout: 10000,
      ...options,
    });
    return { stdout: output, exitCode: 0 };
  } catch (error) {
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      exitCode: error.status || 1,
    };
  }
}

describe('CLI --version option', () => {
  test('--version outputs version number', () => {
    const result = runCli(['--version']);
    assert.equal(result.exitCode, 0, 'exit code should be 0');
    // Version should be a semver-like string
    assert.match(
      result.stdout.trim(),
      /^\d+\.\d+\.\d+/,
      'should output version in semver format'
    );
  });

  test('-v outputs version number', () => {
    const result = runCli(['-v']);
    assert.equal(result.exitCode, 0, 'exit code should be 0');
    assert.match(
      result.stdout.trim(),
      /^\d+\.\d+\.\d+/,
      'should output version in semver format'
    );
  });
});

describe('CLI --help option', () => {
  test('--help outputs help message', () => {
    const result = runCli(['--help']);
    assert.equal(result.exitCode, 0, 'exit code should be 0');
    assert.ok(
      result.stdout.includes('test-anywhere'),
      'should mention test-anywhere'
    );
    assert.ok(result.stdout.includes('USAGE:'), 'should include USAGE section');
    assert.ok(
      result.stdout.includes('WRAPPER OPTIONS:'),
      'should include WRAPPER OPTIONS section'
    );
    assert.ok(
      result.stdout.includes('OPTION SPLITTING:'),
      'should include OPTION SPLITTING section'
    );
    assert.ok(
      result.stdout.includes('EXAMPLES:'),
      'should include EXAMPLES section'
    );
  });

  test('-h outputs help message', () => {
    const result = runCli(['-h']);
    assert.equal(result.exitCode, 0, 'exit code should be 0');
    assert.ok(
      result.stdout.includes('test-anywhere'),
      'should mention test-anywhere'
    );
  });

  test('help message documents double-dash syntax', () => {
    const result = runCli(['--help']);
    assert.ok(
      result.stdout.includes('--'),
      'should document double-dash separator'
    );
    assert.ok(
      result.stdout.includes('Double-dash separator'),
      'should explain double-dash syntax'
    );
  });

  test('help message documents command keyword syntax', () => {
    const result = runCli(['--help']);
    assert.ok(
      result.stdout.includes('command'),
      'should document command keyword'
    );
    assert.ok(
      result.stdout.includes('Command keyword separator'),
      'should explain command keyword syntax'
    );
  });

  test('help message documents runtime priority', () => {
    const result = runCli(['--help']);
    assert.ok(
      result.stdout.includes('RUNTIME PRIORITY:'),
      'should include RUNTIME PRIORITY section'
    );
    assert.ok(
      result.stdout.includes('Bun (preferred)'),
      'should show Bun as preferred runtime'
    );
  });
});

describe('CLI --verbose option', () => {
  test('--verbose is documented in help', () => {
    const result = runCli(['--help']);
    assert.ok(
      result.stdout.includes('--verbose'),
      'should document --verbose option'
    );
    assert.ok(
      result.stdout.includes('Enable verbose output'),
      'should describe --verbose option'
    );
  });
});

describe('CLI option splitting syntax', () => {
  test('help explains that only one separator can be used', () => {
    const result = runCli(['--help']);
    assert.ok(
      result.stdout.includes('Use only ONE separator style'),
      'should warn about using only one separator'
    );
  });

  test('help shows double-dash example', () => {
    const result = runCli(['--help']);
    assert.ok(
      result.stdout.includes('test-anywhere --verbose -- --test-timeout=5000'),
      'should show double-dash example'
    );
  });

  test('help shows command keyword example', () => {
    const result = runCli(['--help']);
    assert.ok(
      result.stdout.includes(
        'test-anywhere --verbose command --test-timeout=5000'
      ),
      'should show command keyword example'
    );
  });
});

describe('CLI documentation link', () => {
  test('help includes documentation link', () => {
    const result = runCli(['--help']);
    assert.ok(
      result.stdout.includes(
        'https://github.com/link-foundation/test-anywhere'
      ),
      'should include GitHub repository link'
    );
  });
});
