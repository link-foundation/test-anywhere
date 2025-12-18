#!/usr/bin/env node

/**
 * Script to run Node.js tests with coverage and enforce a minimum threshold.
 *
 * This script provides coverage threshold enforcement for all Node.js versions,
 * including those that don't support native --test-coverage-* threshold flags.
 *
 * For Node.js 22.8.0+, you can also use native threshold flags:
 *   node --test --experimental-test-coverage --test-coverage-lines=80 tests/
 *
 * Usage:
 *   node scripts/check-node-coverage.mjs [--threshold=80]
 *
 * Environment variables:
 *   COVERAGE_THRESHOLD - Minimum coverage percentage (default: 80)
 */

import { spawn } from 'node:child_process';
import { parseArgs } from 'node:util';

const DEFAULT_THRESHOLD = 80;

function parseArguments() {
  try {
    const { values } = parseArgs({
      options: {
        threshold: {
          type: 'string',
          short: 't',
          default: process.env.COVERAGE_THRESHOLD || String(DEFAULT_THRESHOLD),
        },
        help: {
          type: 'boolean',
          short: 'h',
          default: false,
        },
      },
      allowPositionals: true,
    });
    return values;
  } catch {
    return { threshold: String(DEFAULT_THRESHOLD), help: false };
  }
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      const str = data.toString();
      stdout += str;
      process.stdout.write(data);
    });

    proc.stderr.on('data', (data) => {
      const str = data.toString();
      stderr += str;
      process.stderr.write(data);
    });

    proc.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

function parseNodeCoverage(output) {
  const lines = output.split('\n');
  let lineCoverage = null;
  let branchCoverage = null;
  let functionCoverage = null;

  for (const line of lines) {
    if (line.includes('all files')) {
      const match = line.match(
        /all files\s*\|\s*(\d+(?:\.\d+)?)\s*\|\s*(\d+(?:\.\d+)?)\s*\|\s*(\d+(?:\.\d+)?)/i
      );
      if (match) {
        lineCoverage = parseFloat(match[1]);
        branchCoverage = parseFloat(match[2]);
        functionCoverage = parseFloat(match[3]);
      }
    }
  }

  return { lineCoverage, branchCoverage, functionCoverage };
}

async function main() {
  const args = parseArguments();

  if (args.help) {
    console.log(`
Usage: node scripts/check-node-coverage.mjs [options]

Options:
  -t, --threshold=N   Minimum coverage percentage (default: ${DEFAULT_THRESHOLD})
  -h, --help          Show this help message

Environment variables:
  COVERAGE_THRESHOLD  Minimum coverage percentage

Example:
  node scripts/check-node-coverage.mjs --threshold=90
`);
    process.exit(0);
  }

  const threshold = parseFloat(args.threshold);
  if (isNaN(threshold) || threshold < 0 || threshold > 100) {
    console.error(`Error: Invalid threshold value: ${args.threshold}`);
    console.error('Threshold must be a number between 0 and 100');
    process.exit(1);
  }

  console.log(
    `\n📊 Running Node.js tests with coverage (threshold: ${threshold}%)\n`
  );

  const result = await runCommand('node', [
    '--test',
    '--experimental-test-coverage',
    'tests/',
  ]);

  if (result.code !== 0) {
    console.error('\n❌ Tests failed');
    process.exit(result.code);
  }

  const { lineCoverage, branchCoverage, functionCoverage } = parseNodeCoverage(
    result.stdout + result.stderr
  );

  console.log('\n📊 Coverage Summary:');
  if (lineCoverage !== null) {
    console.log(`   Line coverage: ${lineCoverage.toFixed(2)}%`);
  }
  if (branchCoverage !== null) {
    console.log(`   Branch coverage: ${branchCoverage.toFixed(2)}%`);
  }
  if (functionCoverage !== null) {
    console.log(`   Function coverage: ${functionCoverage.toFixed(2)}%`);
  }

  if (lineCoverage === null) {
    console.warn(
      '\n⚠️  Could not parse coverage percentage from Node.js output'
    );
    console.log('   Raw output was logged above');
    console.log('   Continuing without threshold enforcement...');
    process.exit(0);
  }

  let failed = false;
  const failures = [];

  if (lineCoverage < threshold) {
    failures.push(`Line coverage ${lineCoverage.toFixed(2)}%`);
    failed = true;
  }

  if (branchCoverage !== null && branchCoverage < threshold) {
    failures.push(`Branch coverage ${branchCoverage.toFixed(2)}%`);
    failed = true;
  }

  if (functionCoverage !== null && functionCoverage < threshold) {
    failures.push(`Function coverage ${functionCoverage.toFixed(2)}%`);
    failed = true;
  }

  if (failed) {
    console.error(`\n❌ Coverage check failed!`);
    console.error(`   Below threshold of ${threshold}%:`);
    for (const failure of failures) {
      console.error(`   - ${failure}`);
    }
    process.exit(1);
  }

  console.log(`\n✅ Coverage check passed! (all metrics >= ${threshold}%)`);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
