#!/usr/bin/env node

/**
 * Test script to understand what changeset version does
 */

import { execSync } from 'child_process';
import { readdirSync, readFileSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

try {
  console.log('=== Testing changeset version behavior ===\n');

  // Save current state
  const packageJson = require('../package.json');
  const originalVersion = packageJson.version;
  console.log(`Current version: ${originalVersion}\n`);

  // Count changeset files (excluding README.md and config.json)
  const changesetDir = '.changeset';
  const changesetFiles = readdirSync(changesetDir)
    .filter(file => file.endsWith('.md') && file !== 'README.md');

  const changesetCount = changesetFiles.length;
  console.log(`Changeset files found: ${changesetCount}`);

  if (changesetCount === 0) {
    console.log('No changesets to process. Exiting.');
    process.exit(0);
  }

  console.log('\nChangeset files:');
  changesetFiles.forEach(file => console.log(`  ${file}`));
  console.log();

  // Show what files will be modified
  console.log('=== Running changeset version (dry-run to understand changes) ===\n');

  // Run changeset version
  execSync('npm run changeset:version', { stdio: 'inherit' });

  console.log('\n=== Changes made by changeset version ===\n');

  // Show what changed
  console.log('New version:');
  // Re-read package.json since it may have changed
  delete require.cache[require.resolve('../package.json')];
  const newPackageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));
  const newVersion = newPackageJson.version;
  console.log(newVersion);
  console.log();

  console.log('Git status after version bump:');
  execSync('git status --short', { stdio: 'inherit' });
  console.log();

  console.log('Files that would be committed:');
  execSync('git diff --name-only HEAD', { stdio: 'inherit' });
  console.log();

  console.log('=== Summary ===');
  console.log(`Original version: ${originalVersion}`);
  console.log(`New version: ${newVersion}`);

  const remainingChangesets = readdirSync(changesetDir)
    .filter(file => file.endsWith('.md') && file !== 'README.md');
  console.log(`Changesets remaining: ${remainingChangesets.length}\n`);

  console.log('This shows exactly what needs to be committed to main after version bump.');
} catch (error) {
  console.error('Error during changeset version test:', error.message);
  if (process.env.DEBUG) {
    console.error('Stack trace:', error.stack);
  }
  process.exit(1);
}
