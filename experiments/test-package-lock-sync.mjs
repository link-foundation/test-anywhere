#!/usr/bin/env node

/**
 * Experiment script to verify package-lock.json version synchronization
 * This checks if package.json and package-lock.json versions match
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  console.log('Checking package-lock.json synchronization...\n');

  // Read package.json
  const packageJsonPath = join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  const packageJsonVersion = packageJson.version;

  console.log(`package.json version: ${packageJsonVersion}`);

  // Read package-lock.json
  const packageLockPath = join(__dirname, '..', 'package-lock.json');
  const packageLock = JSON.parse(readFileSync(packageLockPath, 'utf-8'));
  const packageLockVersion = packageLock.version;
  const packageLockRootVersion = packageLock.packages[''].version;

  console.log(`package-lock.json version: ${packageLockVersion}`);
  console.log(
    `package-lock.json root package version: ${packageLockRootVersion}`
  );

  // Check if versions match
  if (
    packageJsonVersion === packageLockVersion &&
    packageJsonVersion === packageLockRootVersion
  ) {
    console.log('\n✅ All versions are synchronized!');
    process.exit(0);
  } else {
    console.log('\n❌ Version mismatch detected!');
    console.log(
      'This will be fixed by running: npm install --package-lock-only'
    );
    process.exit(1);
  }
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
