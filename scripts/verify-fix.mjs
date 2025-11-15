#!/usr/bin/env node

/**
 * Verifying the fix for auto-merge check
 */

import { execSync } from 'child_process';

try {
  console.log('Verifying the fix for auto-merge check...\n');

  // Get the actual value from gh api
  const prAutoMerge = execSync(
    'gh api repos/link-foundation/test-anywhere/pulls/48 --jq \'.auto_merge\'',
    { encoding: 'utf-8' }
  ).trim();

  console.log('Current state of PR #48:');
  console.log(`  Raw API value: [${prAutoMerge}]`);
  console.log(`  Length: ${prAutoMerge.length}`);
  console.log(`  Is empty: ${prAutoMerge === '' ? 'YES' : 'NO'}\n`);

  console.log('OLD LOGIC (BUGGY):');
  console.log('  if [ "$PR_AUTO_MERGE" != "null" ]; then');
  if (prAutoMerge !== 'null') {
    console.log('    ❌ Would skip enabling auto-merge (BUG!)');
  } else {
    console.log('    ✅ Would enable auto-merge');
  }
  console.log();

  console.log('NEW LOGIC (FIXED):');
  console.log('  if [ -n "$PR_AUTO_MERGE" ] && [ "$PR_AUTO_MERGE" != "null" ]; then');
  if (prAutoMerge && prAutoMerge !== 'null') {
    console.log('    ❌ Would skip enabling auto-merge');
  } else {
    console.log('    ✅ Would enable auto-merge (CORRECT!)');
  }
  console.log();

  console.log('EXPLANATION:');
  console.log('  - When auto_merge is null in GitHub API, gh api --jq returns empty string');
  console.log('  - Old logic: [ "" != "null" ] = TRUE (incorrectly skips)');
  console.log('  - New logic: [ -n "" ] && [ "" != "null" ] = FALSE (correctly enables)');
} catch (error) {
  console.error('Error during verification:', error.message);
  if (process.env.DEBUG) {
    console.error('Stack trace:', error.stack);
  }
  process.exit(1);
}
