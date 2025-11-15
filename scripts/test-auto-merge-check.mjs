#!/usr/bin/env node

/**
 * Test what gh api returns when auto_merge is null
 */

import { execSync } from 'child_process';

try {
  console.log('Testing auto_merge check logic...\n');

  // Get the actual value from the API
  const prAutoMerge = execSync(
    'gh api repos/link-foundation/test-anywhere/pulls/48 --jq \'.auto_merge\'',
    { encoding: 'utf-8' }
  ).trim();

  console.log(`Raw value from gh api --jq '.auto_merge': [${prAutoMerge}]`);
  console.log(`Length of value: ${prAutoMerge.length}\n`);

  // Test the current workflow condition
  console.log('Current workflow condition: [ "$PR_AUTO_MERGE" != "null" ]');
  if (prAutoMerge !== 'null') {
    console.log('  Result: TRUE (would skip enabling auto-merge) ❌ BUG!');
  } else {
    console.log('  Result: FALSE (would enable auto-merge) ✅');
  }
  console.log();

  // Show what the value actually is
  console.log('Checking if value is empty string:');
  if (prAutoMerge === '') {
    console.log('  Value is empty string ✅');
  } else {
    console.log('  Value is NOT empty string');
  }
  console.log();

  console.log('Checking if value equals literal \'null\':');
  if (prAutoMerge === 'null') {
    console.log('  Value equals \'null\' ✅');
  } else {
    console.log('  Value does NOT equal \'null\'');
  }
} catch (error) {
  console.error('Error during auto-merge check:', error.message);
  if (process.env.DEBUG) {
    console.error('Stack trace:', error.stack);
  }
  process.exit(1);
}
