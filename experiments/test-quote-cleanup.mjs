#!/usr/bin/env node

/**
 * Test script for issue #124: Verifying quote cleanup in format-release-notes.mjs
 *
 * This script tests the cleanup logic that removes leading/trailing quotes
 * from release note descriptions. The quotes are introduced by command-stream's
 * shell command builder when creating GitHub releases.
 */

console.log('🧪 Testing quote cleanup for issue #124\n');

// Simulate the cleanup logic from format-release-notes.mjs
function cleanDescription(rawDescription) {
  return rawDescription
    .replace(/\\n/g, '\n') // Convert escaped \n to actual newlines
    .replace(/^['"]|['"]$/g, '') // Remove leading/trailing single or double quotes
    .replace(/📦.*$/s, '') // Remove any existing npm package info
    .replace(/---.*$/s, '') // Remove any existing separators and everything after
    .trim()
    .split('\n') // Split by lines
    .map((line) => line.trim()) // Trim whitespace from each line
    .join('\n') // Rejoin with newlines
    .replace(/\n{3,}/g, '\n\n'); // Normalize excessive blank lines (3+ becomes 2)
}

// Test cases
const testCases = [
  {
    name: 'Issue #124: Trailing single quote from command-stream',
    input: `fix: replace lino-arguments in format-release-notes.mjs for reliable CI execution\n\nThe format-release-notes.mjs script was still using lino-arguments for CLI argument parsing.\n\nFixes #122'`,
    expectedEnd: 'Fixes #122',
    shouldNotContain: "'",
  },
  {
    name: 'Leading and trailing single quotes',
    input: `'This is a test description'`,
    expected: 'This is a test description',
    shouldNotContain: "'",
  },
  {
    name: 'Leading and trailing double quotes',
    input: `"This is a test description"`,
    expected: 'This is a test description',
    shouldNotContain: '"',
  },
  {
    name: 'Mixed quotes',
    input: `'This is a test description"`,
    expected: 'This is a test description',
    shouldNotContain: ["'", '"'],
  },
  {
    name: 'Escaped newlines',
    input: `'Line 1\\nLine 2\\nLine 3'`,
    expected: 'Line 1\nLine 2\nLine 3',
    shouldNotContain: ["'", '\\n'],
  },
  {
    name: 'No quotes (should not change)',
    input: 'Normal description without quotes',
    expected: 'Normal description without quotes',
  },
  {
    name: 'Quotes in the middle (should be preserved)',
    input: `This is a "quoted word" in the middle`,
    expected: 'This is a "quoted word" in the middle',
  },
  {
    name: 'Excessive blank lines',
    input: `Line 1\n\n\n\nLine 2`,
    expected: 'Line 1\n\nLine 2',
  },
];

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  console.log(`📝 Test: ${testCase.name}`);

  const result = cleanDescription(testCase.input);

  let success = true;
  const errors = [];

  // Check exact match if provided
  if (testCase.expected !== undefined) {
    if (result !== testCase.expected) {
      success = false;
      errors.push(`Expected:\n  "${testCase.expected}"\nGot:\n  "${result}"`);
    }
  }

  // Check expected end if provided
  if (testCase.expectedEnd !== undefined) {
    if (!result.endsWith(testCase.expectedEnd)) {
      success = false;
      errors.push(
        `Expected to end with: "${testCase.expectedEnd}"\nGot: "${result}"`
      );
    }
  }

  // Check that certain characters should not be present
  if (testCase.shouldNotContain !== undefined) {
    const charsToCheck = Array.isArray(testCase.shouldNotContain)
      ? testCase.shouldNotContain
      : [testCase.shouldNotContain];

    for (const char of charsToCheck) {
      // Only check at the start or end
      if (result.startsWith(char) || result.endsWith(char)) {
        success = false;
        errors.push(
          `Should not have "${char}" at start/end, but found it in: "${result}"`
        );
      }
    }
  }

  if (success) {
    console.log(`✅ PASSED\n`);
    passed++;
  } else {
    console.log(`❌ FAILED`);
    errors.forEach((err) => console.log(`   ${err}`));
    console.log();
    failed++;
  }
}

console.log('='.repeat(60));
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('🎉 All tests passed! The quote cleanup is working correctly.');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed. Please review the cleanup logic.');
  process.exit(1);
}
