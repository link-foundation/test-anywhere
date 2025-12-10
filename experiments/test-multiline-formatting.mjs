#!/usr/bin/env node

/**
 * Test script for multiline formatting in format-release-notes.mjs
 * Tests the description cleaning logic with various inputs
 */

// Test cases with different formatting scenarios
const testCases = [
  {
    name: 'Multiline with bullet points (Issue #100 case)',
    input: `Fix npm trusted publishing by adding repository field to package.json

The npm trusted publishing E422 error occurred because the package.json was missing the repository field. When npm publishes with provenance, it verifies that the repository.url in package.json matches the source repository URI from the GitHub Actions OIDC token.

Changes:

- Add repository field to package.json with correct GitHub URL
- Update .gitignore to allow ci-logs/\\*.log files
- Update case study documentation with E422 error analysis`,
    expected: `Fix npm trusted publishing by adding repository field to package.json

The npm trusted publishing E422 error occurred because the package.json was missing the repository field. When npm publishes with provenance, it verifies that the repository.url in package.json matches the source repository URI from the GitHub Actions OIDC token.

Changes:

- Add repository field to package.json with correct GitHub URL
- Update .gitignore to allow ci-logs/\\*.log files
- Update case study documentation with E422 error analysis`,
  },
  {
    name: 'With escaped newlines (from GitHub API)',
    input: `Fix description\\n\\nThis has escaped newlines\\n- Item 1\\n- Item 2`,
    expected: `Fix description

This has escaped newlines
- Item 1
- Item 2`,
  },
  {
    name: 'With excessive blank lines',
    input: `Title


Too many blank lines



Should be normalized`,
    expected: `Title

Too many blank lines

Should be normalized`,
  },
];

// The NEW cleaning logic from format-release-notes.mjs
function cleanDescription(rawDescription) {
  return rawDescription
    .replace(/\\n/g, '\n') // Convert escaped \n to actual newlines
    .replace(/📦.*$/s, '') // Remove any existing npm package info
    .replace(/---.*$/s, '') // Remove any existing separators and everything after
    .trim()
    .split('\n') // Split by lines
    .map((line) => line.trim()) // Trim whitespace from each line
    .join('\n') // Rejoin with newlines
    .replace(/\n{3,}/g, '\n\n'); // Normalize excessive blank lines (3+ becomes 2)
}

// Old logic for comparison
function cleanDescriptionOld(rawDescription) {
  return rawDescription
    .replace(/\\n/g, ' ') // Remove literal \n characters
    .replace(/📦.*$/s, '') // Remove any existing npm package info
    .replace(/---.*$/s, '') // Remove any existing separators and everything after
    .trim()
    .replace(/\s+/g, ' '); // Normalize all whitespace to single spaces
}

console.log('Testing format-release-notes cleaning logic\n');
console.log('='.repeat(80));

let passedTests = 0;
let failedTests = 0;

for (const testCase of testCases) {
  console.log(`\nTest: ${testCase.name}`);
  console.log('-'.repeat(80));

  const result = cleanDescription(testCase.input);
  const oldResult = cleanDescriptionOld(testCase.input);

  console.log('\nOld logic result (BEFORE fix):');
  console.log(oldResult);

  console.log('\nNew logic result (AFTER fix):');
  console.log(result);

  if (result === testCase.expected) {
    console.log('\n✅ PASS - New logic produces expected result');
    passedTests++;
  } else {
    console.log('\n❌ FAIL - Result does not match expected');
    failedTests++;
  }

  console.log(`\n${'='.repeat(80)}`);
}

console.log(`\n\nTest Summary:`);
console.log(`  Passed: ${passedTests}/${testCases.length}`);
console.log(`  Failed: ${failedTests}/${testCases.length}`);

if (failedTests > 0) {
  process.exit(1);
}

console.log(
  '\n✅ All tests passed! The fix correctly preserves multiline formatting.'
);
