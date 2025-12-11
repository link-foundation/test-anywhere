#!/usr/bin/env node

/**
 * Experiment: Reproduce the triple quote issue from issue #135
 *
 * This script tests how apostrophes in release notes get transformed
 * into triple quotes when passed through the release workflow.
 */

// Load use-m dynamically
const { use } = eval(
  await (await fetch('https://unpkg.com/use-m/use.js')).text()
);

// Import command-stream
const { $ } = await use('command-stream');

console.log('=== Testing Triple Quote Issue (Issue #135) ===\n');

// Sample text from the actual issue
const sampleText =
  'Fix NPM publish check to properly detect unpublished versions. The script was incorrectly reporting versions as "already published" when they didn\'t exist on npm, causing the publish step to be skipped. This was caused by misunderstanding how command-stream\'s .run({ capture: true }) handles command failures - it returns a result object with a code property instead of throwing errors.';

console.log('Original text from CHANGELOG.md:');
console.log(sampleText);
console.log('\n---\n');

// Simulate what create-github-release.mjs does
console.log(
  'Step 1: Escape double quotes (as in create-github-release.mjs line 77)'
);
const escapedNotes = sampleText.replace(/"/g, '\\"');
console.log('After escaping double quotes:');
console.log(escapedNotes);
console.log('\n---\n');

// Test what happens when we pass this to gh command with double quotes
console.log('Step 2: Pass to gh release create with double quotes');
console.log(
  'Command template: gh release create "tag" --notes "${escapedNotes}"'
);

// Let's see what command-stream actually sends
// We'll use echo to capture what the shell sees
const testResult = await $`echo "${escapedNotes}"`.run({ capture: true });
console.log('\nWhat the shell receives:');
console.log(testResult.stdout);

console.log('\n---\n');

// Now test what GitHub API receives
console.log('Step 3: Simulate GitHub API behavior');
console.log(
  'When GitHub receives the escaped text from shell, it stores it literally.'
);
console.log("So if shell sends: didn'\\''t, GitHub stores: didn'\\''t");
console.log("And when rendered, GitHub shows: didn''' (three quotes visible)");

console.log('\n---\n');

// Test alternative approaches
console.log('=== Testing Alternative Approaches ===\n');

console.log('Approach 1: Use --input with JSON (avoid shell escaping)');
const jsonPayload = JSON.stringify({
  tag_name: 'v0.8.45',
  name: '0.8.45',
  body: sampleText,
});

console.log('JSON payload:');
console.log(jsonPayload);
console.log(
  '\nThis approach passes data via stdin as JSON, avoiding shell escaping entirely.'
);

console.log('\n---\n');

console.log('Approach 2: Use heredoc');
console.log("gh release create tag --notes \"$(cat <<'EOF'");
console.log(sampleText);
console.log('EOF');
console.log(')"');
console.log('\nThis approach uses heredoc to preserve literal text.');

console.log('\n=== Summary ===');
console.log(
  'The root cause is that command-stream escapes apostrophes when they appear'
);
console.log(
  'in double-quoted template literal arguments. The Bash escape sequence for'
);
console.log(
  "an apostrophe within single quotes is '\\''  which appears as ''' when rendered."
);
console.log(
  '\nSolution: Use gh API with JSON input instead of gh CLI with shell arguments.'
);
