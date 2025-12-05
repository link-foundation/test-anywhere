#!/usr/bin/env node

/**
 * Experiment to test the format-release-notes.mjs script
 * Tests formatting of v0.8.8 release (instant mode - no commit hash)
 */

import { execSync } from 'child_process';

const repository = 'link-foundation/test-anywhere';
const version = 'v0.8.8';

console.log('Testing format-release-notes.mjs with v0.8.8...\n');

// Get the release ID for v0.8.8
try {
  const releaseData = JSON.parse(
    execSync(`gh api repos/${repository}/releases/tags/${version}`, {
      encoding: 'utf8',
    })
  );

  const releaseId = releaseData.id;
  console.log(`Release ID: ${releaseId}`);
  console.log(`Current body:\n${releaseData.body}\n`);

  // Run the format script
  console.log('Running format-release-notes.mjs...\n');
  execSync(
    `node scripts/format-release-notes.mjs "${releaseId}" "${version}" "${repository}"`,
    { stdio: 'inherit' }
  );

  // Check the result
  console.log('\nChecking result...\n');
  const updatedRelease = JSON.parse(
    execSync(`gh api repos/${repository}/releases/tags/${version}`, {
      encoding: 'utf8',
    })
  );

  console.log(`Updated body:\n${updatedRelease.body}`);
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
