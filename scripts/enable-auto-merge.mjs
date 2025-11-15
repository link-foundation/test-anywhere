#!/usr/bin/env node

/**
 * Script to enable auto-merge for the repository
 */

import { execSync } from 'child_process';

try {
  const repo = 'link-foundation/test-anywhere';

  console.log('Checking current auto-merge setting...');
  const current = execSync(
    `gh api repos/${repo} --jq '.allow_auto_merge'`,
    { encoding: 'utf-8' }
  ).trim();

  console.log(`Current allow_auto_merge: ${current}\n`);

  if (current === 'false') {
    console.log('Auto-merge is currently DISABLED.');
    console.log('To enable auto-merge for this repository, run:\n');
    console.log(`  gh api repos/${repo} -X PATCH -f allow_auto_merge=true\n`);
    console.log('This requires admin permissions on the repository.');
  } else {
    console.log('Auto-merge is already enabled!');
  }
} catch (error) {
  console.error('Error checking auto-merge setting:', error.message);
  if (process.env.DEBUG) {
    console.error('Stack trace:', error.stack);
  }
  process.exit(1);
}
