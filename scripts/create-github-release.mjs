#!/usr/bin/env node

/**
 * Create GitHub Release from CHANGELOG.md
 * Usage: node scripts/create-github-release.mjs <version> <repository>
 *   version: Version number (e.g., 1.0.0)
 *   repository: GitHub repository (e.g., owner/repo)
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

const [version, repository] = process.argv.slice(2);

if (!version || !repository) {
  console.error('Error: Missing required arguments');
  console.error(
    'Usage: node scripts/create-github-release.mjs <version> <repository>'
  );
  process.exit(1);
}

const tag = `v${version}`;

console.log(`Creating GitHub release for ${tag}...`);

try {
  // Read CHANGELOG.md
  const changelog = readFileSync('./CHANGELOG.md', 'utf8');

  // Extract changelog entry for this version
  // Read from CHANGELOG.md between this version header and the next version header
  const versionHeaderRegex = new RegExp(`## ${version}[\\s\\S]*?(?=## \\d|$)`);
  const match = changelog.match(versionHeaderRegex);

  let releaseNotes = '';
  if (match) {
    // Remove the version header itself and trim
    releaseNotes = match[0].replace(`## ${version}`, '').trim();
  }

  if (!releaseNotes) {
    releaseNotes = `Release ${version}`;
  }

  // Create release using gh CLI
  execSync(
    `gh release create "${tag}" --title "${version}" --notes "${releaseNotes.replace(/"/g, '\\"')}" --repo "${repository}"`,
    { stdio: 'inherit' }
  );

  console.log(`\u2705 Created GitHub release: ${tag}`);
} catch (error) {
  console.error('Error creating release:', error.message);
  process.exit(1);
}
