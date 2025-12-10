#!/usr/bin/env node

/**
 * Version packages and commit to main
 * Usage: node scripts/version-and-commit.mjs [changeset|instant] [bump_type] [description]
 *   changeset: Run changeset version
 *   instant: Run instant version bump with bump_type (patch|minor|major) and optional description
 */

import { execSync } from 'child_process';
import { readFileSync, appendFileSync, readdirSync } from 'fs';

const mode = process.argv[2] || 'changeset';
const bumpType = process.argv[3] || '';
const description = process.argv[4] || '';

/**
 * Execute command and return output
 * @param {string} cmd
 * @param {object} options
 */
function exec(cmd, options = {}) {
  return execSync(cmd, { encoding: 'utf8', ...options }).trim();
}

/**
 * Execute command with inherited stdio
 * @param {string} cmd
 */
function execInherit(cmd) {
  execSync(cmd, { stdio: 'inherit' });
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

/**
 * Count changeset files (excluding README.md)
 */
function countChangesets() {
  try {
    const changesetDir = '.changeset';
    const files = readdirSync(changesetDir);
    return files.filter((f) => f.endsWith('.md') && f !== 'README.md').length;
  } catch {
    return 0;
  }
}

/**
 * Get package version
 * @param {string} source - 'local' or 'remote'
 */
function getVersion(source = 'local') {
  if (source === 'remote') {
    const content = exec('git show origin/main:package.json');
    return JSON.parse(content).version;
  }
  return JSON.parse(readFileSync('./package.json', 'utf8')).version;
}

function main() {
  try {
    // Configure git
    execInherit('git config user.name "github-actions[bot]"');
    execInherit(
      'git config user.email "github-actions[bot]@users.noreply.github.com"'
    );

    // Check if remote main has advanced (handles re-runs after partial success)
    console.log('Checking for remote changes...');
    execInherit('git fetch origin main');
    const localHead = exec('git rev-parse HEAD');
    const remoteHead = exec('git rev-parse origin/main');

    if (localHead !== remoteHead) {
      console.log(
        `Remote main has advanced (local: ${localHead}, remote: ${remoteHead})`
      );
      console.log('This may indicate a previous attempt partially succeeded.');

      // Check if the remote version is already the expected bump
      const remoteVersion = getVersion('remote');
      console.log(`Remote version: ${remoteVersion}`);

      // Check if there are changesets to process
      const changesetCount = countChangesets();

      if (changesetCount === 0) {
        console.log('No changesets to process and remote has advanced.');
        console.log(
          'Assuming version bump was already completed in a previous attempt.'
        );
        setOutput('version_committed', 'false');
        setOutput('already_released', 'true');
        setOutput('new_version', remoteVersion);
        return;
      } else {
        console.log('Rebasing on remote main to incorporate changes...');
        execInherit('git rebase origin/main');
      }
    }

    // Get current version before bump
    const oldVersion = getVersion();
    console.log(`Current version: ${oldVersion}`);

    let commitSuffix;
    if (mode === 'instant') {
      console.log('Running instant version bump...');
      // Run instant version bump script
      if (description) {
        execInherit(
          `node scripts/instant-version-bump.mjs "${bumpType}" "${description}"`
        );
      } else {
        execInherit(`node scripts/instant-version-bump.mjs "${bumpType}"`);
      }
      commitSuffix = `Manual ${bumpType} release`;
    } else {
      console.log('Running changeset version...');
      // Run changeset version to bump versions and update CHANGELOG
      execInherit('npm run changeset:version');
      commitSuffix =
        '\uD83E\uDD16 Generated with [Claude Code](https://claude.com/claude-code)';
    }

    // Get new version after bump
    const newVersion = getVersion();
    console.log(`New version: ${newVersion}`);
    setOutput('new_version', newVersion);

    // Check if there are changes to commit
    const status = exec('git status --porcelain');
    if (status) {
      console.log('Changes detected, committing...');

      // Stage all changes (package.json, package-lock.json, CHANGELOG.md, deleted changesets)
      execInherit('git add -A');

      // Commit with version number and suffix as message
      const commitMessage = `${newVersion}\n\n${commitSuffix}`;
      execSync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, {
        stdio: 'inherit',
      });

      // Push directly to main
      execInherit('git push origin main');

      console.log('\u2705 Version bump committed and pushed to main');
      setOutput('version_committed', 'true');
    } else {
      console.log('No changes to commit');
      setOutput('version_committed', 'false');
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
