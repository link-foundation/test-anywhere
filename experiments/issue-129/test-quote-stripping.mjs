#!/usr/bin/env node

/**
 * Test quote stripping logic for issue #129
 * Tests various quote patterns to ensure they're properly cleaned
 */

console.log('Testing quote stripping logic...\n');

// Test cases
const testCases = [
  {
    name: 'Simple text with surrounding single quotes',
    input: "'Test patch release (instant)'",
    expected: 'Test patch release (instant)',
  },
  {
    name: 'Simple text with surrounding double quotes',
    input: '"Test patch release (instant)"',
    expected: 'Test patch release (instant)',
  },
  {
    name: 'Text without quotes',
    input: 'Test patch release (instant)',
    expected: 'Test patch release (instant)',
  },
  {
    name: 'Text with quotes in the middle',
    input: 'Fix "critical" bug',
    expected: 'Fix "critical" bug',
  },
  {
    name: 'Text with escaped single quotes at start/end',
    input: "\\'Test patch release (instant)\\'",
    expected: 'Test patch release (instant)',
  },
  {
    name: 'Text with double escaped single quotes (from GitHub API)',
    input: "\\''Test patch release (instant)''",
    expected: 'Test patch release (instant)',
  },
  {
    name: 'Text with escaped double quotes at start/end',
    input: '\\"Test patch release (instant)\\"',
    expected: 'Test patch release (instant)',
  },
  {
    name: 'Multiple trailing quotes',
    input: "Test patch release (instant)''",
    expected: 'Test patch release (instant)',
  },
];

// Simulate the cleaning logic from instant-version-bump.mjs
function cleanQuotesSimple(text) {
  return text.replace(/^['"]|['"]$/g, '');
}

// Simulate the cleaning logic from format-release-notes.mjs
function cleanQuotesComprehensive(text) {
  return text
    .replace(/^(\\['"])+/g, '') // Remove leading escaped quotes (e.g., \', \", \'', \'')
    .replace(/(['"])+$/g, '') // Remove trailing unescaped quotes (e.g., ', ", '', '')
    .replace(/^(['"])+/g, ''); // Remove leading unescaped quotes
}

console.log('Testing simple quote stripping (instant-version-bump.mjs):');
console.log('='.repeat(70));

let simplePassCount = 0;
testCases.forEach((test) => {
  const result = cleanQuotesSimple(test.input);
  const passed = result === test.expected;
  simplePassCount += passed ? 1 : 0;

  console.log(`\nTest: ${test.name}`);
  console.log(`  Input:    "${test.input}"`);
  console.log(`  Expected: "${test.expected}"`);
  console.log(`  Result:   "${result}"`);
  console.log(`  Status:   ${passed ? '✅ PASS' : '❌ FAIL'}`);
});

console.log(`\n${'='.repeat(70)}`);
console.log(
  `Simple cleaning: ${simplePassCount}/${testCases.length} tests passed\n`
);

console.log(
  'Testing comprehensive quote stripping (format-release-notes.mjs):'
);
console.log('='.repeat(70));

let comprehensivePassCount = 0;
testCases.forEach((test) => {
  const result = cleanQuotesComprehensive(test.input);
  const passed = result === test.expected;
  comprehensivePassCount += passed ? 1 : 0;

  console.log(`\nTest: ${test.name}`);
  console.log(`  Input:    "${test.input}"`);
  console.log(`  Expected: "${test.expected}"`);
  console.log(`  Result:   "${result}"`);
  console.log(`  Status:   ${passed ? '✅ PASS' : '❌ FAIL'}`);
});

console.log(`\n${'='.repeat(70)}`);
console.log(
  `Comprehensive cleaning: ${comprehensivePassCount}/${testCases.length} tests passed\n`
);

// Summary
const allPassed =
  simplePassCount === testCases.length &&
  comprehensivePassCount === testCases.length;
console.log('='.repeat(70));
console.log(
  `Overall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`
);
console.log('='.repeat(70));

process.exit(allPassed ? 0 : 1);
