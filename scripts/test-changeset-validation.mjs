#!/usr/bin/env node

/**
 * Test script to validate changeset validation logic
 */

import { execSync } from 'child_process';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

try {
  console.log('=== Testing Changeset Validation Logic ===\n');

  // Count changeset files (excluding README.md and config.json)
  const changesetDir = '.changeset';
  const changesetFiles = readdirSync(changesetDir)
    .filter(file => file.endsWith('.md') && file !== 'README.md');

  const changesetCount = changesetFiles.length;
  console.log(`Found ${changesetCount} changeset file(s)`);

  // Ensure exactly one changeset file exists
  if (changesetCount === 0) {
    console.error('ERROR: No changeset found');
    process.exit(1);
  } else if (changesetCount > 1) {
    console.error(`ERROR: Multiple changesets found (${changesetCount})`);
    changesetFiles.forEach(file => console.error(`  ${file}`));
    process.exit(1);
  }

  // Get the changeset file
  const changesetFile = join(changesetDir, changesetFiles[0]);
  console.log(`Validating changeset: ${changesetFile}`);

  // Read the changeset file
  const content = readFileSync(changesetFile, 'utf-8');

  // Check if changeset has a valid type (major, minor, or patch)
  const versionTypeRegex = /^['"]test-anywhere['"]:\s+(major|minor|patch)/m;
  if (!versionTypeRegex.test(content)) {
    console.error('ERROR: Changeset must specify a version type: major, minor, or patch');
    console.error(content);
    process.exit(1);
  }

  // Extract description (everything after the closing ---) and check it's not empty
  const parts = content.split('---');
  if (parts.length < 3) {
    console.error('ERROR: Changeset must include a description');
    console.error(content);
    process.exit(1);
  }

  const description = parts.slice(2).join('---').trim();
  if (!description) {
    console.error('ERROR: Changeset must include a description');
    console.error(content);
    process.exit(1);
  }

  // Extract version type
  const versionTypeMatch = content.match(versionTypeRegex);
  const versionType = versionTypeMatch ? versionTypeMatch[1] : 'unknown';

  console.log('✅ Changeset validation passed');
  console.log(`   Type: ${versionType}`);
  console.log(`   Description: ${description}`);
} catch (error) {
  console.error('Error during changeset validation:', error.message);
  if (process.env.DEBUG) {
    console.error('Stack trace:', error.stack);
  }
  process.exit(1);
}
