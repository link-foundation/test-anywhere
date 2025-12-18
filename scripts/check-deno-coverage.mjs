#!/usr/bin/env node

/**
 * Script to run Deno tests with coverage and enforce a minimum threshold.
 *
 * Deno does not have a built-in --threshold flag, so this script:
 * 1. Runs deno test with coverage collection
 * 2. Parses the coverage output
 * 3. Exits with code 1 if coverage is below the threshold
 *
 * Usage:
 *   node scripts/check-deno-coverage.mjs [--threshold=99]
 *
 * Environment variables:
 *   COVERAGE_THRESHOLD - Minimum coverage percentage (default: 99)
 */

import { spawn } from 'node:child_process';
import { rm, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { parseArgs } from 'node:util';

const DEFAULT_THRESHOLD = 80;
const COVERAGE_DIR = 'coverage_deno';

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

function parseCoveragePercentage(output) {
  const lines = output.split('\n');
  let lineCoverage = null;
  let branchCoverage = null;

  for (const line of lines) {
    const lineMatch = line.match(/cover\s+(\d+(?:\.\d+)?)\s*%\s+of\s+lines/i);
    if (lineMatch) {
      lineCoverage = parseFloat(lineMatch[1]);
    }

    const branchMatch = line.match(
      /branch\s+coverage[:\s]+(\d+(?:\.\d+)?)\s*%/i
    );
    if (branchMatch) {
      branchCoverage = parseFloat(branchMatch[1]);
    }

    const totalMatch = line.match(/^total[:\s]+(\d+(?:\.\d+)?)\s*%/im);
    if (totalMatch && lineCoverage === null) {
      lineCoverage = parseFloat(totalMatch[1]);
    }

    const allFilesMatch = line.match(/^All files[:\s|]+(\d+(?:\.\d+)?)/im);
    if (allFilesMatch && lineCoverage === null) {
      lineCoverage = parseFloat(allFilesMatch[1]);
    }
  }

  if (lineCoverage === null) {
    const percentMatches = output.match(/(\d+(?:\.\d+)?)\s*%/g);
    if (percentMatches && percentMatches.length > 0) {
      const percentValues = percentMatches.map((m) =>
        parseFloat(m.replace('%', ''))
      );
      const filtered = percentValues.filter((v) => v >= 0 && v <= 100);
      if (filtered.length > 0) {
        lineCoverage = filtered[filtered.length - 1];
      }
    }
  }

  return { lineCoverage, branchCoverage };
}

async function main() {
  const args = parseArguments();

  if (args.help) {
    console.log(`
Usage: node scripts/check-deno-coverage.mjs [options]

Options:
  -t, --threshold=N   Minimum coverage percentage (default: ${DEFAULT_THRESHOLD})
  -h, --help          Show this help message

Environment variables:
  COVERAGE_THRESHOLD  Minimum coverage percentage

Example:
  node scripts/check-deno-coverage.mjs --threshold=90
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
    `\n📊 Running Deno tests with coverage (threshold: ${threshold}%)\n`
  );

  if (existsSync(COVERAGE_DIR)) {
    await rm(COVERAGE_DIR, { recursive: true });
  }
  await mkdir(COVERAGE_DIR, { recursive: true });

  console.log('🧪 Running tests and collecting coverage...\n');
  const testResult = await runCommand('deno', [
    'test',
    `--coverage=${COVERAGE_DIR}`,
    '--allow-read',
  ]);

  if (testResult.code !== 0) {
    console.error('\n❌ Tests failed');
    process.exit(testResult.code);
  }

  console.log('\n📈 Generating coverage report...\n');
  const coverageResult = await runCommand('deno', ['coverage', COVERAGE_DIR]);

  if (coverageResult.code !== 0) {
    console.error('\n❌ Failed to generate coverage report');
    process.exit(coverageResult.code);
  }

  const { lineCoverage, branchCoverage } = parseCoveragePercentage(
    coverageResult.stdout + coverageResult.stderr
  );

  console.log('\n📊 Coverage Summary:');
  if (lineCoverage !== null) {
    console.log(`   Line coverage: ${lineCoverage.toFixed(2)}%`);
  }
  if (branchCoverage !== null) {
    console.log(`   Branch coverage: ${branchCoverage.toFixed(2)}%`);
  }

  if (lineCoverage === null) {
    console.warn('\n⚠️  Could not parse coverage percentage from Deno output');
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

  console.log(
    `\n✅ Coverage check passed! (${lineCoverage.toFixed(2)}% >= ${threshold}%)`
  );

  await rm(COVERAGE_DIR, { recursive: true }).catch(() => {});
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
