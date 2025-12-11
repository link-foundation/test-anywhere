#!/usr/bin/env node

/**
 * Minimal reproduction for lino-arguments bug
 *
 * Expected behavior:
 *   node minimal-repro.mjs --version "1.0.0" --repository "owner/repo"
 *   Should parse and display: version="1.0.0", repository="owner/repo"
 *
 * Actual behavior in CI environments:
 *   Both arguments return empty strings (from getenv defaults)
 */

// Load use-m dynamically
const { use } = eval(
  await (await fetch('https://unpkg.com/use-m/use.js')).text()
);

// Import lino-arguments
const { makeConfig } = await use('lino-arguments');

console.log('=== Testing lino-arguments CLI parsing ===');
console.log('process.argv:', process.argv);
console.log('');

// Parse CLI arguments using lino-arguments
const config = makeConfig({
  yargs: ({ yargs, getenv }) =>
    yargs
      .option('version', {
        type: 'string',
        default: getenv('VERSION', ''),
        describe: 'Version number (e.g., 1.0.0)',
      })
      .option('repository', {
        type: 'string',
        default: getenv('REPOSITORY', ''),
        describe: 'GitHub repository (e.g., owner/repo)',
      }),
});

console.log('=== Results ===');
console.log('config.version:', JSON.stringify(config.version));
console.log('config.repository:', JSON.stringify(config.repository));
console.log('');

if (!config.version || !config.repository) {
  console.error('❌ BUG REPRODUCED: Arguments were not parsed!');
  console.error('Expected: version="1.0.0", repository="owner/repo"');
  console.error(`Actual: version="${config.version}", repository="${config.repository}"`);
  process.exit(1);
} else {
  console.log('✅ Arguments parsed successfully');
  console.log(`version: ${config.version}`);
  console.log(`repository: ${config.repository}`);
}
