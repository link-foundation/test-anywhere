#!/usr/bin/env node

/**
 * Update npm for OIDC trusted publishing
 * npm trusted publishing requires npm >= 11.5.1
 * Node.js 20.x ships with npm 10.x, so we need to update
 */

import { execSync } from 'child_process';

try {
  // Get current npm version
  const currentVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  console.log(`Current npm version: ${currentVersion}`);

  // Update npm to latest
  execSync('npm install -g npm@latest', { stdio: 'inherit' });

  // Get updated npm version
  const updatedVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  console.log(`Updated npm version: ${updatedVersion}`);
} catch (error) {
  console.error('Error updating npm:', error.message);
  process.exit(1);
}
