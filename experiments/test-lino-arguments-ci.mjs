#!/usr/bin/env node

/**
 * Minimal reproducible example for lino-arguments parsing failure in CI environments.
 *
 * This script demonstrates the issue where lino-arguments' makeConfig() fails
 * to parse CLI arguments in GitHub Actions CI environments.
 *
 * Expected behavior:
 *   $ node test-lino-arguments-ci.mjs --version "0.8.36" --repository "link-foundation/test-anywhere"
 *   Version: 0.8.36
 *   Repository: link-foundation/test-anywhere
 *
 * Actual behavior in GitHub Actions CI:
 *   Version: (empty string from getenv default)
 *   Repository: (empty string from getenv default)
 *   Script exits with code 1 due to missing required arguments
 */

// Load use-m dynamically
const { use } = eval(
  await (await fetch('https://unpkg.com/use-m/use.js')).text()
);

const { makeConfig } = await use('lino-arguments');

// Configure CLI arguments using lino-arguments
const config = makeConfig({
  yargs: ({ yargs, getenv }) =>
    yargs
      .option('version', {
        type: 'string',
        description: 'Version to process',
        default: getenv('VERSION') || '',
      })
      .option('repository', {
        type: 'string',
        description: 'Repository name',
        default: getenv('REPOSITORY') || '',
      })
      .help()
      .strict(),
});

const version = config.version;
const repository = config.repository;

console.log(`Version: ${version}`);
console.log(`Repository: ${repository}`);

if (!version || !repository) {
  console.error('Error: Missing required arguments');
  console.error(
    'Usage: node test-lino-arguments-ci.mjs --version <version> --repository <repository>'
  );
  process.exit(1);
}

console.log('✅ Arguments parsed successfully!');
