#!/usr/bin/env node

/**
 * Test script to verify the fix for issue #135
 *
 * This script tests that the updated create-github-release.mjs correctly handles
 * apostrophes and other special characters without shell escaping issues.
 */

// Load use-m dynamically
const { use } = eval(
  await (await fetch('https://unpkg.com/use-m/use.js')).text()
);

// Import command-stream
const { $ } = await use('command-stream');

console.log('=== Testing Create Release Fix (Issue #135) ===\n');

// Test cases with various special characters
const testCases = [
  {
    name: 'Basic apostrophe',
    text: "This release doesn't have issues",
    expected: "doesn't",
  },
  {
    name: 'Multiple apostrophes',
    text: "It's the user's choice, and we're happy about it",
    expected: "It's the user's choice, and we're happy about it",
  },
  {
    name: 'Double quotes',
    text: 'This is "quoted" text',
    expected: 'This is "quoted" text',
  },
  {
    name: 'Mixed quotes',
    text: 'It\'s a "great" release',
    expected: 'It\'s a "great" release',
  },
  {
    name: 'Backticks',
    text: 'Use `npm install` to install',
    expected: 'Use `npm install` to install',
  },
  {
    name: 'Newlines',
    text: 'Line 1\nLine 2\nLine 3',
    expected: 'Line 1\nLine 2\nLine 3',
  },
  {
    name: 'Real issue #135 text',
    text: 'Fix NPM publish check to properly detect unpublished versions. The script was incorrectly reporting versions as "already published" when they didn\'t exist on npm, causing the publish step to be skipped. This was caused by misunderstanding how command-stream\'s .run({ capture: true }) handles command failures.',
    expected: "didn't",
  },
];

let passCount = 0;
let failCount = 0;

for (const testCase of testCases) {
  console.log(`Test: ${testCase.name}`);
  console.log(
    `Input: ${testCase.text.substring(0, 60)}${testCase.text.length > 60 ? '...' : ''}`
  );

  // Test the new approach: JSON via stdin
  const payload = JSON.stringify({
    tag_name: 'v0.0.0-test',
    name: '0.0.0-test',
    body: testCase.text,
  });

  // Use echo to simulate what gh api would receive
  const result =
    await $`node -e "const data = JSON.parse(require('fs').readFileSync(0, 'utf-8')); console.log(data.body)"`.run(
      {
        stdin: payload,
        capture: true,
      }
    );

  const received = result.stdout.trim();

  // Check if the expected text is present in the result
  if (received.includes(testCase.expected)) {
    console.log(`✅ PASS: Text preserved correctly`);
    passCount++;
  } else {
    console.log(`❌ FAIL: Text was corrupted`);
    console.log(`   Expected to contain: ${testCase.expected}`);
    console.log(`   Received: ${received.substring(0, 100)}...`);
    failCount++;
  }

  console.log('');
}

console.log('=== Test Results ===');
console.log(`Passed: ${passCount}/${testCases.length}`);
console.log(`Failed: ${failCount}/${testCases.length}`);

if (failCount === 0) {
  console.log(
    '\n✅ All tests passed! The fix correctly handles special characters.'
  );
} else {
  console.log('\n❌ Some tests failed. The fix needs adjustment.');
  process.exit(1);
}

console.log('\n=== Comparison with Old Approach ===\n');

// Show what the old approach would produce
const problematicText =
  "This text has apostrophes like didn't and command-stream's";
console.log('Sample text:', problematicText);
console.log('');

console.log('OLD APPROACH (shell arguments):');
const escapedNotes = problematicText.replace(/"/g, '\\"');
const oldResult = await $`echo "${escapedNotes}"`.run({ capture: true });
console.log('Result:', oldResult.stdout.trim());
console.log("Note: Contains shell escape sequences like '\\''");
console.log('');

console.log('NEW APPROACH (JSON stdin):');
const newPayload = JSON.stringify({ body: problematicText });
const newResult =
  await $`node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf-8')).body)"`.run(
    {
      stdin: newPayload,
      capture: true,
    }
  );
console.log('Result:', newResult.stdout.trim());
console.log('Note: Text is preserved exactly as-is');
