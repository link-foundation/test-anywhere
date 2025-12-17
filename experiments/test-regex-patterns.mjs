#!/usr/bin/env node

/**
 * Test script to verify the regex pattern handles all changeset types
 */

// Test cases for different change types
const testCases = [
  {
    name: 'Major Changes with commit hash',
    input: `### Major Changes

- abc1234: Breaking change to the API structure`,
    expected: {
      changeType: 'Major',
      commitHash: 'abc1234',
      description: 'Breaking change to the API structure',
    },
  },
  {
    name: 'Minor Changes with commit hash',
    input: `### Minor Changes

- def5678: Add support for new feature`,
    expected: {
      changeType: 'Minor',
      commitHash: 'def5678',
      description: 'Add support for new feature',
    },
  },
  {
    name: 'Patch Changes with commit hash',
    input: `### Patch Changes

- 9876abc: Fix critical bug in module`,
    expected: {
      changeType: 'Patch',
      commitHash: '9876abc',
      description: 'Fix critical bug in module',
    },
  },
  {
    name: 'Major Changes without commit hash',
    input: `### Major Changes

- Complete rewrite of the core engine`,
    expected: {
      changeType: 'Major',
      commitHash: null,
      description: 'Complete rewrite of the core engine',
    },
  },
  {
    name: 'Minor Changes without commit hash',
    input: `### Minor Changes

- Added TypeScript support and improved type definitions`,
    expected: {
      changeType: 'Minor',
      commitHash: null,
      description: 'Added TypeScript support and improved type definitions',
    },
  },
  {
    name: 'Patch Changes without commit hash',
    input: `### Patch Changes

- Fixed memory leak in cache module`,
    expected: {
      changeType: 'Patch',
      commitHash: null,
      description: 'Fixed memory leak in cache module',
    },
  },
  {
    name: 'Multi-line description with commit hash',
    input: `### Minor Changes

- abc1234: Add support for google/gemini-3-pro model alias
- Added google/gemini-3-pro as an alias to gemini-3-pro-preview
- Updated README.md with Google Gemini usage examples`,
    expected: {
      changeType: 'Minor',
      commitHash: 'abc1234',
      description: `Add support for google/gemini-3-pro model alias
- Added google/gemini-3-pro as an alias to gemini-3-pro-preview
- Updated README.md with Google Gemini usage examples`,
    },
  },
];

// The regex pattern from the fix
const changesPattern =
  /### (Major|Minor|Patch) Changes\s*\n\s*-\s+(?:([a-f0-9]+):\s+)?(.+?)$/s;

console.log('🧪 Testing regex pattern for all changeset types\n');
console.log('=' .repeat(70));

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  console.log(`\n📝 Test: ${testCase.name}`);
  console.log('-'.repeat(70));

  const match = testCase.input.match(changesPattern);

  if (!match) {
    console.log('❌ FAILED: No match found');
    console.log(`   Input: ${JSON.stringify(testCase.input)}`);
    failed++;
    continue;
  }

  const [, changeType, commitHash, rawDescription] = match;

  // Check if we need to extract commit hash from description (fallback)
  let actualCommitHash = commitHash;
  let actualDescription = rawDescription;

  if (!actualCommitHash && rawDescription) {
    const descWithHashMatch = rawDescription.match(/^([a-f0-9]+):\s+(.+)$/s);
    if (descWithHashMatch) {
      [, actualCommitHash, actualDescription] = descWithHashMatch;
    }
  }

  const results = {
    changeType,
    commitHash: actualCommitHash || null,
    description: actualDescription,
  };

  // Compare results
  const changeTypeMatch = results.changeType === testCase.expected.changeType;
  const commitHashMatch = results.commitHash === testCase.expected.commitHash;
  const descriptionMatch =
    results.description === testCase.expected.description;

  if (changeTypeMatch && commitHashMatch && descriptionMatch) {
    console.log('✅ PASSED');
    console.log(`   Change Type: ${results.changeType}`);
    console.log(`   Commit Hash: ${results.commitHash || '(none)'}`);
    console.log(
      `   Description: ${results.description.substring(0, 50)}${results.description.length > 50 ? '...' : ''}`
    );
    passed++;
  } else {
    console.log('❌ FAILED');
    console.log('\n   Expected:');
    console.log(`     Change Type: ${testCase.expected.changeType}`);
    console.log(`     Commit Hash: ${testCase.expected.commitHash || '(none)'}`);
    console.log(`     Description: ${testCase.expected.description}`);
    console.log('\n   Got:');
    console.log(`     Change Type: ${results.changeType}`);
    console.log(`     Commit Hash: ${results.commitHash || '(none)'}`);
    console.log(`     Description: ${results.description}`);
    failed++;
  }
}

console.log('\n' + '='.repeat(70));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('✅ All tests passed!');
  process.exit(0);
} else {
  console.log('❌ Some tests failed');
  process.exit(1);
}
