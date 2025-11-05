#!/usr/bin/env node

/**
 * Experiment script to test version extraction from package.json
 * This simulates what the GitHub workflow will do
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  // Read package.json
  const packageJsonPath = join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

  console.log('Testing version extraction logic...\n');
  console.log('Package name:', packageJson.name);
  console.log('Current version:', packageJson.version);

  // Simulate what the workflow will do
  const version = packageJson.version;
  const newTitle = `chore: version packages (v${version})`;

  console.log('\n--- Simulated PR Title Update ---');
  console.log('Old title: chore: version packages');
  console.log('New title:', newTitle);

  console.log('\n✅ Version extraction logic works correctly!');
  console.log('Expected format: chore: version packages (v0.2.2) or similar');
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
