#!/usr/bin/env node

/**
 * Script to format GitHub release notes with proper formatting:
 * - Fix special characters like \n
 * - Add link to PR that contains the release commit (if found)
 * - Add shields.io NPM version badge
 * - Format nicely with proper markdown
 *
 * PR Detection Logic:
 * 1. Extract commit hash from changelog entry (if present)
 * 2. Fall back to --commit-sha argument (passed from workflow)
 * 3. Look up PRs that contain the commit via GitHub API
 * 4. If no PR found, simply don't display any PR link (no guessing)
 */

import { execSync } from 'child_process';

const args = process.argv.slice(2);

// Parse --commit-sha=<sha> argument
const commitShaArg = args.find((arg) => arg.startsWith('--commit-sha='));
const passedCommitSha = commitShaArg ? commitShaArg.split('=')[1] : null;

const positionalArgs = args.filter((arg) => !arg.startsWith('--'));
const [releaseId, version, repository] = positionalArgs;

if (!releaseId || !version || !repository) {
  console.error(
    'Usage: format-release-notes.mjs <releaseId> <version> <repository> [--commit-sha=<sha>]'
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

  // Skip if already formatted (has shields.io badge image)
  if (currentBody.includes('img.shields.io')) {
    console.log('ℹ️ Release notes already formatted');
    process.exit(0);
  }

  // Extract the patch changes section
  // This regex handles two formats:
  // 1. With commit hash: "- abc1234: Description"
  // 2. Without commit hash: "- Description"
  const patchChangesMatchWithHash = currentBody.match(
    /### Patch Changes\s*\n\s*-\s+([a-f0-9]+):\s+(.+?)$/s
  );
  const patchChangesMatchNoHash = currentBody.match(
    /### Patch Changes\s*\n\s*-\s+(.+?)$/s
  );

  let commitHash = null;
  let rawDescription = null;

  if (patchChangesMatchWithHash) {
    // Format: - abc1234: Description
    [, commitHash, rawDescription] = patchChangesMatchWithHash;
  } else if (patchChangesMatchNoHash) {
    // Format: - Description (no commit hash)
    [, rawDescription] = patchChangesMatchNoHash;
  } else {
    console.log('⚠️ Could not parse patch changes from release notes');
    process.exit(0);
  }

  // Clean up the description:
  // 1. Convert literal \n sequences (escaped newlines from GitHub API) to actual newlines
  // 2. Remove any trailing npm package links or markdown that might be there
  // 3. Normalize whitespace while preserving line breaks
  const cleanDescription = rawDescription
    .replace(/\\n/g, '\n') // Convert escaped \n to actual newlines
    .replace(/📦.*$/s, '') // Remove any existing npm package info
    .replace(/---.*$/s, '') // Remove any existing separators and everything after
    .trim()
    .split('\n') // Split by lines
    .map((line) => line.trim()) // Trim whitespace from each line
    .join('\n') // Rejoin with newlines
    .replace(/\n{3,}/g, '\n\n'); // Normalize excessive blank lines (3+ becomes 2)

  // Find the PR that contains the release commit
  // Uses commit hash from changelog or passed commit SHA from workflow
  let prNumber = null;

  // Determine which commit SHA to use for PR lookup
  const commitShaToLookup = commitHash || passedCommitSha;

  if (commitShaToLookup) {
    const source = commitHash ? 'changelog' : 'workflow';
    console.log(
      `ℹ️ Looking up PR for commit ${commitShaToLookup} (from ${source})`
    );

    try {
      const prsData = JSON.parse(
        execSync(
          `gh api "repos/${repository}/commits/${commitShaToLookup}/pulls"`,
          {
            encoding: 'utf8',
          }
        )
      );

      // Find the PR that's not the version bump PR (not "chore: version packages")
      const relevantPr = prsData.find(
        (pr) => !pr.title.includes('version packages')
      );

      if (relevantPr) {
        prNumber = relevantPr.number;
        console.log(`✅ Found PR #${prNumber} containing commit`);
      } else if (prsData.length > 0) {
        console.log(
          '⚠️ Found PRs but all are version bump PRs, not linking any'
        );
      } else {
        console.log(
          'ℹ️ No PR found containing this commit - not adding PR link'
        );
      }
    } catch (error) {
      console.log('⚠️ Could not find PR for commit', commitShaToLookup);
      console.log('   Error:', error.message);
      if (process.env.DEBUG) {
        console.error(error);
      }
    }
  } else {
    // No commit hash available from any source
    console.log('ℹ️ No commit SHA available - not adding PR link');
  }

  // Build formatted release notes
  const versionWithoutV = version.replace(/^v/, '');
  const npmBadge = `[![npm version](https://img.shields.io/badge/npm-${versionWithoutV}-blue.svg)](https://www.npmjs.com/package/${packageName}/v/${versionWithoutV})`;

  let formattedBody = `## What's Changed\n\n${cleanDescription}`;

  // Add PR link if available
  if (prNumber) {
    formattedBody += `\n\n**Related Pull Request:** #${prNumber}`;
  }

  formattedBody += `\n\n---\n\n${npmBadge}\n\n📦 **View on npm:** https://www.npmjs.com/package/${packageName}/v/${versionWithoutV}`;

  // Update the release using JSON input to properly handle special characters
  const updatePayload = JSON.stringify({ body: formattedBody });
  execSync(
    `gh api repos/${repository}/releases/${releaseId} -X PATCH --input -`,
    {
      encoding: 'utf8',
      input: updatePayload,
    }
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
