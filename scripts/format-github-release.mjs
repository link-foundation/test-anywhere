#!/usr/bin/env node

/**
 * Format GitHub release notes using the format-release-notes.mjs script
 * Usage: node scripts/format-github-release.mjs <version> <repository> <commit_sha>
 *   version: Version number (e.g., 1.0.0)
 *   repository: GitHub repository (e.g., owner/repo)
 *   commit_sha: Commit SHA for PR detection
 */

import { execSync } from 'child_process';

const [version, repository, commitSha] = process.argv.slice(2);

if (!version || !repository || !commitSha) {
  console.error('Error: Missing required arguments');
  console.error(
    'Usage: node scripts/format-github-release.mjs <version> <repository> <commit_sha>'
  );
  process.exit(1);
}

const tag = `v${version}`;

try {
  // Get the release ID for this version
  let releaseId = '';
  try {
    releaseId = execSync(
      `gh api "repos/${repository}/releases/tags/${tag}" --jq '.id'`,
      { encoding: 'utf8' }
    ).trim();
  } catch {
    console.log(`\u26A0\uFE0F Could not find release for ${tag}`);
    process.exit(0);
  }

  if (releaseId) {
    console.log(`Formatting release notes for ${tag}...`);
    // Pass the trigger commit SHA for PR detection
    // This allows proper PR lookup even if the changelog doesn't have a commit hash
    execSync(
      `node scripts/format-release-notes.mjs "${releaseId}" "${tag}" "${repository}" --commit-sha="${commitSha}"`,
      { stdio: 'inherit' }
    );
    console.log(`\u2705 Formatted release notes for ${tag}`);
  }
} catch (error) {
  console.error('Error formatting release:', error.message);
  process.exit(1);
}
