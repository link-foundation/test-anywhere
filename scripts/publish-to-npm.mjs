#!/usr/bin/env node

/**
 * Publish to npm using OIDC trusted publishing
 * Usage: node scripts/publish-to-npm.mjs [should_pull]
 *   should_pull: Optional flag to pull latest changes before publishing (for release job)
 */

import { execSync } from 'child_process';
import { readFileSync, appendFileSync } from 'fs';

const shouldPull = process.argv[2] === 'true';
const MAX_RETRIES = 3;
const RETRY_DELAY = 10000; // 10 seconds

/**
 * Sleep for specified milliseconds
 * @param {number} ms
 */
function sleep(ms) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms));
}

/**
 * Append to GitHub Actions output file
 * @param {string} key
 * @param {string} value
 */
function setOutput(key, value) {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) {
    appendFileSync(outputFile, `${key}=${value}\n`);
  }
}

async function main() {
  try {
    if (shouldPull) {
      // Pull the latest changes we just pushed
      execSync('git pull origin main', { stdio: 'inherit' });
    }

    // Get current version
    const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
    const currentVersion = packageJson.version;
    console.log(`Current version to publish: ${currentVersion}`);

    // Check if this version is already published on npm
    console.log(
      `Checking if version ${currentVersion} is already published...`
    );
    try {
      execSync(`npm view "test-anywhere@${currentVersion}" version`, {
        encoding: 'utf8',
      });
      console.log(`Version ${currentVersion} is already published to npm`);
      setOutput('published', 'true');
      setOutput('published_version', currentVersion);
      setOutput('already_published', 'true');
      return;
    } catch {
      // Version not found on npm, proceed with publish
      console.log(
        `Version ${currentVersion} not found on npm, proceeding with publish...`
      );
    }

    // Publish to npm using OIDC trusted publishing with retry logic
    for (let i = 1; i <= MAX_RETRIES; i++) {
      console.log(`Publish attempt ${i} of ${MAX_RETRIES}...`);
      try {
        execSync('npm run changeset:publish', { stdio: 'inherit' });
        setOutput('published', 'true');
        setOutput('published_version', currentVersion);
        console.log(`\u2705 Published test-anywhere@${currentVersion} to npm`);
        return;
      } catch (_error) {
        if (i < MAX_RETRIES) {
          console.log(
            `Publish failed, waiting ${RETRY_DELAY / 1000}s before retry...`
          );
          await sleep(RETRY_DELAY);
        }
      }
    }

    console.error(`\u274C Failed to publish after ${MAX_RETRIES} attempts`);
    process.exit(1);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
