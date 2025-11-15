#!/usr/bin/env node

/**
 * Testing changeset creation logic
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync, unlinkSync } from 'fs';
import { randomBytes } from 'crypto';

try {
  console.log('Testing changeset creation logic...\n');

  // Simulate the workflow
  const changesetId = randomBytes(4).toString('hex');
  const changesetFile = `.changeset/test-manual-release-${changesetId}.md`;
  const bumpType = 'patch';
  const description = 'Manual patch release';

  // Create the changeset file with single quotes
  const content = `---
'test-anywhere': ${bumpType}
---

${description}
`;

  writeFileSync(changesetFile, content, 'utf-8');

  console.log(`Created changeset: ${changesetFile}`);
  console.log('Contents before Prettier:');
  console.log(readFileSync(changesetFile, 'utf-8'));

  // Run Prettier
  execSync(`npx prettier --write "${changesetFile}"`, { stdio: 'inherit' });

  console.log('\nContents after Prettier:');
  console.log(readFileSync(changesetFile, 'utf-8'));

  // Verify with format check
  console.log('\nRunning format check...');
  try {
    execSync(`npx prettier --check "${changesetFile}"`, { stdio: 'inherit' });
    console.log('✓ Format check passed');
  } catch {
    console.log('✗ Format check failed');
  }

  // Clean up
  unlinkSync(changesetFile);
  console.log('\nTest completed successfully!');
} catch (error) {
  console.error('Error during changeset creation test:', error.message);
  if (process.env.DEBUG) {
    console.error('Stack trace:', error.stack);
  }
  process.exit(1);
}
