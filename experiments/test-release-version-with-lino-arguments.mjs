#!/usr/bin/env node

/**
 * Experiment: Test if using --release-version instead of --version
 * works with lino-arguments to avoid yargs conflict
 *
 * This tests the workaround suggested in:
 * - lino-arguments issue #13 (--version conflict)
 * - format-github-release.mjs (already uses --release-version successfully)
 */

// Load use-m dynamically
const { use } = eval(
  await (await fetch('https://unpkg.com/use-m/use.js')).text()
);

const { makeConfig } = await use('lino-arguments');

console.log('Testing lino-arguments with --release-version...');
console.log('process.argv:', process.argv);

// Test using --release-version (should work - avoids yargs conflict)
const config = makeConfig({
  yargs: ({ yargs, getenv }) =>
    yargs
      .option('release-version', {
        type: 'string',
        default: getenv('VERSION', ''),
        describe: 'Version number (e.g., 1.0.0)',
      })
      .option('release-id', {
        type: 'string',
        default: getenv('RELEASE_ID', ''),
        describe: 'Release ID',
      })
      .option('repository', {
        type: 'string',
        default: getenv('REPOSITORY', ''),
        describe: 'Repository',
      })
      .option('commit-sha', {
        type: 'string',
        default: getenv('COMMIT_SHA', ''),
        describe: 'Commit SHA',
      }),
});

console.log('\nParsed config:');
console.log('  releaseVersion:', JSON.stringify(config.releaseVersion));
console.log('  releaseId:', JSON.stringify(config.releaseId));
console.log('  repository:', JSON.stringify(config.repository));
console.log('  commitSha:', JSON.stringify(config.commitSha));

// Check if parsing succeeded
if (
  config.releaseVersion &&
  config.releaseVersion !== '' &&
  config.releaseVersion !== false
) {
  console.log('\n✅ SUCCESS: --release-version parsed correctly!');
  console.log('   Value:', config.releaseVersion);
  process.exit(0);
} else {
  console.log('\n❌ FAILURE: --release-version not parsed correctly');
  console.log('   Expected: "v0.8.36" or similar');
  console.log('   Got:', JSON.stringify(config.releaseVersion));
  process.exit(1);
}
