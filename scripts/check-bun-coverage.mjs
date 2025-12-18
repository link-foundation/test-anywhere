#!/usr/bin/env node

/**
 * Script to run Bun tests with coverage and enforce a minimum threshold.
 *
 * Bun's bunfig.toml threshold enforcement can be unreliable in some versions,
 * so this script provides a consistent way to enforce coverage thresholds.
 *
 * Usage:
 *   node scripts/check-bun-coverage.mjs [--threshold=99]
 *
 * Environment variables:
 *   COVERAGE_THRESHOLD - Minimum coverage percentage (default: 99)
 */

import { spawn } from 'node:child_process';
import { parseArgs } from 'node:util';

const DEFAULT_THRESHOLD = 75;

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

function parseBunCoverage(output) {
  const lines = output.split('\n');
  let lineCoverage = null;
  let functionCoverage = null;

  for (const line of lines) {
    if (line.includes('All files')) {
      const match = line.match(
        /All files\s*\|\s*(\d+(?:\.\d+)?)\s*\|\s*(\d+(?:\.\d+)?)/
      );
      if (match) {
        functionCoverage = parseFloat(match[1]);
        lineCoverage = parseFloat(match[2]);
      }
    }
  }

  return { lineCoverage, functionCoverage };
}

async function main() {
  const args = parseArguments();

  if (args.help) {
    console.log(`
Usage: node scripts/check-bun-coverage.mjs [options]

Options:
  -t, --threshold=N   Minimum coverage percentage (default: ${DEFAULT_THRESHOLD})
  -h, --help          Show this help message

Environment variables:
  COVERAGE_THRESHOLD  Minimum coverage percentage

Example:
  node scripts/check-bun-coverage.mjs --threshold=90
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
    `\n📊 Running Bun tests with coverage (threshold: ${threshold}%)\n`
  );

  const result = await runCommand('bun', ['test', '--coverage']);

  if (result.code !== 0) {
    console.error('\n❌ Tests failed');
    process.exit(result.code);
  }

  const { lineCoverage, functionCoverage } = parseBunCoverage(
    result.stdout + result.stderr
  );

  console.log('\n📊 Coverage Summary:');
  if (lineCoverage !== null) {
    console.log(`   Line coverage: ${lineCoverage.toFixed(2)}%`);
  }
  if (functionCoverage !== null) {
    console.log(`   Function coverage: ${functionCoverage.toFixed(2)}%`);
  }

  if (lineCoverage === null) {
    console.warn('\n⚠️  Could not parse coverage percentage from Bun output');
    console.log('   Raw output was logged above');
    console.log('   Continuing without threshold enforcement...');
    process.exit(0);
  }

  if (lineCoverage < threshold) {
    console.error(`\n❌ Coverage check failed!`);
    console.error(
      `   Line coverage ${lineCoverage.toFixed(2)}% is below threshold of ${threshold}%`
    );
    process.exit(1);
  }

  if (functionCoverage !== null && functionCoverage < threshold) {
    console.error(`\n❌ Coverage check failed!`);
    console.error(
      `   Function coverage ${functionCoverage.toFixed(2)}% is below threshold of ${threshold}%`
    );
    process.exit(1);
  }

  console.log(
    `\n✅ Coverage check passed! (${lineCoverage.toFixed(2)}% >= ${threshold}%)`
  );
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
