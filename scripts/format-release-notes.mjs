#!/usr/bin/env node

/**
 * Script to format GitHub release notes with proper formatting:
 * - Fix special characters like \n
 * - Add link to PR with changeset (if available)
 * - Add shields.io NPM version badge
 * - Format nicely with proper markdown
 */

import { execSync } from 'child_process';

const [, , releaseId, version, repository] = process.argv;

if (!releaseId || !version || !repository) {
  console.error(
    'Usage: format-release-notes.mjs <releaseId> <version> <repository>'
  );
  process.exit(1);
}

const packageName = 'test-anywhere';

try {
  // Get current release body
  const releaseData = JSON.parse(
    execSync(`gh api repos/${repository}/releases/${releaseId}`, {
      encoding: 'utf8',
    })
  );

  const currentBody = releaseData.body || '';

  // Skip if already formatted (has shields.io badge)
  if (currentBody.includes('shields.io')) {
    console.log('ℹ️ Release notes already formatted');
    process.exit(0);
  }

  // Extract the patch changes section
  const patchChangesMatch = currentBody.match(
    /### Patch Changes\s*\n\s*-\s+([a-f0-9]+):\s+(.+)/
  );

  if (!patchChangesMatch) {
    console.log('⚠️ Could not parse patch changes from release notes');
    process.exit(0);
  }

  const [, commitHash, description] = patchChangesMatch;

  // Find the PR that contains this commit
  let prNumber = null;

  try {
    const prsData = JSON.parse(
      execSync(`gh api "repos/${repository}/commits/${commitHash}/pulls"`, {
        encoding: 'utf8',
      })
    );

    // Find the PR that's not the version bump PR (not "chore: version packages")
    const relevantPr = prsData.find(
      (pr) => !pr.title.includes('version packages')
    );

    if (relevantPr) {
      prNumber = relevantPr.number;
    }
  } catch (_error) {
    console.log('⚠️ Could not find PR for commit', commitHash);
  }

  // Build formatted release notes
  const versionWithoutV = version.replace(/^v/, '');
  const npmBadge = `[![npm version](https://img.shields.io/badge/npm-${versionWithoutV}-blue.svg)](https://www.npmjs.com/package/${packageName}/v/${versionWithoutV})`;

  let formattedBody = `## What's Changed\n\n${description}`;

  // Add PR link if available
  if (prNumber) {
    formattedBody += `\n\n**Related Pull Request:** #${prNumber}`;
  }

  formattedBody += `\n\n---\n\n${npmBadge}\n\n📦 **View on npm:** https://www.npmjs.com/package/${packageName}/v/${versionWithoutV}`;

  // Update the release
  execSync(
    `gh api repos/${repository}/releases/${releaseId} -X PATCH -f body='${formattedBody.replace(/'/g, "'\\''")}'`,
    { encoding: 'utf8' }
  );

  console.log(`✅ Formatted release notes for v${versionWithoutV}`);
  if (prNumber) {
    console.log(`   - Added link to PR #${prNumber}`);
  }
  console.log('   - Added shields.io npm badge');
  console.log('   - Cleaned up formatting');
} catch (error) {
  console.error('❌ Error formatting release notes:', error.message);
  process.exit(1);
}
